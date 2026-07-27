export const PERSONALITY_ENGINE_VERSION = '1.1.0';

// Item identity, domain and reverse-key structure follow Mini-IPIP exactly.
// Japanese wording keeps the source construct while clarifying the distinct
// behavioral focus of items that can otherwise sound repetitive in Japanese.
export const MINI_IPIP_ITEMS = Object.freeze([
  { id:'e1', domain:'E', reverse:false, focus:'social_energy', text:'盛り上げ役である' },
  { id:'a1', domain:'A', reverse:false, focus:'empathic_concern', text:'人がつらそうなとき、その気持ちに寄り添うほうだ' },
  { id:'c1', domain:'C', reverse:false, focus:'task_initiation', text:'すぐに雑用や用事を済ませる' },
  { id:'n1', domain:'N', reverse:false, focus:'mood_variability', text:'気分が著しく変化するほうだ' },
  { id:'o1', domain:'O', reverse:false, focus:'vivid_imagery', text:'頭の中で情景を鮮やかに思い浮かべるほうだ' },
  { id:'e2', domain:'E', reverse:true,  focus:'verbal_output', text:'おしゃべりではない' },
  { id:'a2', domain:'A', reverse:true,  focus:'problem_concern', text:'人が抱えている悩みや問題には、あまり関心がない' },
  { id:'c2', domain:'C', reverse:true,  focus:'object_return', text:'整理した物を元の場所へ戻し忘れることが多い' },
  { id:'n2', domain:'N', reverse:true,  focus:'baseline_relaxation', text:'いつもリラックスしていることが多い' },
  { id:'o2', domain:'O', reverse:true,  focus:'abstract_interest', text:'理論や概念など、抽象的な考えにはあまり興味がない' },
  { id:'e3', domain:'E', reverse:false, focus:'social_breadth', text:'人が集まる場では、いろいろな人と話すほうだ' },
  { id:'a3', domain:'A', reverse:false, focus:'emotional_resonance', text:'相手の喜びや悲しみが、自分にも伝わってくるほうだ' },
  { id:'c3', domain:'C', reverse:false, focus:'order_preference', text:'整頓するのが好きである' },
  { id:'n3', domain:'N', reverse:false, focus:'upset_reactivity', text:'慌てたり動揺したりしやすい' },
  { id:'o3', domain:'O', reverse:true,  focus:'abstract_comprehension', text:'抽象的な説明から内容を理解するのは苦手だ' },
  { id:'e4', domain:'E', reverse:true,  focus:'background_preference', text:'引っ込み思案である' },
  { id:'a4', domain:'A', reverse:true,  focus:'person_interest', text:'周囲の人がどんな人なのか、あまり知りたいと思わない' },
  { id:'c4', domain:'C', reverse:true,  focus:'messiness', text:'物事を散らかしたままにしやすい' },
  { id:'n4', domain:'N', reverse:true,  focus:'low_sadness', text:'落ち込むことはめったにない' },
  { id:'o4', domain:'O', reverse:true,  focus:'generative_imagination', text:'新しい場面やアイデアを想像するのは苦手だ' }
]);

export const RESPONSE_OPTIONS = Object.freeze([
  { value:1, label:'まったく当てはまらない' },
  { value:2, label:'あまり当てはまらない' },
  { value:3, label:'どちらともいえない' },
  { value:4, label:'やや当てはまる' },
  { value:5, label:'とても当てはまる' }
]);

const DOMAIN_NAMES = Object.freeze({
  E:'対人活動性',
  A:'共感協調性',
  C:'計画実行性',
  N:'感情感受性',
  O:'想像探究性'
});

