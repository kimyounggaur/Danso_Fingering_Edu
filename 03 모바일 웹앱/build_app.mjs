// 단소 계이름 운지법 배우기 — 오프라인 단일 HTML 생성기
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NOTES, C, FONT } from '../02 계이름 운지법 차트/danso_svg_lib.mjs';
import { animatedReferencePanel, animatedReferenceCss, animatedHolePoints } from './danso_hand_animation.mjs';
import { createDansoSynth, DANSO_SYNTH_VERSION } from './danso_synth.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, '..');
const PUBLIC_DIR = join(ROOT, 'public');

const referenceImages = Array.from({ length: 5 }, (_, i) => {
  const file = `danso-reference-${String(i + 1).padStart(2, '0')}.webp`;
  const url = 'data:image/webp;base64,' + readFileSync(join(DIR, 'assets', file)).toString('base64');
  return `<img src="${url}" alt="단소 잡는 자세 참고 이미지 ${i + 1}" loading="lazy">`;
}).join('');

const ripplePoints = animatedHolePoints;

const rippleSvg = Object.entries(ripplePoints)
  .map(([hole, [x, y]]) => `<circle id="rippleH${hole}" class="hole-ripple" cx="${x}" cy="${y}" r="15"/>`)
  .join('');

const panelSvg = `<svg id="handPanel" xmlns="http://www.w3.org/2000/svg" viewBox="24 178 350 980" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="stageTitle stageDesc">
  <title id="stageTitle">단소를 잡은 양손 운지 애니메이션</title>
  <desc id="stageDesc">선택한 음에 맞춰 다섯 손가락이 단소의 지공을 막거나 반만 막거나 엽니다.</desc>
  ${animatedReferencePanel()}
  <g class="ripple-layer" aria-hidden="true">${rippleSvg}</g>
</svg>`;

