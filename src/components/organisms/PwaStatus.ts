import { Button } from "../atoms/Button";

type InstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaStatus(): string {
  return `<section id="pwaStatus" class="pwa-status" aria-label="ติดตั้งและใช้งานออฟไลน์">
    <p id="pwaMessage" class="note" role="status">กำลังเตรียมใช้งานออฟไลน์…</p>
    <div class="actions">
      ${Button("installApp", "ติดตั้งแอป", true)}
      <button class="ghost" id="updateApp" type="button" hidden>อัปเดตแอป</button>
    </div>
    <details class="mt-2 text-xs text-muted">
      <summary class="cursor-pointer">วิธีติดตั้งและใช้งานออฟไลน์</summary>
      <p class="mt-2 leading-6 text-ink"><b>สุ่มเลขได้แม้ไม่มีเน็ต</b><br>
        ใช้ได้ทั้ง iOS และ Android หรือ กดปุ่มติดตั้งเพื่อลงแอปในเครื่อง ประวัติการสุ่มจะเก็บไว้เฉพาะในอุปกรณ์นี้<br>
        iPhone/iPad: Safari → แชร์ → เพิ่มไปยังหน้าจอโฮม<br>
        Android: Chrome → เมนู → เพิ่มไปยังหน้าจอโฮม
      </p>
      <p class="text-ink"><b>ไม่มีเก็บข้อมูลส่วนตัว ปลอดภัยหายห่วง</b></p>
    </details>
    <p id="pwaHelp" class="note" role="status" hidden></p>
  </section>`;
}

export function connectPwaStatus() {
  function element<T extends HTMLElement>(id: string): T {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Missing PWA element: ${id}`);
    return node as T;
  }
  const message = element<HTMLParagraphElement>("pwaMessage");
  const help = element<HTMLParagraphElement>("pwaHelp");
  const install = element<HTMLButtonElement>("installApp");
  const update = element<HTMLButtonElement>("updateApp");
  const draw = element<HTMLButtonElement>("go");
  const displayMode = window.matchMedia("(display-mode: standalone)");
  let installed =
    displayMode.matches ||
    !!(navigator as Navigator & { standalone?: boolean }).standalone;
  let installPrompt: InstallPromptEvent | null = null;
  let ready = false;
  let waiting = false;
  let issue = "";
  let updater: (() => Promise<void>) | undefined;

  function render(): void {
    const network = navigator.onLine ? "🟢" : "🔴";
    message.textContent =
      issue ||
      `${network} · ${ready ? "พร้อมใช้งานออฟไลน์" : "กำลังเตรียมใช้งานออฟไลน์…"}${waiting ? " · มีเวอร์ชันใหม่" : ""}`;
    install.disabled = installed || !installPrompt;
    install.textContent = installed ? "ติดตั้งแล้ว" : "ติดตั้งแอป";
    update.hidden = !waiting;
    update.disabled = draw.disabled;
  }
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event as InstallPromptEvent;
    render();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    installPrompt = null;
    render();
  });
  displayMode.addEventListener("change", (event) => {
    installed = event.matches;
    render();
  });
  window.addEventListener("online", render);
  window.addEventListener("offline", render);
  new MutationObserver(render).observe(draw, {
    attributes: true,
    attributeFilter: ["disabled"],
  });
  install.addEventListener("click", async () => {
    if (!installPrompt) return;
    const prompt = installPrompt;
    installPrompt = null;
    render();
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      help.hidden = false;
      help.textContent =
        "ติดตั้งไม่สำเร็จ ลองเลือกติดตั้งแอปจากเมนูของเบราว์เซอร์";
    }
    render();
  });
  update.addEventListener("click", async () => {
    if (draw.disabled || !updater) return;
    update.disabled = true;
    try {
      await updater();
    } catch {
      help.hidden = false;
      help.textContent = "อัปเดตไม่สำเร็จ กรุณาลองอีกครั้ง";
      render();
    }
  });
  render();
  return {
    offlineReady(): void {
      ready = true;
      issue = "";
      render();
    },
    needRefresh(): void {
      waiting = true;
      render();
    },
    setUpdater(callback: () => Promise<void>): void {
      updater = callback;
    },
    error(): void {
      issue = "เตรียมใช้งานออฟไลน์ไม่สำเร็จ กรุณาเปิดแอปใหม่ขณะมีอินเทอร์เน็ต";
      render();
    },
    development(): void {
      issue = "โหมดพัฒนา · ทดสอบออฟไลน์ด้วย bun run build และ bun run preview";
      render();
    },
    unsupported(): void {
      issue =
        "ใช้งานออฟไลน์ต้องเปิดผ่าน HTTPS หรือ localhost และใช้เบราว์เซอร์ที่รองรับ Service Worker";
      render();
    },
  };
}
