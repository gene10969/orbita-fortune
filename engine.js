export const ENGINE_VERSION = '2.1.0';

const ARCHETYPES = [
  { id:'quiet-tower', name:'静かな塔', glyph:'◇', element:'静', light:'少し距離を置くと、必要な情報が見えやすくなります。', shadow:'考えるだけの時間が長すぎると、動けなくなります。', action:'判断に必要な情報を3つだけ書き出し、今日は考える時間を終える。' },
  { id:'open-door', name:'開いた扉', glyph:'⟡', element:'動', light:'小さく試すと、実際の反応を確認できます。', shadow:'勢いで元に戻せない決断まで進まないよう注意が必要です。', action:'やり直せる範囲で、最小の一歩だけ試す。' },
  { id:'gold-thread', name:'金の糸', glyph:'⌁', element:'縁', light:'人とのつながりや過去の経験が、判断の基準を思い出させます。', shadow:'相手の希望と自分の希望を混同しやすい時です。', action:'「私はどうしたいか」を主語にして一文書く。' },
  { id:'moon-well', name:'月の井戸', glyph:'◒', element:'深', light:'繰り返し浮かぶ感情に、大切な手掛かりがあります。', shadow:'不安を事実だと思い込むと、選択肢が狭くなります。', action:'事実・予想・感情を分けて書く。' },
  { id:'first-spark', name:'最初の火花', glyph:'✦', element:'始', light:'完璧にするより、まず始めることが流れを変えます。', shadow:'新しさだけに気を取られ、続ける条件を見落とさないでください。', action:'15分で作れる試作品か、短い確認連絡を作る。' },
  { id:'returning-tide', name:'還る潮', glyph:'≈', element:'巡', light:'以前やめたことを見直すと、今なら違う答えが出るかもしれません。', shadow:'懐かしさだけを理由に戻らないことが大切です。', action:'以前やめた理由が、今も当てはまるか確認する。' },
  { id:'glass-bridge', name:'硝子の橋', glyph:'⌇', element:'境', light:'確認しながら少しずつ進める道があります。', shadow:'一度に全部決めようとすると、不安が大きくなります。', action:'次に確認する一つだけを決める。' },
  { id:'sealed-letter', name:'封じた手紙', glyph:'▱', element:'言', light:'言葉にしていない本音が、決めにくさにつながっています。', shadow:'説明を避けると、相手の想像で話が進みやすくなります。', action:'送らなくてもよいので、本音の文章を一度作る。' },
  { id:'north-window', name:'北の窓', glyph:'⌃', element:'観', light:'短い目での損得を離れると、進みたい方向が見えやすくなります。', shadow:'理想が高すぎて、現実にできることを否定しないでください。', action:'半年後にも残したいものを一つ選ぶ。' },
  { id:'small-key', name:'小さな鍵', glyph:'⚿', element:'解', light:'問題全体ではなく、一か所の詰まりが原因かもしれません。', shadow:'全部を変えなければならないと思い込まないでください。', action:'一番負担が大きい一つを特定する。' },
  { id:'unlit-lantern', name:'灯る前のランタン', glyph:'⬡', element:'準', light:'今は、始めるための条件を整えている段階です。', shadow:'準備を理由に、いつまでも先延ばしにしないことが大切です。', action:'開始する日か、開始できる条件を決める。' },
  { id:'two-shores', name:'二つの岸', glyph:'≍', element:'選', light:'どちらを選んでも、得るものと手放すものがあります。', shadow:'損をしない選択だけを探すと、決められなくなります。', action:'受け入れられる不利益を先に決める。' },
  { id:'hidden-stair', name:'隠れた階段', glyph:'⋰', element:'転', light:'AかB以外の方法が見つかる可能性があります。', shadow:'別の方法を探すあまり、必要な話し合いまで避けないでください。', action:'AでもBでもない小さな案を一つ作る。' },
  { id:'golden-scale', name:'金の天秤', glyph:'⚖', element:'衡', light:'気持ちと条件を別々に考えると、納得しやすくなります。', shadow:'数字だけ、気持ちだけに偏らないようにしてください。', action:'条件と気持ちを、それぞれ10点満点で採点する。' },
  { id:'rain-after', name:'雨あがり', glyph:'☂', element:'浄', light:'混乱が少し落ち着き、考え直せる余裕が戻っています。', shadow:'疲れている時に結論を急がないでください。', action:'睡眠・食事・時間を整えてから、もう一度考える。' },
  { id:'mirror-room', name:'鏡の部屋', glyph:'◈', element:'映', light:'相手への評価に、自分の不安や期待が混ざっているかもしれません。', shadow:'自分だけを責めて、相手側の問題を見落とさないでください。', action:'相手が実際にしたことと、自分の解釈を分けて書く。' },
  { id:'stone-seed', name:'石の種', glyph:'●', element:'耐', light:'すぐ結果が出なくても、続けた分が残る選択です。', shadow:'我慢すること自体を目的にしないでください。', action:'続ける期限と、やめる条件を同時に決める。' },
  { id:'crosswind', name:'横風', glyph:'⇝', element:'変', light:'予定外の反応が、より合う方向へ修正するきっかけになります。', shadow:'一度の反対を、すべての否定だと思わないでください。', action:'反応を見て変更できる余地を残す。' },
  { id:'empty-chair', name:'空いた椅子', glyph:'□', element:'余', light:'すぐ埋めない時間が、新しい選択肢を見つけやすくします。', shadow:'寂しさを避けるためだけの選択に注意してください。', action:'何もしない場合の良い点も書き出す。' },
  { id:'dawn-line', name:'夜明けの線', glyph:'━', element:'明', light:'状況が完全に変わる前に、進みたい方向が見え始めています。', shadow:'100％の確信を待ち続けないことが大切です。', action:'60％納得できる仮の決定を置く。' },
  { id:'root-map', name:'根の地図', glyph:'⌄', element:'基', light:'今の迷いは、生活の土台や大切にしたいことの確認を求めています。', shadow:'目先の魅力だけで、生活の土台を崩さないでください。', action:'お金・時間・健康・人間関係の最低条件を確認する。' },
  { id:'white-feather', name:'白い羽', glyph:'⌁', element:'軽', light:'不要な役割を一つ外すと、本当に望む方向が見えやすくなります。', shadow:'責任から逃げることと、不要な負担を減らすことを分けて考えてください。', action:'本来は引き受けなくてもよい役割を一つ確認する。' },
  { id:'silent-bell', name:'鳴らない鐘', glyph:'◉', element:'待', light:'返事や反応がないことも、大切な判断材料です。', shadow:'相手の沈黙に、自分に都合のよい意味を加えないでください。', action:'待つ期限と、期限を過ぎた後の行動を決める。' },
  { id:'orbit-change', name:'軌道変更', glyph:'◎', element:'新', light:'目的は変えず、方法だけ変える選択が合っています。', shadow:'ここまで続けた時間だけを理由に、同じ方法を続けないでください。', action:'目的と方法を分け、別の方法を二つ考える。' }
];