const notesJson = JSON.stringify(NOTES);
const audioEngineSource = createDansoSynth.toString();
const css = `
:root{
  color-scheme:light;
  --paper:${C.paper};--card:${C.card};--card-line:${C.cardLine};--ink:${C.ink};--sub:${C.sub};
  --low:${C.low};--low-bg:${C.lowBg};--high:${C.high};--high-bg:${C.highBg};
  --bamboo:#b9874e;--shadow:0 16px 42px rgba(74,54,28,.13);
  --ease:cubic-bezier(.2,.8,.2,1);--safe-bottom:env(safe-area-inset-bottom,0px);
}
*{box-sizing:border-box}
html,body{width:100%;height:100%;height:100dvh;overflow:hidden;overscroll-behavior:none}
body{margin:0;background:var(--paper);color:var(--ink);font-family:${FONT};-webkit-font-smoothing:antialiased}
body::before{content:"";position:fixed;inset:0;pointer-events:none;background:
  radial-gradient(circle at 10% 16%,rgba(61,107,46,.1),transparent 28%),
  radial-gradient(circle at 92% 78%,rgba(180,101,47,.09),transparent 30%)}
button{font:inherit;color:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
button:focus-visible{outline:3px solid #1769aa;outline-offset:3px}
.skip-link{position:fixed;z-index:30;left:12px;top:8px;transform:translateY(-150%);background:#fff;padding:8px 12px;border-radius:8px;color:var(--ink)}
.skip-link:focus{transform:none}
.app-shell{position:relative;z-index:1;height:100dvh;display:flex;flex-direction:column}
.appbar{height:48px;min-height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 12px 0 16px;border-bottom:1px solid rgba(92,98,71,.18);background:rgba(253,251,245,.92);backdrop-filter:blur(12px)}
.brand{display:flex;align-items:center;gap:9px;min-width:0}
.brand-mark{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:var(--low-bg);border:1px solid rgba(61,107,46,.3);color:var(--low);font-family:serif;font-weight:800;box-shadow:inset 0 0 0 4px rgba(255,255,255,.55)}
.brand-copy{min-width:0}
.brand-copy h1{margin:0;font-size:15.5px;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.brand-copy p{display:none;margin:1px 0 0;color:var(--sub);font-size:10.5px}
.icon-button{width:36px;height:36px;border:0;border-radius:50%;display:grid;place-items:center;background:transparent;font-size:19px;cursor:pointer}
.icon-button:hover{background:rgba(92,98,71,.08)}
.workspace{flex:1;min-height:0;display:flex;flex-direction:column}
.stage{position:relative;flex:1;min-height:0;display:grid;place-items:center;padding:6px 10px 4px;overflow:hidden}
.stage::before{content:"";position:absolute;width:min(72vw,310px);aspect-ratio:1;border:1px solid rgba(61,107,46,.14);border-radius:50%;box-shadow:0 0 0 18px rgba(61,107,46,.025),0 0 0 38px rgba(61,107,46,.018)}
.stage svg{position:relative;height:100%;width:100%;display:block;filter:drop-shadow(0 12px 24px rgba(74,54,28,.08))}
.gesture-hint{position:absolute;right:14px;top:50%;transform:translateY(-50%);max-width:108px;padding:9px 10px;border:1px solid rgba(92,98,71,.18);border-radius:13px;background:rgba(255,255,255,.72);box-shadow:0 8px 22px rgba(74,54,28,.08);color:var(--sub);font-size:10.5px;line-height:1.45;text-align:center;pointer-events:none}
.gesture-hint b{display:block;margin-bottom:2px;color:var(--ink);font-size:11px}
.gesture-hint .hold-dot{display:inline-block;width:7px;height:7px;margin-right:4px;border-radius:50%;background:var(--low);box-shadow:0 0 0 4px rgba(61,107,46,.13)}
.deck{flex:0 0 auto;border-top:1px solid rgba(92,98,71,.18);background:rgba(253,251,245,.95);box-shadow:0 -12px 36px rgba(74,54,28,.06)}
.info-strip{height:58px;display:grid;grid-template-columns:minmax(98px,1fr) auto minmax(96px,1fr);align-items:center;gap:8px;padding:6px 14px;border-bottom:1px solid rgba(92,98,71,.15)}
.note-id{display:flex;align-items:baseline;gap:7px;min-width:0}
.note-name{font-size:25px;font-weight:800;letter-spacing:-.06em;white-space:nowrap}
.note-yul{color:var(--sub);font-size:15px;font-weight:650;white-space:nowrap}
.note-yul small{font-size:10.5px;font-weight:500}
.hole-state{display:flex;gap:4px;justify-content:center;white-space:nowrap}
.hole-state span{width:14px;height:14px;display:grid;place-items:center;font-size:14px;line-height:1}
.breath{justify-self:end;display:flex;align-items:center;gap:7px;color:var(--low);min-width:0}
.breath-copy{text-align:right;line-height:1.05}
.breath-copy strong{display:block;font-size:12px}
.breath-copy small{color:var(--sub);font-size:9.5px;white-space:nowrap}
.breath-waves{width:30px;display:flex;flex-direction:column;gap:2px}
.breath-waves i{display:block;height:4px;border-top:2px solid currentColor;border-radius:50%;opacity:.2}
.breath-waves i.on{opacity:.85}
.breath-waves.sustaining i.on{animation:breathPulse 1.2s ease-in-out infinite}
.breath-waves.sustaining i:nth-child(2){animation-delay:.12s}.breath-waves.sustaining i:nth-child(3){animation-delay:.24s}
@keyframes breathPulse{0%,100%{opacity:.35;transform:translateX(-2px)}50%{opacity:1;transform:translateX(2px)}}
.controls{height:48px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:5px 12px}
.control{height:38px;border:1px solid rgba(92,98,71,.23);border-radius:999px;background:#fff;padding:0 13px;display:flex;align-items:center;gap:7px;font-size:12px;font-weight:750;cursor:pointer;box-shadow:0 3px 10px rgba(74,54,28,.05)}
.control[aria-pressed="true"]{border-color:currentColor;background:var(--low-bg);color:var(--low)}
body[data-octave="true"] .control.octave[aria-pressed="true"]{background:var(--high-bg);color:var(--high)}
.control-glyph{font-size:16px;line-height:1}
.control-hint{color:var(--sub);font-size:10px;font-weight:500}
.keypad{position:relative;display:grid;grid-template-columns:repeat(4,minmax(64px,1fr));gap:7px;padding:0 10px calc(10px + var(--safe-bottom))}
.note-key{position:relative;min-width:64px;min-height:64px;border:1.5px solid rgba(61,107,46,.38);border-radius:16px;background:linear-gradient(150deg,#fff,var(--low-bg));color:var(--low);display:grid;grid-template-columns:auto 1fr;grid-template-rows:1fr 1fr;column-gap:6px;align-items:center;padding:7px 8px;cursor:pointer;box-shadow:0 5px 0 rgba(61,107,46,.12),0 8px 16px rgba(74,54,28,.06);transition:transform .12s ease,box-shadow .12s ease,border-color .12s ease}
.note-key .number{grid-row:1 / 3;font-size:27px;font-weight:850;line-height:1;letter-spacing:-.06em}
.note-key .sol{align-self:end;font-size:11px;font-weight:800;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.note-key .yul{align-self:start;color:var(--sub);font-size:9.5px;line-height:1.2;white-space:nowrap}
.note-key.selected{border-color:currentColor;box-shadow:0 5px 0 currentColor,0 10px 18px rgba(74,54,28,.08)}
.note-key.pressed{transform:translateY(4px);box-shadow:0 1px 0 currentColor,0 4px 8px rgba(74,54,28,.06)}
body[data-octave="true"] .note-key{border-color:rgba(180,101,47,.42);background:linear-gradient(150deg,#fff,var(--high-bg));color:var(--high);box-shadow:0 5px 0 rgba(180,101,47,.14),0 8px 16px rgba(74,54,28,.06)}
body[data-octave="true"] .note-key.selected{box-shadow:0 5px 0 currentColor,0 10px 18px rgba(74,54,28,.08)}
.float-note{position:absolute;left:50%;top:12px;z-index:3;transform:translateX(-50%);font-size:12px;font-weight:850;color:currentColor;pointer-events:none}
.finger{transition-property:transform;transition-duration:260ms;transition-timing-function:var(--ease);will-change:transform}
.finger .ring{transition:opacity 200ms ease}.finger.lifted .ring{opacity:0}
${animatedReferenceCss}
.hole-ripple{fill:none;stroke:var(--low);stroke-width:2.5;opacity:0;transform-box:fill-box;transform-origin:center}
body[data-tone="high"] .hole-ripple{stroke:var(--high)}
body:not(.ready) .finger{transition:none!important}
.settings-dialog{width:min(92vw,390px);border:0;border-radius:22px;padding:0;background:var(--paper);color:var(--ink);box-shadow:0 28px 80px rgba(38,48,27,.3)}
.settings-dialog::backdrop{background:rgba(38,48,27,.38);backdrop-filter:blur(3px)}
.sheet-head{display:flex;align-items:center;justify-content:space-between;padding:15px 16px;border-bottom:1px solid var(--card-line)}
.sheet-head h2{margin:0;font-size:17px}.sheet-body{padding:16px;max-height:75dvh;overflow-y:auto}
.reference-photo{margin:14px 0;color:var(--ink);font-size:12px}.reference-photo summary{cursor:pointer;font-weight:750;color:var(--low)}.reference-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.reference-photo img{display:block;width:100%;height:145px;object-fit:contain;border-radius:12px;background:var(--card)}.reference-photo p{color:var(--sub);line-height:1.5}
.sheet-body h3{margin:0 0 9px;font-size:13px;color:var(--low)}
.key-guide{display:grid;grid-template-columns:auto 1fr;gap:7px 12px;margin:0 0 16px;font-size:12px}
.key-guide dt{font-weight:800}.key-guide dd{margin:0;color:var(--sub)}
.tip-card{padding:12px 13px;border-radius:14px;background:var(--low-bg);color:var(--sub);font-size:11.5px;line-height:1.55}
.tip-card strong{color:var(--ink)}
.close-sheet{border:0;background:var(--card);border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:18px}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media (max-height:700px) and (orientation:portrait){
  .info-strip{height:54px}.controls{height:44px}.control{height:34px}.keypad{gap:6px;padding-bottom:calc(7px + var(--safe-bottom))}
  .note-key{min-height:61px;border-radius:14px;padding:6px 7px}.note-key .number{font-size:25px}.gesture-hint{display:none}
}
@media (min-width:640px) and (orientation:landscape){
  .appbar{padding-inline:22px}.brand-copy h1{font-size:17px}.brand-copy p{display:block}
  .workspace{flex-direction:row;padding:10px;gap:10px}.stage{flex:0 0 calc(55% - 5px);border:1px solid rgba(92,98,71,.16);border-radius:22px;background:rgba(255,255,255,.28)}
  .deck{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;border:1px solid rgba(92,98,71,.16);border-radius:22px;overflow:hidden;box-shadow:var(--shadow)}
  .info-strip{height:70px}.controls{height:58px;padding-inline:16px}.keypad{gap:10px;padding:4px 14px calc(14px + var(--safe-bottom))}
  .note-key{min-height:76px}.note-key .number{font-size:31px}.note-key .sol{font-size:12px}.note-key .yul{font-size:10.5px}
}
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{scroll-behavior:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
}
`;

