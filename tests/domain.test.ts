import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { initialState, normalizeState, randomDigit, completeDraw, back, reset } from '../src/domain/lottery';

test('cycle 2 → 3 → 6 preserves leading zeroes and counts rounds', () => {
  let state = initialState();
  for (const [index, value] of ['00', '001', '000002'].entries()) {
    state = completeDraw(state, value, 1000 + index);
    assert.equal(state.history[0].idx, index + 1);
    assert.equal(state.history[0].value, value);
  }
  assert.equal(state.step, 0);
  assert.equal(state.rounds, 1);
  assert.equal(state.lastValue, '000002');
  assert.equal(state.history.length, 3);
  assert.throws(() => completeDraw(state, '123'));
});
test('back crosses round boundary, reset preserves history', () => {
  let state = initialState();
  assert.deepEqual(back(state), state);
  for (const value of ['01', '002', '000003']) state = completeDraw(state, value);
  const previous = back(state);
  assert.equal(previous.step, 2);
  assert.equal(previous.rounds, 0);
  assert.equal(previous.lastValue, '');
  assert.deepEqual(reset(previous).history, state.history);
  assert.equal(reset(previous).step, 0);
});
test('history is bounded to 30 entries', () => {
  let state = initialState();
  for (let i = 0; i < 40; i++) state = completeDraw(state, '0'.repeat([2, 3, 6][state.step]), i);
  assert.equal(state.history.length, 30);
  assert.equal(state.history[0].ts, 39);
});
test('storage validates legacy records and rejects malformed values', () => {
  const legacy = { step: 2, rounds: 4, lastValue: '007', lastTs: 1000,
    history: [{ idx: 2, n: 3, value: '007', time: '12:00:00', ts: 1000 }] };
  assert.deepEqual(normalizeState(legacy), legacy);
  const broken = normalizeState({ step: 0.5, rounds: -1, lastValue: '<img>', lastTs: Infinity,
    history: [{ idx: 1, n: 2, value: '000' }, { idx: 1, n: 2, value: '<script>' }, null] });
  assert.deepEqual(broken, initialState());
  assert.deepEqual(normalizeState(null), initialState());
});
test('random digits reject biased bytes before modulo', () => {
  const bytes = [255, 250, 249];
  assert.equal(randomDigit({ getRandomValues(array: Uint8Array) { array[0] = bytes.shift()!; } }), '9');
  assert.equal(bytes.length, 0);
});