export function scoreMiniIpip(rawResponses = {}) {
  const sums = { E:0, A:0, C:0, N:0, O:0 };
  const counts = { E:0, A:0, C:0, N:0, O:0 };
  const answered = [];

  for (const item of MINI_IPIP_ITEMS) {
    const raw = Number(rawResponses[item.id]);
    if (!Number.isFinite(raw) || raw < 1 || raw > 5) continue;
    const keyed = item.reverse ? 6 - raw : raw;
    sums[item.domain] += keyed;
    counts[item.domain] += 1;
    answered.push({ ...item, raw, keyed });
  }

  const domains = {};
  for (const domain of Object.keys(sums)) {
    const count = counts[domain];
    const mean = count ? sums[domain] / count : 3;
    const normalized = Math.round(((mean - 1) / 4) * 100);
    domains[domain] = {
      key:domain,
      name:DOMAIN_NAMES[domain],
      count,
      mean:Number(mean.toFixed(2)),
      score:clamp(normalized,0,100),
      band:bandFor(normalized)
    };
  }

  return {
    version:PERSONALITY_ENGINE_VERSION,
    complete:answered.length === MINI_IPIP_ITEMS.length,
    answered:answered.length,
    domains,
    responseQuality:assessResponseQuality(answered)
  };
}

export function buildInternalPersonalityModel({ scores, context = {}, identity = {}, tarotNames = [], advisorTone = '' } = {}) {
  const domains = scores?.domains || scoreMiniIpip({}).domains;
  const lexical = analyzeContext(context.question || '');
  const tension = clamp(Number(context.tension) || 5,1,10);
  const timeframe = String(context.timeframe || '');

  // Evidence hierarchy:
  // 1) Mini-IPIP domain scores determine the stable personality description.
  // 2) Consultation text, urgency and tension only modify the present-state description.
  // 3) Name, birth date, advisor and tarot choose presentation variants only; they never alter trait scores.
  const stable = {
    sociability:domains.E.score,
    empathy:domains.A.score,
    organization:domains.C.score,
    sensitivity:domains.N.score,
    imagination:domains.O.score
  };

  const current = {
    relationalFocus:clamp(50 + lexical.otherFocus * 8 - lexical.selfFocus * 4,20,85),
    uncertainty:clamp(35 + tension * 5 + lexical.uncertainty * 7,20,95),
    actionReadiness:clamp(55 + lexical.action * 7 - lexical.uncertainty * 4 - (timeframe.includes('1年') ? 8 : 0),15,90)
  };

  const presentationSeed = hashText([
    identity.fullName || '', identity.kana || '', context.birthdate || '',
    context.category || '', advisorTone || '', ...tarotNames
  ].join('|'));

  return {
    version:PERSONALITY_ENGINE_VERSION,
    stable,
    current,
    presentationSeed,
    responseQuality:scores?.responseQuality || { level:'unknown' },
    privateEvidence:{
      psychometric:'Mini-IPIP 20 responses',
      contextual:'consultation text, tension, decision timeframe',
      presentation:'name, reading, birth date, advisor tone, tarot cards',
      policy:'presentation inputs never change psychometric trait scores'
    }
  };
}

export function buildPersonalityNarrative(model = {}) {
  const s = model.stable || {};
  const c = model.current || {};
  const seed = Number(model.presentationSeed) || 0;
  const paragraphs = [];

  paragraphs.push(combineCoreTraits(s, seed));
  paragraphs.push(combineInterpersonalTraits(s, seed >>> 3));
  paragraphs.push(combineCurrentState(s, c, seed >>> 6));
  paragraphs.push(combineClosing(s, c, seed >>> 9));

  return {
    title:'あなたはこういう人です',
    paragraphs:paragraphs.filter(Boolean),
    internalConfidence:confidenceLabel(model.responseQuality)
  };
}