const CATEGORY_GUIDANCE = {
  work: ['収入・成長・負担の三点を分けて評価する', '辞める・続ける以外の移行期間を設ける', '一日の実際の消耗量を記録する'],
  love: ['相手の言葉より継続した行動を確認する', '自分が安心していられる境界線を決める', '連絡頻度と関係の価値を混同しない'],
  relationship: ['相手を変える案ではなく自分が選べる行動に変換する', '一度の出来事と繰り返す傾向を分ける', '必要な距離を具体的な期間で決める'],
  money: ['最悪時の損失上限を先に決める', '生活資金と挑戦資金を混ぜない', '高揚時ではなく平常時に再確認する'],
  life: ['一年後にも残したい価値を一つ選ぶ', '他人の正解と自分の生活条件を分ける', '大きな変更は小さな実験から始める'],
  other: ['事実・感情・希望を分けて書く', '元に戻せる一歩から試す', '決めない期限を決める']
};

const TONE_GUIDANCE = {
  empathy:'気持ちを急いで決めず、安心して動ける範囲から考えます。',
  rational:'気持ちと条件を分けて、現実にできることを考えます。',
  direct:'都合のよい解釈を避け、見落としている問題をはっきり整理します。',
  motherly:'抱えている負担を責めず、守るものと減らすものを整理します。',
  wise:'目先の結果だけでなく、長く続けられる方向を考えます。',
  mystic:'動く時期と待つ時期を分け、無理のないタイミングを考えます。',
  philosophical:'一つの答えに決めつけず、別の考え方も含めて整理します。',
  stoic:'続ける条件とやめる条件を、短くはっきり整理します。',
  cheerful:'重く考えすぎず、今日からできる行動へ変えます。',
  glamorous:'他人の評価より、自分が納得できる選び方を中心に考えます。'
};

