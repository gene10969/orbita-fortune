import { ADVISORS, getAdvisor } from '../../advisors.js';
import { BOOKING_CONFIG, createSlots, advisorStatus, toJstParts } from '../../booking-core.js';

const JSON_HEADERS = { 'Content-Type':'application/json; charset=utf-8' };

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers:{ ...JSON_HEADERS, ...extra } });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || env.SITE_URL || '').split(',').map((v) => v.trim()).filter(Boolean);
  const selected = allowed.includes(origin) ? origin : allowed[0] || 'null';
  return {
    'Access-Control-Allow-Origin':selected,
    'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
    'Vary':'Origin',
    'Cache-Control':'no-store'
  };
}

async function readJson(request, maxBytes = 65000) {
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > maxBytes) throw new Error('payload_too_large');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new Error('payload_too_large');
  return JSON.parse(text || '{}');
}

function requireEnv(env, names) {
  const missing = names.filter((name) => !env[name]);
  if (missing.length) throw new Error(`missing_env:${missing.join(',')}`);
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function stripeRequest(env, path, init = {}) {
  requireEnv(env, ['STRIPE_SECRET_KEY']);
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    ...init,
    headers:{ 'Authorization':`Bearer ${env.STRIPE_SECRET_KEY}`, ...(init.headers || {}) }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'stripe_error');
  return data;
}

function requireDatabase(env) {
  if (!env.DB) throw new Error('missing_env:DB');
  return env.DB;
}

function bookingId() {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return `ORB-BKG-${[...bytes].map((byte) => byte.toString(16).padStart(2,'0')).join('').toUpperCase()}`;
}

function mapBookingRow(row) {
  return {
    bookingId:row.booking_id,
    advisorId:row.advisor_id,
    startAt:row.start_at,
    readyAt:row.ready_at,
    status:row.status,
    createdAt:row.created_at
  };
}

async function listRelevantBookings(env, advisorId = '') {
  const db = requireDatabase(env);
  const lower = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const upper = new Date(Date.now() + BOOKING_CONFIG.bookingHorizonDays * 24 * 60 * 60 * 1000).toISOString();
  const statement = advisorId
    ? db.prepare('SELECT booking_id, advisor_id, start_at, ready_at, status, created_at FROM bookings WHERE advisor_id = ? AND ready_at >= ? AND start_at <= ?').bind(advisorId,lower,upper)
    : db.prepare('SELECT booking_id, advisor_id, start_at, ready_at, status, created_at FROM bookings WHERE ready_at >= ? AND start_at <= ?').bind(lower,upper);
  const result = await statement.all();
  return (result.results || []).map(mapBookingRow);
}

async function advisorStatuses(env) {
  const reservations = await listRelevantBookings(env);
  const now = new Date();
  return json({
    statuses:ADVISORS.map((advisor) => ({ advisorId:advisor.id, ...advisorStatus(advisor,reservations,now) })),
    serverTime:now.toISOString()
  });
}