const js = `
const NOTES=${notesJson};
const FING={1:'fingL1',2:'fingL2',3:'fingL3',4:'fingR4',5:'fingR5'};
const SYMBOL={1:'●',0.5:'◐',0:'○'};
const BREATH={
  '저취':{desc:'여리게',waves:1,tone:'low',attack:.09,level:.18,air:.027,chiff:.072,brightness:.82,vibratoRate:5.05,vibratoDepth:5.5},
  '평취':{desc:'보통 세기',waves:2,tone:'low',attack:.058,level:.205,air:.037,chiff:.085,brightness:.98,vibratoRate:5.2,vibratoDepth:6.8},
  '역취':{desc:'세고 빠르게',waves:3,tone:'high',attack:.038,level:.215,air:.052,chiff:.102,brightness:1.15,vibratoRate:5.45,vibratoDepth:8.6}
};
const DANSO_SYNTH_VERSION='${DANSO_SYNTH_VERSION}';
${audioEngineSource}
let octaveOn=false,shiftOctave=false,soundOn=true,currentNote=null,selectedButton=1;
let audioContext=null,audioEngine=null,activePointer=null,activeButton=null,keyboardButton=null;

const byId=(id)=>document.getElementById(id);
const reducedMotion=()=>window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const effectiveOctave=()=>octaveOn||shiftOctave;
const noteForButton=(buttonNo)=>NOTES[(effectiveOctave()?buttonNo+7:buttonNo)-1];
const fullSol=(note)=>note.id===15?'최고 솔':note.id>=8?'높은 '+note.sol:note.sol;
const holesText=(holes)=>holes.map((value)=>SYMBOL[value]).join(' ');

function renderKeys(){
  const high=effectiveOctave();
  document.body.dataset.octave=String(high);
  byId('octaveToggle').setAttribute('aria-pressed',String(octaveOn));
  byId('octaveState').textContent=high?'높은음':'기본음';
  document.querySelectorAll('.note-key').forEach((button)=>{
    const buttonNo=Number(button.dataset.button);
    const note=noteForButton(buttonNo);
    button.querySelector('.sol').textContent=fullSol(note);
    button.querySelector('.yul').textContent=note.yul+' ('+note.read+')';
    button.setAttribute('aria-label',buttonNo+'번 '+fullSol(note)+' '+note.read);
    button.classList.toggle('selected',buttonNo===selectedButton);
    if(buttonNo===selectedButton)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');
  });
}

function renderInfo(note){
  const breath=BREATH[note.breath];
  byId('noteName').textContent=fullSol(note);
  byId('noteYul').innerHTML=note.yul+' <small>('+note.read+')</small>';
  const holeState=byId('holeState');
  holeState.innerHTML=note.holes.map((value)=>'<span>'+SYMBOL[value]+'</span>').join('');
  holeState.setAttribute('aria-label','운지 '+holesText(note.holes));
  byId('breathName').textContent=note.breath;
  byId('breathDesc').textContent=breath.desc;
  byId('breathWaves').querySelectorAll('i').forEach((wave,index)=>wave.classList.toggle('on',index<breath.waves));
  document.body.dataset.tone=breath.tone;
  byId('liveDetail').textContent=fullSol(note)+', '+note.yul+' '+note.read+', '+holesText(note.holes)+', '+note.breath;
}

function rippleAt(hole){
  const circle=byId('rippleH'+hole);
  if(!circle||!circle.animate||reducedMotion())return;
  circle.animate(
    [{opacity:.58,transform:'scale(.55)'},{opacity:0,transform:'scale(1.75)'}],
    {duration:400,easing:'cubic-bezier(.2,.8,.2,1)'}
  );
}

function applyFingering(note,previous,animate=true){
  for(let hole=1;hole<=5;hole++){
    const finger=byId(FING[hole]);
    if(!finger)continue;
    const state=note.holes[hole-1];
    const before=previous?previous.holes[hole-1]:null;
    if(state===before)continue;
    finger.style.transitionDelay=(40*Math.max(0,hole-2))+'ms';
    finger.style.transitionDuration=(state===1?220:260)+'ms';
    finger.classList.toggle('lifted',state===0);
    finger.classList.toggle('half',state===.5);
    if(animate&&state===1&&before!==1)rippleAt(hole);
    const clear=()=>{finger.style.transitionDelay='';finger.style.transitionDuration='';};
    finger.addEventListener('transitionend',clear,{once:true});
    window.setTimeout(clear,520);
  }
}

function updateUrl(note){
  try{
    const url=new URL(location.href);
    url.searchParams.set('note',String(note.id));
    history.replaceState(null,'',url);
  }catch(_error){}
}

function selectNote(note,{animate=true,updateHistory=true}={}){
  const previous=currentNote;
  currentNote=note;
  applyFingering(note,previous,animate);
  renderInfo(note);
  renderKeys();
  if(updateHistory)updateUrl(note);
}

function ensureAudio(){
  if(!soundOn)return null;
  const AudioCtor=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtor)return null;
  if(!audioContext){
    try{audioContext=new AudioCtor({latencyHint:'interactive'});}
    catch(_error){audioContext=new AudioCtor();}
    audioEngine=createDansoSynth(audioContext);
    document.body.dataset.synthVersion=DANSO_SYNTH_VERSION;
  }
  if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
  return audioContext;
}

function releaseVoice(immediate=false){
  if(audioEngine)audioEngine.release(immediate);
  byId('breathWaves').classList.remove('sustaining');
}

function startSound(note){
  if(!soundOn)return;
  const ctx=ensureAudio();
  if(!ctx||!audioEngine)return;
  const spec=BREATH[note.breath];
  audioEngine.play(note,spec);
  byId('breathWaves').classList.add('sustaining');
}

function floatLabel(button,note){
  if(!button.animate||reducedMotion())return;
  const label=document.createElement('span');
  label.className='float-note';label.textContent=fullSol(note);button.appendChild(label);
  const animation=label.animate(
    [{opacity:0,transform:'translate(-50%,6px)'},{opacity:1,offset:.22},{opacity:0,transform:'translate(-50%,-12px)'}],
    {duration:430,easing:'ease-out'}
  );
  animation.finished.finally(()=>label.remove());
}

function beginButton(button,source='pointer'){
  const buttonNo=Number(button.dataset.button);
  selectedButton=buttonNo;
  const note=noteForButton(buttonNo);
  if(activeButton&&activeButton!==button)activeButton.classList.remove('pressed');
  activeButton=button;button.classList.add('pressed');
  selectNote(note);
  startSound(note);
  floatLabel(button,note);
  if(source==='pointer'&&navigator.vibrate)navigator.vibrate(10);
}

function endButton(button){
  if(button)button.classList.remove('pressed');
  if(activeButton===button)activeButton=null;
  releaseVoice(false);
}

function setOctave(value,updateCurrent=true){
  octaveOn=value;
  renderKeys();
  if(updateCurrent){
    const next=noteForButton(selectedButton);
    selectNote(next,{animate:true,updateHistory:true});
  }
}

document.querySelectorAll('.note-key').forEach((button)=>{
  button.addEventListener('pointerdown',(event)=>{
    event.preventDefault();activePointer=event.pointerId;
    try{button.setPointerCapture(event.pointerId);}catch(_error){}
    beginButton(button,'pointer');
  });
  const release=(event)=>{
    if(activePointer!==null&&event.pointerId!==activePointer)return;
    activePointer=null;endButton(button);
  };
  button.addEventListener('pointerup',release);
  button.addEventListener('pointercancel',release);
  button.addEventListener('lostpointercapture',(event)=>{if(activePointer===event.pointerId)release(event);});
  button.addEventListener('click',(event)=>{
    if(event.detail!==0)return;
    beginButton(button,'keyboard');window.setTimeout(()=>endButton(button),560);
  });
});

byId('octaveToggle').addEventListener('click',()=>setOctave(!octaveOn));
byId('soundToggle').addEventListener('click',()=>{
  soundOn=!soundOn;
  byId('soundToggle').setAttribute('aria-pressed',String(soundOn));
  byId('soundIcon').textContent=soundOn?'🔊':'🔇';
  byId('soundState').textContent=soundOn?'소리 켬':'소리 끔';
  if(audioEngine)audioEngine.setEnabled(soundOn);
  if(!soundOn)byId('breathWaves').classList.remove('sustaining');
});

const settingsDialog=byId('settingsDialog');
byId('settingsButton').addEventListener('click',()=>settingsDialog.showModal());
byId('closeSettings').addEventListener('click',()=>settingsDialog.close());
settingsDialog.addEventListener('click',(event)=>{if(event.target===settingsDialog)settingsDialog.close();});

document.addEventListener('keydown',(event)=>{
  if(event.target.closest('button,dialog')&&event.key===' ')return;
  if(event.key==='Shift'&&!shiftOctave){shiftOctave=true;renderKeys();return;}
  if(event.repeat)return;
  if(/^[1-8]$/.test(event.key)){
    event.preventDefault();const button=document.querySelector('[data-button="'+event.key+'"]');
    keyboardButton=button;beginButton(button,'keyboard');return;
  }
  if(event.key.toLowerCase()==='o'){
    event.preventDefault();setOctave(!octaveOn);return;
  }
  if(event.code==='Space'){
    event.preventDefault();if(currentNote)startSound(currentNote);
  }
});
document.addEventListener('keyup',(event)=>{
  if(event.key==='Shift'){shiftOctave=false;renderKeys();return;}
  if(/^[1-8]$/.test(event.key)&&keyboardButton){endButton(keyboardButton);keyboardButton=null;return;}
  if(event.code==='Space')releaseVoice(false);
});
window.addEventListener('blur',()=>{if(activeButton)activeButton.classList.remove('pressed');activeButton=null;releaseVoice(true);});
window.addEventListener('pagehide',()=>{if(audioEngine)audioEngine.destroy();});

(function init(){
  const raw=Number(new URLSearchParams(location.search).get('note'));
  const noteId=Number.isInteger(raw)&&raw>=1&&raw<=15?raw:1;
  if(noteId>=9){octaveOn=true;selectedButton=noteId-7;}
  else if(noteId===8){octaveOn=false;selectedButton=8;}
  else{selectedButton=noteId;}
  renderKeys();selectNote(NOTES[noteId-1],{animate:false,updateHistory:false});
  requestAnimationFrame(()=>document.body.classList.add('ready'));
})();
`;