const METHOD_GUIDANCE = {
  decision:'AとBの試しやすさと、やり直しやすさを比べます。',
  tarot:'3枚の象徴カードから、今の状況・注意点・次の行動を見ます。',
  numerology:'生年月日の数字から、考え方と判断の傾向を見ます。',
  astrology:'今動くか、少し待つかを時期の流れから考えます。',
  oracle:'今必要な考え方と、気持ちを整える行動を見ます。',
  intuition:'相談文に繰り返し出る言葉から、本音と迷いを整理します。'
};

const STOP_PATTERNS = [
  /自殺|死にたい|消えたい|生きていたくない|自傷|リストカット/i,
  /殺す|殺したい|傷つけたい|復讐してやる/i,
  /寿命|死期|いつ死ぬ|余命/i,
  /病気.*治る|治癒|診断して|妊娠している|妊娠できる/i,
  /株|FX|仮想通貨|暗号資産|競馬|競艇|パチンコ|宝くじ|ギャンブル/i
];

const CAUTION_PATTERNS = [
  /病院|薬|手術|診断|症状|妊娠|法律|弁護士|裁判|税金|借金|投資|融資/i
];

export function normalizeText(value, max = 240) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function fnv1a(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed) {
  return function random() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function reduceNumber(value, preserveMasters = true) {
  let result = Math.abs(Number(value) || 0);
  while (result > 9 && !(preserveMasters && [11, 22, 33].includes(result))) result = String(result).split('').reduce((sum, digit) => sum + Number(digit), 0);
  return result;
}

export function calculateLifePath(dateString) {
  const digits = String(dateString).replace(/\D/g, '');
  return reduceNumber([...digits].reduce((sum, digit) => sum + Number(digit), 0));
}

export function calculatePersonalCycle(dateString, readingDate) {
  const birth = String(dateString).split('-').map(Number);
  const read = String(readingDate).split('-').map(Number);
  return reduceNumber((birth[1] || 0) + (birth[2] || 0) + [...String(read[0] || 0)].reduce((sum, digit) => sum + Number(digit), 0) + (read[1] || 0) + (read[2] || 0));
}

export function detectSafetyRisk(text) {
  const normalized = normalizeText(text, 800);
  if (STOP_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      level:'stop',
      title:'この内容は鑑定できません',
      message:'命や安全、医療、妊娠、法律、投資、賭け事などの重要な判断には利用できません。緊急性がある場合は、地域の緊急窓口や適切な専門家へ相談してください。'
    };
  }
  if (CAUTION_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return {
      level:'caution',
      title:'専門家への確認も優先してください',
      message:'この結果は参考情報です。医療・法律・税務・金融などの判断では、資格を持つ専門家や公的窓口へ確認してください。'
    };
  }
  return { level:'normal', title:'', message:'' };
}

function uniqueDraws(random, count) {
  const pool = [...ARCHETYPES];
  const output = [];
  while (output.length < count && pool.length) {
    const index = Math.floor(random() * pool.length);
    output.push(pool.splice(index, 1)[0]);
  }
  return output;
}

