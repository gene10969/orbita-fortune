export const METHOD_CATALOG = Object.freeze({
  decision: { id:'decision', name:'二つの道を比較', short:'今のまま進む道と別の方向へ進む道を比べる', icon:'◎' },
  tarot: { id:'tarot', name:'タロットカード', short:'3枚のタロットカードから今の状況を読む', icon:'◇' },
  numerology: { id:'numerology', name:'数秘術', short:'生年月日の数字から考え方の傾向を見る', icon:'⌘' },
  astrology: { id:'astrology', name:'星読み', short:'動く時期と待つ時期を考える', icon:'☾' },
  oracle: { id:'oracle', name:'オラクル', short:'今必要な考え方と行動を整理する', icon:'✦' },
  intuition: { id:'intuition', name:'言葉の読み取り', short:'相談文に表れている本音と迷いを整理する', icon:'◉' }
});

// schedule: 0=日曜〜6=土曜。時刻は日本時間。
// 追加する場合は、この配列へ1件追加し、画像を assets/advisors/ に置きます。
export const ADVISORS = Object.freeze([
  {
    id:'luna', name:'月乃ルナ', age:32, gender:'女性', nationality:'日本', image:'assets/advisors/luna.webp',
    type:'やさしく整理', tagline:'気持ちを否定せず、今できる一歩を一緒に見つけます。',
    specialties:['恋愛','不安','二択'], genres:['love','decision'], methods:['tarot','numerology','oracle'], tone:'empathy',
    schedule:{ 2:[['18:00','23:00']], 4:[['18:00','23:00']], 6:[['13:00','20:00']] }
  },
  {
    id:'shion', name:'九条シオン', age:41, gender:'男性', nationality:'日本', image:'assets/advisors/shion.webp',
    type:'現実的に整理', tagline:'気持ちと条件を分けて、実行しやすい選択を考えます。',
    specialties:['仕事','転職','事業'], genres:['work','decision'], methods:['decision','numerology','tarot'], tone:'rational',
    schedule:{ 1:[['07:00','10:00'],['20:00','23:00']], 3:[['07:00','10:00'],['20:00','23:00']], 5:[['20:00','23:00']] }
  },
  {
    id:'rei', name:'黒曜レイ', age:36, gender:'女性', nationality:'日本', image:'assets/advisors/rei.webp',
    type:'はっきり伝える', tagline:'避けている問題を整理し、必要な判断を分かりやすく伝えます。',
    specialties:['複雑恋愛','執着','人間関係'], genres:['love','relationship'], methods:['intuition','tarot','decision'], tone:'direct',
    schedule:{ 3:[['19:00','23:00']], 5:[['19:00','23:00']], 6:[['20:00','23:30']] }
  },
  {
    id:'mikoto', name:'暮羽ミコト', age:52, gender:'女性', nationality:'日本', image:'assets/advisors/mikoto.webp',
    type:'じっくり聞く', tagline:'家庭や人間関係の疲れを受け止め、無理のない答えを考えます。',
    specialties:['家庭','夫婦','人間関係'], genres:['relationship','life'], methods:['oracle','numerology','tarot'], tone:'motherly',
    schedule:{ 1:[['10:00','17:00']], 3:[['10:00','17:00']], 5:[['10:00','17:00']], 0:[['09:00','15:00']] }
  },
  {
    id:'sougen', name:'天城ソウゲン', age:57, gender:'男性', nationality:'日本', image:'assets/advisors/sougen.webp',
    type:'長い目で考える', tagline:'目先の不安から少し離れ、長く続けられる方向を考えます。',
    specialties:['人生','再出発','仕事'], genres:['life','work'], methods:['astrology','numerology','decision'], tone:'wise',
    schedule:{ 2:[['09:00','16:00']], 4:[['09:00','16:00']], 6:[['10:00','16:00']] }
  },
  {
    id:'aurora', name:'オーロラ・ヴェイル', age:45, gender:'女性', nationality:'フランス', image:'assets/advisors/aurora.webp',
    type:'時期を読む', tagline:'今動くか、少し待つかを、気持ちの波と時期から整理します。',
    specialties:['恋愛','時期','人生'], genres:['love','life'], methods:['astrology','oracle','numerology'], tone:'mystic',
    schedule:{ 1:[['16:00','23:00']], 3:[['16:00','23:00']], 5:[['16:00','23:00']], 0:[['18:00','23:00']] }
  },
  {
    id:'malik', name:'マリク・オリオン', age:50, gender:'男性', nationality:'モロッコ', image:'assets/advisors/malik.webp',
    type:'別の角度から考える', tagline:'思い込みを外し、見えていなかった選択肢を探します。',
    specialties:['決断','仕事','人生'], genres:['decision','work','life'], methods:['astrology','decision','oracle'], tone:'philosophical',
    schedule:{ 2:[['19:00','23:00']], 4:[['19:00','23:00']], 6:[['19:00','23:00']] }
  },
  {
    id:'rou', name:'霧島ロウ', age:54, gender:'男性', nationality:'日本', image:'assets/advisors/rou.webp',
    type:'条件を整理', tagline:'続ける条件とやめる条件を分け、判断しやすくします。',
    specialties:['仕事','損切り','人間関係'], genres:['work','relationship','decision'], methods:['decision','intuition','tarot'], tone:'stoic',
    schedule:{ 1:[['20:00','23:30']], 2:[['20:00','23:30']], 4:[['20:00','23:30']], 5:[['20:00','23:30']] }
  },
  {
    id:'riho', name:'桜庭りほ', age:21, gender:'女性', nationality:'日本', image:'assets/advisors/riho.webp',
    type:'明るく背中を押す', tagline:'恋や夢の悩みを重くしすぎず、今日できることへ変えます。',
    specialties:['恋愛','推し活','夢'], genres:['love','life'], methods:['tarot','oracle','numerology'], tone:'cheerful',
    schedule:{ 3:[['17:00','22:00']], 5:[['17:00','22:00']], 6:[['12:00','18:00']], 0:[['12:00','18:00']] }
  },
  {
    id:'usaki', name:'羽咲', age:24, gender:'女性', nationality:'日本', image:'assets/advisors/usaki.webp',
    type:'自信を取り戻す', tagline:'他人の評価に振り回されず、自分の魅力と希望を整理します。',
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

if (typeof window !== 'undefined' && /\/owner-test\.html$/.test(window.location.pathname)) {
  import('./owner-test-v4.js?v=4.1.0')
    .then((module) => module.initOwnerTestV4?.())
    .catch((error) => console.error('owner_test_v4_failed', error));
}