const buttons = Array.from({ length: 8 }, (_, index) => {
  const buttonNo = index + 1;
  const note = NOTES[index];
  return `<button class="note-key" type="button" data-button="${buttonNo}" aria-label="${buttonNo}번 ${note.sol} ${note.read}">
    <span class="number">${buttonNo}</span><span class="sol">${note.sol}</span><span class="yul">${note.yul} (${note.read})</span>
  </button>`;
}).join('');

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="${C.paper}">
  <meta name="description" content="숫자 버튼을 누르며 단소의 계이름, 운지법, 실제 음을 함께 익히는 모바일 학습 웹앱">
  <title>단소 운지법 배우기</title>
  <style>${css}</style>
</head>
<body data-tone="low" data-octave="false">
  <a class="skip-link" href="#keypad">숫자 키패드로 이동</a>
  <div class="app-shell">
    <header class="appbar">
      <div class="brand"><span class="brand-mark" aria-hidden="true">簫</span><div class="brand-copy"><h1>단소 운지법 배우기</h1><p>손가락으로 익히고, 귀로 확인해요</p></div></div>
      <button class="icon-button" id="settingsButton" type="button" aria-label="사용 안내 열기">⚙</button>
    </header>
    <main class="workspace">
      <section class="stage" aria-label="단소 운지 애니메이션 스테이지">
        ${panelSvg}
        <div class="gesture-hint" aria-hidden="true"><b><span class="hold-dot"></span>길게 눌러 보세요</b>누르는 동안<br>음이 이어집니다</div>
      </section>
      <section class="deck" aria-label="음 선택과 연주 컨트롤">
        <div class="info-strip" aria-live="polite" aria-atomic="true">
          <div class="note-id"><span class="note-name" id="noteName">솔</span><span class="note-yul" id="noteYul">仲 <small>(중)</small></span></div>
          <div class="hole-state" id="holeState" role="img" aria-label="운지 ● ● ● ● ○"></div>
          <div class="breath"><div class="breath-copy"><strong id="breathName">저취</strong><small id="breathDesc">여리게</small></div><span class="breath-waves" id="breathWaves" aria-hidden="true"><i></i><i></i><i></i></span></div>
          <span class="sr-only" id="liveDetail"></span>
        </div>
        <div class="controls">
          <button class="control octave" id="octaveToggle" type="button" aria-pressed="false"><span class="control-glyph">▲</span><span>옥타브</span><span class="control-hint" id="octaveState">기본음</span></button>
          <button class="control sound" id="soundToggle" type="button" aria-pressed="true"><span class="control-glyph" id="soundIcon">🔊</span><span id="soundState">소리 켬</span></button>
        </div>
        <div class="keypad" id="keypad" aria-label="계이름 숫자 키패드">${buttons}</div>
      </section>
    </main>
  </div>
  <dialog class="settings-dialog" id="settingsDialog" aria-labelledby="settingsTitle">
    <div class="sheet-head"><h2 id="settingsTitle">연주 사용 안내</h2><button class="close-sheet" id="closeSettings" type="button" aria-label="닫기">×</button></div>
    <div class="sheet-body">
      <h3>키보드로도 연주할 수 있어요</h3>
      <dl class="key-guide"><dt>1–8</dt><dd>계이름 선택</dd><dt>Shift + 숫자</dt><dd>누르는 동안 높은음</dd><dt>O</dt><dd>옥타브 고정 전환</dd><dt>Space</dt><dd>마지막 음 다시 듣기</dd></dl>
      <details class="reference-photo"><summary>단소 잡는 자세 참고하기</summary><div class="reference-grid">${referenceImages}</div><p>제공된 이미지는 단소를 잡는 자세를 살펴보기 위한 참고 자료입니다. 선택한 음의 운지는 애니메이션을 확인하세요.</p></details>
      <div class="tip-card"><strong>고품질 단소 합성음</strong><br>배음, 입김, 취구 소리와 자연스러운 흔들림을 기기 안에서 실시간으로 합성합니다. 처음 재생할 때 브라우저의 소리를 허용해 주세요.</div>
    </div>
  </dialog>
  <script>${js}</script>