function scorePair(random, lifePath, cycle, tension) {
  const bias = ((lifePath * 7 + cycle * 3 + tension) % 17) - 8;
  const rawA = 48 + bias + Math.round((random() - 0.5) * 22);
  const rawB = 100 - rawA + Math.round((random() - 0.5) * 8);
  const safeA = Math.max(25, Math.min(75, rawA));
  const safeB = Math.max(25, Math.min(75, rawB));
  const total = safeA + safeB;
  const a = Math.round((safeA / total) * 100);
  return { a, b: 100 - a };
}

function decisionLabel(scores) {
  const delta = scores.a - scores.b;
  if (delta >= 16) return { key:'a', text:'まずはAを小さく試すのがおすすめです', tone:'forward' };
  if (delta <= -16) return { key:'b', text:'まずはBを小さく試すのがおすすめです', tone:'forward' };
  return { key:'hold', text:'今はAとBを比べるための小さな確認が必要です', tone:'balanced' };
}

function buildSevenDayPlan(input, cards, scores, reversibility) {
  const chosen = scores.a >= scores.b ? input.optionA : input.optionB;
  const categoryTips = CATEGORY_GUIDANCE[input.category] || CATEGORY_GUIDANCE.other;
  return [
    { day:1, title:'AとBを書き分ける', body:`「${input.optionA}」と「${input.optionB}」で、良い点と心配な点をそれぞれ3つ書きます。` },
    { day:2, title:'事実だけを確認する', body:'予想や期待を入れず、今確認できている事実だけを書きます。' },
    { day:3, title:'気をつけたい点を行動に変える', body:cards[1].action },
    { day:4, title:'最低条件を決める', body:categoryTips[0] + '。' },
    { day:5, title:'小さく試す', body:`「${chosen}」を選んだ場合にできる最小の行動を、${reversibility >= 60 ? '24時間以内' : '3日以内'}に一つ試します。` },
    { day:6, title:'実際の反応を記録する', body:'行動する前と後で、不安・安心・疲れを10点満点で記録します。' },
    { day:7, title:'次の7日間だけ決める', body:'一生の決定ではなく、次の7日間だけ試す方向を決めます。後から変更して構いません。' }
  ];
}

function buildLocalNarrative(input, cards, scores, lifePath, cycle, decision, reversibility) {
  const preferred = decision.key === 'a' ? input.optionA : input.optionB;
  const lead = decision.key === 'hold'
    ? 'AとBの差は小さめです。今は結論を急ぐより、少しずつ試して実際の違いを確認する段階です。'
    : `現時点では「${preferred}」の方が、小さく試しやすい結果です。これは成功を保証する数字ではなく、今の状況で始めやすいかどうかを表しています。`;
  const toneLead = TONE_GUIDANCE[input.advisorTone] || TONE_GUIDANCE.rational;
  const methodLead = METHOD_GUIDANCE[input.method] || METHOD_GUIDANCE.decision;
  const returnText = reversibility >= 65
    ? 'やり直しや変更がしやすいため、小さく試してから調整できます。'
    : reversibility >= 45
      ? '条件を決めれば試せます。始める前に、やめる条件も決めておくと安心です。'
      : '元に戻しにくい要素があります。始める前に情報確認と第三者への相談を優先してください。';
  return {
    overview: `${toneLead} ${methodLead} ${lead} 「${cards[0].name}」は、${cards[0].light}`,
    hidden: `特に気をつけたいのは「${cards[1].name}」です。${cards[1].shadow}`,
    timing: `生年月日から出した基礎数は${lifePath}、今回の時期を表す数字は${cycle}です。${returnText}`,
    closing: `${toneLead} 今回は、最終結論を決めることより、次に何を確認するかを決めることが大切です。`
  };
}

