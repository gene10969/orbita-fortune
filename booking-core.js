export const BOOKING_CONFIG = Object.freeze({
  timeZone:'Asia/Tokyo',
  slotIntervalMinutes:10,
  readingDurationSeconds:185,
  bookingHorizonDays:14,
  minimumLeadMinutes:0
});

const WEEKDAYS = ['日','月','火','水','木','金','土'];

function pad(value) { return String(value).padStart(2,'0'); }

export function toJstParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone:BOOKING_CONFIG.timeZone,
    year:'numeric', month:'2-digit', day:'2-digit', weekday:'short',
    hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'
  }).formatToParts(date).reduce((acc, part) => { acc[part.type] = part.value; return acc; }, {});
  const weekdayMap = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  return {
    year:Number(parts.year), month:Number(parts.month), day:Number(parts.day),
    weekday:weekdayMap[parts.weekday], hour:Number(parts.hour), minute:Number(parts.minute), second:Number(parts.second),
    dateKey:`${parts.year}-${parts.month}-${parts.day}`,
    timeKey:`${parts.hour}:${parts.minute}`
  };
}

export function jstDateTimeToDate(dateKey, timeKey) {
  return new Date(`${dateKey}T${timeKey}:00+09:00`);
}

export function dateKeyAfter(days, from = new Date()) {
  const current = toJstParts(from);
  const base = jstDateTimeToDate(current.dateKey, '12:00');
  base.setUTCDate(base.getUTCDate() + days);
  return toJstParts(base).dateKey;
}

export function weekdayForDateKey(dateKey) {
  return jstDateTimeToDate(dateKey, '12:00').getUTCDay();
}

export function formatDateLabel(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const weekday = weekdayForDateKey(dateKey);
  return `${month}/${day}（${WEEKDAYS[weekday]}）`;
}

export function formatDateTimeJst(isoString) {
  const p = toJstParts(new Date(isoString));
  return `${p.month}/${p.day}（${WEEKDAYS[p.weekday]}）${pad(p.hour)}:${pad(p.minute)}`;
}

export function minutesFromTime(timeKey) {
  const [hour, minute] = String(timeKey).split(':').map(Number);
  return hour * 60 + minute;
}

export function timeFromMinutes(minutes) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export function scheduleWindows(advisor, dateKey) {
  return advisor?.schedule?.[weekdayForDateKey(dateKey)] || [];
}

export function isWithinShift(advisor, date = new Date()) {
  const p = toJstParts(date);
  const nowMinutes = p.hour * 60 + p.minute;
  return scheduleWindows(advisor, p.dateKey).some(([start,end]) => nowMinutes >= minutesFromTime(start) && nowMinutes < minutesFromTime(end));
}

export function createSlots(advisor, dateKey, reservations = [], now = new Date()) {
  const nowTime = now.getTime() + BOOKING_CONFIG.minimumLeadMinutes * 60000;
  const reservedStarts = new Set(reservations.filter((item) => item.advisorId === advisor.id && item.status !== 'cancelled').map((item) => item.startAt));
  const slots = [];
  for (const [start,end] of scheduleWindows(advisor,dateKey)) {
    let cursor = minutesFromTime(start);
    const endMinutes = minutesFromTime(end);
    while (cursor + Math.ceil(BOOKING_CONFIG.readingDurationSeconds / 60) <= endMinutes) {
      const timeKey = timeFromMinutes(cursor);
      const startAt = jstDateTimeToDate(dateKey,timeKey).toISOString();
      const readyAt = new Date(new Date(startAt).getTime() + BOOKING_CONFIG.readingDurationSeconds * 1000).toISOString();
      if (new Date(startAt).getTime() >= nowTime) {
        slots.push({ dateKey, timeKey, startAt, readyAt, available:!reservedStarts.has(startAt) });
      }
      cursor += BOOKING_CONFIG.slotIntervalMinutes;
    }
  }
  return slots;
}

export function activeReservation(advisorId, reservations = [], now = new Date()) {
  const time = now.getTime();
  return reservations.find((item) => item.advisorId === advisorId && item.status !== 'cancelled' && new Date(item.startAt).getTime() <= time && time < new Date(item.readyAt).getTime()) || null;
}

export function nextShiftStart(advisor, now = new Date(), maxDays = 14) {
  for (let offset = 0; offset <= maxDays; offset += 1) {
    const dateKey = dateKeyAfter(offset, now);
    for (const [start] of scheduleWindows(advisor,dateKey)) {
      const date = jstDateTimeToDate(dateKey,start);
      if (date.getTime() > now.getTime()) return date.toISOString();
    }
  }
  return null;
}

export function advisorStatus(advisor, reservations = [], now = new Date()) {
  const active = activeReservation(advisor.id,reservations,now);
  if (active) return { key:'busy', label:'占い中', detail:`${Math.max(1,Math.ceil((new Date(active.readyAt)-now)/60000))}分ほどで受付再開` };
  if (isWithinShift(advisor,now)) {
    const today = toJstParts(now).dateKey;
    const next = createSlots(advisor,today,reservations,now).find((slot) => slot.available);
    return next ? { key:'available', label:'予約受付中', detail:`最短 ${next.timeKey}` } : { key:'full', label:'本日満枠', detail:'次の受付枠を確認' };
  }
  const next = nextShiftStart(advisor,now);
  return next ? { key:'off', label:'受付時間外', detail:`次回 ${formatDateTimeJst(next)}` } : { key:'off', label:'受付時間外', detail:'シフト調整中' };
}

export function validateAdvisorSchedules(advisors) {
  const errors = [];
  for (const advisor of advisors) {
    for (const [weekday, windows] of Object.entries(advisor.schedule || {})) {
      if (Number(weekday) < 0 || Number(weekday) > 6) errors.push(`${advisor.id}: invalid weekday`);
      for (const [start,end] of windows) {
        if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || minutesFromTime(start) >= minutesFromTime(end)) errors.push(`${advisor.id}: invalid window ${start}-${end}`);
      }
    }
  }
  return errors;
}
