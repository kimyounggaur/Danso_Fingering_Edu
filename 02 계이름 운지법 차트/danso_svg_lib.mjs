// 단소 차트와 모바일 앱이 함께 쓰는 순수 SVG 컴포넌트
// 이 파일을 import해도 파일 생성 부수효과가 없습니다.

/* ── 1. 데이터 (Single Source of Truth — 수정 금지) ─────────────────
   holes = [1공(뒤), 2공, 3공, 4공, 5공]  1=막음 0.5=반막음 0=엶       */
const NOTES = [
  { id: 1, sol: '솔', yul: '仲', read: '중', holes: [1, 1, 1, 1, 0], breath: '저취', freq: 415.30 },
  { id: 2, sol: '라', yul: '林', read: '임', holes: [1, 1, 1, 0, 0], breath: '저취', freq: 466.16 },
  { id: 3, sol: '시', yul: '南', read: '남', holes: [1, 1, 0.5, 0, 0], breath: '저취', freq: 523.25, alt: '●●○●○' },
  { id: 4, sol: '도', yul: '無', read: '무', holes: [1, 1, 0, 0, 0], breath: '저취', freq: 554.37 },
  { id: 5, sol: '레', yul: '潢', read: '황', holes: [1, 0, 0, 0, 0], breath: '저취', freq: 622.25 },
  { id: 6, sol: '미', yul: '汰', read: '태', holes: [0, 0, 0, 0, 0], breath: '저취', freq: 698.46 },
  { id: 7, sol: '파', yul: '淡', read: '담', holes: [1, 1, 1, 1, 1], breath: '평취', freq: 739.99 },
  { id: 8, sol: '솔', yul: '沖', read: '중', holes: [1, 1, 1, 1, 1], breath: '역취', freq: 830.61, hi: 1 },
  { id: 9, sol: '라', yul: '淋', read: '임', holes: [1, 1, 1, 0, 0], breath: '역취', freq: 932.33, hi: 1 },
  { id: 10, sol: '시', yul: '湳', read: '남', holes: [1, 1, 0.5, 0, 0], breath: '역취', freq: 1046.50, hi: 1, alt: '●●○●○' },
  { id: 11, sol: '도', yul: '潕', read: '무', holes: [1, 1, 0, 0, 0], breath: '역취', freq: 1108.73, hi: 1 },
  { id: 12, sol: '레', yul: '潢′', read: '황', holes: [1, 0, 0, 0, 0], breath: '역취', freq: 1244.51, hi: 1 },
  { id: 13, sol: '미', yul: '汰′', read: '태', holes: [1, 0, 1, 0, 0], breath: '역취', freq: 1396.91, hi: 1 },
  { id: 14, sol: '파', yul: '淡′', read: '담', holes: [0, 1, 1, 0, 0], breath: '역취', freq: 1479.98, hi: 1 },
  { id: 15, sol: '솔', yul: '沖′', read: '중', holes: [1, 1, 0, 1, 0], breath: '역취', freq: 1661.22, hi: 2 },
];

// 지공-손가락 매핑 (교본01·교본04 기준)
const FINGER = {
  1: { hand: 'L', name: '왼손 엄지', pos: '뒷면' },
  2: { hand: 'L', name: '왼손 검지' },
  3: { hand: 'L', name: '왼손 중지' },
  4: { hand: 'R', name: '오른손 중지' },
  5: { hand: 'R', name: '오른손 약지' },
};

const C = {
  paper: '#fdfbf5', card: '#f7f2e4', cardLine: '#d8d2b8',
  ink: '#26301b', sub: '#5c6247', grid: '#c9cfae',
  low: '#3d6b2e', high: '#b4652f', lowBg: '#e9f0dd', highBg: '#f7e8d8',
  bamboo1: '#d3a86e', bamboo2: '#a97b45', bamboo3: '#83592e',
  hole: '#241c12',
  skin: '#f3c6a5', skinHi: '#fbdec4', skinSh: '#dfa87f', skinLine: '#b97d52',
  nail: '#fbe9dc', nailLine: '#e0b596',
  handL: '#2f6f4f', handR: '#b4652f',
};
const FONT = `'Noto Sans KR','Noto Sans CJK KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const txt = (x, y, s, size, fill, opts = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-family="${FONT}"` +
  ` text-anchor="${opts.anchor || 'middle'}"${opts.weight ? ` font-weight="${opts.weight}"` : ''}` +
  `${opts.ls ? ` letter-spacing="${opts.ls}"` : ''}${opts.op ? ` opacity="${opts.op}"` : ''}>${esc(s)}</text>`;

