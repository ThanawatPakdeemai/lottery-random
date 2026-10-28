export const MODES = [
  { n: 2, label: 'เลข 2 ตัว', range: '00–99' },
  { n: 3, label: 'เลข 3 ตัว', range: '000–999' },
  { n: 6, label: 'เลข 6 ตัว', range: '000000–999999' },
];
export const initialState = () => ({ step: 0, rounds: 0, history: [], lastValue: '', lastTs: 0 });
export const validValue = value => typeof value === 'string' && /^(?:\d{2}|\d{3}|\d{6})$/.test(value);
const validTs = ts => Number.isFinite(ts) && ts >= 0 && ts <= 8.64e15;

export function normalizeState(data) {
  const state = initialState();
  if (!data || typeof data !== 'object') return state;
  if (Number.isInteger(data.step) && data.step >= 0 && data.step < 3) state.step = data.step;
  if (Number.isSafeInteger(data.rounds) && data.rounds >= 0) state.rounds = data.rounds;
  if (Array.isArray(data.history)) {
    state.history = data.history.filter(h => h && validValue(h.value) &&
      MODES[h.idx - 1]?.n === h.n && h.n === h.value.length)
      .slice(0, 30).map(h => ({ idx: h.idx, n: h.n, value: h.value,
        ts: validTs(h.ts) ? h.ts : 0, time: typeof h.time === 'string' ? h.time.slice(0, 30) : '' }));
  }
  if (validValue(data.lastValue)) state.lastValue = data.lastValue;
  if (validTs(data.lastTs)) state.lastTs = data.lastTs;
  return state;
}

// Rejection sampling: all ten digits have the same probability; keep leading zeroes.
export function randomDigit(random = crypto) {
  const bytes = new Uint8Array(1);
  do { random.getRandomValues(bytes); } while (bytes[0] >= 250);
  return String(bytes[0] % 10);
}
export const randomValue = n => Array.from({ length: n }, () => randomDigit()).join('');

export function completeDraw(state, value, ts = Date.now()) {
  const mode = MODES[state.step];
  if (!validValue(value) || value.length !== mode.n) throw new Error('Invalid draw');
  const step = (state.step + 1) % MODES.length;
  return { step, rounds: state.rounds + (step === 0 ? 1 : 0), lastValue: value, lastTs: ts,
    history: [{ idx: state.step + 1, n: mode.n, value, ts, time: '' }, ...state.history].slice(0, 30) };
}
export function back(state) {
  if (!state.step && !state.rounds) return state;
  return { ...state, step: (state.step + 2) % 3,
    rounds: state.rounds - (state.step === 0 ? 1 : 0), lastValue: '', lastTs: 0 };
}
export const reset = state => ({ ...initialState(), history: state.history });
export function fmtWhen(h) {
  if (!h.ts) return { date: '', time: h.time || '' };
  const date = new Date(h.ts);
  return {
    date: date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('th-TH', { hour12: false }),
  };
}
