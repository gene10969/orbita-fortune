export const ENGINE_VERSION = '2.0.0';

const ARCHETYPES = [
  { id:'quiet-tower', name:'静かな塔', glyph:'◇', element:'静', light:'距離を置くことで、本当に必要な情報が見えやすくなる時です。', shadow:'考え続けるだけでは、慎重さが停滞へ変わります。', action:'判断材料を3つに絞り、今夜はいったん考えるのを止める。' },
  { id:'open-door', name:'開いた扉', glyph:'⟡', element:'動', light:'小さく試すことで、想像では分からなかった反応を確かめられます。', shadow:'勢いだけで不可逆な決断まで進めない注意が必要です。', action:'元に戻せる範囲で、最小の一歩だけ実行する。' },
  { id:'gold-thread', name:'金の糸', glyph:'⌁', element:'縁', light:'人や過去の経験とのつながりが、選択の基準を思い出させます。', shadow:'相手の期待を自分の希望と取り違えやすい時です。', action:'「私はどうしたいか」を主語にして一文書く。' },
  { id:'moon-well', name:'月の井戸', glyph:'◒', element:'深', light:'表面の理由より、繰り返し浮かぶ感情に重要な手掛かりがあります。', shadow:'不安を事実として扱うと、選択肢を狭めてしまいます。', action:'事実・予想・感情を別々に書き分ける。' },
  { id:'first-spark', name:'最初の火花', glyph:'✦', element:'始', light:'完成度より着手が流れを変えます。', shadow:'新しさへの高揚だけで、維持条件を見落とさないでください。', action:'15分で終わる試作品か仮連絡をつくる。' },
  { id:'returning-tide', name:'還る潮', glyph:'≈', element:'巡', light:'一度離れたものを見直すことで、以前とは違う答えが得られます。', shadow:'懐かしさだけで同じ場所へ戻らないこと。', action:'過去にやめた理由が今も有効か確認する。' },
  { id:'glass-bridge', name:'硝子の橋', glyph:'⌇', element:'境', light:'不確実でも、確認しながら渡れる道があります。', shadow:'一度に全てを決めようとすると恐れが大きくなります。', action:'次の確認地点だけを決める。' },
  { id:'sealed-letter', name:'封じた手紙', glyph:'▱', element:'言', light:'言葉にしていない本音が、選択を難しくしています。', shadow:'説明を避けるほど、相手の想像が事実を上書きします。', action:'送らなくてもよいので、本音の返信文を一度作る。' },
  { id:'north-window', name:'北の窓', glyph:'⌃', element:'観', light:'短期的な損得から離れると、進む方向が整います。', shadow:'理想を高く置きすぎて、現実の足場を否定しないこと。', action:'半年後に残したいものを一つ選ぶ。' },
  { id:'small-key', name:'小さな鍵', glyph:'⚿', element:'解', light:'大きな問題に見えても、実際の詰まりは一箇所かもしれません。', shadow:'全部を変える必要があると思い込まないでください。', action:'最も負担の大きい一点だけを特定する。' },
  { id:'unlit-lantern', name:'灯る前のランタン', glyph:'⬡', element:'準', light:'今は準備不足ではなく、点火条件を整えている段階です。', shadow:'準備という言葉で決断を先送りし続けないこと。', action:'開始条件を数値か日付で決める。' },
  { id:'two-shores', name:'二つの岸', glyph:'≍', element:'選', light:'どちらを選んでも得るものと失うものがあります。', shadow:'損失ゼロの選択肢を探すほど決められなくなります。', action:'許容できる損失を先に決める。' },
  { id:'hidden-stair', name:'隠れた階段', glyph:'⋰', element:'転', light:'正面突破以外の経路が見つかる余地があります。', shadow:'裏道を探すあまり、必要な対話まで避けないこと。', action:'AかBではない第三の小案を一つ作る。' },
  { id:'golden-scale', name:'金の天秤', glyph:'⚖', element:'衡', light:'感情と条件を別々に量ることで、納得できる選択へ近づきます。', shadow:'数字だけ、気持ちだけの一方に偏らないでください。', action:'条件点と感情点を10点満点で別々に採点する。' },
  { id:'rain-after', name:'雨あがり', glyph:'☂', element:'浄', light:'混乱のピークは過ぎ、判断をやり直せる余白があります。', shadow:'疲労したまま結論を急がないこと。', action:'睡眠・食事・時間を整えてから再判定する。' },
  { id:'mirror-room', name:'鏡の部屋', glyph:'◈', element:'映', light:'相手への評価に、自分の恐れや願いが映っている可能性があります。', shadow:'自己責任だけに寄せて、相手の問題を見逃さないこと。', action:'相手の事実と自分の解釈を二列に分ける。' },
  { id:'stone-seed', name:'石の種', glyph:'●', element:'耐', light:'すぐに結果が出なくても、積み重ねが残る選択です。', shadow:'耐えること自体を目的にしないでください。', action:'続ける期限と撤退条件を同時に決める。' },
  { id:'crosswind', name:'横風', glyph:'⇝', element:'変', light:'予定外の反応が、より適切な方向修正を促します。', shadow:'一時的な反対を、全面的な否定と受け取らないこと。', action:'反応を見て調整できる余白を残す。' },
  { id:'empty-chair', name:'空いた椅子', glyph:'□', element:'余', light:'埋めようとしない空白が、新しい選択肢を招きます。', shadow:'寂しさを避けるためだけの選択に注意してください。', action:'何もしない場合の利点も一度書く。' },
  { id:'dawn-line', name:'夜明けの線', glyph:'━', element:'明', light:'状況が完全に変わる前に、方向だけ先に見え始めています。', shadow:'確信が100％になるまで待たないこと。', action:'60％納得できる仮決定を置く。' },
  { id:'root-map', name:'根の地図', glyph:'⌄', element:'基', light:'現在の迷いは、生活基盤や価値観の再確認を求めています。', shadow:'目先の魅力で基盤を崩さないようにしてください。', action:'お金・時間・健康・関係の最低条件を確認する。' },
  { id:'white-feather', name:'白い羽', glyph:'⌁', element:'軽', light:'不要な義務を一つ外すと、本心に近い選択が残ります。', shadow:'責任から逃れることと、重荷を手放すことを混同しないでください。', action:'本来引き受けなくてよい役割を一つ確認する。' },
  { id:'silent-bell', name:'鳴らない鐘', glyph:'◉', element:'待', light:'反応がないこと自体が、重要な情報になっています。', shadow:'相手の沈黙に都合のよい意味を加えないこと。', action:'待つ期限と、期限後の行動を決める。' },
  { id:'orbit-change', name:'軌道変更', glyph:'◎', element:'新', light:'目的を保ったまま、方法だけを変える選択が有効です。', shadow:'過去の投入量だけを理由に続けないでください。', action:'目的と手段を分け、代替手段を二つ挙げる。' }
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
  empathy:'急いで答えを固定せず、まず心が安全に動ける範囲を確かめます。',
  rational:'感情と条件を分け、実行可能性と損失上限から読み解きます。',
  direct:'慰めになる解釈より、今避けている論点を優先して映します。',
  motherly:'抱えている負担を責めず、守るものと手放すものを整えます。',
  wise:'目先の結果から少し離れ、長く残る軸を基準に読みます。',
  mystic:'時期の巡りと感情の波を重ね、無理なく動ける瞬間を探します。',
  philosophical:'一つの正解ではなく、選択を支える前提そのものを問い直します。',
  stoic:'続ける条件とやめる条件を曖昧にせず、最小限の言葉で示します。',
  cheerful:'重く考えすぎず、今日から試せる明るい一歩へ変換します。',
  glamorous:'他人からどう見られるかより、自分の魅力と境界線を軸に読みます。'
};

