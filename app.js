import { APP_CONFIG } from './config.js';
import { ADVISORS, getAdvisor, getMethod } from './advisors.js';
import { BOOKING_CONFIG, formatDateLabel, formatDateTimeJst, toJstParts } from './booking-core.js';
import { bookingDates, getAvailability, getStatuses, reserveBooking } from './booking-service.js';
import { generateReading, readingToShareText } from './engine.js';

const ASSET_VERSION = '3.1.0';
const advisorImage = (advisor) => `${advisor.image}?v=${ASSET_VERSION}`;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const HISTORY_KEY = 'orbita_readings_v3';
const PENDING_KEY = 'orbita_pending_session_v3';
const SELECTION_KEY = 'orbita_booking_selection_v3';
const CHAT_KEY = 'orbita_chat_state_v1';
const PAID_PENDING_KEY = 'orbita_pending_paid_reading_v1';

let activeReading = null;
let advisorStatuses = [];
let selectedAdvisorId = '';
let selectedSlot = null;
let activeFilter = 'all';
let activeGenreFilter = 'all';
let advisorSort = 'recommended';
let toastTimer = null;
let deferredInstallPrompt = null;
let statusTimer = null;
let sessionTimer = null;
let chatBusy = false;
let chatState = null;
let chatSnapshots = [];

const CATEGORY_LABELS = {
  work:'仕事・転職',
  love:'恋愛',
  relationship:'人間関係',
  money:'お金',
  life:'人生・将来',
  other:'その他'
};

const TIMEFRAME_LABELS = {
  '7days':'7日以内',
  '1month':'1か月以内',
  '3months':'3か月以内',
  '1year':'1年以内'
};

const CHAT_STEPS = [
  {
    key:'nickname',
    type:'text',
    prompt:'まず、鑑定の中でお呼びする名前を教えてください。本名でなくて構いません。',
    label:'呼び名',
    placeholder:'例：ミナ',
    validate:(value) => value.trim().length ? '' : '呼び名を入力してください。',
    acknowledge:(value) => `${value}さんですね。ありがとうございます。`
  },
  {
    key:'birthdate',
    type:'date',
    prompt:'次に、生年月日を教えてください。数秘術や時期の計算に使います。',
    label:'生年月日',
    validate:(value) => /^\d{4}-\d{2}-\d{2}$/.test(value) ? '' : '生年月日を選択してください。',
    acknowledge:() => '確認しました。'
  },
  {
    key:'category',
    type:'choice',
    prompt:'今回の相談に一番近い分野を選んでください。',
    choices:[
      ['love','恋愛'],['work','仕事・転職'],['relationship','人間関係'],['money','お金'],['life','人生・将来'],['other','その他']
    ],
    acknowledge:(value) => `${CATEGORY_LABELS[value]}についての相談ですね。`
  },
  {
    key:'question',
    type:'textarea',
    prompt:'いま迷っていることを、できる範囲で教えてください。短くても大丈夫です。',
    label:'相談内容',
    placeholder:'例：今の仕事を続けるか、新しい環境へ移るか迷っています。',
    validate:(value) => value.trim().length >= 8 ? '' : '相談内容を8文字以上で入力してください。',
    acknowledge:() => '内容を受け取りました。次に、二つの選択肢を確認します。'
  },
  {
    key:'optionA',
    type:'text',
    prompt:'選択肢Aを、短い言葉で入力してください。',
    label:'選択肢A',
    placeholder:'例：今の仕事を続ける',
    validate:(value) => value.trim().length ? '' : '選択肢Aを入力してください。',
    acknowledge:(value) => `Aは「${value}」ですね。`
  },
  {
    key:'optionB',
    type:'text',
    prompt:'選択肢Bを入力してください。Aとは違う内容にしてください。',
    label:'選択肢B',
    placeholder:'例：新しい仕事へ移る',
    validate:(value, answers) => {
      if (!value.trim()) return '選択肢Bを入力してください。';
      if (value.trim() === String(answers.optionA || '').trim()) return 'AとBは違う内容にしてください。';
      return '';
    },
    acknowledge:(value) => `Bは「${value}」ですね。AとBの違いを整理します。`
  },
  {
    key:'timeframe',
    type:'choice',
    prompt:'どのくらいの期間で考えたいですか？',
    choices:[['7days','7日以内'],['1month','1か月以内'],['3months','3か月以内'],['1year','1年以内']],
    acknowledge:(value) => `${TIMEFRAME_LABELS[value]}を目安に考えます。`
  },
  {
    key:'tension',
    type:'choice',
    prompt:'今の迷いの強さを、1から10で選んでください。1は軽い迷い、10はかなり強い迷いです。',
    choices:Array.from({ length:10 },(_,index) => [String(index + 1),String(index + 1)]),
    acknowledge:(value) => `迷いの強さは${value}/10ですね。行動の大きさを調整するために使います。`
  },
  {
    key:'method',
    type:'method',
    prompt:'最後に、今回使う占い方法を選んでください。',
    acknowledge:(value) => `${getMethod(value).name}でまとめます。`
  },
  {
    key:'confirm',
    type:'confirm',
    prompt:'入力内容をまとめました。内容を確認して、予約を確定してください。'
  }
];

function localISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g,(char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
}

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'),2600);
}

function routeTo(route,pushHash = true) {
  const target = document.querySelector(`[data-view="${route}"]`) || $('[data-view="home"]');
  $$('.view').forEach((view) => view.classList.toggle('active',view === target));
  if (pushHash && location.hash !== `#${route}`) history.pushState(null,'',`#${route}`);
  $('.site-nav')?.classList.remove('open');
  $('.menu-toggle')?.setAttribute('aria-expanded','false');
  if (route === 'history') renderHistory();
  if (route === 'advisors') renderAdvisorPage();
  if (route === 'chat') renderChat();
  window.scrollTo({ top:0,behavior:'smooth' });
  setTimeout(() => $('#app')?.focus({ preventScroll:true }),50);
}

