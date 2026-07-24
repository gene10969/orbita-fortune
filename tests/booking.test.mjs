import test from 'node:test';
import assert from 'node:assert/strict';
import { ADVISORS } from '../advisors.js';
import { BOOKING_CONFIG, createSlots, advisorStatus, validateAdvisorSchedules, toJstParts } from '../booking-core.js';

test('initial roster contains exactly ten advisors with mixed profiles', () => {
  assert.equal(ADVISORS.length, 10);
  assert.ok(ADVISORS.some((item) => item.gender === '男性'));
  assert.ok(ADVISORS.some((item) => item.gender === '女性'));
  assert.ok(ADVISORS.some((item) => item.nationality !== '日本'));
  assert.ok(ADVISORS.some((item) => item.type.includes('アイドル')));
  assert.ok(ADVISORS.some((item) => item.type.includes('グラビア')));
});

test('all advisor schedules are valid', () => {
  assert.deepEqual(validateAdvisorSchedules(ADVISORS), []);
});

test('slots are ten minutes apart and reading duration is about three minutes', () => {
  const advisor = ADVISORS.find((item) => item.id === 'luna');
  const now = new Date('2026-07-25T00:00:00.000Z');
  const slots = createSlots(advisor, '2026-07-25', [], now);
  assert.ok(slots.length > 1);
  assert.equal((new Date(slots[1].startAt) - new Date(slots[0].startAt)) / 60000, BOOKING_CONFIG.slotIntervalMinutes);
  assert.equal((new Date(slots[0].readyAt) - new Date(slots[0].startAt)) / 1000, BOOKING_CONFIG.readingDurationSeconds);
});

test('active reservation makes advisor busy', () => {
  const advisor = ADVISORS.find((item) => item.id === 'luna');
  const now = new Date('2026-07-25T04:01:00.000Z'); // 13:01 JST Saturday
  const reservation = { advisorId:'luna', startAt:'2026-07-25T04:00:00.000Z', readyAt:'2026-07-25T04:03:05.000Z', status:'reserved' };
  const status = advisorStatus(advisor,[reservation],now);
  assert.equal(status.key,'busy');
  assert.equal(status.label,'占い中');
});

test('JST conversion is stable', () => {
  const parts = toJstParts(new Date('2026-07-25T15:30:00.000Z'));
  assert.equal(parts.dateKey,'2026-07-26');
  assert.equal(parts.timeKey,'00:30');
});
