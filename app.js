import { APP_CONFIG } from './config.js';
import { ADVISORS, getAdvisor, getMethod } from './advisors.js';
import { BOOKING_CONFIG, formatDateLabel, formatDateTimeJst, toJstParts } from './booking-core.js';
import { bookingDates, getAvailability, getStatuses, reserveBooking } from './booking-service.js';
import { generateReading, readingToShareText } from './engine.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const HISTORY_KEY = 'orbita_readings_v2';
const PENDING_KEY = 'orbita_pending_session_v2';
const SELECTION_KEY = 'orbita_booking_selection_v2';
const PAID_PENDING_KEY = 'orbita_pending_paid_reading_v1';

let activeReading = null;
let advisorStatuses = [];
let selectedAdvisorId = '';
let selectedSlot = null;
let activeFilter = 'all';
let toastTimer = null;
let deferredInstallPrompt = null;
let statusTimer = null;
let sessionTimer = null;

function localISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function routeTo(route, pushHash = true) {
  const target = document.querySelector(`[data-view="${route}"]`) || $('[data-view="home"]');
  $$('.view').forEach((view) => view.classList.toggle('active', view === target));
  if (pushHash && location.hash !== `#${route}`) history.pushState(null, '', `#${route}`);
  $('.site-nav')?.classList.remove('open');
  $('.menu-toggle')?.setAttribute('aria-expanded', 'false');
  if (route === 'history') renderHistory();
  if (route === 'advisors') renderAdvisorPage();
  if (route === 'reading') prepareReadingView();
  window.scrollTo({ top:0, behavior:'smooth' });
  setTimeout(() => $('#app')?.focus({ preventScroll:true }), 50);
}

function readJsonStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function getHistory() {
  const parsed = readJsonStorage(HISTORY_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveReading(reading) {
  const items = getHistory().filter((item) => item.readingId !== reading.readingId);
  items.unshift(reading);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, APP_CONFIG.historyLimit)));
}

function deleteReading(readingId) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(getHistory().filter((item) => item.readingId !== readingId)));
  renderHistory();
  showToast('履歴を削除しました');
}

function clearHistory() {
  if (!window.confirm('この端末に保存された鑑定履歴をすべて削除しますか？')) return;
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  showToast('すべての履歴を削除しました');
}