function readJsonStorage(key,fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function getHistory() {
  const parsed = readJsonStorage(HISTORY_KEY,[]);
  return Array.isArray(parsed) ? parsed : [];
}

function saveReading(reading) {
  const items = getHistory().filter((item) => item.readingId !== reading.readingId);
  items.unshift(reading);
  localStorage.setItem(HISTORY_KEY,JSON.stringify(items.slice(0,APP_CONFIG.historyLimit)));
}

function deleteReading(readingId) {
  localStorage.setItem(HISTORY_KEY,JSON.stringify(getHistory().filter((item) => item.readingId !== readingId)));
  renderHistory();
  showToast('履歴を削除しました');
}

function clearHistory() {
  if (!window.confirm('この端末に保存した鑑定履歴をすべて削除しますか？')) return;
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  showToast('すべての履歴を削除しました');
}

function ageOnDate(birthdate,reference = new Date()) {
  const birth = new Date(`${birthdate}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return 0;
  let age = reference.getFullYear() - birth.getFullYear();
  const beforeBirthday = reference.getMonth() < birth.getMonth() || (reference.getMonth() === birth.getMonth() && reference.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function statusFor(advisorId) {
  return advisorStatuses.find((item) => item.advisorId === advisorId) || { key:'loading',label:'確認中',detail:'受付状況を確認しています' };
}

function statusBadge(status) {
  return `<span class="advisor-status status-${escapeHTML(status.key)}"><i></i>${escapeHTML(status.label)}</span>`;
}

function advisorCardHTML(advisor,compact = false) {
  const status = statusFor(advisor.id);
  const methods = advisor.methods.slice(0,compact ? 2 : 3).map((id) => getMethod(id).name).join('・');
  return `
    <article class="advisor-card ${compact ? 'compact' : ''}" data-advisor-card="${escapeHTML(advisor.id)}">
      <div class="advisor-image-wrap">
        <img src="${escapeHTML(advisorImage(advisor))}" alt="${escapeHTML(advisor.name)}" loading="lazy" width="900" height="600">
        <div class="advisor-image-copy">
          <h3>${escapeHTML(advisor.name)}</h3>
          <div class="advisor-meta"><span>${advisor.age}歳</span><span>${escapeHTML(advisor.gender)}</span><span>${escapeHTML(advisor.nationality)}</span></div>
        </div>
      </div>
      <div class="advisor-card-body">
        <p class="advisor-type">${escapeHTML(advisor.type)}</p>
        ${compact ? '' : `<p class="advisor-specialties">${advisor.specialties.map(escapeHTML).join('・')}</p>`}
        ${compact ? '' : `<p class="advisor-methods">${escapeHTML(methods)}</p>`}
        <div class="advisor-card-status-row">${statusBadge(status)}<small class="advisor-next">${escapeHTML(status.detail || '')}</small></div>
        <button class="button ${status.key === 'busy' ? 'ghost' : 'primary'} advisor-book-button" type="button" data-book-advisor="${escapeHTML(advisor.id)}">空いている時間を見る</button>
      </div>
    </article>`;
}

async function refreshStatuses() {
  advisorStatuses = await getStatuses();
  renderHomeAdvisors();
  if ($('#view-advisors')?.classList.contains('active')) renderAdvisorPage();
}

function renderHomeAdvisors() {
  const root = $('#home-advisor-grid');
  if (!root) return;
  const order = { available:0,busy:1,full:2,off:3,loading:4 };
  const ranked = [...ADVISORS].sort((a,b) => (order[statusFor(a.id).key] ?? 9) - (order[statusFor(b.id).key] ?? 9)).slice(0,4);
  root.innerHTML = ranked.map((advisor) => advisorCardHTML(advisor,true)).join('');
  bindAdvisorButtons(root);
}

function filteredAdvisors() {
  let advisors = [...ADVISORS];
  if (activeFilter === 'available') advisors = advisors.filter((advisor) => statusFor(advisor.id).key === 'available');
  if (activeFilter === '女性' || activeFilter === '男性') advisors = advisors.filter((advisor) => advisor.gender === activeFilter);
  if (activeGenreFilter !== 'all') advisors = advisors.filter((advisor) => advisor.genres.includes(activeGenreFilter));
  if (advisorSort === 'availability') {
    const order = { available:0,busy:1,full:2,off:3,loading:4 };
    advisors.sort((a,b) => (order[statusFor(a.id).key] ?? 9) - (order[statusFor(b.id).key] ?? 9));
  } else if (advisorSort === 'age-asc') advisors.sort((a,b) => a.age - b.age);
  else if (advisorSort === 'age-desc') advisors.sort((a,b) => b.age - a.age);
  return advisors;
}

function renderAdvisorPage() {
  const root = $('#advisor-grid');
  if (!root) return;
  const advisors = filteredAdvisors();
  root.innerHTML = advisors.length ? advisors.map((advisor) => advisorCardHTML(advisor)).join('') : '<div class="history-empty">条件に合う鑑定パートナーが見つかりませんでした。</div>';
  bindAdvisorButtons(root);
  $$('.filter-chip').forEach((chip) => chip.classList.toggle('active',chip.dataset.advisorFilter === activeFilter));
  if ($('#advisor-genre-filter')) $('#advisor-genre-filter').value = activeGenreFilter;
  if ($('#advisor-sort')) $('#advisor-sort').value = advisorSort;
}

function bindAdvisorButtons(root = document) {
  $$('[data-book-advisor]',root).forEach((button) => button.addEventListener('click',() => openBookingModal(button.dataset.bookAdvisor)));
}

function scheduleSummary(advisor) {
  const weekday = ['日','月','火','水','木','金','土'];
  return Object.entries(advisor.schedule).map(([day,windows]) => `${weekday[Number(day)]} ${windows.map((window) => window.join('〜')).join(' / ')}`).join('　');
}

function closeBookingModal() {
  $('#booking-modal')?.remove();
  document.body.classList.remove('modal-open');
}

async function renderModalSlots(advisor,dateKey) {
  const root = $('#modal-slot-list');
  if (!root) return;
  root.innerHTML = '<div class="slot-loading">空いている時間を確認しています…</div>';
  const slots = await getAvailability(advisor.id,dateKey);
  if (!$('#modal-slot-list')) return;
  root.innerHTML = slots.length
    ? slots.map((slot) => `<button class="slot-button" type="button" data-slot-start="${escapeHTML(slot.startAt)}" data-slot-ready="${escapeHTML(slot.readyAt)}" ${slot.available ? '' : 'disabled'}><strong>${escapeHTML(slot.timeKey)}</strong><small>${slot.available ? '予約できます' : '予約済み'}</small></button>`).join('')
    : '<div class="slot-empty">この日の受付時間はありません。</div>';
  $$('[data-slot-start]',root).forEach((button) => button.addEventListener('click',() => {
    selectedAdvisorId = advisor.id;
    selectedSlot = { startAt:button.dataset.slotStart,readyAt:button.dataset.slotReady };
    sessionStorage.setItem(SELECTION_KEY,JSON.stringify({ advisorId:selectedAdvisorId,slot:selectedSlot }));
    closeBookingModal();
    startChat(true);
  }));
}

function openBookingModal(advisorId) {
  const advisor = getAdvisor(advisorId);
  if (!advisor) return;
  closeBookingModal();
  const dates = bookingDates();
  const modal = document.createElement('div');
  modal.id = 'booking-modal';
  modal.className = 'booking-modal';
  modal.innerHTML = `
    <div class="booking-backdrop" data-close-modal></div>
    <section class="booking-dialog" role="dialog" aria-modal="true" aria-labelledby="booking-title">
      <button class="modal-close" type="button" aria-label="閉じる" data-close-modal>×</button>
      <div class="booking-advisor-head">
        <img src="${escapeHTML(advisorImage(advisor))}" alt="" width="180" height="240">
        <div>${statusBadge(statusFor(advisor.id))}<p class="eyebrow">RESERVATION</p><h2 id="booking-title">${escapeHTML(advisor.name)}</h2><p>${escapeHTML(advisor.tagline)}</p><small>${escapeHTML(scheduleSummary(advisor))}</small></div>
      </div>
      <div class="date-tabs">${dates.map((dateKey,index) => `<button class="date-tab ${index === 0 ? 'active' : ''}" type="button" data-booking-date="${dateKey}">${escapeHTML(formatDateLabel(dateKey))}</button>`).join('')}</div>
      <div id="modal-slot-list" class="slot-list"></div>
      <p class="booking-note">空いている時間を選ぶと、チャット相談へ進みます。予約後は約${Math.round(BOOKING_CONFIG.readingDurationSeconds / 60)}分で結果を表示します。</p>
    </section>`;
  document.body.append(modal);
  document.body.classList.add('modal-open');
  $$('[data-close-modal]',modal).forEach((button) => button.addEventListener('click',closeBookingModal));
  $$('[data-booking-date]',modal).forEach((button) => button.addEventListener('click',() => {
    $$('.date-tab',modal).forEach((tab) => tab.classList.toggle('active',tab === button));
    renderModalSlots(advisor,button.dataset.bookingDate);
  }));
  renderModalSlots(advisor,dates[0]);
  $('.modal-close',modal)?.focus();
}

function restoreSelection() {
  try {
    const selection = JSON.parse(sessionStorage.getItem(SELECTION_KEY) || 'null');
    if (selection?.advisorId && selection?.slot) {
      selectedAdvisorId = selection.advisorId;
      selectedSlot = selection.slot;
    }
  } catch {
    selectedAdvisorId = '';
    selectedSlot = null;
  }
}

function emptyChatState() {
  return { step:0,answers:{},messages:[],startedAt:new Date().toISOString() };
}

function saveChatState() {
  if (chatState) sessionStorage.setItem(CHAT_KEY,JSON.stringify(chatState));
}

function loadChatState() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(CHAT_KEY) || 'null');
    if (saved && typeof saved.step === 'number' && saved.answers && Array.isArray(saved.messages)) return saved;
  } catch { /* ignore */ }
  return null;
}

function addChatMessage(role,text) {
  chatState.messages.push({ role,text:String(text),createdAt:new Date().toISOString() });
  saveChatState();
  renderChatMessages();
}

function addTypingMessage() {
  const root = $('#chat-messages');
  if (!root) return null;
  const node = document.createElement('div');
  node.className = 'chat-message agent chat-typing-row';
  node.innerHTML = '<span class="chat-avatar">✦</span><div class="chat-bubble"><span class="chat-typing"><i></i><i></i><i></i></span></div>';
  root.append(node);
  root.scrollTop = root.scrollHeight;
  return node;
}

async function requestAgentReply(stepKey,userMessage,fallback,nextPrompt) {
  if (!APP_CONFIG.agentChatMode || !APP_CONFIG.apiBaseUrl) return `${fallback}\n\n${nextPrompt}`;
  try {
    const response = await fetch(`${APP_CONFIG.apiBaseUrl}/api/chat`,{
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({
        advisorId:selectedAdvisorId,
        step:stepKey,
        userMessage,
        answers:chatState.answers,
        nextQuestion:nextPrompt
      })
    });
    if (!response.ok) throw new Error('chat_failed');
    const data = await response.json();
    if (typeof data.reply !== 'string' || data.reply.length < 3) throw new Error('invalid_reply');
    return data.reply;
  } catch {
    return `${fallback}\n\n${nextPrompt}`;
  }
}

function startChat(reset = false) {
  const advisor = getAdvisor(selectedAdvisorId);
  if (!advisor || !selectedSlot) {
    routeTo('advisors');
    showToast('先に鑑定パートナーと予約時間を選んでください');
    return;
  }
  if (reset) {
    chatState = emptyChatState();
    chatSnapshots = [];
    chatState.messages.push({ role:'agent',text:`${advisor.name}です。ご予約ありがとうございます。`,createdAt:new Date().toISOString() });
    chatState.messages.push({ role:'agent',text:'一度に全部書かなくて大丈夫です。表示する質問に、順番に答えてください。',createdAt:new Date().toISOString() });
    chatState.messages.push({ role:'agent',text:CHAT_STEPS[0].prompt,createdAt:new Date().toISOString() });
    saveChatState();
  } else if (!chatState) {
    chatState = loadChatState() || emptyChatState();
  }
  routeTo('chat');
}

function renderChatHead() {
  const root = $('#chat-advisor-head');
  const advisor = getAdvisor(selectedAdvisorId);
  if (!root || !advisor || !selectedSlot) return;
  root.innerHTML = `
    <img src="${escapeHTML(advisorImage(advisor))}" alt="${escapeHTML(advisor.name)}" width="88" height="88">
    <div><h2 id="chat-title">${escapeHTML(advisor.name)}</h2><p>${escapeHTML(advisor.type)}｜${escapeHTML(advisor.tagline)}</p><small>予約時間：${escapeHTML(formatDateTimeJst(selectedSlot.startAt))}</small></div>
    <button class="mini-button chat-change-button" id="change-chat-reservation" type="button">相手・時間を変更</button>`;
  $('#change-chat-reservation')?.addEventListener('click',() => openBookingModal(selectedAdvisorId));
}

function renderChatMessages() {
  const root = $('#chat-messages');
  if (!root || !chatState) return;
  root.innerHTML = chatState.messages.map((message) => {
    if (message.role === 'system') return `<div class="chat-message system"><div class="chat-bubble">${escapeHTML(message.text)}</div></div>`;
    if (message.role === 'user') return `<div class="chat-message user"><div class="chat-bubble">${escapeHTML(message.text)}</div></div>`;
    return `<div class="chat-message agent"><span class="chat-avatar">✦</span><div class="chat-bubble">${escapeHTML(message.text)}</div></div>`;
  }).join('');
  root.scrollTop = root.scrollHeight;
}

function maxBirthdate() {
  const max = new Date();
  max.setFullYear(max.getFullYear() - 18);
  return localISODate(max);
}

function choiceButtons(choices) {
  return `<div class="chat-choice-list">${choices.map(([value,label]) => `<button class="chat-choice" type="button" data-chat-choice="${escapeHTML(value)}" data-chat-label="${escapeHTML(label)}">${escapeHTML(label)}</button>`).join('')}</div>`;
}

function chatSummaryHTML() {
  const advisor = getAdvisor(selectedAdvisorId);
  const a = chatState.answers;
  return `
    <div class="chat-summary">
      <dl>
        <dt>鑑定パートナー</dt><dd>${escapeHTML(advisor?.name || '')}</dd>
        <dt>予約時間</dt><dd>${escapeHTML(formatDateTimeJst(selectedSlot.startAt))}</dd>
        <dt>呼び名</dt><dd>${escapeHTML(a.nickname || '')}</dd>
        <dt>相談分野</dt><dd>${escapeHTML(CATEGORY_LABELS[a.category] || a.category || '')}</dd>
        <dt>相談内容</dt><dd>${escapeHTML(a.question || '')}</dd>
        <dt>選択肢A</dt><dd>${escapeHTML(a.optionA || '')}</dd>
        <dt>選択肢B</dt><dd>${escapeHTML(a.optionB || '')}</dd>
        <dt>考えたい期間</dt><dd>${escapeHTML(TIMEFRAME_LABELS[a.timeframe] || '')}</dd>
        <dt>迷いの強さ</dt><dd>${escapeHTML(a.tension || '')}/10</dd>
        <dt>占い方法</dt><dd>${escapeHTML(getMethod(a.method).name)}</dd>
      </dl>
    </div>`;
}

function renderChatControls() {
  const root = $('#chat-controls');
  const back = $('#chat-back');
  if (!root || !chatState) return;
  const step = CHAT_STEPS[chatState.step] || CHAT_STEPS.at(-1);
  const progress = Math.min(100,Math.round((chatState.step / (CHAT_STEPS.length - 1)) * 100));
  if ($('#chat-progress-bar')) $('#chat-progress-bar').style.width = `${progress}%`;
  if (back) back.disabled = chatSnapshots.length === 0 || chatBusy;

  if (step.type === 'choice') {
    root.innerHTML = `${choiceButtons(step.choices)}<p class="chat-helper">一つ選んでください。</p>`;
    $$('[data-chat-choice]',root).forEach((button) => button.addEventListener('click',() => handleChatAnswer(button.dataset.chatChoice,button.dataset.chatLabel)));
    return;
  }

  if (step.type === 'method') {
    const advisor = getAdvisor(selectedAdvisorId);
    const choices = advisor.methods.map((id) => [id,`${getMethod(id).name}｜${getMethod(id).short}`]);
    root.innerHTML = `${choiceButtons(choices)}<p class="chat-helper">迷った場合は、一番上の方法で問題ありません。</p>`;
    $$('[data-chat-choice]',root).forEach((button) => button.addEventListener('click',() => handleChatAnswer(button.dataset.chatChoice,button.dataset.chatLabel)));
    return;
  }

  if (step.type === 'confirm') {
    root.innerHTML = `
      <div class="chat-confirm">
        ${chatSummaryHTML()}
        <label class="chat-consent"><input id="chat-adult" type="checkbox"><span>18歳以上であり、この鑑定が悩みを整理するための参考情報であることを確認しました。</span></label>
        <label class="chat-consent"><input id="chat-save-history" type="checkbox"><span>この端末に鑑定履歴を保存する</span></label>
        <div id="chat-confirm-error" class="chat-error" hidden></div>
        <div class="chat-confirm-actions"><button id="chat-confirm-booking" class="button primary" type="button">この内容で予約を確定</button></div>
      </div>`;
    $('#chat-confirm-booking')?.addEventListener('click',submitChatReservation);
    return;
  }

  const inputType = step.type === 'date' ? 'date' : 'text';
  const element = step.type === 'textarea'
    ? `<textarea id="chat-input" class="chat-textarea" rows="4" maxlength="300" placeholder="${escapeHTML(step.placeholder || '')}"></textarea>`
    : `<input id="chat-input" class="${step.type === 'date' ? 'chat-date' : 'chat-input'}" type="${inputType}" ${step.type === 'date' ? `max="${maxBirthdate()}" min="1900-01-01"` : 'maxlength="120"'} placeholder="${escapeHTML(step.placeholder || '')}">`;
  root.innerHTML = `
    <div class="chat-input-row">
      <div class="chat-input-wrap"><label for="chat-input">${escapeHTML(step.label || '回答')}</label>${element}<div id="chat-input-error" class="chat-error" hidden></div></div>
      <button id="chat-send" class="button primary chat-send" type="button">送信</button>
    </div>
    <p class="chat-helper">Enterでも送信できます。長文は改行して構いません。</p>`;
  const input = $('#chat-input');
  const submit = () => handleChatAnswer(input.value,input.value);
  $('#chat-send')?.addEventListener('click',submit);
  input?.addEventListener('keydown',(event) => {
    if (event.key === 'Enter' && !(step.type === 'textarea' && event.shiftKey)) {
      event.preventDefault();
      submit();
    }
  });
  setTimeout(() => input?.focus(),50);
}

function renderChat() {
  if (!selectedAdvisorId || !selectedSlot) {
    restoreSelection();
    if (!selectedAdvisorId || !selectedSlot) { routeTo('advisors'); return; }
  }
  if (!chatState) chatState = loadChatState();
  if (!chatState) {
    startChat(true);
    return;
  }
  renderChatHead();
  renderChatMessages();
  renderChatControls();
}

async function handleChatAnswer(value,label) {
  if (chatBusy || !chatState) return;
  const step = CHAT_STEPS[chatState.step];
  if (!step || step.type === 'confirm') return;
  const cleanValue = String(value ?? '').trim();
  const error = step.validate ? step.validate(cleanValue,chatState.answers) : '';
  if (error) {
    const box = $('#chat-input-error');
    if (box) { box.hidden = false; box.textContent = error; }
    else showToast(error);
    return;
  }

  chatSnapshots.push(JSON.stringify(chatState));
  chatBusy = true;
  renderChatControls();
  addChatMessage('user',label || cleanValue);
  chatState.answers[step.key] = cleanValue;
  chatState.step += 1;
  saveChatState();
  const nextStep = CHAT_STEPS[chatState.step];
  const typing = addTypingMessage();
  const fallback = step.acknowledge ? step.acknowledge(cleanValue) : 'ありがとうございます。';
  const nextPrompt = nextStep?.prompt || '';
  const reply = await requestAgentReply(step.key,cleanValue,fallback,nextPrompt);
  await new Promise((resolve) => setTimeout(resolve,480));
  typing?.remove();
  addChatMessage('agent',reply);
  chatBusy = false;
  renderChatControls();
}

function backChat() {
  if (chatBusy || !chatSnapshots.length) return;
  try {
    chatState = JSON.parse(chatSnapshots.pop());
    saveChatState();
    renderChat();
  } catch { /* ignore */ }
}

function resetChat() {
  if (!window.confirm('チャット内容を消して、最初からやり直しますか？')) return;
  sessionStorage.removeItem(CHAT_KEY);
  startChat(true);
}

function buildReadingInput() {
  const advisor = getAdvisor(selectedAdvisorId);
  const a = chatState.answers;
  return {
    nickname:a.nickname,
    birthdate:a.birthdate,
    category:a.category,
    question:a.question,
    optionA:a.optionA,
    optionB:a.optionB,
    timeframe:a.timeframe,
    tension:Number(a.tension || 5),
    readingDate:toJstParts(new Date(selectedSlot.startAt)).dateKey,
    advisorId:advisor?.id || '',
    advisorName:advisor?.name || '',
    advisorTone:advisor?.tone || 'rational',
    method:a.method || advisor?.methods?.[0] || 'decision',
    bookingStart:selectedSlot.startAt
  };
}

async function submitChatReservation() {
  const errorBox = $('#chat-confirm-error');
  const adult = $('#chat-adult')?.checked;
  if (!adult) {
    if (errorBox) { errorBox.hidden = false; errorBox.textContent = '18歳以上であることと、注意事項の確認が必要です。'; }
    return;
  }
  const input = buildReadingInput();
  if (ageOnDate(input.birthdate) < 18) {
    if (errorBox) { errorBox.hidden = false; errorBox.textContent = 'このサービスは18歳以上の方が利用できます。'; }
    return;
  }
  const result = generateReading(input);
  if (result.safety?.level === 'stop') {
    if (errorBox) { errorBox.hidden = false; errorBox.textContent = result.safety.message; }
    return;
  }
  if (!result.ok) {
    if (errorBox) { errorBox.hidden = false; errorBox.textContent = (result.errors || ['入力内容を確認してください。']).join(' '); }
    return;
  }
  const button = $('#chat-confirm-booking');
  if (button) { button.disabled = true; button.textContent = '予約を確定しています…'; }
  try {
    const booking = await reserveBooking({ advisorId:selectedAdvisorId,startAt:selectedSlot.startAt,readyAt:selectedSlot.readyAt });
    result.booking = { bookingId:booking.bookingId,startAt:booking.startAt,readyAt:booking.readyAt };
    localStorage.setItem(PENDING_KEY,JSON.stringify({ booking,reading:result,saveHistory:Boolean($('#chat-save-history')?.checked) }));
    sessionStorage.removeItem(CHAT_KEY);
    showToast('予約を確定しました');
    renderSession();
  } catch (error) {
    if (String(error.message).includes('slot_taken')) {
      if (errorBox) { errorBox.hidden = false; errorBox.textContent = '選んだ時間が埋まりました。別の時間を選んでください。'; }
      openBookingModal(selectedAdvisorId);
    } else if (errorBox) {
      errorBox.hidden = false;
      errorBox.textContent = '予約に失敗しました。通信状態を確認して、もう一度お試しください。';
    }
  } finally {
    if (button) { button.disabled = false; button.textContent = 'この内容で予約を確定'; }
    refreshStatuses();
  }
}

function meterDescription(value,kind) {
  if (kind === 'reversibility') {
    if (value >= 65) return 'やり直しや変更がしやすい';
    if (value >= 45) return '条件を決めれば試しやすい';
    return '始める前の確認が特に必要';
  }
  if (value >= 75) return '判断材料がかなりそろっている';
  if (value >= 55) return '小さく決めるには十分';
  return '追加の情報確認が必要';
}

function renderResult(reading) {
  clearInterval(sessionTimer);
  activeReading = reading;
  const root = $('#result-root');
  const advisor = getAdvisor(reading.input.advisorId);
  const method = getMethod(reading.input.method);
  const cardLabels = ['今の状況','気をつけたい点','次にやること'];
  const caution = reading.safety.level === 'caution' ? `<div class="result-warning"><strong>${escapeHTML(reading.safety.title)}</strong><br>${escapeHTML(reading.safety.message)}</div>` : '';
  root.innerHTML = `
    <div class="result-oracle-head">
      ${advisor ? `<img src="${escapeHTML(advisorImage(advisor))}" alt="${escapeHTML(advisor.name)}" width="180" height="240">` : ''}
      <div><div class="reading-id">${escapeHTML(reading.readingId)}</div><p class="eyebrow">YOUR READING</p><h1>${escapeHTML(reading.nickname || reading.input.nickname)}さんの鑑定結果</h1><p>${advisor ? `${escapeHTML(advisor.name)}｜${escapeHTML(method.name)}` : ''}</p><strong>${escapeHTML(reading.decision.text)}</strong><p class="result-explain">下の数字は成功率ではありません。今の状況で、どちらから試しやすいかを比べた目安です。</p></div>
    </div>
    ${caution}
    <div class="score-stage">
      <article class="score-choice"><small>Aを試しやすい度</small><h2>${escapeHTML(reading.input.optionA)}</h2><div class="score-number">${reading.scores.a}<span>/100</span></div></article>
      <div class="compass-score" style="--score-a:${reading.scores.a}%"><div><strong>${escapeHTML(reading.decision.text)}</strong><small>成功率ではありません</small></div></div>
      <article class="score-choice"><small>Bを試しやすい度</small><h2>${escapeHTML(reading.input.optionB)}</h2><div class="score-number">${reading.scores.b}<span>/100</span></div></article>
    </div>
    <div class="metric-grid">
      <article class="metric-card"><span>生年月日から出した基礎数</span><strong>${reading.numerology.lifePath}</strong><p>考え方や決め方の基本的な傾向</p></article>
      <article class="metric-card"><span>やり直しやすさ</span><strong>${reading.reversibility}</strong><p>${escapeHTML(meterDescription(reading.reversibility,'reversibility'))}</p></article>
      <article class="metric-card"><span>判断材料のそろい具合</span><strong>${reading.clarity}</strong><p>${escapeHTML(meterDescription(reading.clarity,'clarity'))}</p></article>
    </div>
    <h2 class="cards-title">3枚の象徴カード</h2>
    <div class="archetype-grid">${reading.cards.map((card,index) => `<article class="archetype-card"><div class="position">${cardLabels[index]}</div><div class="glyph">${escapeHTML(card.glyph)}</div><h3>${escapeHTML(card.name)}</h3><p>${escapeHTML(index === 1 ? card.shadow : card.light)}</p><p><strong>行動：</strong>${escapeHTML(card.action)}</p></article>`).join('')}</div>
    <h2 class="narrative-title">今回の読み解き</h2>
    <div class="narrative-grid">
      <article class="narrative-card"><h3>今の状況</h3><p>${escapeHTML(reading.narrative.overview)}</p></article>
      <article class="narrative-card"><h3>見落としやすい点</h3><p>${escapeHTML(reading.narrative.hidden)}</p></article>
      <article class="narrative-card"><h3>動く前の確認</h3><p>${escapeHTML(reading.narrative.timing)}</p></article>
      <article class="narrative-card"><h3>今回のまとめ</h3><p>${escapeHTML(reading.narrative.closing)}</p></article>
    </div>
    <h2 class="plan-title">次の7日間でできること</h2>
    <div class="plan-list">${reading.plan.map((item) => `<article class="plan-item"><div class="plan-day">DAY ${item.day}</div><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.body)}</p></article>`).join('')}</div>
    ${reading.deep ? `<section class="deep-result"><p class="eyebrow">90 DAY DETAIL</p><h2>90日間の詳しい鑑定</h2><div class="narrative-grid"><article class="narrative-card"><h3>Aで起こりやすい問題</h3><p>${escapeHTML(reading.deep.optionAObstacle)}</p></article><article class="narrative-card"><h3>Bで起こりやすい問題</h3><p>${escapeHTML(reading.deep.optionBObstacle)}</p></article><article class="narrative-card"><h3>やめる条件</h3><p>${escapeHTML(reading.deep.exitCondition)}</p></article><article class="narrative-card"><h3>90日後に残したいもの</h3><p>${escapeHTML(reading.deep.ninetyDayFocus)}</p></article></div><div class="deep-weeks">${(reading.deep.weeks || []).map((week) => `<article><span>WEEK ${escapeHTML(week.week)}</span><h3>${escapeHTML(week.title)}</h3><p>${escapeHTML(week.action)}</p></article>`).join('')}</div><div class="narrative-card"><h3>まとめ</h3><p>${escapeHTML(reading.deep.closing)}</p></div></section>` : ''}
    <div class="deep-card"><div><p class="eyebrow">OPTIONAL</p><h2>${escapeHTML(APP_CONFIG.paidProductName)}</h2><p>今回の相談内容と結果をもとに、AとBそれぞれの注意点、やめる条件、4週間の行動案を詳しくまとめます。</p></div><div><div class="deep-price">${escapeHTML(APP_CONFIG.paidPriceLabel)}<small>買い切り・自動表示</small></div><button id="deep-reading-button" class="button primary" type="button" ${reading.deep ? 'disabled' : ''}>${reading.deep ? '詳しい鑑定を表示済み' : (APP_CONFIG.paidMode && APP_CONFIG.operatorReady ? '詳しい鑑定へ進む' : '準備中')}</button></div></div>
    <div class="result-actions"><button class="button ghost" id="share-result" type="button">結果を共有</button><button class="button ghost" id="download-result" type="button">データを保存</button><button class="button ghost" id="print-result" type="button">印刷・PDF保存</button><a class="button primary" href="#advisors" data-route="advisors">別の相談をする</a></div>
    <p class="result-disclaimer">${escapeHTML(reading.disclaimer)}</p>`;
  localStorage.removeItem(PENDING_KEY);
  sessionStorage.removeItem(SELECTION_KEY);
  sessionStorage.removeItem(CHAT_KEY);
  selectedAdvisorId = '';
  selectedSlot = null;
  chatState = null;
  routeTo('result');
  bindResultActions();
  refreshStatuses();
}

async function createPaidCheckout() {
  if (!APP_CONFIG.paidMode || !APP_CONFIG.operatorReady) { showToast('詳しい鑑定は現在準備中です'); return; }
  if (!APP_CONFIG.apiBaseUrl) { showToast('接続設定が完了していません'); return; }
  try {
    sessionStorage.setItem(PAID_PENDING_KEY,JSON.stringify(activeReading));
    const response = await fetch(`${APP_CONFIG.apiBaseUrl}/api/create-checkout`,{ method:'POST',headers:{ 'Content-Type':'application/json' },body:JSON.stringify({ readingId:activeReading.readingId,reading:activeReading }) });
    if (!response.ok) throw new Error('checkout_failed');
    const data = await response.json();
    if (!data.url) throw new Error('checkout_url_missing');
    location.href = data.url;
  } catch { showToast('決済画面を開けませんでした'); }
}

function bindResultActions() {
  $('#share-result')?.addEventListener('click',async () => {
    const advisor = getAdvisor(activeReading?.input?.advisorId);
    const text = `${advisor ? `${advisor.name}の鑑定\n` : ''}${readingToShareText(activeReading)}`;
    try {
      if (navigator.share) await navigator.share({ title:'ORBITA 鑑定結果',text });
      else { await navigator.clipboard.writeText(text); showToast('結果をコピーしました'); }
    } catch { /* cancelled */ }
  });
  $('#download-result')?.addEventListener('click',() => {
    const blob = new Blob([JSON.stringify(activeReading,null,2)],{ type:'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeReading.readingId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });
  $('#print-result')?.addEventListener('click',() => window.print());
  $('#deep-reading-button')?.addEventListener('click',createPaidCheckout);
  $$('[data-route]',$('#result-root')).forEach((link) => link.addEventListener('click',(event) => { event.preventDefault(); routeTo(link.dataset.route); }));
}

function readPendingSession() {
  return readJsonStorage(PENDING_KEY,null);
}

function sessionStage(elapsedSeconds) {
  if (elapsedSeconds < 35) return { index:1,title:'相談内容を整理しています',detail:'悩みと二つの選択肢を読み分けています。' };
  if (elapsedSeconds < 85) return { index:2,title:'AとBを比べています',detail:'それぞれの良い点、心配な点、試しやすさを比べています。' };
  if (elapsedSeconds < 135) return { index:3,title:'占いの結果を重ねています',detail:'生年月日と選んだ占い方法を組み合わせています。' };
  if (elapsedSeconds < 170) return { index:4,title:'次にできる行動をまとめています',detail:'大きな決断ではなく、まず試せる行動に整理しています。' };
  return { index:5,title:'文章を読みやすく整えています',detail:'分かりにくい表現や矛盾がないか確認しています。' };
}

function formatCountdown(milliseconds) {
  const seconds = Math.max(0,Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
}

function renderSession() {
  clearInterval(sessionTimer);
  const pending = readPendingSession();
  if (!pending?.booking || !pending?.reading) { routeTo('advisors'); return; }
  const advisor = getAdvisor(pending.booking.advisorId);
  const root = $('#session-root');
  const update = () => {
    const now = Date.now();
    const starts = new Date(pending.booking.startAt).getTime();
    const ready = new Date(pending.booking.readyAt).getTime();
    if (now >= ready) {
      clearInterval(sessionTimer);
      if (pending.saveHistory) saveReading(pending.reading);
      renderResult(pending.reading);
      return;
    }
    const waiting = now < starts;
    const elapsed = Math.max(0,(now - starts) / 1000);
    const stage = sessionStage(elapsed);
    const remaining = waiting ? starts - now : ready - now;
    root.innerHTML = `
      <div class="session-oracle">
        <div class="session-portrait"><img src="${escapeHTML(advisor ? advisorImage(advisor) : '')}" alt="" width="360" height="480"><span class="live-badge"><i></i>${waiting ? '予約済み' : '鑑定中'}</span></div>
        <div class="session-content"><p class="eyebrow">${waiting ? 'WAITING' : 'READING IN PROGRESS'}</p><h1>${waiting ? `${escapeHTML(formatDateTimeJst(pending.booking.startAt))}から開始します` : `${escapeHTML(advisor?.name || '鑑定パートナー')}が結果をまとめています`}</h1><p>${waiting ? 'この画面を閉じても、同じ端末で再度開けば続きから確認できます。' : escapeHTML(stage.detail)}</p><div class="session-countdown"><strong>${formatCountdown(remaining)}</strong><small>${waiting ? '開始まで' : '結果表示までの目安'}</small></div>
          <div class="reading-stages">${[1,2,3,4,5].map((index) => `<span class="${!waiting && index <= stage.index ? 'active' : ''}">${index}</span>`).join('')}</div>
          <h2>${waiting ? '予約時間までお待ちください' : escapeHTML(stage.title)}</h2>
          <p class="session-note">会話内容と選んだ占い方法をもとに、結果を順番に整理しています。</p>
        </div>
      </div>`;
  };
  update();
  sessionTimer = setInterval(update,1000);
  routeTo('session');
}

function renderHistory() {
  const root = $('#history-root');
  const items = getHistory();
  if (!items.length) root.innerHTML = '<div class="history-empty"><p>保存した鑑定はありません。</p><a class="button primary" href="#advisors" data-route="advisors">相談相手を選ぶ</a></div>';
  else root.innerHTML = `<div class="history-toolbar"><button class="mini-button danger-button" id="clear-history" type="button">すべて削除</button></div><div class="history-list">${items.map((reading) => { const advisor = getAdvisor(reading.input.advisorId); return `<article class="history-item"><div><h2>${escapeHTML(reading.input.optionA)} / ${escapeHTML(reading.input.optionB)}</h2><p>${advisor ? `${escapeHTML(advisor.name)}・` : ''}${escapeHTML(reading.decision.text)}</p></div><div class="history-item-actions"><button class="mini-button" data-open-reading="${escapeHTML(reading.readingId)}" type="button">開く</button><button class="mini-button danger-button" data-delete-reading="${escapeHTML(reading.readingId)}" type="button">削除</button></div></article>`; }).join('')}</div>`;
  $('#clear-history')?.addEventListener('click',clearHistory);
  $$('[data-open-reading]',root).forEach((button) => button.addEventListener('click',() => { const reading = getHistory().find((item) => item.readingId === button.dataset.openReading); if (reading) renderResult(reading); }));
  $$('[data-delete-reading]',root).forEach((button) => button.addEventListener('click',() => deleteReading(button.dataset.deleteReading)));
  $$('[data-route]',root).forEach((link) => link.addEventListener('click',(event) => { event.preventDefault(); routeTo(link.dataset.route); }));
}

function showHowItWorks() {
  routeTo('about');
  showToast('4つの手順で利用できます');
}

function bindGlobalEvents() {
  $$('[data-route]').forEach((link) => link.addEventListener('click',(event) => { event.preventDefault(); routeTo(link.dataset.route); }));
  $('.menu-toggle')?.addEventListener('click',() => {
    const nav = $('.site-nav');
    const open = nav.classList.toggle('open');
    $('.menu-toggle').setAttribute('aria-expanded',String(open));
  });
  $('#sample-reading')?.addEventListener('click',showHowItWorks);
  $$('.filter-chip').forEach((chip) => chip.addEventListener('click',() => { activeFilter = chip.dataset.advisorFilter; renderAdvisorPage(); }));
  $('#advisor-genre-filter')?.addEventListener('change',(event) => { activeGenreFilter = event.target.value; renderAdvisorPage(); });
  $('#advisor-sort')?.addEventListener('change',(event) => { advisorSort = event.target.value; renderAdvisorPage(); });
  $('#chat-back')?.addEventListener('click',backChat);
  $('#chat-reset')?.addEventListener('click',resetChat);
  window.addEventListener('hashchange',() => routeTo(location.hash.replace('#','') || 'home',false));
  window.addEventListener('beforeinstallprompt',(event) => { event.preventDefault(); deferredInstallPrompt = event; const install = $('#install-app'); if (install) install.hidden = false; });
  $('#install-app')?.addEventListener('click',async () => { if (!deferredInstallPrompt) return; deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; $('#install-app').hidden = true; });
  window.addEventListener('appinstalled',() => { deferredInstallPrompt = null; const install = $('#install-app'); if (install) install.hidden = true; showToast('ORBITAをインストールしました'); });
}

async function handleCheckoutReturn() {
  const params = new URLSearchParams(location.search);
  const sessionId = params.get('session_id');
  if (!sessionId || !APP_CONFIG.apiBaseUrl) return;
  try {
    const response = await fetch(`${APP_CONFIG.apiBaseUrl}/api/payment-status?session_id=${encodeURIComponent(sessionId)}`);
    if (!response.ok) throw new Error('payment_check_failed');
    const data = await response.json();
    const pending = JSON.parse(sessionStorage.getItem(PAID_PENDING_KEY) || 'null');
    if (!data.paid || !pending || data.readingId !== pending.readingId) throw new Error('reading_mismatch');
    const deepResponse = await fetch(`${APP_CONFIG.apiBaseUrl}/api/deep-reading`,{ method:'POST',headers:{ 'Content-Type':'application/json' },body:JSON.stringify({ sessionId,reading:pending }) });
    if (!deepResponse.ok) throw new Error('deep_reading_failed');
    const deepData = await deepResponse.json();
    pending.deep = deepData.deep;
    pending.deep.createdAt = new Date().toISOString();
    renderResult(pending);
    sessionStorage.removeItem(PAID_PENDING_KEY);
    showToast('詳しい鑑定を表示しました');
  } catch { showToast('決済の確認に失敗しました。運営者へお問い合わせください'); }
  finally { history.replaceState(null,'',`${location.pathname}#result`); }
}

async function init() {
  restoreSelection();
  chatState = loadChatState();
  bindGlobalEvents();
  await refreshStatuses();
  const pending = readPendingSession();
  if (pending) renderSession();
  else {
    const route = location.hash.replace('#','') || 'home';
    if (route === 'chat' && (!selectedAdvisorId || !selectedSlot)) routeTo('advisors',false);
    else routeTo(route,false);
  }
  handleCheckoutReturn();
  statusTimer = setInterval(refreshStatuses,30000);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
}

init();