async function bookingAvailability(url, env) {
  const advisorId = String(url.searchParams.get('advisor_id') || '');
  const dateKey = String(url.searchParams.get('date') || '');
  const advisor = getAdvisor(advisorId);
  if (!advisor || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return json({ error:'invalid_request' },400);
  const reservations = await listRelevantBookings(env,advisorId);
  return json({ advisorId, dateKey, slots:createSlots(advisor,dateKey,reservations,new Date()) });
}

async function reserveBooking(request, env) {
  const db = requireDatabase(env);
  const { advisorId, startAt, readyAt, clientToken } = await readJson(request,12000);
  const advisor = getAdvisor(String(advisorId || ''));
  if (!advisor) return json({ error:'advisor_not_found' },404);
  if (!/^CLIENT-[A-F0-9-]{12,80}$/.test(String(clientToken || ''))) return json({ error:'invalid_client_token' },400);
  const start = new Date(startAt);
  const ready = new Date(readyAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(ready.getTime()) || ready <= start) return json({ error:'invalid_slot' },400);
  const reservations = await listRelevantBookings(env,advisor.id);
  const valid = createSlots(advisor,toJstParts(start).dateKey,reservations,new Date()).find((slot) => slot.startAt === start.toISOString() && slot.readyAt === ready.toISOString() && slot.available);
  if (!valid) return json({ error:'slot_taken' },409);

  const id = bookingId();
  const tokenHash = await sha256(clientToken);
  const createdAt = new Date().toISOString();
  try {
    await db.prepare('INSERT INTO bookings (booking_id, advisor_id, start_at, ready_at, client_token_hash, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id,advisor.id,start.toISOString(),ready.toISOString(),tokenHash,'reserved',createdAt).run();
  } catch (error) {
    if (String(error?.message || '').toLowerCase().includes('unique')) return json({ error:'slot_taken' },409);
    throw error;
  }
  return json({ bookingId:id, advisorId:advisor.id, startAt:start.toISOString(), readyAt:ready.toISOString(), status:'reserved', createdAt },201);
}

async function readBooking(url, env) {
  const db = requireDatabase(env);
  const match = url.pathname.match(/^\/api\/bookings\/(ORB-BKG-[A-F0-9]+)$/);
  if (!match) return json({ error:'invalid_booking_id' },400);
  const clientToken = String(url.searchParams.get('client_token') || '');
  const tokenHash = await sha256(clientToken);
  const row = await db.prepare('SELECT booking_id, advisor_id, start_at, ready_at, client_token_hash, status, created_at FROM bookings WHERE booking_id = ?').bind(match[1]).first();
  if (!row || row.client_token_hash !== tokenHash) return json({ error:'not_found' },404);
  const booking = mapBookingRow(row);
  const now = Date.now();
  booking.phase = now < new Date(booking.startAt).getTime() ? 'reserved' : now < new Date(booking.readyAt).getTime() ? 'reading' : 'ready';
  return json(booking);
}

async function createCheckout(request, env) {
  requireEnv(env, ['STRIPE_SECRET_KEY','STRIPE_PRICE_ID','SITE_URL']);
  const { readingId, reading } = await readJson(request);
  if (!/^ORB-[A-Z0-9-]{8,40}$/.test(String(readingId || ''))) return json({ error:'invalid_reading_id' }, 400);
  if (!reading || reading.readingId !== readingId || reading.ok !== true) return json({ error:'invalid_reading' }, 400);
  const payloadHash = await sha256(JSON.stringify(reading));
  const body = new URLSearchParams();
  body.set('mode','payment');
  body.set('line_items[0][price]', env.STRIPE_PRICE_ID);
  body.set('line_items[0][quantity]','1');
  body.set('client_reference_id', readingId);
  body.set('metadata[reading_id]', readingId);
  body.set('metadata[payload_hash]', payloadHash);
  body.set('success_url', `${env.SITE_URL.replace(/\/$/,'')}/?session_id={CHECKOUT_SESSION_ID}#result`);
  body.set('cancel_url', `${env.SITE_URL.replace(/\/$/,'')}/#result`);
  body.set('locale','ja');
  const session = await stripeRequest(env, '/checkout/sessions', {
    method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, body
  });
  return json({ url:session.url });
}

async function getPaidSession(env, sessionId) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(String(sessionId || ''))) throw new Error('invalid_session');
  const session = await stripeRequest(env, `/checkout/sessions/${encodeURIComponent(sessionId)}`);
  if (session.payment_status !== 'paid') throw new Error('payment_not_complete');
  return session;
}

async function paymentStatus(url, env) {
  const sessionId = url.searchParams.get('session_id');
  try {
    const session = await getPaidSession(env, sessionId);
    return json({ paid:true, readingId:session.client_reference_id || session.metadata?.reading_id || '' });
  } catch {
    return json({ paid:false }, 402);
  }
}

function extractOutputText(data) {
  if (typeof data.output_text === 'string') return data.output_text;
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  return '';
}

function parseJsonText(text) {
  const cleaned = String(text || '').replace(/^```json\s*/i,'').replace(/```$/,'').trim();
  return JSON.parse(cleaned);
}

function validateDeepResult(value) {
  const requiredStrings = ['optionAObstacle','optionBObstacle','exitCondition','ninetyDayFocus','closing'];
  if (!value || requiredStrings.some((key) => typeof value[key] !== 'string' || value[key].length < 10)) throw new Error('invalid_ai_output');
  if (!Array.isArray(value.weeks) || value.weeks.length !== 4) throw new Error('invalid_ai_weeks');
  value.weeks.forEach((week, index) => {
    if (Number(week.week) !== index + 1 || typeof week.title !== 'string' || typeof week.action !== 'string') throw new Error('invalid_ai_week');
  });
  return value;
}

function chatTone(advisor) {
  const tones = {
    empathy:'やさしく安心感のある話し方',
    rational:'落ち着いて現実的な話し方',
    direct:'短く、はっきりした話し方',
    motherly:'包み込むような温かい話し方',
    wise:'落ち着きがあり、長い目で考える話し方',
    mystic:'静かで余韻のある話し方。ただし難しい比喩は使わない',
    philosophical:'別の見方を示す穏やかな話し方',
    stoic:'無駄を省いた簡潔な話し方',
    cheerful:'明るく前向きな話し方',
    glamorous:'自信を取り戻せる華やかな話し方'
  };
  return tones[advisor?.tone] || tones.rational;
}

