import assert from 'node:assert/strict';
import {
  PERSONALITY_ENGINE_VERSION,
  MINI_IPIP_ITEMS,
  scoreMiniIpip,
  buildInternalPersonalityModel,
  buildPersonalityNarrative
} from '../personality-core.js';

assert.equal(PERSONALITY_ENGINE_VERSION,'1.1.0');
assert.equal(MINI_IPIP_ITEMS.length,20);
assert.deepEqual([...new Set(MINI_IPIP_ITEMS.map((item)=>item.domain))].sort(),['A','C','E','N','O']);
assert.equal(new Set(MINI_IPIP_ITEMS.map((item)=>item.id)).size,20);
assert.equal(new Set(MINI_IPIP_ITEMS.map((item)=>item.focus)).size,20);

const expectedKeys={
  E:{items:4,reverse:2},
  A:{items:4,reverse:2},
  C:{items:4,reverse:2},
  N:{items:4,reverse:2},
  O:{items:4,reverse:3}
};
for(const [domain,expected] of Object.entries(expectedKeys)){
  const domainItems=MINI_IPIP_ITEMS.filter((item)=>item.domain===domain);
  assert.equal(domainItems.length,expected.items);
  assert.equal(domainItems.filter((item)=>item.reverse).length,expected.reverse);
  assert.equal(new Set(domainItems.map((item)=>item.focus)).size,expected.items);
}

const itemsById=Object.fromEntries(MINI_IPIP_ITEMS.map((item)=>[item.id,item]));
assert.match(itemsById.a1.text,/寄り添う/);
assert.match(itemsById.a2.text,/悩みや問題/);
assert.match(itemsById.a3.text,/喜びや悲しみ/);
assert.match(itemsById.a4.text,/どんな人/);
assert.match(itemsById.o1.text,/情景.*鮮やか/);
assert.match(itemsById.o2.text,/興味がない/);
assert.match(itemsById.o3.text,/理解するのは苦手/);
assert.match(itemsById.o4.text,/場面やアイデア.*想像するのは苦手/);

const allHigh=Object.fromEntries(MINI_IPIP_ITEMS.map((item)=>[item.id,item.reverse?1:5]));
const highScores=scoreMiniIpip(allHigh);
assert.equal(highScores.complete,true);
for(const domain of Object.values(highScores.domains)) assert.equal(domain.score,100);

const allLow=Object.fromEntries(MINI_IPIP_ITEMS.map((item)=>[item.id,item.reverse?5:1]));
const lowScores=scoreMiniIpip(allLow);
for(const domain of Object.values(lowScores.domains)) assert.equal(domain.score,0);

const model=buildInternalPersonalityModel({
  scores:highScores,
  context:{question:'周りへの影響が心配ですが、新しいことを始めたいです',tension:8,timeframe:'1か月以内'},
  identity:{fullName:'山田 花子',kana:'やまだ はなこ'},
  tarotNames:['静かな塔','開いた扉','金の糸'],
  advisorTone:'月乃ルナ'
});
assert.equal(model.privateEvidence.policy,'presentation inputs never change psychometric trait scores');
const narrative=buildPersonalityNarrative(model);
assert.equal(narrative.title,'あなたはこういう人です');
assert.ok(narrative.paragraphs.length>=4);
assert.ok(narrative.paragraphs.every((p)=>p.length>20));

console.log('personality-core tests passed');