/* ── 2. 공용 <defs> ──────────────────────────────────────────────── */
function defs() {
  return `<defs>
  <linearGradient id="gBamboo" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.bamboo3}"/><stop offset="0.18" stop-color="${C.bamboo2}"/>
    <stop offset="0.42" stop-color="${C.bamboo1}"/><stop offset="0.62" stop-color="#e2bd85"/>
    <stop offset="0.8" stop-color="${C.bamboo2}"/><stop offset="1" stop-color="${C.bamboo3}"/>
  </linearGradient>
  <linearGradient id="gBambooMini" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.bamboo2}"/><stop offset="0.45" stop-color="#dcb67e"/>
    <stop offset="1" stop-color="${C.bamboo3}"/>
  </linearGradient>
  <radialGradient id="gSkin" cx="0.35" cy="0.3" r="1">
    <stop offset="0" stop-color="${C.skinHi}"/><stop offset="0.55" stop-color="${C.skin}"/>
    <stop offset="1" stop-color="${C.skinSh}"/>
  </radialGradient>
  <linearGradient id="gSkinV" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.skinHi}"/><stop offset="0.5" stop-color="${C.skin}"/>
    <stop offset="1" stop-color="${C.skinSh}"/>
  </linearGradient>
  <filter id="fSoft" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="1.6" dy="2.4" stdDeviation="2.2" flood-color="#5a3214" flood-opacity="0.28"/>
  </filter>
  <filter id="fTiny" x="-60%" y="-60%" width="220%" height="220%">
    <feDropShadow dx="0.8" dy="1.2" stdDeviation="1" flood-color="#5a3214" flood-opacity="0.3"/>
  </filter>
</defs>`;
}

/* ── 3. 손가락 그리기 헬퍼 ────────────────────────────────────────
   fingerChain: 중심선 polyline을 두 번 스트로크(외곽선→살색)해
   윤곽 있는 캡슐 체인(손가락)을 만든다.                              */
function chainPath(pts) {
  return 'M' + pts.map((p) => `${p[0]} ${p[1]}`).join(' L ');
}
function fingerChain(pts, r, opts = {}) {
  const fill = opts.fill || 'url(#gSkinV)';
  const line = opts.line || C.skinLine;
  const d = chainPath(pts);
  const cap = 'stroke-linecap="round" stroke-linejoin="round" fill="none"';
  let s = `<path d="${d}" stroke="${line}" stroke-width="${r * 2 + 3}" ${cap}/>`;
  s += `<path d="${d}" stroke="${fill}" stroke-width="${r * 2}" ${cap}/>`;
  return s;
}
// 관절 주름: 손가락 방향(ang, 도)에 수직인 짧은 호
function crease(x, y, ang, w) {
  const a = ((ang + 90) * Math.PI) / 180;
  const dx = Math.cos(a) * w, dy = Math.sin(a) * w;
  const bx = Math.cos((ang * Math.PI) / 180) * w * 0.35, by = Math.sin((ang * Math.PI) / 180) * w * 0.35;
  return `<path d="M${x - dx} ${y - dy} Q ${x + bx} ${y + by} ${x + dx} ${y + dy}" stroke="${C.skinSh}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity="0.8"/>`;
}
// 손톱: 손끝(tx,ty)에서 방향 ang(도)를 보는 둥근 손톱
function nail(tx, ty, ang, r) {
  return `<g transform="translate(${tx} ${ty}) rotate(${ang})">
    <rect x="${-r * 0.92}" y="${-r * 0.62}" width="${r * 1.15}" height="${r * 1.24}" rx="${r * 0.55}"
      fill="${C.nail}" stroke="${C.nailLine}" stroke-width="1"/>
  </g>`;
}

/* ── 4. 미니 손끝 (그리드 다이어그램용) ──────────────────────────
   dir: 'L'(왼쪽에서 진입) | 'R'(오른쪽에서 진입)                    */
