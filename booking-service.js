import { APP_CONFIG } from './config.js';
import { ADVISORS, getAdvisor } from './advisors.js';
import { BOOKING_CONFIG, advisorStatus, createSlots, dateKeyAfter, toJstParts } from './booking-core.js';

const LOCAL_BOOKINGS_KEY = 'orbita_bookings_v2';
const CLIENT_TOKEN_KEY = 'orbita_client_token_v1';

function randomId(prefix = 'ORB-BKG') {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  const value = [...bytes].map((byte) => byte.toString(16).padStart(2,'0')).join('').toUpperCase();
  return `${prefix}-${value}`;
}

function getClientToken() {
  let token = localStorage.getItem(CLIENT_TOKEN_KEY);
  if (!token) {
    token = randomId('CLIENT');
    localStorage.setItem(CLIENT_TOKEN_KEY, token);
  }
  return token;
}

function readLocalBookings() {
  try {
    const items = JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || '[]');
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function writeLocalBookings(items) {
  localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(items.slice(-100)));
}

function apiEnabled() {
  return Boolean(APP_CONFIG.bookingMode && APP_CONFIG.apiBaseUrl);
}

async function request(path, init = {}) {
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}${path}`, {
    ...init,
    headers:{ 'Content-Type':'application/json', ...(init.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'booking_request_failed');
  return data;
}

export async function getStatuses(now = new Date()) {
  if (apiEnabled()) {
    try {
      const data = await request('/api/advisors/status');
      if (Array.isArray(data.statuses)) return data.statuses;
    } catch {
      // 通信障害時は表示を止めず、端末内予約へフォールバックする。
    }
  }
  const reservations = readLocalBookings();
  return ADVISORS.map((advisor) => ({ advisorId:advisor.id, ...advisorStatus(advisor,reservations,now), demo:!apiEnabled() }));
}

export async function getAvailability(advisorId, dateKey, now = new Date()) {
  const advisor = getAdvisor(advisorId);
  if (!advisor) return [];
  if (apiEnabled()) {
    try {
      const data = await request(`/api/bookings/availability?advisor_id=${encodeURIComponent(advisorId)}&date=${encodeURIComponent(dateKey)}`);
      if (Array.isArray(data.slots)) return data.slots;
    } catch {
      // フォールバック
    }
  }
  return createSlots(advisor,dateKey,readLocalBookings(),now);
}

export async function reserveBooking({ advisorId, startAt, readyAt }) {
  const advisor = getAdvisor(advisorId);
  if (!advisor) throw new Error('advisor_not_found');
  const payload = { advisorId, startAt, readyAt, clientToken:getClientToken() };
  if (apiEnabled()) return request('/api/bookings/reserve',{ method:'POST', body:JSON.stringify(payload) });

  if (new Date(startAt).getTime() < Date.now() || new Date(readyAt).getTime() <= new Date(startAt).getTime()) throw new Error('slot_taken');
  const validSlots = await getAvailability(advisorId, toJstParts(new Date(startAt)).dateKey);
  if (!validSlots.some((slot) => slot.startAt === startAt && slot.readyAt === readyAt && slot.available)) throw new Error('slot_taken');
  const bookings = readLocalBookings();
  const conflict = bookings.some((item) => item.advisorId === advisorId && item.startAt === startAt && item.status !== 'cancelled');
  if (conflict) throw new Error('slot_taken');
  const booking = {
    bookingId:randomId(), advisorId, startAt, readyAt,
    status:'reserved', clientToken:payload.clientToken, createdAt:new Date().toISOString(), demo:true
  };
  bookings.push(booking);
  writeLocalBookings(bookings);
  return booking;
}

export async function getBooking(bookingId) {
  if (apiEnabled()) {
    try { return await request(`/api/bookings/${encodeURIComponent(bookingId)}?client_token=${encodeURIComponent(getClientToken())}`); }
    catch { return null; }
  }
  return readLocalBookings().find((item) => item.bookingId === bookingId) || null;
}

export function getLocalReservations() {
  return readLocalBookings();
}

export function bookingDates(now = new Date()) {
  return Array.from({ length:BOOKING_CONFIG.bookingHorizonDays },(_,index) => dateKeyAfter(index,now));
}
