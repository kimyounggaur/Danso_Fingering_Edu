import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { NOTES } from '../02 계이름 운지법 차트/danso_svg_lib.mjs';

class FakeElement {
  constructor() {
    this.attrs={}; this.style={}; this.events={}; this.dataset={}; this.textContent='';
    const set=new Set(); this.classList={toggle:(c,v)=>v?set.add(c):set.delete(c),add:c=>set.add(c),remove:c=>set.delete(c),contains:c=>set.has(c)};
  }
  setAttribute(k,v){this.attrs[k]=v}
  getAttribute(k){return this.attrs[k]??null}
  removeAttribute(k){delete this.attrs[k]}
  addEventListener(k,v){this.events[k]=v}
  querySelector(){return new FakeElement()}
  querySelectorAll(){return [new FakeElement(),new FakeElement(),new FakeElement()]}
  appendChild(){} remove(){}
}
async function boot(id, reduced=false) {
  const html=await readFile(new URL('../public/danso-app.html',import.meta.url),'utf8');
  const code=html.match(/<script>([\s\S]*)<\/script>/)?.[1];assert.ok(code);
  const elements=new Map(); const get=(id)=>{if(!elements.has(id))elements.set(id,new FakeElement());return elements.get(id)};
  const buttons=Array.from({length:8},(_,i)=>{const b=new FakeElement();b.dataset.button=String(i+1);return b});
  const document={body:new FakeElement(),getElementById:get,querySelectorAll:(s)=>s==='.note-key'?buttons:[],querySelector:()=>buttons[0],addEventListener(){},createElement:()=>new FakeElement()};
  const window={matchMedia:()=>({matches:reduced}),addEventListener(){},setTimeout(){}};
  const context={document,window,navigator:{},URL,URLSearchParams,location:{href:`https://example.test/?note=${id}`,search:`?note=${id}`},history:{replaceState(){}},requestAnimationFrame:fn=>fn()};
  vm.runInNewContext(code,context);
  return {elements,context,buttons};
}
const ids=['fingL1','fingL2','fingL3','fingR4','fingR5'];
test('15음의 지공 상태가 손가락 개별 모션과 일치',async()=>{
  for(const note of NOTES){
    const {elements}=await boot(note.id);
    note.holes.forEach((value,i)=>{
      const e=elements.get(ids[i]); assert.ok(e,`${note.id}음 ${i+1}공`);
      assert.equal(e.classList.contains('lifted'),value===0,`${note.id}음 ${i+1}공 열림`);
      assert.equal(e.classList.contains('half'),value===0.5,`${note.id}음 ${i+1}공 반막음`);
    });
  }
});
test('첨부 사진은 오프라인 참고 자료이고 지공 애니메이션과 분리',async()=>{
 const html=await readFile(new URL('../public/danso-app.html',import.meta.url),'utf8');
 assert.match(html,/data:image\/webp;base64,/);
 assert.match(html,/자세를 살펴보기 위한 참고 자료/);
 assert.match(html,/#fingL3\.half\s*\{\s*transform:\s*translate\(0px, 8px\)/);
 for(const id of ids)assert.match(html,new RegExp(`id="${id}" class="finger"`));
 assert.doesNotMatch(html,/(?:src|href)=["']https?:/i);
});
test('움직임 줄이기 설정에서 파동 효과를 실행하지 않음',async()=>{
 const {context}=await boot(1,true);let calls=0;
 context.document.getElementById('rippleH2').animate=()=>{calls++};
 vm.runInNewContext('rippleAt(2)',context);assert.equal(calls,0);
});

test('확대/전체 보기를 반복해도 15음의 운지와 연주 상태를 보존',async()=>{
  for(const note of NOTES){
    const {elements,context,buttons}=await boot(note.id);
    const toggle=elements.get('viewToggle');
    toggle.setAttribute('aria-pressed','false');
    const state=()=>JSON.stringify({
      fingers:ids.map(id=>[elements.get(id).classList.contains('lifted'),elements.get(id).classList.contains('half')]),
      note:elements.get('noteName').textContent,
      selected:buttons.map(b=>b.classList.contains('selected')),
      octave:context.document.body.dataset.octave,
      sound:vm.runInNewContext('soundOn',context),
      noteId:vm.runInNewContext('currentNote.id',context),
    });
    const before=state();
    for(let i=0;i<6;i++){
      toggle.events.click();
      const full=i%2===0;
      assert.equal(toggle.getAttribute('aria-pressed'),String(full));
      assert.equal(elements.get('handPanel').getAttribute('viewBox'),full?'24 178 350 980':'24 230 350 640');
      assert.equal(state(),before,`${note.id}음 ${i+1}번째 보기 전환`);
    }
  }
});

test('라인 일러스트 관절과 정확한 다섯 지공 표식이 모든 음에 맞게 갱신됨',async()=>{
 const lineIds=['left-index-mcp','left-middle-mcp','right-middle-mcp','right-ring-mcp'];
 for(const note of NOTES){
  const {elements}=await boot(note.id);
  note.holes.forEach((value,i)=>{
   const symbol={1:'●',0.5:'◐',0:'○'}[value];
   assert.equal(elements.get('lineStateH'+(i+1)).textContent,symbol,`${note.id}음 ${i+1}공 표식`);
   if(i>0){const e=elements.get(lineIds[i-1]);assert.equal(e.classList.contains('lifted'),value===0);assert.equal(e.classList.contains('half'),value===.5);}
  });
 }
});
test('관절 참고 그림과 표준 운지 그림을 바꿔도 선택 음을 보존',async()=>{
 const {elements,context}=await boot(3); const button=elements.get('illustrationToggle');
 button.setAttribute('aria-pressed','false');
 button.events.click();
 assert.equal(elements.get('line-visual').style.display,'none');
 assert.equal(elements.get('standard-visual').style.display,'');
 assert.equal(vm.runInNewContext('currentNote.id',context),3);
 button.events.click();
 assert.equal(elements.get('line-visual').style.display,'');
 assert.equal(elements.get('standard-visual').style.display,'none');
 assert.equal(vm.runInNewContext('currentNote.id',context),3);
});
test('라인 참고 그림은 추정 지공 없이 순수 벡터와 개별 관절로 구성',async()=>{
 const html=await readFile(new URL('../public/danso-app.html',import.meta.url),'utf8');
 assert.match(html,/손가락 움직임 참고/);
 assert.match(html,/선택한 음의 운지 · ①은 뒷면/);
 assert.doesNotMatch(html,/data-hole-reference="approximate"/);
 for(const name of ['left-index','left-middle','right-middle','right-ring'])
   for(const joint of ['mcp','pip','dip'])assert.match(html,new RegExp(`id="${name}-${joint}"`));
});