function miniFingertip(cx, cy, dir, state, hand, opts = {}) {
  const sgn = dir === 'L' ? -1 : 1;
  const r = opts.r || 9;
  const len = opts.short ? 22 : dir === 'L' ? 30 : 26;
  const root = [cx + sgn * len, cy + (opts.short ? 9 : 12)];
  const mid = [cx + sgn * len * 0.5, cy + (opts.short ? 4 : 5)];
  const tip = [cx, cy];
  const ang = dir === 'L' ? 0 : 180;
  const color = hand === 'L' ? C.handL : C.handR;
  let g = '';
  if (state === 0) {
    // 엶: 지공 노출 + 손가락 색 링만
    return `<circle cx="${cx}" cy="${cy}" r="${r + 3.5}" fill="none" stroke="${color}" stroke-width="1.6" opacity="0.4"/>`;
  }
  let inner = fingerChain([root, mid, tip], r) +
    crease(cx + sgn * len * 0.44, cy + 4, ang + sgn * 16, r * 0.72);
  if (state === 0.5) {
    // 반막음: 지공 아래 절반만 덮도록 클립
    const clip = `cH${Math.round(cx)}_${Math.round(cy)}`;
    g += `<clipPath id="${clip}"><rect x="${cx - 44}" y="${cy}" width="88" height="60"/></clipPath>`;
    g += `<g clip-path="url(#${clip})" filter="url(#fTiny)">${inner}</g>`;
    g += `<line x1="${cx - r - 2}" y1="${cy}" x2="${cx + r + 2}" y2="${cy}" stroke="${color}" stroke-width="1.4" opacity="0.75"/>`;
  } else {
    g += `<g filter="url(#fTiny)"${opts.dashed ? ' opacity="0.93"' : ''}>${inner}</g>`;
    g += `<circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="none" stroke="rgba(90,50,20,0.35)" stroke-width="1.4"${opts.dashed ? ' stroke-dasharray="4 3"' : ''}/>`;
  }
  return g;
}

/* ── 5. 미니 단소 (그리드 열 다이어그램) ─────────────────────────── */
const MINI = {
  top: 402, bottom: 888, hw: 13, hr: 8.5, backDX: -27,
  holeY: { 1: 452, 2: 526, 3: 600, 4: 706, 5: 780 },
  nodes: [656, 844],
};
function miniDanso(cx, holes) {
  const { top, holeY, bottom, hw, hr, nodes } = MINI;
  let s = `<g>`;
  s += `<rect x="${cx - hw}" y="${top}" width="${hw * 2}" height="${bottom - top}" rx="6" fill="url(#gBambooMini)" stroke="#6d4a26" stroke-width="1.3"/>`;
  s += `<path d="M${cx - 5.5} ${top - 1} q 5.5 8 11 0 l 0 -4.5 l -11 0 Z" fill="#efe2c8" stroke="#6d4a26" stroke-width="1"/>`;
  for (const my of nodes) {
    s += `<line x1="${cx - hw}" y1="${my}" x2="${cx + hw}" y2="${my}" stroke="#6d4a26" stroke-width="1.6" opacity="0.65"/>`;
    s += `<line x1="${cx - hw}" y1="${my + 2.6}" x2="${cx + hw}" y2="${my + 2.6}" stroke="#e8cb99" stroke-width="1" opacity="0.8"/>`;
  }
  s += `<rect x="${cx - hw + 3}" y="${top + 6}" width="3.4" height="${bottom - top - 12}" rx="1.7" fill="#ffffff" opacity="0.35"/>`;
  // 앞지공 2~5 + 상태
  for (let h = 2; h <= 5; h++) {
    const st = holes[h - 1];
    const cy = holeY[h];
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${hr}" ry="${hr * 0.88}" fill="${C.hole}"/>`;
    s += `<ellipse cx="${cx}" cy="${cy - 1.4}" rx="${hr * 0.62}" ry="${hr * 0.4}" fill="#4a3a26" opacity="0.8"/>`;
    s += miniFingertip(cx, cy, FINGER[h].hand === 'L' ? 'L' : 'R', st, FINGER[h].hand);
  }
  // 뒷구멍 1공 (관 왼쪽 위 분리 표기)
  const bx = cx + MINI.backDX, by = holeY[1];
  const st1 = holes[0];
  if (st1 === 0) {
    s += `<circle cx="${bx}" cy="${by}" r="${hr}" fill="${C.hole}" stroke="#6d4a26" stroke-width="1.2" stroke-dasharray="3.5 2.6"/>`;
    s += `<circle cx="${bx}" cy="${by}" r="${hr + 3.5}" fill="none" stroke="${C.handL}" stroke-width="1.5" opacity="0.4"/>`;
  } else {
    s += `<circle cx="${bx}" cy="${by}" r="${hr}" fill="${C.hole}"/>`;
    s += miniFingertip(bx, by, 'L', 1, 'L', { r: 8, dashed: true, short: true });
  }
  s += txt(bx, by + 24, '뒤', 10.5, C.sub);
  s += `</g>`;
  return s;
}

