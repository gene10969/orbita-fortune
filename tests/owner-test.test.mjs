import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import {
  OWNER_TAROT_CARD_NAMES,
  buildTarotSVG
} from '../owner-test-v5.js';

const expectedTarotNames=[
  '静かな塔','開いた扉','金の糸','月の井戸','最初の火花','還る潮',
  '硝子の橋','封じた手紙','北の窓','小さな鍵','灯る前のランタン','二つの岸',
  '隠れた階段','金の天秤','雨あがり','鏡の部屋','石の種','横風',
  '空いた椅子','夜明けの線','根の地図','白い羽','鳴らない鐘','軌道変更'
];

assert.deepEqual(OWNER_TAROT_CARD_NAMES,expectedTarotNames);
assert.equal(new Set(OWNER_TAROT_CARD_NAMES).size,24);

OWNER_TAROT_CARD_NAMES.forEach((name,index)=>{
  const svg=buildTarotSVG(name,index);
  assert.match(svg,new RegExp(`aria-label="${name}を表したタロットカードイラスト"`));
  assert.match(svg,new RegExp(`>${name}</text>`));
  assert.doesNotMatch(svg,/data-owner-concept-name/);
});

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const advisors=fs.readFileSync(path.join(root,'advisors.js'),'utf8');
const entry=fs.readFileSync(path.join(root,'owner-test-v8.js'),'utf8');
const ownerPage=fs.readFileSync(path.join(root,'owner-test.html'),'utf8');
const waiting=fs.readFileSync(path.join(root,'owner-test-v4.js'),'utf8');

assert.ok(advisors.includes("/\\/owner-test\\.html$/"));
assert.match(advisors,/owner-test-v8\.js\?v=8\.4\.0/);
assert.doesNotMatch(entry,/owner-tarot-v8-refresh|reinstallFinalTarotController/);
assert.match(waiting,/#waiting-panel \.estimate,\s*#waiting-panel \.orb\{display:none!important\}/);

const gateScript=ownerPage.match(/<script>\s*(\(\(\) => \{[\s\S]*?\}\)\(\);)\s*<\/script>\s*<script type="module">/)?.[1];
assert.ok(gateScript,'The access gate must run before the module script.');

const elements=Object.fromEntries(['access-key','unlock','gate-error'].map((id)=>{
  const classes=new Set(id==='gate-error'?['hidden']:[]);
  const listeners=new Map();
  return [id,{
    value:'',
    disabled:false,
    textContent:'',
    classList:{
      add:(name)=>classes.add(name),
      remove:(name)=>classes.delete(name),
      contains:(name)=>classes.has(name)
    },
    addEventListener:(type,handler)=>listeners.set(type,handler),
    dispatch:(type,event={})=>listeners.get(type)?.(event)
  }];
}));
const storedValues=new Map();
const timers=new Map();
let timerId=0;
const gateContext={
  document:{getElementById:(id)=>elements[id]},
  sessionStorage:{
    getItem:(key)=>storedValues.get(key)??null,
    setItem:(key,value)=>storedValues.set(key,value)
  },
  window:{
    clearTimeout:(id)=>timers.delete(id),
    setTimeout:(handler)=>{timerId+=1;timers.set(timerId,handler);return timerId;}
  }
};
vm.runInNewContext(gateScript,gateContext);

elements['access-key'].value='INVALID';
elements.unlock.dispatch('click');
assert.match(elements['gate-error'].textContent,/アクセスキーが違います/);
assert.equal(elements['gate-error'].classList.contains('hidden'),false);

elements['access-key'].dispatch('input');
assert.equal(elements['gate-error'].classList.contains('hidden'),true);

let opened=0;
gateContext.window.__orbitaOwnerGate.setReady(()=>{opened+=1;});
elements['access-key'].value='ORB-OEWA-OZ29';
elements.unlock.dispatch('click');
assert.equal(opened,1);
assert.ok(Number(storedValues.get('orbita_owner_test_access_v2'))>Date.now());

console.log('owner-test tests passed');