function combineCoreTraits(s, seed) {
  const highC = s.organization >= 62;
  const lowC = s.organization <= 38;
  const highN = s.sensitivity >= 62;
  const highO = s.imagination >= 62;
  const lowO = s.imagination <= 38;

  if (highC && highN) {
    return pick([
      'あなたは、責任を引き受けたことを途中で投げ出さない人です。先の変化まで考えて準備するため、周囲からは慎重に見えますが、内側では常に最善の形を探し続けています。',
      'あなたは、曖昧なまま進むことを好まず、納得できる形まで整えたい人です。細かな違和感にも早く気づくため、決断の前には人より多くの可能性を考えています。'
    ], seed);
  }
  if (highC && !highN) {
    return pick([
      'あなたは、感情に流されるより、やるべきことを一つずつ形にできる人です。決めた後の動きが安定しており、時間をかけてでも結果へ近づけます。',
      'あなたは、目立つ勢いよりも積み重ねで信頼を作る人です。自分の中で順序が決まると、周囲に振り回されず淡々と進めます。'
    ], seed);
  }
  if (lowC && highO) {
    return pick([
      'あなたは、決められた手順よりも、その場で見つけた可能性に心が動く人です。発想が広がるほど選択肢も増えるため、最初の一歩を決めるまでに時間がかかりやすいところがあります。',
      'あなたは、一つの正解に閉じこもらず、別の道を見つけられる人です。自由に考えられる反面、興味の向く方向が変わると優先順位も揺れやすくなります。'
    ], seed);
  }
  if (lowO) {
    return pick([
      'あなたは、曖昧な理想より、実際に確かめられることを大切にする人です。見慣れない方法へ飛びつくより、信頼できる手順を選ぶことで力を発揮します。',
      'あなたは、現実から離れた話より、今できることに集中できる人です。変化を選ぶ時も、生活の中で続けられるかを自然に見ています。'
    ], seed);
  }
  return pick([
    'あなたは、考えることと動くことの両方を必要とする人です。勢いだけでは決めませんが、納得できる理由が見つかると迷いを行動へ変えられます。',
    'あなたは、状況に合わせて考え方を変えられる人です。慎重さと柔軟さの両方を持ち、最後は自分の感覚で折り合いをつけます。'
  ], seed);
}

function combineInterpersonalTraits(s, seed) {
  const highE = s.sociability >= 62;
  const lowE = s.sociability <= 38;
  const highA = s.empathy >= 62;
  const lowA = s.empathy <= 38;

  if (highE && highA) return pick([
    '人との間に自然に流れを作り、相手の反応にもすぐ気づきます。明るく見える時ほど、場の空気を整える役割まで無意識に背負っています。',
    'あなたは人と関わることで力が出る一方、相手の気持ちも深く受け取ります。周囲を元気にしながら、自分の疲れは後回しにしやすい人です。'
  ], seed);
  if (lowE && highA) return pick([
    'あなたは多くを語らなくても、相手の変化をよく見ています。静かに寄り添える反面、自分の本音を出す前に相手の事情を優先しやすい人です。',
    'あなたは目立つことより、信頼できる相手との深いつながりを大切にします。人の気持ちを受け取りすぎると、一人で整理する時間が必要になります。'
  ], seed);
  if (highE && lowA) return pick([
    'あなたは人の中へ入っていく力があり、自分の考えを前へ出せる人です。遠慮より率直さを選ぶため、迷いが晴れた後の決断は速いでしょう。',
    'あなたは、周囲の反応を待つより自分から流れを動かせる人です。納得できない時には、関係を保つためだけの妥協を選びません。'
  ], seed);
  if (lowE && lowA) return pick([
    'あなたは、誰にでも心を開くのではなく、自分の領域をはっきり守る人です。必要な関係だけを選ぶため、一度信頼した相手には長く誠実でいられます。',
    'あなたは一人で考える力が強く、周囲の意見に簡単には流されません。距離を取る時は冷たさではなく、自分を整えるための判断です。'
  ], seed);
  return pick([
    'あなたは、相手に合わせる時と自分を通す時を使い分ける人です。関係を壊したくない気持ちはありますが、最後の一線は自分で決めます。',
    'あなたは、人との距離を相手ごとに調整できる人です。親しさだけで判断せず、自分が安心していられる関係かを見ています。'
  ], seed);
}