/* ── 6. 큰 단소 + 양손 (좌측 패널) ────────────────────────────────
   stateful=true 면 지공 손가락 그룹에 id 부여 (HTML 애니메이션용)    */
const BIG = {
  cx: 208, top: 246, bottom: 1078, hw: 17,
  holeY: { 1: 348, 2: 448, 3: 522, 4: 706, 5: 780 },
  nodes: [610, 906],
};
function bigDanso() {
  const { cx, top, bottom, hw, holeY, nodes } = BIG;
  let s = '';
  s += `<g filter="url(#fSoft)">`;
  s += `<rect x="${cx - hw}" y="${top}" width="${hw * 2}" height="${bottom - top}" rx="8" fill="url(#gBamboo)" stroke="#5f3f1e" stroke-width="1.8"/>`;
  s += `</g>`;
  // 취구 (U자 노치 + 단면)
  s += `<ellipse cx="${cx}" cy="${top}" rx="${hw}" ry="5.5" fill="#efe0c2" stroke="#5f3f1e" stroke-width="1.6"/>`;
  s += `<ellipse cx="${cx}" cy="${top + 0.5}" rx="${hw * 0.62}" ry="3.4" fill="#8a5f33" opacity="0.85"/>`;
  s += `<path d="M${cx - 6.5} ${top + 3.2} a 6.5 5 0 0 0 13 0 Z" fill="#3a2a17" opacity="0.9"/>`;
  for (const ny of nodes) {
    s += `<rect x="${cx - hw}" y="${ny - 3}" width="${hw * 2}" height="6" rx="3" fill="#8a5f33" opacity="0.55"/>`;
    s += `<line x1="${cx - hw}" y1="${ny - 3.4}" x2="${cx + hw}" y2="${ny - 3.4}" stroke="#e8cb99" stroke-width="1.2" opacity="0.9"/>`;
    s += `<line x1="${cx - hw}" y1="${ny + 3.4}" x2="${cx + hw}" y2="${ny + 3.4}" stroke="#5f3f1e" stroke-width="1.1" opacity="0.7"/>`;
  }
  s += `<rect x="${cx - hw + 4}" y="${top + 10}" width="4.5" height="${bottom - top - 20}" rx="2.2" fill="#ffffff" opacity="0.32"/>`;
  s += `<ellipse cx="${cx}" cy="${bottom}" rx="${hw}" ry="5.5" fill="#c9a267" stroke="#5f3f1e" stroke-width="1.5"/>`;
  s += `<ellipse cx="${cx}" cy="${bottom}" rx="${hw * 0.55}" ry="3" fill="#3a2a17"/>`;
  for (let h = 2; h <= 5; h++) {
    const cy = holeY[h];
    s += `<ellipse cx="${cx}" cy="${cy}" rx="10.5" ry="9" fill="${C.hole}"/>`;
    s += `<ellipse cx="${cx}" cy="${cy - 1.8}" rx="6.5" ry="4" fill="#4a3a26" opacity="0.85"/>`;
  }
  // 뒷구멍(1공) 위치 점선 표시
  s += `<ellipse cx="${cx}" cy="${holeY[1]}" rx="10.5" ry="9" fill="none" stroke="#f5eeda" stroke-width="1.6" stroke-dasharray="4 3" opacity="0.95"/>`;
  return s;
}

/* 손 하나를 규격화해 그린다.
   side: 'L' → 왼쪽에서 진입(손끝이 오른쪽), 'R' → 오른쪽에서 진입    */
