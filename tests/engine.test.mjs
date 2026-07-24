import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLifePath, detectSafetyRisk, generateReading, readingToShareText } from '../engine.js';

const sample = {
  nickname:'ミナ',
  birthdate:'1990-01-23',
  category:'work',
  question:'現在の仕事を続けるか、新しい仕事へ移るか迷っています。',
  optionA:'現在の仕事を続ける',
  optionB:'新しい仕事へ移る',
  timeframe:'3months',
  tension:7,
  readingDate:'2026-07-25',
  advisorId:'shion',
  advisorName:'九条シオン',
  advisorTone:'rational',
  method:'decision',
  bookingStart:'2026-07-25T11:00:00.000Z'
};

test('life path calculation is stable', () => {
  assert.equal(calculateLifePath('1990-01-23'), 7);
});

test('same input produces same reading core', () => {
  const a = generateReading(sample);
  const b = generateReading(sample);
  assert.equal(a.ok, true);
  assert.equal(a.readingId, b.readingId);
  assert.deepEqual(a.cards.map(c => c.id), b.cards.map(c => c.id));
  assert.deepEqual(a.scores, b.scores);
});

test('advisor or method changes the reading', () => {
  const a = generateReading(sample);
  const b = generateReading({ ...sample, advisorId:'luna', advisorName:'月乃ルナ', advisorTone:'empathy', method:'tarot' });
  assert.notEqual(a.readingId, b.readingId);
});

test('different booking slot changes the reading', () => {
  const a = generateReading(sample);
  const b = generateReading({ ...sample, bookingStart:'2026-07-25T11:10:00.000Z' });
  assert.notEqual(a.readingId, b.readingId);
});

test('scores total 100 and plan has seven days', () => {
  const result = generateReading(sample);
  assert.equal(result.scores.a + result.scores.b, 100);
  assert.equal(result.plan.length, 7);
});

test('high-risk request is stopped', () => {
  const result = generateReading({ ...sample, question:'私はいつ死ぬか寿命を教えてください。' });
  assert.equal(result.ok, false);
  assert.equal(result.safety.level, 'stop');
});

test('medical content receives caution', () => {
  const risk = detectSafetyRisk('病気の治療をどうするか迷っています');
  assert.equal(risk.level, 'caution');
});

test('share text contains reading id and disclaimer', () => {
  const result = generateReading(sample);
  const text = readingToShareText(result);
  assert.match(text, /ORB-/);
  assert.match(text, /保証するものではありません/);
});