</body>
</html>`;

function verify() {
  const errors = [];
  if (NOTES.length !== 15) errors.push(`음 데이터가 ${NOTES.length}개입니다.`);
  for (let button = 1; button <= 8; button += 1) {
    if (NOTES[button - 1]?.id !== button) errors.push(`기본 ${button}번 매핑 오류`);
    if (NOTES[button + 6]?.id !== button + 7) errors.push(`옥타브 ${button}번 매핑 오류`);
  }
  if (NOTES[2].holes[2] !== 0.5 || NOTES[9].holes[2] !== 0.5) errors.push('시 반막음 데이터 오류');
  if (NOTES[5].holes.some((value) => value !== 0)) errors.push('미 전부 엶 데이터 오류');
  if (NOTES[6].holes.join() !== NOTES[7].holes.join()) errors.push('파/높은 솔 동일 운지 오류');
  if (!html.includes(`const DANSO_SYNTH_VERSION='${DANSO_SYNTH_VERSION}'`)) errors.push('단소 합성 엔진 버전 누락');
  if (!html.includes('createPeriodicWave') || !html.includes('createConvolver')) errors.push('단소 합성 음향 그래프 누락');
  if (html.includes('\uFFFD')) errors.push('U+FFFD 문자가 포함되었습니다.');
  if (/(?:src|href)=["']https?:/i.test(html)) errors.push('외부 네트워크 자원이 포함되었습니다.');
  return errors;
}

const errors = verify();
if (errors.length) {
  console.error('앱 자체 검증 실패\n' + errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

mkdirSync(PUBLIC_DIR, { recursive: true });
writeFileSync(join(DIR, '단소_운지법_배우기.html'), html, 'utf8');
writeFileSync(join(PUBLIC_DIR, 'danso-app.html'), html, 'utf8');
console.log('✅ 모바일 웹앱 생성 + 데이터/매핑/오프라인 자체 검증 통과');