function hand(side, palm, fingers, opts = {}) {
  // palm: {x,y,rx,ry,rot}   fingers: [{pts, r, nailAng, hole, id, rest}]
  const sgn = side === 'L' ? 1 : -1;
  let s = `<g${opts.gid ? ` id="${opts.gid}"` : ''}>`;
  // 손목 (팔 쪽으로)
  if (opts.wrist) s += fingerChain(opts.wrist, opts.wristR || 21);
  // 손등
  s += `<g transform="rotate(${palm.rot || 0} ${palm.x} ${palm.y})">` +
    `<ellipse cx="${palm.x}" cy="${palm.y}" rx="${palm.rx}" ry="${palm.ry}" fill="url(#gSkin)" stroke="${C.skinLine}" stroke-width="1.8"/>` +
    `</g>`;
  // 손등 주름 힌트
  s += `<path d="M${palm.x - sgn * 6} ${palm.y - palm.ry * 0.45} q ${sgn * 16} 6 ${sgn * 20} 22" stroke="${C.skinSh}" stroke-width="1.2" fill="none" opacity="0.5"/>`;
  for (const f of fingers) {
    const tip = f.pts[f.pts.length - 1];
    s += `<g${f.id ? ` id="${f.id}" class="finger" data-hole="${f.hole}"` : ''}>`;
    s += fingerChain(f.pts, f.r);
    // 관절 주름 2개 (첫/둘째 세그먼트 끝)
    const p1 = f.pts[1];
    const angSeg = (Math.atan2(tip[1] - p1[1], tip[0] - p1[0]) * 180) / Math.PI;
    s += crease(p1[0], p1[1], angSeg, f.r * 0.78);
    s += crease((p1[0] + tip[0]) / 2, (p1[1] + tip[1]) / 2, angSeg, f.r * 0.72);
    s += nail(tip[0] + (side === 'L' ? 1.5 : -1.5), tip[1], f.nailAng ?? (side === 'L' ? 0 : 180), f.r * 0.86);
    if (f.hole) {
      s += `<circle class="ring" cx="${tip[0]}" cy="${tip[1]}" r="${f.r + 4}" fill="none" stroke="rgba(90,50,20,0.32)" stroke-width="1.6"/>`;
    }
    s += `</g>`;
  }
  s += `</g>`;
  return s;
}

// 왼손(위): 검지→2공, 중지→3공 / 오른손(아래): 중지→4공, 약지→5공
function bigHands(stateful) {
  const { cx, holeY } = BIG;
  const id = (k) => (stateful ? k : '');
  let s = '';
  // 왼손 — 관 왼쪽 위 (손가락 거의 평행, 위→아래 검지·중지·약지·새끼)
  s += hand('L',
    { x: 102, y: 510, rx: 46, ry: 72, rot: -12 },
    [
      // 새끼 (가장 아래, 먼저 그려 뒤로)
      { pts: [[106, 586], [144, 598], [182, 606]], r: 8.4 },
      // 약지 (관에 걸침)
      { pts: [[112, 544], [154, 558], [196, 570]], r: 9.6 },
      // 중지 → 3공
      { pts: [[116, 496], [162, 508], [cx, holeY[3]]], r: 11.2, hole: 3, id: id('fingL3') },
      // 검지 → 2공
      { pts: [[118, 440], [162, 442], [cx, holeY[2]]], r: 11, hole: 2, id: id('fingL2') },
    ],
    { wrist: [[26, 528], [64, 516]], wristR: 27, gid: id('handL') });
  // 오른손 — 관 오른쪽 아래
  s += hand('R',
    { x: 306, y: 742, rx: 44, ry: 56, rot: 8 },
    [
      // 새끼 (관 아래 걸침)
      { pts: [[300, 800], [262, 814], [230, 822]], r: 8 },
      // 검지 (4공 위 관에 얹음)
      { pts: [[296, 674], [252, 662], [218, 658]], r: 10 },
      // 약지 → 5공
      { pts: [[298, 764], [252, 772], [cx, holeY[5]]], r: 10.6, hole: 5, id: id('fingR5') },
      // 중지 → 4공
      { pts: [[298, 712], [250, 706], [cx, holeY[4]]], r: 11.2, hole: 4, id: id('fingR4') },
    ],
    { wrist: [[374, 760], [334, 750]], wristR: 26, gid: id('handR') });
  return s;
}

