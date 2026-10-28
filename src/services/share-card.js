import qrcode from 'qrcode-generator';
import { MODES, fmtWhen } from '../domain/lottery.js';

// QR points to the installed application's own base URL, including subdirectory deployments.
const APP_URL = new URL(import.meta.env.BASE_URL, window.location.origin).href;
const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

let fontPromise;
export function loadFonts() {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  var thai =
    "เครื่องสุ่มหวย สุ่มเพื่อความบันเทิง ผลไม่เกี่ยวกับสลากจริง ม.ค. ก.พ. มี.ค. เม.ย. พ.ค. มิ.ย. ก.ค. ส.ค. ก.ย. ต.ค. พ.ย. ธ.ค. เลขตัว ขอให้เฮงรวยหวยถูก สแกนเพื่อใช้เครื่องสุ่มหวย ()-0123456789:";
  return fontPromise ??= Promise.all([
    document.fonts.load("600 54px Mitr", thai),
    document.fonts.load('600 28px "Noto Sans Thai"', thai),
    document.fonts.load('400 26px "Noto Sans Thai"', thai),
    document.fonts.load('500 26px "Noto Sans Thai"', thai),
    document.fonts.load('500 26px "IBM Plex Mono"', "0123456789:"),
  ]).catch(function () {});
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx, text, maxW) {
  var lines = [],
    cur = "";
  text.split(" ").forEach(function (w) {
    var t = cur ? cur + " " + w : w;
    if (cur && ctx.measureText(t).width > maxW) {
      lines.push(cur);
      cur = w;
    } else {
      cur = t;
    }
  });
  if (cur) lines.push(cur);
  return lines;
}

// Background wording for the five share themes (theme n uses phrase n)
var PHRASES = [
  "ขอให้ถูกหวย",
  "ขอให้ดวงเฮง",
  "ขอให้เลขที่ซื้อเข้า",
  "ขอให้เป็นเศรษฐีใหม่",
  "ขอให้รับทรัพย์ก้อนโต",
];
// Each spot: [x as share of width, y as share of height, tilt in degrees (+ right, - left), font size]
var WM_LAYOUTS = [
  [
    [0.3, 0.2, -7, 110],
    [0.74, 0.42, 8, 104],
    [0.28, 0.64, 6, 108],
    [0.72, 0.86, -8, 104],
  ],
  [
    [0.72, 0.17, 8, 108],
    [0.26, 0.38, -9, 106],
    [0.75, 0.62, -6, 104],
    [0.3, 0.87, 7, 110],
  ],
  [
    [0.25, 0.14, 6, 104],
    [0.78, 0.33, -8, 108],
    [0.22, 0.58, -7, 106],
    [0.7, 0.84, 9, 104],
  ],
  [
    [0.78, 0.2, -6, 106],
    [0.24, 0.45, 9, 108],
    [0.8, 0.68, 7, 104],
    [0.28, 0.88, -9, 106],
  ],
  [
    [0.35, 0.16, -9, 104],
    [0.7, 0.4, 6, 108],
    [0.3, 0.62, 8, 104],
    [0.74, 0.86, -7, 108],
  ],
];


