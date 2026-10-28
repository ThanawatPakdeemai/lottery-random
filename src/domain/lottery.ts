export interface HistoryEntry {
  idx: number;
  n: number;
  value: string;
  time: string;
  ts: number;
}
export interface LotteryState {
  step: number;
  rounds: number;
  history: HistoryEntry[];
  lastValue: string;
  lastTs: number;
}
export const MODES = [
  { n: 2, label: 'เลข 2 ตัว', range: '00–99' },
  { n: 3, label: 'เลข 3 ตัว', range: '000–999' },
  { n: 6, label: 'เลข 6 ตัว', range: '000000–999999' },
];
export const initialState = (): LotteryState => ({ step: 0, rounds: 0, history: [], lastValue: '', lastTs: 0 });
export const validValue = (value: unknown): value is string => typeof value === 'string' && /^(?:\d{2}|\d{3}|\d{6})$/.test(value);
const validTs = (ts: unknown): ts is number => typeof ts === 'number' && Number.isFinite(ts) && ts >= 0 && ts <= 8.64e15;

export function normalizeState(data: unknown): LotteryState {
  const state = initialState();
  if (!data || typeof data !== 'object') return state;
  const saved = data as Record<string, unknown>;
  if (typeof saved.step === 'number' && Number.isInteger(saved.step) && saved.step >= 0 && saved.step < 3) state.step = saved.step;
  if (typeof saved.rounds === 'number' && Number.isSafeInteger(saved.rounds) && saved.rounds >= 0) state.rounds = saved.rounds;
  if (Array.isArray(saved.history)) {
    state.history = saved.history.filter((entry: unknown): entry is HistoryEntry => {
      if (!entry || typeof entry !== 'object') return false;
      const h = entry as Partial<HistoryEntry>;
      return typeof h.idx === 'number' && validValue(h.value) && MODES[h.idx - 1]?.n === h.n && h.n === h.value.length;
    }).slice(0, 30).map(h => ({ idx: h.idx, n: h.n, value: h.value,
      ts: validTs(h.ts) ? h.ts : 0, time: typeof h.time === 'string' ? h.time.slice(0, 30) : '' }));
  }
  if (validValue(saved.lastValue)) state.lastValue = saved.lastValue;
  if (validTs(saved.lastTs)) state.lastTs = saved.lastTs;
  return state;
}
// Rejection sampling avoids modulo bias and preserves leading zeroes.
export function randomDigit(random: { getRandomValues(array: Uint8Array): unknown } = crypto): string {
  const bytes = new Uint8Array(1);
  do { random.getRandomValues(bytes); } while (bytes[0] >= 250);
  return String(bytes[0] % 10);
}
export const randomValue = (n: number): string => Array.from({ length: n }, () => randomDigit()).join('');
export function completeDraw(state: LotteryState, value: string, ts = Date.now()): LotteryState {
  const mode = MODES[state.step];
  if (!validValue(value) || value.length !== mode.n) throw new Error('Invalid draw');
  const step = (state.step + 1) % MODES.length;
  return { step, rounds: state.rounds + (step === 0 ? 1 : 0), lastValue: value, lastTs: ts,
    history: [{ idx: state.step + 1, n: mode.n, value, ts, time: '' }, ...state.history].slice(0, 30) };
}
export function back(state: LotteryState): LotteryState {
  if (!state.step && !state.rounds) return state;
  return { ...state, step: (state.step + 2) % 3, rounds: state.rounds - (state.step === 0 ? 1 : 0), lastValue: '', lastTs: 0 };
}
export const reset = (state: LotteryState): LotteryState => ({ ...initialState(), history: state.history });
export function fmtWhen(h: { ts: number; time: string }): { date: string; time: string } {
  if (!h.ts) return { date: '', time: h.time };
  const date = new Date(h.ts);
  return {
    date: date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('th-TH', { hour12: false }),
  };
}
