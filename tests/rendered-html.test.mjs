import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { NOTES } from "../02 계이름 운지법 차트/danso_svg_lib.mjs";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the finished Korean handoff page and metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]+lang="ko"/i);
  assert.match(html, /<title>단소 운지법 배우기<\/title>/i);
  assert.match(html, /단소 운지법 교실을 여는 중입니다/);
  assert.doesNotMatch(html, /codex-preview|Starter Project|react-loading-skeleton/i);
});

test("standalone app preserves all 15 SSOT notes and offline behavior", async () => {
  const html = await readFile(
    new URL("../public/danso-app.html", import.meta.url),
    "utf8",
  );

  assert.equal(NOTES.length, 15);
  for (const note of NOTES) {
    assert.match(html, new RegExp(`\\"id\\":${note.id},\\"sol\\":\\"${note.sol}\\"`));
  }

  for (let button = 1; button <= 8; button += 1) {
    assert.equal(NOTES[button - 1].id, button);
    assert.equal(NOTES[button + 6].id, button + 7);
  }

  assert.deepEqual(NOTES[2].holes, [1, 1, 0.5, 0, 0]);
  assert.deepEqual(NOTES[5].holes, [0, 0, 0, 0, 0]);
  assert.deepEqual(NOTES[6].holes, NOTES[7].holes);
  assert.deepEqual(NOTES[12].holes, [1, 0, 1, 0, 0]);
  assert.deepEqual(NOTES[13].holes, [0, 1, 1, 0, 0]);
  assert.deepEqual(NOTES[14].holes, [1, 1, 0, 1, 0]);

  assert.match(html, /height:100dvh;overflow:hidden;overscroll-behavior:none/);
  assert.match(html, /grid-template-columns:repeat\(4,minmax\(64px,1fr\)\)/);
  assert.match(html, /viewBox="24 230 350 640"/);
  assert.match(html, /"full":"24 178 350 980"/);
  assert.match(html, /id="fingL1" class="finger"/);
  assert.match(html, /#fingL3\.half\s*\{\s*transform:\s*translate\(0px, 8px\)/);
  assert.match(html, /AudioContext\|\|window\.webkitAudioContext/);
  assert.match(html, /event\.key\.toLowerCase\(\)==='o'/);
  assert.match(html, /URLSearchParams\(location\.search\)\.get\('note'\)/);
  assert.doesNotMatch(html, /(?:src|href)=["']https?:/i);
  assert.doesNotMatch(html, /\uFFFD/);

  const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
  assert.ok(script, "standalone interaction script should exist");
  assert.doesNotThrow(() => new vm.Script(script));
});

test("chart refactor keeps the three verified source artifacts byte-identical", async () => {
  const fixtures = [
    ["../02 계이름 운지법 차트/단소_계이름_운지법_차트.svg", "F745DB1110C5EA23DA1FF9E4708047FDAF373483B71DD4D67A662B7097292739"],
    ["../02 계이름 운지법 차트/단소_계이름_운지법_차트.html", "83062ECD06AC70D4F86B0D1188281A0BCFF2ADF5EFCF28494336EA603B883A1E"],
    ["../02 계이름 운지법 차트/print.html", "BDD3CEA46404E3F88F6E2596A07C1C3C7A6F1962EE6B5919DDE01B049D16E829"],
  ];

  for (const [path, expected] of fixtures) {
    const contents = await readFile(new URL(path, import.meta.url));
    const actual = createHash("sha256").update(contents).digest("hex").toUpperCase();
    assert.equal(actual, expected);
  }
});
