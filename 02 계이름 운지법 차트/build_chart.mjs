// 단소 계이름 운지법 차트 생성기 (v2 — 손·손가락 SVG 포함)
// 실행: node build_chart.mjs
// 출력: 단소_계이름_운지법_차트.svg / print.html
// 데이터 근거: 01 Source/포인트 단소교본01(운지표), 피리토끼 PDF(교차검증)
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));

import { NOTES, FINGER, C, FONT, esc, txt, defs, leftPanel, miniDanso, miniFingertip, MINI } from './danso_svg_lib.mjs';

/* ── 7. 그리드 (15열) ─────────────────────────────────────────────── */
const GRID = { x0: 392, x1: 1666, yTop: 210, boxTop: 256, boxBottom: 1042 };
function grid() {
  const { x0, x1, boxTop, boxBottom } = GRID;
  const n = NOTES.length;
  const cw = (x1 - x0) / n;
  let s = `<g>`;
  const bx = (i) => x0 + cw * i;

  // 구간 브래킷
  const brk = (a, b, label, color) => {
    const xa = bx(a) + 6, xb = bx(b) - 6, ym = 238;
    let t = `<path d="M${xa} ${ym + 12} L ${xa} ${ym} L ${xb} ${ym} L ${xb} ${ym + 12}" stroke="${color}" stroke-width="2.2" fill="none"/>`;
    t += txt((xa + xb) / 2, ym - 10, label, 21, color, { weight: 700, ls: 3 });
    return t;
  };
  s += brk(0, 7, '낮은소리 (저취 — 여리게)', C.low);
  s += brk(7, 15, '높은소리 (역취 — 세게)', C.high);

  for (let i = 0; i < n; i++) {
    const note = NOTES[i];
    const cxCol = x0 + cw * (i + 0.5);
    const isHigh = i >= 7;
    const acc = isHigh ? C.high : C.low;
    const accBg = isHigh ? C.highBg : C.lowBg;

    s += `<g data-note-id="${note.id}" data-holes="${note.holes.join(',')}">`;
    if (i % 2 === 1) s += `<rect x="${bx(i)}" y="${boxTop}" width="${cw}" height="${boxBottom - boxTop}" fill="#000000" opacity="0.025"/>`;

    // 계이름 칩 (+ 옥타브 점)
    const chipY = 280;
    s += `<rect x="${cxCol - 33}" y="${chipY}" width="66" height="44" rx="12" fill="${accBg}" stroke="${acc}" stroke-width="1.6"/>`;
    s += txt(cxCol, chipY + 31, note.sol, 27, acc, { weight: 700 });
    if (note.hi) {
      for (let k = 0; k < note.hi; k++) {
        const dx = (k - (note.hi - 1) / 2) * 10;
        s += `<circle cx="${cxCol + dx}" cy="${chipY - 7}" r="3.1" fill="${acc}"/>`;
      }
    }

    // 율명
    s += txt(cxCol, 368, note.yul, 30, C.ink, { weight: 600 });
    s += txt(cxCol, 392, `(${note.read})`, 14, C.sub);

    // 미니 단소 + 운지
    s += miniDanso(cxCol + 2, note.holes);

    // 취법 배지 + 입김 물결
    const by2 = 920;
    s += `<rect x="${cxCol - 30}" y="${by2}" width="60" height="30" rx="15" fill="${note.breath === '저취' ? C.low : C.high}" opacity="${note.breath === '평취' ? 0.72 : 0.92}"/>`;
    s += txt(cxCol, by2 + 21, note.breath, 16.5, '#ffffff', { weight: 700 });
    const waves = note.breath === '저취' ? 1 : note.breath === '평취' ? 2 : 3;
    for (let w = 0; w < waves; w++) {
      const wy = by2 + 46 + w * 7.5;
      s += `<path d="M${cxCol - 14} ${wy} q 7 -5 14 0 q 7 5 14 0" transform="translate(-7 0)" stroke="${acc}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    }
    s += `</g>`;
    if (i > 0) s += `<line x1="${bx(i)}" y1="${boxTop}" x2="${bx(i)}" y2="${boxBottom}" stroke="${C.grid}" stroke-width="1"/>`;
  }
  s += `<rect x="${x0}" y="${boxTop}" width="${x1 - x0}" height="${boxBottom - boxTop}" rx="10" fill="none" stroke="${C.grid}" stroke-width="1.8"/>`;
  s += `<line x1="${bx(7)}" y1="${boxTop}" x2="${bx(7)}" y2="${boxBottom}" stroke="${C.high}" stroke-width="2.4" stroke-dasharray="8 5" opacity="0.7"/>`;

  // 입김 세기 화살표 (그리드 안 하단)
  const ay = 1014;
  s += txt(x0 + 16, ay - 10, '여리게', 15.5, C.low, { anchor: 'start', weight: 700 });
  s += txt(x1 - 28, ay - 10, '점점 세게 붑니다', 15.5, C.high, { anchor: 'end', weight: 700 });
  s += `<path d="M${x0 + 16} ${ay} L ${x1 - 28} ${ay}" stroke="${C.sub}" stroke-width="2.4" marker-end="url(#mArrow)"/>`;
  s += `</g>`;
  return s;
}

/* ── 8. 헤더/범례/각주 ───────────────────────────────────────────── */
function header() {
  let s = '';
  s += txt(96, 106, '단소 계이름 운지법 차트', 46, C.ink, { anchor: 'start', weight: 700, ls: 2 });
  s += txt(96, 148, '短簫 運指法 · 계이름 솔–솔 두 옥타브 · 5공 단소', 18, C.sub, { anchor: 'start' });
  const lx = 1004, ly = 78, lw = 662, lh = 82;
  s += `<rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="14" fill="${C.card}" stroke="${C.cardLine}" stroke-width="1.6"/>`;
  const cy = ly + lh / 2 + 6;
  const sample = (x, state) =>
    `<ellipse cx="${x}" cy="${cy - 6}" rx="10" ry="9.2" fill="${C.hole}"/>` +
    miniFingertip(x, cy - 6, 'L', state, 'L', { r: 8, short: true });
  s += sample(lx + 58, 1) + txt(lx + 76, cy, '막음', 15.5, C.ink, { anchor: 'start' });
  s += sample(lx + 190, 0.5) + txt(lx + 208, cy, '반막음', 15.5, C.ink, { anchor: 'start' });
  s += sample(lx + 336, 0) + txt(lx + 354, cy, '엶', 15.5, C.ink, { anchor: 'start' });
  s += `<circle cx="${lx + 440}" cy="${cy - 6}" r="8" fill="${C.handL}"/>` + txt(lx + 454, cy, '왼손', 15.5, C.ink, { anchor: 'start' });
  s += `<circle cx="${lx + 540}" cy="${cy - 6}" r="8" fill="${C.handR}"/>` + txt(lx + 554, cy, '오른손', 15.5, C.ink, { anchor: 'start' });
  return s;
}
function footnotes() {
  const x = 392, y = 1082;
  let s = '';
  s += txt(x, y, '※ ⑴ 파(淡)·높은 솔(沖)은 운지가 같고 입김 세기(평취/역취)로만 구분합니다.', 14.5, C.sub, { anchor: 'start' });
  s += txt(x, y + 24, '※ ⑵ 시(南·湳)의 3공 반막음이 어려우면 대체 운지 ●●○●○(3공 열고 4공 막기)도 쓰입니다 — 피리토끼 급수제', 14.5, C.sub, { anchor: 'start' });
  s += txt(x + 902, y, '※ ⑶ 제4공은 교본에 따라 오른손 검지로 막기도 합니다.', 14.5, C.sub, { anchor: 'start' });
  s += txt(x + 902, y + 24, '※ ⑷ 율명의 ′ 표시와 계이름 위 점(˙)은 한 옥타브 위 음입니다.', 14.5, C.sub, { anchor: 'start' });
  return s;
}

/* ── 9. 정적 SVG 조립 ─────────────────────────────────────────────── */
function buildStaticSVG() {
  let s = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  s += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1700 1191" width="297mm" height="210mm" font-family="${FONT}">`;
  s += defs();
  s += `<marker id="mArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="${C.sub}"/></marker>`;
  s += `<rect width="1700" height="1191" fill="${C.paper}"/>`;
  s += `<rect x="34" y="40" width="1632" height="4" rx="2" fill="${C.low}" opacity="0.8"/>`;
  s += header();
  s += leftPanel(false);
  s += grid();
  s += footnotes();
  s += txt(1666, 1176, '자료: 포인트 단소교본 운지표 · 피리토끼 단소급수제 (교차검증) — 2026', 12.5, C.sub, { anchor: 'end', op: 0.9 });
  s += `</svg>`;
  return s;
}

/* ── 10. 자체 검증 ────────────────────────────────────────────────── */
function verify(svg) {
  const errs = [];
  const colRe = /<g data-note-id="(\d+)" data-holes="([^"]+)">/g;
  const found = new Map();
  let m;
  while ((m = colRe.exec(svg))) found.set(Number(m[1]), m[2]);
  if (found.size !== 15) errs.push(`열 개수 ${found.size} ≠ 15`);
  for (const n of NOTES) {
    const want = n.holes.join(',');
    if (found.get(n.id) !== want) errs.push(`#${n.id} ${n.sol}: 렌더 ${found.get(n.id)} ≠ 데이터 ${want}`);
  }
  const eq = (a, b) => NOTES[a].holes.join() === NOTES[b].holes.join();
  if (!eq(6, 7)) errs.push('파(7)≠높은솔(8) 운지 불일치');
  if (NOTES[2].holes[2] !== 0.5 || NOTES[9].holes[2] !== 0.5) errs.push('시(南/湳) 3공 반막음 아님');
  if (NOTES[12].holes.join() !== '1,0,1,0,0') errs.push('높은미 변형 운지 오류');
  if (NOTES[13].holes.join() !== '0,1,1,0,0') errs.push('높은파 변형 운지 오류');
  if (NOTES[14].holes.join() !== '1,1,0,1,0') errs.push('최고솔 변형 운지 오류');
  return errs;
}

