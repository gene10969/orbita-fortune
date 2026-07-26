import assert from 'node:assert/strict';
import {
  MINI_IPIP_ITEMS,
  scoreMiniIpip,
  buildInternalPersonalityModel,
  buildPersonalityNarrative
} from '../personality-core.js';

assert.equal(MINI_IPIP_ITEMS.length,20);
assert.deepEqual([...new Set(MINI_IPIP_ITEMS.map((item)=>item.domain))].sort(),['A','C','E','N','O']);

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
