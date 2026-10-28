import { AppLayout } from '../components/templates/AppLayout';
import { loadFonts, renderCard } from '../services/share-card';
import { MODES, normalizeState, randomDigit, completeDraw, back, reset, fmtWhen, type HistoryEntry } from '../domain/lottery';

export function LotteryPage(root: HTMLElement): void {
  root.innerHTML = AppLayout();
  function element<T extends HTMLElement = HTMLElement>(id: string): T {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Missing element: ${id}`);
    return node as T;
  }
  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var stepsEl = element("steps");
  var display = element("display");
  var metaLeft = element("metaLeft");
  var metaRight = element("metaRight");
  var goBtn = element<HTMLButtonElement>("go");
  var copyBtn = element<HTMLButtonElement>("copy");
  var clearBtn = element<HTMLButtonElement>("clear");
  var resetBtn = element<HTMLButtonElement>("reset");
  var backBtn = element<HTMLButtonElement>("back");
  var shareBtn = element<HTMLButtonElement>("share");
  var shade = element("shade");
  var shareImg = element<HTMLImageElement>("shareImg");
  var shareInfo = element<HTMLParagraphElement>("shareInfo");
  var shareClose = element<HTMLButtonElement>("shareClose");
  var shareSave = element<HTMLButtonElement>("shareSave");
  var shareNative = element<HTMLButtonElement>("shareNative");
  var histList = element("histList");
  var toastEl = element("toast");

  var step = 0; // index of the next mode to draw
  var rounds = 0; // completed 2-3-6 rounds
  var history: HistoryEntry[] = [];
  var lastValue = "";
  var lastTs = 0; // time of the latest draw
  var busy = false;
  var toastTimer: ReturnType<typeof setTimeout> | null = null;
  var STORE_KEY = "lotto-random-v1";

  // localStorage can throw or be empty (private window, blocked data), so every access is guarded
  function save() {
    try {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({
          step: step,
          rounds: rounds,
          history: history,
          lastValue: lastValue,
          lastTs: lastTs,
        }),
      );
    } catch (e) {}
  }

  function load(): void {
    try {
      const saved = normalizeState(JSON.parse(localStorage.getItem(STORE_KEY) || 'null'));
      ({ step, rounds, history, lastValue, lastTs } = saved);
    } catch { /* Private browsing or damaged storage: keep the initial state. */ }
  }

  function restoreLast() {
    if (!lastValue || !history.length) return;
    var h = history[0];
    setCells(lastValue.length, false);
    Array.prototype.forEach.call(display.children, function (c, i) {
      c.textContent = lastValue.charAt(i);
      c.classList.add("set");
    });
    metaLeft.innerHTML =
      "<strong>ครั้งที่ " +
      h.idx +
      "</strong> · เลข " +
      h.n +
      " ตัว · ผลล่าสุด";
    metaRight.textContent = MODES[h.idx - 1]
      ? MODES[h.idx - 1].range
      : "";
    display.setAttribute("aria-label", "ผลการสุ่ม " + lastValue);
    display.setAttribute("aria-busy", "false");
    copyBtn.disabled = false;
  }

  // Uniform random digit 0-9 (rejection sampling avoids modulo bias)
  function rnd10(): number { return Number(randomDigit()); }

  function setCells(n: number, idle: boolean) {
    display.innerHTML = "";
    display.style.setProperty("--n", String(n));
    display.setAttribute("data-n", String(n));
    display.setAttribute("aria-label", idle ? "ยังไม่ได้สุ่ม" : `กำลังสุ่มเลข ${n} ตัว ...`);
    display.setAttribute("aria-busy", String(!idle));
    for (var i = 0; i < n; i++) {
      var c = document.createElement("span");
      c.className = "cell" + (idle ? " idle" : "");
      c.textContent = idle ? "–" : "0";
      display.appendChild(c);
    }
  }

  function renderSteps() {
    stepsEl.innerHTML = "";
    MODES.forEach(function (m, i) {
      var li = document.createElement("li");
      li.className = i < step ? "done" : i === step ? "next" : "";
      li.innerHTML =
        "<b>ครั้งที่ " +
        (i + 1) +
        '</b><span class="rng">' +
        m.range +
        "</span>";
      stepsEl.appendChild(li);
    });
  }

  function renderButton() {
    var m = MODES[step];
    goBtn.setAttribute("aria-busy", String(busy));
    goBtn.innerHTML =
      "กดสุ่มครั้งที่ " +
      (step + 1) +
      "<small>" +
      m.label +
      " (" +
      m.range +
      ")</small>";
  }

  // Date and time of a draw; entries saved before dates were added fall back to the stored time only
  function renderHistory() {
    histList.innerHTML = "";
    if (!history.length) {
      var li = document.createElement("li");
      li.innerHTML =
        '<span class="empty">ยังไม่มีผล กดปุ่มสุ่มเพื่อเริ่ม</span>';
      li.style.display = "block";
      histList.appendChild(li);
    } else {
      history.forEach(function (h) {
        var li = document.createElement("li");
        li.innerHTML =
          '<span class="tag">ครั้งที่ ' +
          h.idx +
          " · " +
          h.n +
          " ตัว</span>" +
          '<span class="val"></span><span class="time"></span>';
        li.querySelector<HTMLElement>(".val")!.textContent = h.value;
        var tEl = li.querySelector<HTMLElement>(".time")!;
        var when = fmtWhen(h);
        if (when.date) {
          var dSpan = document.createElement("span");
          dSpan.textContent = when.date;
          tEl.appendChild(dSpan);
        }
        var tSpan = document.createElement("span");
        tSpan.textContent = when.time;
        tEl.appendChild(tSpan);
        // tap a row to see that draw as a shareable image
        li.className = "clickable";
        li.tabIndex = 0;
        li.setAttribute("role", "button");
        li.setAttribute("aria-label", "ดูรูปผลการสุ่ม " + h.value);
        var openRow = function () {
          openCard(h.value, h.ts, h.time, li);
        };
        li.addEventListener("click", openRow);
        li.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openRow();
          }
        });
        histList.appendChild(li);
      });
    }
    clearBtn.disabled = !history.length;
  }

  function updateReset() {
    // nothing to reset when the cycle is already at ครั้งที่ 1 with no result shown
    resetBtn.disabled = busy || (step === 0 && !lastValue);
    backBtn.disabled = busy || (step === 0 && rounds === 0);
    shareBtn.disabled = busy || !lastValue;
  }

  function toast(msg: string) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    if (toastTimer !== null) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.hidden = true;
    }, 1800);
  }

  function spin(digits: number[]): Promise<void> {
    return new Promise<void>(function (resolve) {
      var cells = Array.from(display.children) as HTMLElement[];
      if (reduce) {
        cells.forEach(function (c, i) {
          c.textContent = String(digits[i]);
          c.classList.add("set");
        });
        return resolve();
      }
      var start = performance.now();
      var stops = cells.map(function (_, i) {
        return 600 + i * 170;
      });
      var settled = cells.map(function () {
        return false;
      });
      var id = setInterval(function () {
        var t = performance.now() - start;
        var done = true;
        cells.forEach(function (c, i) {
          if (t >= stops[i]) {
            if (!settled[i]) {
              c.textContent = String(digits[i]);
              c.classList.add("set");
              settled[i] = true;
            }
          } else {
            c.textContent = String(rnd10());
            done = false;
          }
        });
        if (done) {
          clearInterval(id);
          resolve();
        }
      }, 55);
    });
  }

  function draw() {
    if (busy) return;
    busy = true;
    goBtn.disabled = true;
    copyBtn.disabled = true;
    resetBtn.disabled = true;
    backBtn.disabled = true;
    shareBtn.disabled = true;
    var idx = step;
    var m = MODES[idx];
    var digits = [];
    for (var i = 0; i < m.n; i++) digits.push(rnd10());
    var value = digits.join("");

    setCells(m.n, false);
    metaLeft.innerHTML =
      "<strong>ครั้งที่ " +
      (idx + 1) +
      "</strong> · " +
      m.label +
      (rounds ? " · รอบที่ " + (rounds + 1) : "");
    metaRight.textContent = m.range;
    renderButton();

    spin(digits).then(function () {
      const next = completeDraw({ step, rounds, history, lastValue, lastTs }, value);
      ({ step, rounds, history, lastValue, lastTs } = next);
      display.setAttribute("aria-label", "ผลการสุ่ม " + value);
      display.setAttribute("aria-busy", "false");
      busy = false;
      renderSteps();
      renderButton();
      renderHistory();
      save();
      goBtn.disabled = false;
      copyBtn.disabled = false;
      updateReset();
    });
  }

  function copyValue() {
    if (!lastValue) return;
    function fallback() {
      try {
        var r = document.createRange();
        r.selectNodeContents(display);
        var s = window.getSelection();
        s?.removeAllRanges();
        s?.addRange(r);
      } catch (e) {}
      toast("เลือกเลขไว้แล้ว กดคัดลอกเอง");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(lastValue)
        .then(function () {
          toast("คัดลอก " + lastValue + " แล้ว");
        })
        .catch(fallback);
    } else {
      fallback();
    }
  }

  // Restart the cycle at ครั้งที่ 1 (2 digits); history stays
  function resetCycle() {
    if (busy) return;
    ({ step, rounds, history, lastValue, lastTs } = reset({ step, rounds, history, lastValue, lastTs }));
    setCells(MODES[0].n, true);
    metaLeft.innerHTML = "<strong>พร้อมสุ่ม</strong>";
    metaRight.textContent = MODES[0].range;
    copyBtn.disabled = true;
    renderSteps();
    renderButton();
    updateReset();
    save();
    toast("รีเซ็ตแล้ว เริ่มสุ่มครั้งที่ 1 ใหม่");
  }

  // ---- Share image: the current result drawn on a canvas in the page's own colours ----

  var shareFile: File | null = null;
  var shareUrl: string | null = null;
  var shareGeneration = 0;

  var THEME_COUNT = 5;
  var shareTheme = 0;
  var cardState: { value: string; ts: number; timeText: string } | null = null;

  var shareOpener: HTMLElement | null = null;

  // Build the image for one draw and show it in the sheet
  function openCard(value: string, ts: number, timeText: string, opener: HTMLElement | null) {
    if (busy) return;
    shareOpener = opener;
    shareTheme = 0;
    syncThemeButtons();
    cardState = { value, ts, timeText };
    const when = fmtWhen({ ts, time: timeText });
    const timestamp = [when.date, when.time].filter(Boolean).join(" ");
    shareInfo.textContent = [`เลข ${value.length} ตัว`, timestamp].filter(Boolean).join(" · ");
    shade.hidden = false;
    shareClose.focus();
    void repaintTheme();
  }

  function openShare() {
    if (lastValue) openCard(lastValue, lastTs, "", shareBtn);
  }

  function closeShare() {
    shade.hidden = true;
    shareGeneration++;
    cardState = null;
    shareFile = null;
    if (shareUrl) URL.revokeObjectURL(shareUrl);
    shareUrl = null;
    shareImg.removeAttribute("src");
    if (shareOpener && document.body.contains(shareOpener)) shareOpener.focus();
  }

  // Theme buttons 1-5: numbers only; the chosen one is filled red
  var themeBtns: HTMLButtonElement[] = [];
  var themesEl = element("themes");
  for (var ti = 0; ti < THEME_COUNT; ti++) {
    (function (i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "theme-btn";
      b.textContent = String(i + 1);
      b.setAttribute("aria-label", "ธีม " + (i + 1));
      b.addEventListener("click", function () {
        if (shareTheme === i) return;
        shareTheme = i;
        syncThemeButtons();
        repaintTheme();
      });
      themesEl.appendChild(b);
      themeBtns.push(b);
    })(ti);
  }

  function syncThemeButtons() {
    themeBtns.forEach(function (b, i) {
      b.setAttribute("aria-pressed", i === shareTheme ? "true" : "false");
    });
  }

  // Redraw the open image after a different theme is picked
  async function repaintTheme(): Promise<void> {
    if (!cardState) return;
    const state = cardState;
    const theme = shareTheme;
    const generation = ++shareGeneration;
    shareFile = null;
    shareSave.disabled = true;
    shareNative.disabled = true;
    shareImg.setAttribute("aria-busy", "true");
    try {
      await loadFonts();
      if (generation !== shareGeneration || shade.hidden) return;
      const canvas = renderCard(state.value, state.ts, state.timeText, theme);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
      canvas.width = canvas.height = 0;
      if (generation !== shareGeneration || shade.hidden) return;
      if (!blob) throw new Error("Unable to encode PNG");
      const nextUrl = URL.createObjectURL(blob);
      if (shareUrl) URL.revokeObjectURL(shareUrl);
      shareUrl = nextUrl;
      shareFile = new File([blob], `lotto-${state.value}.png`, { type: "image/png" });
      shareImg.src = shareUrl;
      shareSave.disabled = false;
      shareNative.disabled = false;
    } catch {
      if (generation === shareGeneration && !shade.hidden) toast("สร้างรูปไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      if (generation === shareGeneration) shareImg.setAttribute("aria-busy", "false");
    }
  }
  syncThemeButtons();

  shareBtn.addEventListener("click", openShare);
  shareClose.addEventListener("click", closeShare);
  shade.addEventListener("click", function (e) {
    if (e.target === shade) closeShare();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !shade.hidden) closeShare();
  });
  shareSave.addEventListener("click", function () {
    if (!shareFile || !shareUrl) return;
    const link = document.createElement("a");
    link.href = shareUrl;
    link.download = shareFile.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
  shareNative.addEventListener("click", async function () {
    if (!shareFile) return;
    try {
      if (!navigator.share || (navigator.canShare && !navigator.canShare({ files: [shareFile] }))) {
        toast("เบราว์เซอร์นี้ไม่รองรับการแชร์รูป กรุณากดบันทึกรูปแทน");
        return;
      }
      shareNative.disabled = true;
      await navigator.share({ files: [shareFile], title: "เครื่องสุ่มหวย" });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        toast("แชร์รูปไม่สำเร็จ กรุณากดบันทึกรูปแทน");
      }
    } finally {
      shareNative.disabled = !shareFile;
    }
  });

  // Step back one digit length so it can be drawn again; history stays
  function goBack() {
    if (busy || (step === 0 && rounds === 0)) return;
    ({ step, rounds, history, lastValue, lastTs } = back({ step, rounds, history, lastValue, lastTs }));
    setCells(MODES[step].n, true);
    metaLeft.innerHTML = "<strong>พร้อมสุ่ม</strong>";
    metaRight.textContent = MODES[step].range;
    copyBtn.disabled = true;
    renderSteps();
    renderButton();
    updateReset();
    save();
    toast(
      "ย้อนกลับ สุ่มครั้งที่ " +
        (step + 1) +
        " ใหม่ (" +
        MODES[step].label +
        ")",
    );
  }

  goBtn.addEventListener("click", draw);
  backBtn.addEventListener("click", goBack);
  resetBtn.addEventListener("click", resetCycle);
  copyBtn.addEventListener("click", copyValue);
  clearBtn.addEventListener("click", function () {
    history = [];
    renderHistory();
    updateReset();
    save();
    toast("ล้างประวัติแล้ว");
  });

  load();
  setCells(MODES[step].n, true);
  renderSteps();
  renderButton();
  renderHistory();
  restoreLast();
  updateReset();
}
