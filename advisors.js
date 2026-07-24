export const METHOD_CATALOG = Object.freeze({
  decision: { id:'decision', name:'二択星路', short:'A・Bの流れを比較', icon:'◎' },
  tarot: { id:'tarot', name:'象徴タロット', short:'三枚の象徴から読む', icon:'◇' },
  numerology: { id:'numerology', name:'数秘術', short:'生年月日の数から読む', icon:'⌘' },
  astrology: { id:'astrology', name:'星読み', short:'巡りと時期を読む', icon:'☾' },
  oracle: { id:'oracle', name:'オラクル', short:'今必要な視点を受け取る', icon:'✦' },
  intuition: { id:'intuition', name:'直感透視風', short:'相談文の本質を整理', icon:'◉' }
});

// schedule: 0=日曜〜6=土曜。時刻は日本時間。
// 鑑定者を増やす場合は、この配列へ1件追加し、画像を assets/advisors/ に置くだけです。
export const ADVISORS = Object.freeze([
  {
    id:'luna', name:'月乃ルナ', age:32, gender:'女性', nationality:'日本', image:'assets/advisors/luna.webp',
    type:'やさしい共感型', tagline:'迷いを否定せず、心が動ける大きさへ整える。',
    specialties:['恋愛','不安','二択'], genres:['love','decision'], methods:['tarot','numerology','oracle'], tone:'empathy',
    schedule:{ 2:[['18:00','23:00']], 4:[['18:00','23:00']], 6:[['13:00','20:00']] }
  },
  {
    id:'shion', name:'九条シオン', age:41, gender:'男性', nationality:'日本', image:'assets/advisors/shion.webp',
    type:'静かな現実派', tagline:'感情と条件を切り分け、実行可能な選択へ導く。',
    specialties:['仕事','転職','事業'], genres:['work','decision'], methods:['decision','numerology','tarot'], tone:'rational',
    schedule:{ 1:[['07:00','10:00'],['20:00','23:00']], 3:[['07:00','10:00'],['20:00','23:00']], 5:[['20:00','23:00']] }
  },
  {
    id:'rei', name:'黒曜レイ', age:36, gender:'女性', nationality:'日本', image:'assets/advisors/rei.webp',
    type:'本質直視型', tagline:'都合のよい解釈を外し、避けている論点を映し出す。',
    specialties:['複雑恋愛','執着','人間関係'], genres:['love','relationship'], methods:['intuition','tarot','decision'], tone:'direct',
    schedule:{ 3:[['19:00','23:00']], 5:[['19:00','23:00']], 6:[['20:00','23:30']] }
  },
  {
    id:'mikoto', name:'暮羽ミコト', age:52, gender:'女性', nationality:'日本', image:'assets/advisors/mikoto.webp',
    type:'包容母性型', tagline:'家庭や人間関係の疲れを受け止め、境界線を整える。',
    specialties:['家庭','夫婦','人間関係'], genres:['relationship','life'], methods:['oracle','numerology','tarot'], tone:'motherly',
    schedule:{ 1:[['10:00','17:00']], 3:[['10:00','17:00']], 5:[['10:00','17:00']], 0:[['09:00','15:00']] }
  },
  {
    id:'sougen', name:'天城ソウゲン', age:57, gender:'男性', nationality:'日本', image:'assets/advisors/sougen.webp',
    type:'達観助言型', tagline:'目先の揺れから離れ、人生全体の軸を見直す。',
    specialties:['人生','再出発','仕事'], genres:['life','work'], methods:['astrology','numerology','decision'], tone:'wise',
    schedule:{ 2:[['09:00','16:00']], 4:[['09:00','16:00']], 6:[['10:00','16:00']] }
  },
  {
    id:'aurora', name:'オーロラ・ヴェイル', age:45, gender:'女性', nationality:'フランス', image:'assets/advisors/aurora.webp',
    type:'異国星読型', tagline:'星の巡りと感情の周期から、動く時期を静かに読む。',
    specialties:['恋愛','時期','人生'], genres:['love','life'], methods:['astrology','oracle','numerology'], tone:'mystic',
    schedule:{ 1:[['16:00','23:00']], 3:[['16:00','23:00']], 5:[['16:00','23:00']], 0:[['18:00','23:00']] }
  },
  {
    id:'malik', name:'マリク・オリオン', age:50, gender:'男性', nationality:'モロッコ', image:'assets/advisors/malik.webp',
    type:'異国叡智型', tagline:'複数の文化的視点から、決断に潜む前提を問い直す。',
    specialties:['決断','仕事','人生'], genres:['decision','work','life'], methods:['astrology','decision','oracle'], tone:'philosophical',
    schedule:{ 2:[['19:00','23:00']], 4:[['19:00','23:00']], 6:[['19:00','23:00']] }
  },
  {
    id:'rou', name:'霧島ロウ', age:54, gender:'男性', nationality:'日本', image:'assets/advisors/rou.webp',
    type:'無口本質型', tagline:'余計な慰めを加えず、続ける条件とやめる条件を示す。',
    specialties:['仕事','損切り','人間関係'], genres:['work','relationship','decision'], methods:['decision','intuition','tarot'], tone:'stoic',
    schedule:{ 1:[['20:00','23:30']], 2:[['20:00','23:30']], 4:[['20:00','23:30']], 5:[['20:00','23:30']] }
  },
  {
    id:'riho', name:'桜庭りほ', age:21, gender:'女性', nationality:'日本', image:'assets/advisors/riho.webp',
    type:'可愛いアイドル型', tagline:'明るい言葉で、恋と夢の一歩を前向きに整える。',
    specialties:['恋愛','推し活','夢'], genres:['love','life'], methods:['tarot','oracle','numerology'], tone:'cheerful',
    schedule:{ 3:[['17:00','22:00']], 5:[['17:00','22:00']], 6:[['12:00','18:00']], 0:[['12:00','18:00']] }
  },
  {
    id:'usaki', name:'羽咲', age:24, gender:'女性', nationality:'日本', image:'assets/advisors/usaki.webp',
    type:'グラビアタレント型', tagline:'魅力と自己肯定感を軸に、愛され方より自分の選び方を読む。',
    specialties:['恋愛','魅力','自己肯定感'], genres:['love','relationship'], methods:['oracle','tarot','intuition'], tone:'glamorous',
    schedule:{ 2:[['18:00','23:00']], 4:[['18:00','23:00']], 5:[['20:00','23:30']], 6:[['20:00','23:30']] }
  }
]);

export function getAdvisor(id) {
  return ADVISORS.find((advisor) => advisor.id === id) || null;
}

export function getMethod(id) {
  return METHOD_CATALOG[id] || METHOD_CATALOG.decision;
}