/* ── 11. 인터랙티브 HTML ─────────────────────────────────────────── */
function buildInteractiveHTML(staticSvg) {
  // 인터랙티브 패널: 좌측 패널만 별도 viewBox로 재사용 (stateful id 포함)
  const panelSvg =
    `<svg id="handPanel" xmlns="http://www.w3.org/2000/svg" viewBox="24 178 350 980">` +
    defs() + leftPanel(true) + `</svg>`;
  const notesJson = JSON.stringify(NOTES);
  const printSvg = staticSvg.replace(/^<\?xml[^>]*\?>\n/, '');

  const css = `
:root{--paper:${C.paper};--card:${C.card};--line:${C.cardLine};--ink:${C.ink};--sub:${C.sub};
--low:${C.low};--high:${C.high};--lowbg:${C.lowBg};--highbg:${C.highBg}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);
font-family:'Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif}
header{padding:26px 34px 10px;border-bottom:4px solid var(--low)}
header h1{margin:0;font-size:30px;letter-spacing:1px}
header p{margin:6px 0 10px;color:var(--sub);font-size:14.5px}
main{display:flex;gap:22px;padding:22px 34px;flex-wrap:wrap}
.panel{flex:0 0 360px;background:var(--card);border:2px solid var(--line);border-radius:18px;padding:8px}
.panel svg{width:100%;height:auto;display:block}
.right{flex:1;min-width:340px;display:flex;flex-direction:column;gap:18px}
.group h2{font-size:16px;margin:0 0 8px;letter-spacing:2px}
.g-low h2{color:var(--low)} .g-high h2{color:var(--high)}
.btns{display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:8px}
button.note{position:relative;border:1.6px solid var(--low);background:var(--lowbg);color:var(--low);
border-radius:12px;padding:9px 4px 7px;font-size:15px;cursor:pointer;line-height:1.25;
font-family:inherit;transition:transform .12s, box-shadow .12s}
button.note b{font-size:19px;display:block}
button.note small{font-size:12px;color:inherit;opacity:.8}
.g-high button.note{border-color:var(--high);background:var(--highbg);color:var(--high)}
button.note:hover{transform:translateY(-2px);box-shadow:0 3px 8px rgba(60,40,10,.18)}
button.note.on{outline:3px solid currentColor;outline-offset:1px;font-weight:700}
.dots{position:absolute;top:2px;right:6px;letter-spacing:2px;font-size:13px}
.info{background:#fff;border:2px solid var(--line);border-radius:16px;padding:16px 20px;
display:flex;gap:22px;align-items:center;flex-wrap:wrap}
.info .big{font-size:44px;font-weight:700}
.info .yul{font-size:26px}
.info .meta{color:var(--sub);font-size:14px;line-height:1.55}
.badge{display:inline-block;color:#fff;border-radius:999px;padding:3px 14px;font-size:14px;font-weight:700}
.holes{font-size:22px;letter-spacing:6px}
.holes small{font-size:11px;letter-spacing:0;color:var(--sub);display:block}
.play{border:none;background:var(--low);color:#fff;font-size:15px;border-radius:999px;
padding:9px 18px;cursor:pointer;font-family:inherit}
details{background:var(--card);border:1.6px solid var(--line);border-radius:12px;
padding:10px 16px;margin:0 34px 12px}
details summary{cursor:pointer;font-weight:700;font-size:15px}
details p{margin:8px 0 4px;font-size:14px;color:var(--sub);line-height:1.7}
.hint{margin:0 34px 8px;color:var(--sub);font-size:13px}
.finger{transition:transform .3s ease}
.finger .ring{transition:opacity .2s}
.finger.lifted .ring{opacity:0}
#fingL2,#fingL3{transform-box:fill-box;transform-origin:15% 50%}
#fingR4,#fingR5{transform-box:fill-box;transform-origin:85% 50%}
#fingL1{transform-box:fill-box;transform-origin:30% 70%}
#fingL2.lifted{transform:translate(-24px,-11px) rotate(-6deg)}
#fingL3.lifted{transform:translate(-24px,-11px) rotate(-6deg)}
#fingL3.half{transform:translate(3px,8px)}
#fingR4.lifted{transform:translate(24px,-11px) rotate(6deg)}
#fingR5.lifted{transform:translate(24px,-11px) rotate(6deg)}
#fingL1.lifted{transform:translate(-15px,13px) rotate(-12deg)}
.state-label{font-size:13px;color:var(--sub);margin-top:2px}
.print-only{display:none}
footer{padding:10px 34px 26px;color:var(--sub);font-size:12.5px}
@media print{
 body>header,main,details,.hint,footer{display:none!important}
 .print-only{display:block}
 .print-only svg{width:297mm;height:210mm;display:block}
 @page{size:A4 landscape;margin:0}
}`;

  const js = `
var NOTES=${notesJson};
var FING={1:'fingL1',2:'fingL2',3:'fingL3',4:'fingR4',5:'fingR5'};
var BR={'저취':'입김을 여리고 부드럽게 — 낮은소리','평취':'보통 세기의 입김','역취':'입김을 세고 빠르게 — 높은소리'};
var cur=0, ctx=null;
function holeStr(h){var s='';for(var i=0;i<5;i++){s+=(h[i]===1?'●':h[i]===0.5?'◐':'○');if(i<4)s+=' ';}return s;}
function setNote(i,quiet){
  cur=i; var n=NOTES[i];
  for(var h=1;h<=5;h++){
    var el=document.getElementById(FING[h]); if(!el)continue;
    var st=n.holes[h-1];
    el.classList.remove('lifted','half');
    if(st===0)el.classList.add('lifted'); else if(st===0.5)el.classList.add('half');
  }
  var bs=document.querySelectorAll('button.note');
  for(var k=0;k<bs.length;k++)bs[k].classList.toggle('on',+bs[k].dataset.i===i);
  var hiDots=n.hi? (n.hi===2?'\\u02d9\\u02d9':'\\u02d9') : '';
  document.getElementById('iSol').textContent=n.sol+hiDots;
  document.getElementById('iYul').textContent=n.yul+' ('+n.read+')';
  var b=document.getElementById('iBreath');
  b.textContent=n.breath; b.style.background=(n.breath==='저취')?'${C.low}':'${C.high}';
  document.getElementById('iBrDesc').textContent=BR[n.breath];
  document.getElementById('iHoles').textContent=holeStr(n.holes);
  document.getElementById('iFreq').textContent='실음 약 '+n.freq.toFixed(1)+' Hz';
  document.getElementById('iAlt').textContent=n.alt?('대체 운지: '+n.alt+' (3공 열고 4공 막기)'):'';
  if(!quiet)play(n);
}
function play(n){
  try{
    ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();
    if(ctx.state==='suspended')ctx.resume();
    var t=ctx.currentTime;
    var g=ctx.createGain(), o1=ctx.createOscillator(), o2=ctx.createOscillator(), g2=ctx.createGain();
    var lfo=ctx.createOscillator(), lg=ctx.createGain();
    o1.type='sine'; o1.frequency.value=n.freq;
    o2.type='sine'; o2.frequency.value=n.freq*2;
    g2.gain.value=(n.breath==='역취')?0.20:0.10;
    lfo.frequency.value=5.2; lg.gain.value=n.freq*0.0045;
    lfo.connect(lg); lg.connect(o1.frequency);
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(ctx.destination);
    var atk=(n.breath==='역취')?0.03:(n.breath==='평취')?0.06:0.1;
    var peak=(n.breath==='역취')?0.3:(n.breath==='평취')?0.26:0.22;
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(peak,t+atk);
    g.gain.setValueAtTime(peak,t+0.75);
    g.gain.exponentialRampToValueAtTime(0.001,t+1.5);
    o1.start(t);o2.start(t);lfo.start(t);
    o1.stop(t+1.6);o2.stop(t+1.6);lfo.stop(t+1.6);
  }catch(e){}
}
document.addEventListener('keydown',function(e){
  if(e.key==='ArrowRight'){setNote((cur+1)%15);}
  else if(e.key==='ArrowLeft'){setNote((cur+14)%15);}
  else if(e.key===' '){e.preventDefault();play(NOTES[cur]);}
});
window.addEventListener('DOMContentLoaded',function(){
  var m=location.search.match(/note=(\\d+)/);
  setNote(m?Math.min(14,Math.max(0,+m[1]-1)):0,true);
});`;

  const btn = (n, i) =>
    `<button class="note" data-i="${i}" onclick="setNote(${i})">` +
    (n.hi ? `<span class="dots">${'˙'.repeat(n.hi)}</span>` : '') +
    `<b>${esc(n.sol)}</b>${esc(n.yul)} <small>(${esc(n.read)})</small></button>`;
  const lowBtns = NOTES.slice(0, 7).map((n, i) => btn(n, i)).join('');
  const highBtns = NOTES.slice(7).map((n, i) => btn(n, i + 7)).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>단소 계이름 운지법 차트 — 인터랙티브</title>
<style>${css}</style>
</head>
<body>
<header>
  <h1>단소 계이름 운지법 차트 <span style="font-weight:400;color:var(--sub);font-size:19px">短簫 運指法</span></h1>
  <p>음을 누르면 왼쪽 손가락이 움직이고 소리가 납니다 · ←/→ 음 이동 · Space 다시 듣기 · 인쇄하면 A4 차트 1장이 나옵니다</p>
</header>
<main>
  <div class="panel">${panelSvg}</div>
  <div class="right">
    <div class="info">
      <div><div class="big" id="iSol">솔</div><div class="yul"><span id="iYul">仲 (중)</span></div></div>
      <div>
        <span class="badge" id="iBreath" style="background:${C.low}">저취</span>
        <div class="state-label" id="iBrDesc"></div>
      </div>
      <div class="holes"><small>1공(뒤) · 2공 · 3공 · 4공 · 5공</small><span id="iHoles"></span>
        <div class="state-label" id="iAlt"></div>
      </div>
      <div class="meta"><span id="iFreq"></span><br>
        <button class="play" onclick="play(NOTES[cur])">🔊 소리 듣기</button>
      </div>
    </div>
    <div class="group g-low"><h2>낮은소리 — 저취 (여리게)</h2><div class="btns">${lowBtns}</div></div>
    <div class="group g-high"><h2>높은소리 — 역취 (세게) · ˙ 표시는 한 옥타브 위</h2><div class="btns">${highBtns}</div></div>
  </div>
</main>
<details><summary>바른 연주 자세 (교본02)</summary>
<p>허리를 곧게 펴고 어깨 힘을 뺍니다. 단소는 몸 중앙에 두고 몸과 약 45도가 되게 하며,
고개를 너무 숙이지 않습니다. 팔꿈치는 몸에서 살짝 떼고, 손가락·손목의 힘을 뺍니다.</p></details>
<details><summary>호흡과 입모양 (교본03)</summary>
<p>배로 숨 쉬는 복식호흡으로 천천히 깊게 들이마십니다. 입술 주름이 펴지도록 살짝 당기고,
아랫입술 가운데에 취구를 대고 윗입술을 가볍게 덮습니다. 입김이 여러 갈래로 갈라지지 않게
입술 가운데로만 내보냅니다.</p></details>
<details><summary>소리가 잘 안 날 때 (교본03·피리토끼)</summary>
<p>취구 위치가 정확한지, 입술에 힘이 들어가지 않았는지, 입김 방향이 위나 아래로 치우치지 않았는지
확인합니다. 입김이 너무 세면 음정이 올라가고(높은소리·역취), 너무 여리면 내려갑니다(낮은소리·저취).
처음부터 끝까지 고르게 부는 연습을 합니다.</p></details>
<p class="hint">※ 시(南·湳)의 3공 반막음이 어려우면 대체 운지 ●●○●○도 쓰입니다 — 피리토끼 급수제 · 제4공은 교본에 따라 오른손 검지로 막기도 합니다.</p>
<footer>자료: 포인트 단소교본(운지표·잡기·소리내기) · 피리토끼 단소급수제 총정리 — 운지 데이터 교차검증 완료 · 2026</footer>
<div class="print-only">${printSvg}</div>
<script>${js}</script>
</body>
</html>`;
}

/* ── 실행 ─────────────────────────────────────────────────────────── */
const svg = buildStaticSVG();
const errs = verify(svg);
if (errs.length) {
  console.error('❌ 자체 검증 실패:\n' + errs.map((e) => ' - ' + e).join('\n'));
  process.exit(1);
}
writeFileSync(join(DIR, '단소_계이름_운지법_차트.svg'), svg, 'utf8');
console.log('✅ SVG 생성 + 자체 검증 15/15 통과');

const printHtml = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>단소 계이름 운지법 차트 (인쇄)</title>
<style>@page{size:A4 landscape;margin:0}html,body{margin:0;padding:0}svg{display:block;width:297mm;height:210mm}</style>
</head><body>${svg.replace(/^<\?xml[^>]*\?>\n/, '')}</body></html>`;
writeFileSync(join(DIR, 'print.html'), printHtml, 'utf8');
console.log('✅ print.html 생성');

writeFileSync(join(DIR, '단소_계이름_운지법_차트.html'), buildInteractiveHTML(svg), 'utf8');
console.log('✅ 인터랙티브 HTML 생성');

export { NOTES, FINGER, C, FONT, defs, leftPanel, miniDanso, MINI, GRID, buildStaticSVG };