// 뒷면 보기 인셋 (왼손 엄지 → 1공)
function backInset(stateful) {
  const bx = 92, by = 286, r = 50;
  let s = `<g${stateful ? ' id="insetBack"' : ''}>`;
  s += `<circle cx="${bx}" cy="${by}" r="${r}" fill="#efe9d6" stroke="${C.cardLine}" stroke-width="2"/>`;
  s += `<rect x="${bx - 11}" y="${by - r + 11}" width="22" height="${r * 2 - 22}" rx="6" fill="url(#gBambooMini)" stroke="#6d4a26" stroke-width="1.2"/>`;
  s += `<ellipse cx="${bx}" cy="${by - 8}" rx="7" ry="6" fill="${C.hole}"/>`;
  s += `<g${stateful ? ' id="fingL1" class="finger" data-hole="1"' : ''}>`;
  s += fingerChain([[bx - 38, by + 32], [bx - 15, by + 11], [bx, by - 7]], 10.5);
  s += crease(bx - 17, by + 12, -42, 8.2);
  s += nail(bx + 1, by - 8, -52, 9);
  s += `<circle class="ring" cx="${bx}" cy="${by - 8}" r="14" fill="none" stroke="rgba(90,50,20,0.32)" stroke-width="1.5"/>`;
  s += `</g>`;
  s += txt(bx + 4, by + r + 20, '뒷면 보기', 14, C.ink, { weight: 700 });
  s += txt(bx + 4, by + r + 38, '왼손 엄지 → 제1공', 12.5, C.sub);
  // 리더선 (인셋 → 본체 1공 점선)
  s += `<path d="M${bx + r - 4} ${by - 2} Q ${BIG.cx - 52} ${BIG.holeY[1] - 30} ${BIG.cx - 13} ${BIG.holeY[1] - 3}" stroke="${C.handL}" stroke-width="1.6" fill="none" stroke-dasharray="5 4" opacity="0.75"/>`;
  s += `</g>`;
  return s;
}

// 콜아웃 라벨
function callouts() {
  const { cx, top, holeY } = BIG;
  const L = (hole, tx, ty, side) => {
    const f = FINGER[hole];
    const color = f.hand === 'L' ? C.handL : C.handR;
    const hx = side === 'r' ? cx + 13 : cx - 13;
    const sx = side === 'r' ? tx - 5 : tx + 5;
    return `<path d="M${hx} ${holeY[hole]} L ${sx} ${ty - 5}" stroke="${color}" stroke-width="1.5" fill="none" opacity="0.8"/>` +
      txt(tx, ty, `${['', '①', '②', '③', '④', '⑤'][hole]} ${f.name}`, 15.5, color, { anchor: side === 'r' ? 'start' : 'end', weight: 700 });
  };
  let s = '';
  s += txt(cx + 32, top + 5, '취구', 15.5, C.sub, { anchor: 'start', weight: 600 });
  s += `<path d="M${cx + 28} ${top} L ${cx + 14} ${top}" stroke="${C.sub}" stroke-width="1.4"/>`;
  s += txt(cx + 28, holeY[1] + 5, '① 제1공(뒤)', 15.5, C.handL, { anchor: 'start', weight: 700 });
  s += `<path d="M${cx + 13} ${holeY[1]} L ${cx + 24} ${holeY[1]}" stroke="${C.handL}" stroke-width="1.5" opacity="0.8"/>`;
  s += L(2, 264, 424, 'r');
  s += L(3, 270, 540, 'r');
  s += L(4, 148, 664, 'l');
  s += L(5, 144, 812, 'l');
  return s;
}

function leftPanel(stateful = false) {
  let s = `<g>`;
  s += `<clipPath id="clipPanel"><rect x="34" y="188" width="330" height="960" rx="18"/></clipPath>`;
  s += `<rect x="34" y="188" width="330" height="960" rx="18" fill="${C.card}" stroke="${C.cardLine}" stroke-width="2"/>`;
  s += `<g clip-path="url(#clipPanel)">`;
  s += bigDanso();
  s += backInset(stateful);
  s += bigHands(stateful);
  s += `</g>`;
  s += txt(58, 226, '단소 잡는 법', 24, C.ink, { anchor: 'start', weight: 700, ls: 2 });
  s += callouts();
  s += txt(199, 1104, '왼손이 위(취구 쪽) · 오른손이 아래', 15, C.sub, { weight: 600 });
  s += txt(199, 1127, '오른손 엄지는 관 뒤를 받칩니다 (교본04)', 13.5, C.sub);
  s += `</g>`;
  return s;
}

export {
  NOTES, FINGER, C, FONT, esc, txt, defs, chainPath, fingerChain, crease, nail,
  miniFingertip, miniDanso, MINI, BIG, bigDanso, hand, bigHands, backInset,
  callouts, leftPanel,
};