function ageOnDate(birthdate, reference = new Date()) {
  const birth = new Date(`${birthdate}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return 0;
  let age = reference.getFullYear() - birth.getFullYear();
  const beforeBirthday = reference.getMonth() < birth.getMonth() || (reference.getMonth() === birth.getMonth() && reference.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function statusFor(advisorId) {
  return advisorStatuses.find((item) => item.advisorId === advisorId) || { key:'loading', label:'確認中', detail:'受付状況を取得中' };
}

function statusBadge(status) {
  return `<span class="advisor-status status-${escapeHTML(status.key)}"><i></i>${escapeHTML(status.label)}</span>`;
}

function advisorCardHTML(advisor, compact = false) {
  const status = statusFor(advisor.id);
  const methods = advisor.methods.slice(0, compact ? 2 : 3).map((id) => getMethod(id).name).join('・');
  return `
    <article class="advisor-card ${compact ? 'compact' : ''}" data-advisor-card="${escapeHTML(advisor.id)}">
      <div class="advisor-image-wrap">
        <img src="${escapeHTML(advisor.image)}" alt="${escapeHTML(advisor.name)}のイメージ" loading="lazy" width="720" height="960">
        ${statusBadge(status)}
      </div>
      <div class="advisor-card-body">
        <div class="advisor-meta"><span>${advisor.age}歳</span><span>${escapeHTML(advisor.gender)}</span><span>${escapeHTML(advisor.nationality)}</span></div>
        <h3>${escapeHTML(advisor.name)}</h3>
        <p class="advisor-type">${escapeHTML(advisor.type)}</p>
        ${compact ? '' : `<p class="advisor-tagline">${escapeHTML(advisor.tagline)}</p>`}
        <div class="advisor-tags">${advisor.specialties.map((item) => `<span>${escapeHTML(item)}</span>`).join('')}</div>
        ${compact ? '' : `<p class="advisor-methods">${escapeHTML(methods)}</p>`}
        <button class="button ${status.key === 'busy' ? 'ghost' : 'primary'} advisor-book-button" type="button" data-book-advisor="${escapeHTML(advisor.id)}">${status.key === 'busy' ? '次の空き枠を見る' : '予約枠を見る'}</button>
        <small class="advisor-next">${escapeHTML(status.detail || '')}${status.demo ? '・端末内デモ' : ''}</small>
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
  const ranked = [...ADVISORS].sort((a,b) => {
    const order = { available:0, busy:1, full:2, off:3, loading:4 };
    return (order[statusFor(a.id).key] ?? 9) - (order[statusFor(b.id).key] ?? 9);
  }).slice(0,4);
  root.innerHTML = ranked.map((advisor) => advisorCardHTML(advisor,true)).join('');
  bindAdvisorButtons(root);
}

function filteredAdvisors() {
  if (activeFilter === 'all') return ADVISORS;
  if (activeFilter === 'available') return ADVISORS.filter((advisor) => statusFor(advisor.id).key === 'available');
  if (activeFilter === '女性' || activeFilter === '男性') return ADVISORS.filter((advisor) => advisor.gender === activeFilter);
  return ADVISORS.filter((advisor) => advisor.genres.includes(activeFilter));
}

function renderAdvisorPage() {
  const root = $('#advisor-grid');
  if (!root) return;
  const advisors = filteredAdvisors();
  root.innerHTML = advisors.length ? advisors.map((advisor) => advisorCardHTML(advisor)).join('') : '<div class="history-empty">該当する鑑定者はいません。</div>';
  bindAdvisorButtons(root);
  $$('.filter-chip').forEach((chip) => chip.classList.toggle('active', chip.dataset.advisorFilter === activeFilter));
}

function bindAdvisorButtons(root = document) {
  $$('[data-book-advisor]', root).forEach((button) => button.addEventListener('click', () => openBookingModal(button.dataset.bookAdvisor)));
}

function scheduleSummary(advisor) {
  const weekday = ['日','月','火','水','木','金','土'];
  return Object.entries(advisor.schedule).map(([day,windows]) => `${weekday[Number(day)]} ${windows.map((window) => window.join('–')).join(' / ')}`).join('　');
}

function closeBookingModal() {
  $('#booking-modal')?.remove();
  document.body.classList.remove('modal-open');
}

async function renderModalSlots(advisor, dateKey) {
  const root = $('#modal-slot-list');
  if (!root) return;
  root.innerHTML = '<div class="slot-loading">空き枠を確認しています…</div>';
  const slots = await getAvailability(advisor.id,dateKey);
  if (!$('#modal-slot-list')) return;
  root.innerHTML = slots.length
    ? slots.map((slot) => `<button class="slot-button" type="button" data-slot-start="${escapeHTML(slot.startAt)}" data-slot-ready="${escapeHTML(slot.readyAt)}" ${slot.available ? '' : 'disabled'}><strong>${escapeHTML(slot.timeKey)}</strong><small>${slot.available ? '予約可' : '予約済み'}</small></button>`).join('')
    : '<div class="slot-empty">この日の受付枠はありません。</div>';
  $$('[data-slot-start]',root).forEach((button) => button.addEventListener('click', () => {
    selectedAdvisorId = advisor.id;
    selectedSlot = { startAt:button.dataset.slotStart, readyAt:button.dataset.slotReady };
    sessionStorage.setItem(SELECTION_KEY, JSON.stringify({ advisorId:selectedAdvisorId, slot:selectedSlot }));
    closeBookingModal();
    routeTo('reading');
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
        <img src="${escapeHTML(advisor.image)}" alt="" width="180" height="240">
        <div>${statusBadge(statusFor(advisor.id))}<p class="eyebrow">RESERVATION</p><h2 id="booking-title">${escapeHTML(advisor.name)}</h2><p>${escapeHTML(advisor.tagline)}</p><small>${escapeHTML(scheduleSummary(advisor))}</small></div>
      </div>
      <div class="date-tabs">${dates.map((dateKey,index) => `<button class="date-tab ${index === 0 ? 'active' : ''}" type="button" data-booking-date="${dateKey}">${escapeHTML(formatDateLabel(dateKey))}</button>`).join('')}</div>
      <div id="modal-slot-list" class="slot-list"></div>
      <p class="booking-note">各枠は1名限定です。予約時刻から約${Math.round(BOOKING_CONFIG.readingDurationSeconds / 60)}分後に結果を表示します。相談内容は予約サーバーへ保存しません。</p>
    </section>`;
  document.body.append(modal);
  document.body.classList.add('modal-open');
  $$('[data-close-modal]',modal).forEach((button) => button.addEventListener('click',closeBookingModal));
  $$('[data-booking-date]',modal).forEach((button) => button.addEventListener('click', () => {
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

function prepareReadingView() {
  const advisor = getAdvisor(selectedAdvisorId);
  const card = $('#selected-advisor-card');
  const form = $('#reading-form');
  if (!card || !form) return;
  if (!advisor || !selectedSlot) {
    card.innerHTML = '<div class="selection-missing"><p>鑑定者と予約日時がまだ選択されていません。</p><button class="button primary" type="button" data-go-advisors>鑑定者を選ぶ</button></div>';
    form.elements.advisorId.value = '';
    form.elements.slotStart.value = '';
    $('#method-select').innerHTML = '<option>先に鑑定者を選択してください</option>';
    $('#selected-slot-label').textContent = '未選択';
    $('[data-go-advisors]')?.addEventListener('click', () => routeTo('advisors'));
    return;
  }
  const status = statusFor(advisor.id);
  card.innerHTML = `<img src="${escapeHTML(advisor.image)}" alt="" width="120" height="160"><div>${statusBadge(status)}<h3>${escapeHTML(advisor.name)}</h3><p>${escapeHTML(advisor.type)}・${advisor.age}歳・${escapeHTML(advisor.nationality)}</p><small>${escapeHTML(advisor.tagline)}</small></div>`;
  form.elements.advisorId.value = advisor.id;
  form.elements.slotStart.value = selectedSlot.startAt;
  $('#selected-slot-label').textContent = formatDateTimeJst(selectedSlot.startAt);
  const select = $('#method-select');
  select.innerHTML = advisor.methods.map((methodId) => {
    const method = getMethod(methodId);
    return `<option value="${escapeHTML(method.id)}">${escapeHTML(method.name)}｜${escapeHTML(method.short)}</option>`;
  }).join('');
  updateFormProgress();
  maybeFillSampleForm();
}

function formDataToInput(form) {
  const data = new FormData(form);
  const advisor = getAdvisor(data.get('advisorId'));
  return {
    nickname:data.get('nickname'), birthdate:data.get('birthdate'), category:data.get('category'), question:data.get('question'),
    optionA:data.get('optionA'), optionB:data.get('optionB'), timeframe:data.get('timeframe'), tension:data.get('tension'),
    readingDate:data.get('slotStart') ? toJstParts(new Date(data.get('slotStart'))).dateKey : localISODate(), advisorId:advisor?.id || '', advisorName:advisor?.name || '', advisorTone:advisor?.tone || 'rational',
    method:data.get('method'), bookingStart:data.get('slotStart')
  };
}

function showErrors(messages) {
  const box = $('#form-errors');
  if (!messages.length) { box.hidden = true; box.textContent = ''; return; }
  box.hidden = false;
  box.innerHTML = `<strong>入力内容をご確認ください。</strong><ul>${messages.map((message) => `<li>${escapeHTML(message)}</li>`).join('')}</ul>`;
  box.scrollIntoView({ behavior:'smooth', block:'center' });
}

function meterDescription(value, kind) {
  if (kind === 'reversibility') {
    if (value >= 65) return '戻りながら試せる余地が大きい';
    if (value >= 45) return '条件を決めれば小さく試せる';
    return '実行前の確認と撤退条件が重要';
  }
  if (value >= 75) return '方向の輪郭が比較的はっきりしている';
  if (value >= 55) return '仮決定に十分な材料がある';
  return '追加の事実確認が必要';
}

function renderResult(reading) {
  clearInterval(sessionTimer);
  activeReading = reading;
  const root = $('#result-root');
  const advisor = getAdvisor(reading.input.advisorId);
  const method = getMethod(reading.input.method);
  const cardLabels = ['現在の中心','見落としやすい点','次の一歩'];
  const caution = reading.safety.level === 'caution' ? `<div class="result-warning"><strong>${escapeHTML(reading.safety.title)}</strong><br>${escapeHTML(reading.safety.message)}</div>` : '';
  root.innerHTML = `
    <div class="result-oracle-head">
      ${advisor ? `<img src="${escapeHTML(advisor.image)}" alt="${escapeHTML(advisor.name)}のイメージ" width="180" height="240">` : ''}
      <div><div class="reading-id">${escapeHTML(reading.readingId)}</div><p class="eyebrow">YOUR RESERVED ORBIT</p><h1>${escapeHTML(reading.nickname || reading.input.nickname)}さんの選択の星図</h1><p>${advisor ? `${escapeHTML(advisor.name)}・${escapeHTML(method.name)}による鑑定` : ''}</p><strong>${escapeHTML(reading.decision.text)}</strong></div>
    </div>
    ${caution}
    <div class="score-stage">
      <article class="score-choice"><small>OPTION A</small><h2>${escapeHTML(reading.input.optionA)}</h2><div class="score-number">${reading.scores.a}<span>/100</span></div></article>
      <div class="compass-score" style="--score-a:${reading.scores.a}%"><div><strong>${escapeHTML(reading.decision.text)}</strong><small>共鳴度は成功確率ではありません</small></div></div>
      <article class="score-choice"><small>OPTION B</small><h2>${escapeHTML(reading.input.optionB)}</h2><div class="score-number">${reading.scores.b}<span>/100</span></div></article>
    </div>
    <div class="metric-grid">
      <article class="metric-card"><span>数の基調</span><strong>${reading.numerology.lifePath}</strong><p>長期的な判断傾向を示す基礎数</p></article>
      <article class="metric-card"><span>可逆性指数</span><strong>${reading.reversibility}</strong><p>${escapeHTML(meterDescription(reading.reversibility,'reversibility'))}</p></article>
      <article class="metric-card"><span>輪郭指数</span><strong>${reading.clarity}</strong><p>${escapeHTML(meterDescription(reading.clarity,'clarity'))}</p></article>
    </div>
    <h2 class="cards-title">三枚の象徴札</h2>
    <div class="archetype-grid">${reading.cards.map((card,index) => `<article class="archetype-card"><div class="position">${cardLabels[index]}</div><div class="glyph">${escapeHTML(card.glyph)}</div><h3>${escapeHTML(card.name)}</h3><p>${escapeHTML(index === 1 ? card.shadow : card.light)}</p><p><strong>行動：</strong>${escapeHTML(card.action)}</p></article>`).join('')}</div>
    <h2 class="narrative-title">${advisor ? `${escapeHTML(advisor.name)}の読み解き` : '星図の読み解き'}</h2>
    <div class="narrative-grid">
      <article class="narrative-card"><h3>全体の流れ</h3><p>${escapeHTML(reading.narrative.overview)}</p></article>
      <article class="narrative-card"><h3>隠れた論点</h3><p>${escapeHTML(reading.narrative.hidden)}</p></article>
      <article class="narrative-card"><h3>動く大きさ</h3><p>${escapeHTML(reading.narrative.timing)}</p></article>
      <article class="narrative-card"><h3>今回の結び</h3><p>${escapeHTML(reading.narrative.closing)}</p></article>
    </div>
    <h2 class="plan-title">7日間の小さな実験</h2>
    <div class="plan-list">${reading.plan.map((item) => `<article class="plan-item"><div class="plan-day">DAY ${item.day}</div><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.body)}</p></article>`).join('')}</div>
    ${reading.deep ? `<section class="deep-result"><p class="eyebrow">DEEP ORBIT / 90 DAYS</p><h2>90日深層星路</h2><div class="narrative-grid"><article class="narrative-card"><h3>Aの障害</h3><p>${escapeHTML(reading.deep.optionAObstacle)}</p></article><article class="narrative-card"><h3>Bの障害</h3><p>${escapeHTML(reading.deep.optionBObstacle)}</p></article><article class="narrative-card"><h3>撤退条件</h3><p>${escapeHTML(reading.deep.exitCondition)}</p></article><article class="narrative-card"><h3>90日後に残すもの</h3><p>${escapeHTML(reading.deep.ninetyDayFocus)}</p></article></div><div class="deep-weeks">${(reading.deep.weeks || []).map((week) => `<article><span>WEEK ${escapeHTML(week.week)}</span><h3>${escapeHTML(week.title)}</h3><p>${escapeHTML(week.action)}</p></article>`).join('')}</div><div class="narrative-card"><h3>深層鑑定の結び</h3><p>${escapeHTML(reading.deep.closing)}</p></div></section>` : ''}
    <div class="deep-card"><div><p class="eyebrow">DEEP ORBIT / OPTIONAL</p><h2>${escapeHTML(APP_CONFIG.paidProductName)}</h2><p>無料鑑定を基礎に、90日間の流れ、A・Bそれぞれの障害、撤退条件、週単位の行動案をAIで個別生成する拡張機能です。</p></div><div><div class="deep-price">${escapeHTML(APP_CONFIG.paidPriceLabel)}<small>買い切り・自動納品</small></div><button id="deep-reading-button" class="button primary" type="button" ${reading.deep ? 'disabled' : ''}>${reading.deep ? '深層鑑定済み' : (APP_CONFIG.paidMode && APP_CONFIG.operatorReady ? '深層鑑定へ進む' : '運営設定後に開放')}</button></div></div>
    <div class="result-actions"><button class="button ghost" id="share-result" type="button">結果を共有</button><button class="button ghost" id="download-result" type="button">JSON保存</button><button class="button ghost" id="print-result" type="button">印刷・PDF保存</button><a class="button primary" href="#advisors" data-route="advisors">別の鑑定を予約</a></div>
    <p class="result-disclaimer">${escapeHTML(reading.disclaimer)}</p>`;
  localStorage.removeItem(PENDING_KEY);
  sessionStorage.removeItem(SELECTION_KEY);
  selectedAdvisorId = '';
  selectedSlot = null;
  routeTo('result');
  bindResultActions();
  refreshStatuses();
}

async function createPaidCheckout() {
  if (!APP_CONFIG.paidMode || !APP_CONFIG.operatorReady) { showToast('有料機能は運営者情報と決済設定後に開放されます'); return; }
  if (!APP_CONFIG.apiBaseUrl) { showToast('API接続先が設定されていません'); return; }
  try {
    sessionStorage.setItem(PAID_PENDING_KEY,JSON.stringify(activeReading));
    const response = await fetch(`${APP_CONFIG.apiBaseUrl}/api/create-checkout`,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ readingId:activeReading.readingId, reading:activeReading }) });
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
      if (navigator.share) await navigator.share({ title:'ORBITA 選択の星図', text });
      else { await navigator.clipboard.writeText(text); showToast('結果をコピーしました'); }
    } catch { /* cancelled */ }
  });
  $('#download-result')?.addEventListener('click',() => {
    const blob = new Blob([JSON.stringify(activeReading,null,2)],{ type:'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `${activeReading.readingId}.json`; link.click(); URL.revokeObjectURL(url);
  });
  $('#print-result')?.addEventListener('click',() => window.print());
  $('#deep-reading-button')?.addEventListener('click',createPaidCheckout);
  $$('[data-route]',$('#result-root')).forEach((link) => link.addEventListener('click',(event) => { event.preventDefault(); routeTo(link.dataset.route); }));
}

function readPendingSession() {
  return readJsonStorage(PENDING_KEY,null);
}

function sessionStage(elapsedSeconds) {
  if (elapsedSeconds < 35) return { index:1, title:'相談内容を静かに読み解いています', detail:'言葉の繰り返しと、二つの選択肢の違いを確認しています。' };
  if (elapsedSeconds < 85) return { index:2, title:'占術の配置を整えています', detail:'選択した占術と生年月日の基調を重ねています。' };
  if (elapsedSeconds < 135) return { index:3, title:'象徴と時期を照合しています', detail:'三枚の象徴札と、今動ける大きさを確かめています。' };
  if (elapsedSeconds < 170) return { index:4, title:'鑑定文をまとめています', detail:'断定を避けながら、行動へつながる言葉へ整えています。' };
  return { index:5, title:'最終確認をしています', detail:'矛盾や危険な表現がないか確認しています。' };
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
        <div class="session-portrait"><img src="${escapeHTML(advisor?.image || '')}" alt="" width="360" height="480"><span class="live-badge"><i></i>${waiting ? '予約済み' : '占い中'}</span></div>
        <div class="session-content"><p class="eyebrow">${waiting ? 'WAITING FOR YOUR SLOT' : 'READING IN PROGRESS'}</p><h1>${waiting ? `${escapeHTML(formatDateTimeJst(pending.booking.startAt))}から鑑定開始` : `${escapeHTML(advisor?.name || '鑑定者')}が星図を整えています`}</h1><p>${waiting ? 'この画面を閉じても、同じ端末で再度開けば続きから確認できます。' : escapeHTML(stage.detail)}</p><div class="session-countdown"><strong>${formatCountdown(remaining)}</strong><small>${waiting ? '鑑定開始まで' : '結果表示までの目安'}</small></div>
          <div class="reading-stages">${[1,2,3,4,5].map((index) => `<span class="${!waiting && index <= stage.index ? 'active' : ''}">${index}</span>`).join('')}</div>
          <h2>${waiting ? '予約枠を確保しました' : escapeHTML(stage.title)}</h2>
          <p class="fiction-note">実在人物がリアルタイムで操作している表示ではなく、選択したAI鑑定人格が結果を構成する待機演出です。</p>
        </div>
      </div>`;
  };
  update();
  sessionTimer = setInterval(update,1000);
  routeTo('session');
}

async function submitReservation(form) {
  const errors = [];
  if (!form.elements.adult.checked) errors.push('18歳以上であることと注意事項への同意が必要です。');
  const input = formDataToInput(form);
  if (input.birthdate && ageOnDate(input.birthdate) < 18) errors.push('本サービスは18歳以上の方を対象としています。');
  if (!selectedAdvisorId || !selectedSlot) errors.push('鑑定者と予約日時を選択してください。');
  const result = generateReading(input);
  if (result.errors) errors.push(...result.errors);
  if (result.safety?.level === 'stop') { showErrors([result.safety.message]); return; }
  showErrors([...new Set(errors)]);
  if (errors.length || !result.ok) return;

  const submitButton = $('.submit-button',form);
  submitButton.disabled = true;
  submitButton.querySelector('span').textContent = '予約枠を確保しています';
  try {
    const booking = await reserveBooking({ advisorId:selectedAdvisorId, startAt:selectedSlot.startAt, readyAt:selectedSlot.readyAt });
    result.booking = { bookingId:booking.bookingId, startAt:booking.startAt, readyAt:booking.readyAt };
    localStorage.setItem(PENDING_KEY,JSON.stringify({ booking, reading:result, saveHistory:form.elements.saveHistory.checked }));
    showToast('予約を確定しました');
    renderSession();
  } catch (error) {
    if (String(error.message).includes('slot_taken')) {
      showErrors(['直前に同じ予約枠が埋まりました。別の日時を選択してください。']);
      openBookingModal(selectedAdvisorId);
    } else showErrors(['予約処理に失敗しました。通信状態を確認して再度お試しください。']);
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector('span').textContent = 'この内容で予約を確定';
    refreshStatuses();
  }
}

function renderHistory() {
  const root = $('#history-root');
  const items = getHistory();
  if (!items.length) root.innerHTML = '<div class="history-empty"><p>保存された鑑定はありません。</p><a class="button primary" href="#advisors" data-route="advisors">鑑定者を選ぶ</a></div>';
  else root.innerHTML = `<div class="history-toolbar"><button class="mini-button danger-button" id="clear-history" type="button">すべて削除</button></div><div class="history-list">${items.map((reading) => { const advisor = getAdvisor(reading.input.advisorId); return `<article class="history-item"><div><h2>${escapeHTML(reading.input.optionA)} / ${escapeHTML(reading.input.optionB)}</h2><p>${advisor ? `${escapeHTML(advisor.name)}・` : ''}${escapeHTML(reading.readingId)}・${escapeHTML(reading.decision.text)}</p></div><div class="history-item-actions"><button class="mini-button" data-open-reading="${escapeHTML(reading.readingId)}" type="button">開く</button><button class="mini-button danger-button" data-delete-reading="${escapeHTML(reading.readingId)}" type="button">削除</button></div></article>`; }).join('')}</div>`;
  $('#clear-history')?.addEventListener('click',clearHistory);
  $$('[data-open-reading]',root).forEach((button) => button.addEventListener('click',() => { const reading = getHistory().find((item) => item.readingId === button.dataset.openReading); if (reading) renderResult(reading); }));
  $$('[data-delete-reading]',root).forEach((button) => button.addEventListener('click',() => deleteReading(button.dataset.deleteReading)));
  $$('[data-route]',root).forEach((link) => link.addEventListener('click',(event) => { event.preventDefault(); routeTo(link.dataset.route); }));
}

function updateFormProgress() {
  const form = $('#reading-form');
  if (!form) return;
  const fields = ['advisorId','slotStart','nickname','birthdate','question','optionA','optionB'];
  const complete = fields.filter((name) => String(form.elements[name]?.value || '').trim()).length;
  const consent = form.elements.adult.checked ? 1 : 0;
  $('#progress-bar').style.width = `${10 + ((complete + consent) / 8) * 90}%`;
}

function fillSample() {
  routeTo('advisors');
  showToast('鑑定者と空き枠を選んだ後、見本内容を入力できます');
  sessionStorage.setItem('orbita_fill_sample_after_selection','1');
}

function maybeFillSampleForm() {
  if (sessionStorage.getItem('orbita_fill_sample_after_selection') !== '1' || !selectedAdvisorId || !selectedSlot) return;
  sessionStorage.removeItem('orbita_fill_sample_after_selection');
  const form = $('#reading-form');
  form.elements.nickname.value = 'ミナ'; form.elements.birthdate.value = '1990-01-23'; form.elements.category.value = 'work';
  form.elements.question.value = '現在の仕事を続けるか、新しい環境へ移るか迷っています。';
  form.elements.optionA.value = '現在の仕事を続ける'; form.elements.optionB.value = '新しい仕事へ移る';
  form.elements.timeframe.value = '3months'; form.elements.tension.value = '7'; form.elements.adult.checked = true;
  $('#tension-output').value = '7'; $('[data-count-for="question"]').textContent = String(form.elements.question.value.length);
  updateFormProgress(); showToast('見本データを入力しました');
}

function bindGlobalEvents() {
  $$('[data-route]').forEach((link) => link.addEventListener('click',(event) => { event.preventDefault(); routeTo(link.dataset.route); }));
  $('.menu-toggle')?.addEventListener('click',() => { const nav = $('.site-nav'); const open = nav.classList.toggle('open'); $('.menu-toggle').setAttribute('aria-expanded',String(open)); });
  $('#sample-reading')?.addEventListener('click',fillSample);
  $('#change-reservation')?.addEventListener('click',() => selectedAdvisorId ? openBookingModal(selectedAdvisorId) : routeTo('advisors'));
  $$('.filter-chip').forEach((chip) => chip.addEventListener('click',() => { activeFilter = chip.dataset.advisorFilter; renderAdvisorPage(); }));
  const form = $('#reading-form');
  form?.addEventListener('input',(event) => {
    if (event.target.name === 'tension') $('#tension-output').value = event.target.value;
    if (event.target.name === 'question') $('[data-count-for="question"]').textContent = String(event.target.value.length);
    updateFormProgress();
  });
  form?.addEventListener('submit',(event) => { event.preventDefault(); submitReservation(form); });
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
    const deepResponse = await fetch(`${APP_CONFIG.apiBaseUrl}/api/deep-reading`,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ sessionId, reading:pending }) });
    if (!deepResponse.ok) throw new Error('deep_reading_failed');
    const deepData = await deepResponse.json(); pending.deep = deepData.deep; pending.deep.createdAt = new Date().toISOString(); renderResult(pending); sessionStorage.removeItem(PAID_PENDING_KEY); showToast('深層鑑定を生成しました');
  } catch { showToast('決済確認に失敗しました。運営者へお問い合わせください'); }
  finally { history.replaceState(null,'',`${location.pathname}#result`); }
}

async function init() {
  const birthInput = $('#reading-form input[name="birthdate"]');
  if (birthInput) { const max = new Date(); max.setFullYear(max.getFullYear() - 18); birthInput.max = localISODate(max); birthInput.min = '1900-01-01'; }
  restoreSelection();
  bindGlobalEvents();
  await refreshStatuses();
  updateFormProgress();
  const pending = readPendingSession();
  if (pending) renderSession();
  else routeTo(location.hash.replace('#','') || 'home',false);
  prepareReadingView(); maybeFillSampleForm();
  handleCheckoutReturn();
  statusTimer = setInterval(refreshStatuses,30000);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
}

init();