// Large, faint, tilted wording behind the content. Clamped and clipped so it stays inside the card frame.
function drawWatermark(ctx, W, H, themeIdx, color) {
  var phrase = PHRASES[themeIdx] || PHRASES[0];
  var spots = WM_LAYOUTS[themeIdx] || WM_LAYOUTS[0];
  var pad = 44;
  ctx.save();
  roundRect(ctx, 28, 28, W - 56, H - 56, 28);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.14;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  spots.forEach(function (s) {
    var ang = (s[2] * Math.PI) / 180;
    var size = s[3];
    ctx.font = "600 " + size + 'px Mitr, "Noto Sans Thai", sans-serif';
    var w = ctx.measureText(phrase).width,
      h = size * 1.25;
    var bw = Math.abs(w * Math.cos(ang)) + h * Math.abs(Math.sin(ang));
    var bh = Math.abs(w * Math.sin(ang)) + h * Math.abs(Math.cos(ang));
    var k = Math.min(
      1,
      (W - 2 * pad) / bw,
      (H - 2 * pad) / bh,
      680 / w,
    );
    size = Math.floor(size * k);
    bw *= k;
    bh *= k;
    ctx.font = "600 " + size + 'px Mitr, "Noto Sans Thai", sans-serif';
    var x = Math.min(
      Math.max(s[0] * W, pad + bw / 2),
      W - pad - bw / 2,
    );
    var y = Math.min(
      Math.max(s[1] * H, pad + bh / 2),
      H - pad - bh / 2,
    );
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.fillText(phrase, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

export function renderCard(value, ts, timeText, themeIdx) {
  var S = 2,
    W = 1080,
    H = 720;
  var cv = document.createElement("canvas");
  cv.width = W * S;
  cv.height = H * S;
  var ctx = cv.getContext("2d");
  ctx.scale(S, S);
  var bg = cssVar("--color-bg"),
    panel = cssVar("--color-panel"),
    ink = cssVar("--color-ink"),
    muted = cssVar("--color-muted");
  var line = cssVar("--color-line"),
    cellBg = cssVar("--color-cell"),
    accent = cssVar("--color-accent");
  var L = 80,
    R = W - 80;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  roundRect(ctx, 28, 28, W - 56, H - 56, 28);
  ctx.fillStyle = panel;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = line;
  ctx.stroke();

  drawWatermark(ctx, W, H, themeIdx || 0, accent);

  // top left: title, top right: date and time of the draw
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = ink;
  ctx.font = '600 54px Mitr, "Noto Sans Thai", sans-serif';
  ctx.fillText("เครื่องสุ่มหวย", L, 122);
  if (ts || timeText) {
    var when = ts
      ? fmtWhen({ ts: ts, time: "" })
      : { date: "", time: timeText };
    ctx.textAlign = "right";
    ctx.fillStyle = muted;
    if (when.date) {
      ctx.font = '500 26px "Noto Sans Thai", sans-serif';
      ctx.fillText(when.date, R, 100);
    }
    ctx.font = '500 26px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillText(when.time, R, when.date ? 138 : 120);
  }

  // centre: the digits, one box each like the page
  var n = value.length,
    gap = 14;
  var bw = n <= 2 ? 210 : n === 3 ? 190 : 140;
  var bh = Math.round(bw * 1.2);
  var x0 = (W - (n * bw + (n - 1) * gap)) / 2;
  var cy = 290;
  var fs = Math.round(bh * 0.62);
  for (var i = 0; i < n; i++) {
    var x = x0 + i * (bw + gap);
    roundRect(ctx, x, cy - bh / 2, bw, bh, 18);
    ctx.fillStyle = cellBg;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = accent;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = accent;
    ctx.font = "600 " + fs + 'px Mitr, "Noto Sans Thai", sans-serif';
    ctx.fillText(value.charAt(i), x + bw / 2, cy + fs * 0.36);
  }

  // dashed tear line like the ticket on the page
  ctx.setLineDash([14, 10]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = line;
  ctx.beginPath();
  ctx.moveTo(L, 440);
  ctx.lineTo(R, 440);
  ctx.stroke();
  ctx.setLineDash([]);

  // under the dashed line: digit count and range of this number, a small gap, then the blessing
  var mode =
    MODES.filter(function (m) {
      return m.n === n;
    })[0] || MODES[0];
  var label =
    "เลข " + n + " ตัว (" + mode.range.replace("–", "-") + ")";
  var blessing = "- ขอให้เฮง ขอให้รวย ขอให้หวยถูก";
  var availW = R - 150 - 40 - L;
  ctx.textAlign = "left";
  ctx.fillStyle = ink;
  ctx.font = '600 28px "Noto Sans Thai", sans-serif';
  var labelW = ctx.measureText(label).width;
  ctx.fillText(label, L, 492);
  ctx.font = '500 28px "Noto Sans Thai", sans-serif';
  if (labelW + 24 + ctx.measureText(blessing).width <= availW) {
    ctx.fillText(blessing, L + labelW + 24, 492);
  } else {
    ctx.fillText(blessing, L, 532);
  }

  // bottom left: disclaimer
  ctx.textAlign = "left";
  ctx.fillStyle = muted;
  ctx.font = '400 26px "Noto Sans Thai", sans-serif';
  var lines = wrapLines(
    ctx,
    "สุ่มเพื่อความบันเทิง ผลไม่เกี่ยวกับสลากจริง",
    R - 300 - L,
  );
  var y = 632 - (lines.length - 1) * 38;
  lines.forEach(function (t) {
    ctx.fillText(t, L, y);
    y += 38;
  });

  // bottom right: QR code to the app, always dark on white so it scans
  var qx = R - 150,
    qy = 452,
    qs = 150;
  roundRect(ctx, qx, qy, qs, qs, 14);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  if (typeof qrcode === "function") {
    var qr = qrcode(0, "M");
    qr.addData(APP_URL);
    qr.make();
    var cnt = qr.getModuleCount();
    var cs = qs / (cnt + 8);
    var quiet = 4 * cs;
    ctx.fillStyle = "#000000";
    for (var r = 0; r < cnt; r++) {
      for (var c = 0; c < cnt; c++) {
        if (qr.isDark(r, c))
          ctx.fillRect(
            qx + quiet + c * cs,
            qy + quiet + r * cs,
            cs + 0.6,
            cs + 0.6,
          );
      }
    }
  }
  // under the QR code
  ctx.textAlign = "right";
  ctx.fillStyle = accent;
  ctx.font = '500 21px "Noto Sans Thai", sans-serif';
  ctx.fillText("สแกนเพื่อใช้เครื่องสุ่มหวย", R, 632);
  return cv;
}