async function generateChatReply(request, env) {
  requireEnv(env, ['OPENAI_API_KEY','OPENAI_MODEL']);
  const payload = await readJson(request, 20000);
  const advisor = getAdvisor(String(payload.advisorId || ''));
  if (!advisor) return json({ error:'advisor_not_found' },404);
  const userMessage = String(payload.userMessage || '').slice(0,600);
  const nextQuestion = String(payload.nextQuestion || '').slice(0,300);
  const step = String(payload.step || '').slice(0,40);
  const answers = payload.answers && typeof payload.answers === 'object' ? payload.answers : {};

  const system = `あなたはORBITAの鑑定パートナー「${advisor.name}」です。${chatTone(advisor)}で、日本語の短い会話文を作ってください。利用者の入力を一度受け止め、次の質問へ自然につなげます。1〜3文、合計180字以内。難しい比喩、専門用語、断定、恐怖をあおる表現、追加購入の勧誘は禁止です。未来、成功、相手の気持ち、病気、妊娠、寿命、法律、税務、投資、ギャンブルの結果を断定しません。自分を人間、占い師、AI、システムなどと説明しません。次の質問は意味を変えず、分かりやすい日本語で含めてください。JSONのみを返してください。形式: {"reply":"会話文"}`;
  const input = { step, userMessage, nextQuestion, knownAnswers:answers };
  const response = await fetch('https://api.openai.com/v1/responses', {
    method:'POST',
    headers:{ 'Authorization':`Bearer ${env.OPENAI_API_KEY}`, 'Content-Type':'application/json' },
    body:JSON.stringify({
      model:env.OPENAI_MODEL,
      input:[
        { role:'system', content:[{ type:'input_text', text:system }] },
        { role:'user', content:[{ type:'input_text', text:JSON.stringify(input) }] }
      ],
      max_output_tokens:300
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'openai_error');
  const value = parseJsonText(extractOutputText(data));
  if (!value || typeof value.reply !== 'string' || value.reply.length < 3 || value.reply.length > 240) throw new Error('invalid_chat_output');
  return json({ reply:value.reply });
}

async function generateDeepReading(request, env) {
  requireEnv(env, ['OPENAI_API_KEY','OPENAI_MODEL']);
  const { sessionId, reading } = await readJson(request);
  const session = await getPaidSession(env, sessionId);
  const readingId = session.client_reference_id || session.metadata?.reading_id;
  if (!reading || reading.readingId !== readingId || reading.ok !== true) return json({ error:'reading_mismatch' }, 400);
  const payloadHash = await sha256(JSON.stringify(reading));
  if (payloadHash !== session.metadata?.payload_hash) return json({ error:'payload_mismatch' }, 400);

  const system = `あなたはORBITA「選択の星図」の深層鑑定編集者です。占いは娯楽・自己内省として扱い、未来、成功、相手の意思を断定しません。医療・法律・金融の助言、寿命、妊娠、治癒、自傷、危害、賭け事の予測をしません。恐怖を煽らず、追加購入を促しません。入力済みの無料鑑定を土台に、二択を現実で小さく検証する90日計画を日本語で作成してください。JSON以外を出力しないでください。形式: {"optionAObstacle":"80〜180字","optionBObstacle":"80〜180字","exitCondition":"80〜180字","ninetyDayFocus":"80〜180字","weeks":[{"week":1,"title":"短い題名","action":"80〜150字"},{"week":2,"title":"短い題名","action":"80〜150字"},{"week":3,"title":"短い題名","action":"80〜150字"},{"week":4,"title":"短い題名","action":"80〜150字"}],"closing":"120〜220字"}`;
  const response = await fetch('https://api.openai.com/v1/responses', {
    method:'POST',
    headers:{ 'Authorization':`Bearer ${env.OPENAI_API_KEY}`, 'Content-Type':'application/json' },
    body:JSON.stringify({
      model:env.OPENAI_MODEL,
      input:[
        { role:'system', content:[{ type:'input_text', text:system }] },
        { role:'user', content:[{ type:'input_text', text:JSON.stringify(reading) }] }
      ],
      max_output_tokens:2200
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'openai_error');
  const deep = validateDeepResult(parseJsonText(extractOutputText(data)));
  return json({ deep });
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:cors });
    const url = new URL(request.url);
    try {
      let response;
      if (request.method === 'GET' && url.pathname === '/api/advisors/status') response = await advisorStatuses(env);
      else if (request.method === 'GET' && url.pathname === '/api/bookings/availability') response = await bookingAvailability(url,env);
      else if (request.method === 'POST' && url.pathname === '/api/bookings/reserve') response = await reserveBooking(request,env);
      else if (request.method === 'GET' && url.pathname.startsWith('/api/bookings/')) response = await readBooking(url,env);
      else if (request.method === 'POST' && url.pathname === '/api/create-checkout') response = await createCheckout(request, env);
      else if (request.method === 'GET' && url.pathname === '/api/payment-status') response = await paymentStatus(url, env);
      else if (request.method === 'POST' && url.pathname === '/api/chat') response = await generateChatReply(request, env);
      else if (request.method === 'POST' && url.pathname === '/api/deep-reading') response = await generateDeepReading(request, env);
      else response = json({ error:'not_found' }, 404);
      const headers = new Headers(response.headers);
      Object.entries(cors).forEach(([key,value]) => headers.set(key,value));
      return new Response(response.body, { status:response.status, headers });
    } catch (error) {
      const message = String(error?.message || 'server_error');
      const publicMessage = message.startsWith('missing_env:') ? message : 'request_failed';
      return json({ error:publicMessage }, 500, cors);
    }
  }
};