function combineCurrentState(s, c, seed) {
  if (c.uncertainty >= 72 && s.sensitivity >= 58) return pick([
    '今のあなたは、答えが分からないのではありません。選んだ後に起こる変化まで先に感じ取っているため、簡単に結論を出したくない状態です。',
    '今回の迷いは、優柔不断だから生まれたものではありません。自分の決断が周囲やこれからの生活へ与える影響を、すでに深く受け取っているからです。'
  ], seed);
  if (c.actionReadiness >= 68) return pick([
    '今は心の中で方向がかなり定まっています。必要なのは新しい答えを増やすことではなく、最初の一歩を現実の予定へ置き換えることです。',
    '今の迷いには、止まりたい気持ちより動きたい気持ちが強く出ています。小さく始められる形が見えれば、流れは一気に変わります。'
  ], seed);
  if (c.relationalFocus >= 65) return pick([
    '今回の選択では、自分の希望だけでなく、相手や周囲がどう感じるかまで抱えています。その優しさが、決断を必要以上に重くしています。',
    '今は自分の答えより、周囲への影響を先に考えています。誰かを傷つけない選択を探すほど、本来の希望が見えにくくなっています。'
  ], seed);
  return pick([
    '今のあなたは、まだ決められないのではなく、納得できる最後の条件を探しています。その条件が一つ見つかれば、迷いは長く残りません。',
    '今回の迷いは、考えが足りないからではありません。すでに十分考えており、あとは何を基準に決めるかを一つに絞る段階です。'
  ], seed);
}

function combineClosing(s, c, seed) {
  const highC = s.organization >= 60;
  const highO = s.imagination >= 60;
  const highN = s.sensitivity >= 60;
  if (highC && highN) return pick([
    'あなたの強さは、怖さがなくなるまで待つことではなく、怖さがあっても崩れない形を作れることです。',
    'あなたは勢いで人生を変える人ではありません。確かめるべきものを確かめた後、静かに大きな決断をする人です。'
  ], seed);
  if (highO) return pick([
    'あなたには、今ある二つの道だけでなく、まだ名前のない第三の道を作る力があります。',
    'あなたの本来の力は、正解を探すことではなく、自分に合う形へ答えを作り直せることです。'
  ], seed);
  if (c.actionReadiness >= 65) return pick([
    'あなたは、始める前より始めた後に強くなる人です。今は完璧な確信より、動きながら確かめる方が合っています。',
    'あなたの答えは、考え続けた先ではなく、最初の行動を起こした後にはっきりします。'
  ], seed);
  return pick([
    'あなたは、急かされて決める人ではありません。自分の中で本当に納得した答えは、時間がたっても簡単には揺らぎません。',
    'あなたは、人の正解を借りるより、自分で確かめた答えを長く守れる人です。'
  ], seed);
}

function analyzeContext(text) {
  const value = String(text || '');
  return {
    otherFocus:countMatches(value,/(相手|家族|夫|妻|彼|彼女|子ども|周り|迷惑|関係)/g),
    selfFocus:countMatches(value,/(自分|私|本音|希望|やりたい|望む)/g),
    uncertainty:countMatches(value,/(不安|迷|心配|怖|分から|決められ|悩)/g),
    action:countMatches(value,/(進|始|変え|動|挑戦|連絡|辞め|続け)/g)
  };
}

function assessResponseQuality(answered) {
  if (answered.length < MINI_IPIP_ITEMS.length) return { level:'incomplete', complete:false };
  const rawValues = answered.map((item) => item.raw);
  const unique = new Set(rawValues).size;
  const straightLine = unique <= 1;
  const extremeRate = rawValues.filter((value) => value === 1 || value === 5).length / rawValues.length;
  const level = straightLine ? 'low' : extremeRate > 0.9 ? 'guarded' : 'standard';
  return { level, complete:true, straightLine, extremeRate:Number(extremeRate.toFixed(2)) };
}

function confidenceLabel(quality = {}) {
  if (quality.level === 'low' || quality.level === 'incomplete') return 'conservative';
  if (quality.level === 'guarded') return 'moderate';
  return 'standard';
}

function bandFor(score) {
  if (score >= 68) return 'high';
  if (score <= 32) return 'low';
  return 'middle';
}

function countMatches(value, pattern) {
  return [...String(value).matchAll(pattern)].length;
}

function pick(values, seed) {
  return values[Math.abs(Number(seed) || 0) % values.length];
}

function hashText(value) {
  let hash = 2166136261;
  for (const char of String(value || '')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