const METHOD_GUIDANCE = {
  decision:'二つの選択肢の試しやすさと戻りやすさを比較します。',
  tarot:'三枚の象徴札が示す現在・盲点・次の一歩を中心に読みます。',
  numerology:'生年月日の数的傾向と当日の巡りを中心に読みます。',
  astrology:'時期の波と、急がない方がよい部分を中心に読みます。',
  oracle:'今の自分に必要な視点と、心を整える一歩を中心に読みます。',
  intuition:'相談文に繰り返し現れる言葉と、避けている論点を中心に読みます。'
};

const STOP_PATTERNS = [
  /自殺|死にたい|消えたい|生きていたくない|自傷|リストカット/i,
  /殺す|殺したい|傷つけたい|復讐してやる/i,
  /寿命|死期|いつ死ぬ|余命/i,
  /病気.*治る|癌.*治る|妊娠.*確実|薬.*やめ/i,
  /必ず.*儲か|絶対.*当た|宝くじ|競馬|競艇|パチンコ.*勝/i
];

const CAUTION_PATTERNS = [
  /病気|症状|診断|治療|薬|妊娠|流産|手術/i,
  /投資|株|FX|仮想通貨|暗号資産|借金|ローン/i,
  /離婚|相続|訴訟|警察|弁護士|契約違反/i
];

export function normalizeText(value, max = 240) {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
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
  let n = Math.abs(Number(value) || 0);
  while (n > 9) {
    if (preserveMasters && [11, 22, 33].includes(n)) return n;
    n = String(n).split('').reduce((sum, d) => sum + Number(d), 0);
  }
  return n || 1;
}

export function calculateLifePath(dateString) {
  const digits = String(dateString).replace(/\D/g, '');
  if (digits.length !== 8) return null;
  return reduceNumber(digits.split('').reduce((sum, d) => sum + Number(d), 0), true);
}