export function validateReadingInput(raw) {
  const input = {
    nickname: normalizeText(raw.nickname, 40),
    birthdate: normalizeText(raw.birthdate, 10),
    category: normalizeText(raw.category, 24) || 'other',
    question: normalizeText(raw.question, 300),
    optionA: normalizeText(raw.optionA, 80),
    optionB: normalizeText(raw.optionB, 80),
    timeframe: normalizeText(raw.timeframe, 30) || '1month',
    tension: Math.max(0, Math.min(10, Number(raw.tension) || 5)),
    readingDate: normalizeText(raw.readingDate, 10),
    advisorId: normalizeText(raw.advisorId, 40),
    advisorName: normalizeText(raw.advisorName, 60),
    advisorTone: normalizeText(raw.advisorTone, 30) || 'rational',
    method: normalizeText(raw.method, 30) || 'decision',
    bookingId: normalizeText(raw.bookingId, 60),
    bookingStart: normalizeText(raw.bookingStart, 40)
  };
  const errors = [];
  if (!input.nickname) errors.push('呼び名を入力してください。');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthdate) || Number.isNaN(new Date(`${input.birthdate}T12:00:00`).getTime())) errors.push('生年月日を正しく入力してください。');
  if (!input.question || input.question.length < 8) errors.push('迷っていることを8文字以上で入力してください。');
  if (!input.optionA) errors.push('選択肢Aを入力してください。');
  if (!input.optionB) errors.push('選択肢Bを入力してください。');
  if (input.optionA === input.optionB) errors.push('選択肢AとBは異なる内容にしてください。');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.readingDate)) errors.push('鑑定日が正しくありません。');
  if (!input.advisorId) errors.push('鑑定パートナーを選択してください。');
  if (!input.bookingStart || Number.isNaN(new Date(input.bookingStart).getTime())) errors.push('予約日時を選択してください。');
  return { input, errors };
}

export function generateReading(raw) {
  const { input, errors } = validateReadingInput(raw);
  if (errors.length) return { ok:false, errors };

  const safety = detectSafetyRisk(`${input.question} ${input.optionA} ${input.optionB}`);
  if (safety.level === 'stop') return { ok:false, safety, errors:[] };

  const lifePath = calculateLifePath(input.birthdate);
  const cycle = calculatePersonalCycle(input.birthdate, input.readingDate);
  const seedSource = [ENGINE_VERSION, input.nickname, input.birthdate, input.category, input.question, input.optionA, input.optionB, input.timeframe, input.tension, input.readingDate, input.advisorId, input.method, input.bookingStart].join('|');
  const seed = fnv1a(seedSource);
  const random = mulberry32(seed);
  const cards = uniqueDraws(random, 3);
  const scores = scorePair(random, lifePath, cycle, input.tension);
  const reversibility = Math.max(22, Math.min(88, Math.round(45 + (random() - 0.5) * 44 + (10 - input.tension))));
  const clarity = Math.max(35, Math.min(92, Math.round(52 + Math.abs(scores.a - scores.b) * 1.2 + (random() - 0.5) * 14)));
  const decision = decisionLabel(scores);
  const narrative = buildLocalNarrative(input, cards, scores, lifePath, cycle, decision, reversibility);
  const plan = buildSevenDayPlan(input, cards, scores, reversibility);
  const guidance = CATEGORY_GUIDANCE[input.category] || CATEGORY_GUIDANCE.other;
  const readingId = `ORB-${input.readingDate.replaceAll('-', '')}-${seed.toString(36).toUpperCase().padStart(7, '0').slice(0, 7)}`;

  return {
    ok:true,
    engineVersion:ENGINE_VERSION,
    readingId,
    createdAt:new Date().toISOString(),
    input,
    safety,
    numerology:{ lifePath, personalCycle:cycle },
    cards,
    scores,
    reversibility,
    clarity,
    decision,
    narrative,
    guidance,
    plan,
    disclaimer:'この鑑定は、悩みを整理するための参考情報です。未来や相手の気持ち、成功や結果を保証するものではありません。医療・法律・税務・投資・安全に関わる判断は、適切な専門家へ相談してください。'
  };
}

export function readingToShareText(reading) {
  if (!reading?.ok) return '';
  return [
    'ORBITA 鑑定結果',
    `鑑定ID: ${reading.readingId}`,
    `今回のまとめ: ${reading.decision.text}`,
    `A「${reading.input.optionA}」 ${reading.scores.a}`,
    `B「${reading.input.optionB}」 ${reading.scores.b}`,
    `中心カード: ${reading.cards[0].name}`,
    reading.narrative.overview,
    '',
    reading.disclaimer
  ].join('\n');
}