export function calculatePersonalCycle(dateString, readingDate) {
  const birth = new Date(`${dateString}T12:00:00`);
  const current = new Date(`${readingDate}T12:00:00`);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(current.getTime())) return null;
  const total = (birth.getMonth() + 1) + birth.getDate() + current.getFullYear() + (current.getMonth() + 1) + current.getDate();
  return reduceNumber(total, false);
}

export function detectSafetyRisk(text) {
  const source = normalizeText(text, 1000);
  if (STOP_PATTERNS.some((pattern) => pattern.test(source))) {
    return {
      level: 'stop',
      title: 'この内容は占いとして扱えません',
      message: '生命・医療・危害・賭け事の結果を占いで判断することはできません。緊急性がある場合は、地域の緊急窓口や信頼できる人、医療・法律・金融の専門家へ直接相談してください。'
    };
  }
  if (CAUTION_PATTERNS.some((pattern) => pattern.test(source))) {
    return {
      level: 'caution',
      title: '専門判断とは分けてお読みください',
      message: 'この鑑定は気持ちと選択肢を整理するための娯楽・内省コンテンツです。医療・法律・金融上の判断は、必ず資格を持つ専門家の情報を優先してください。'
    };
  }
  return { level: 'normal', title: '', message: '' };
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
  if (delta >= 16) return { key:'a', text:'現時点ではAを小さく試す流れ', tone:'forward' };
  if (delta <= -16) return { key:'b', text:'現時点ではBを小さく試す流れ', tone:'forward' };
  return { key:'hold', text:'今は結論より比較実験が有効', tone:'balanced' };
}

function buildSevenDayPlan(input, cards, scores, reversibility) {
  const chosen = scores.a >= scores.b ? input.optionA : input.optionB;
  const categoryTips = CATEGORY_GUIDANCE[input.category] || CATEGORY_GUIDANCE.other;
  return [
    { day:1, title:'迷いを分解する', body:`「${input.optionA}」と「${input.optionB}」で、得るもの・失うものを各3つ書きます。` },
    { day:2, title:'事実だけを集める', body:'推測や期待を除き、確認できている事実だけを箇条書きにします。' },
    { day:3, title:'象徴札を行動へ変える', body:cards[1].action },
    { day:4, title:'最低条件を決める', body:categoryTips[0] + '。' },
    { day:5, title:'小さく試す', body:`「${chosen}」を選んだ場合の最小実験を、${reversibility >= 60 ? '24時間以内' : '3日以内'}に一つ行います。` },
    { day:6, title:'身体反応を記録する', body:'実行前後の緊張・安心・疲労を10点満点で記録します。' },
    { day:7, title:'仮決定する', body:'結果ではなく、次の7日間だけ採用する方向を決めます。変更可能な仮決定で構いません。' }
  ];
}

function buildLocalNarrative(input, cards, scores, lifePath, cycle, decision, reversibility) {
  const lead = decision.key === 'hold'
    ? `二つの選択肢は拮抗しています。今は無理に一つへ固定するより、戻れる範囲で両者の違いを確かめる時です。`
    : `現在の星路は「${decision.key === 'a' ? input.optionA : input.optionB}」側へやや傾いています。ただし、これは成功確率ではなく、今の相談内容と象徴の組み合わせが示す“試しやすさ”です。`;
  const toneLead = TONE_GUIDANCE[input.advisorTone] || TONE_GUIDANCE.rational;
  const methodLead = METHOD_GUIDANCE[input.method] || METHOD_GUIDANCE.decision;
  return {
    overview: `${toneLead} ${methodLead} ${lead} 中心札「${cards[0].name}」は、${cards[0].light}`,
    hidden: `見落としやすい点として「${cards[1].name}」が現れています。${cards[1].shadow}`,
    timing: `数の基調は${lifePath}、今日の巡りは${cycle}です。可逆性指数は${reversibility}。${reversibility >= 65 ? 'まず試してから修正できる余地が比較的大きい状態です。' : reversibility >= 45 ? '小さく区切れば試せますが、撤退条件を先に決める必要があります。' : '不可逆な要素が多いため、実行前の確認と第三者の視点が重要です。'}`,
    closing: `${toneLead} 結論を当てることより、選んだ後に自分で整え直せる設計を持つことが、今回の鑑定で最も重要です。`
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
  if (!input.advisorId) errors.push('鑑定者を選択してください。');
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
    disclaimer:'本鑑定は娯楽および自己理解の補助を目的とし、未来・相手の意思・結果を保証するものではありません。重要な医療・法律・金融・安全上の判断には使用しないでください。'
  };
}

export function readingToShareText(reading) {
  if (!reading?.ok) return '';
  return [
    `ORBITA 選択の星図`,
    `鑑定ID: ${reading.readingId}`,
    `現在の指針: ${reading.decision.text}`,
    `A「${reading.input.optionA}」 ${reading.scores.a}`,
    `B「${reading.input.optionB}」 ${reading.scores.b}`,
    `中心札: ${reading.cards[0].name}`,
    reading.narrative.overview,
    '',
    reading.disclaimer
  ].join('\n');
}
