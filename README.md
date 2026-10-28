# เครื่องสุ่มหวย PWA

**Vite + TypeScript (strict) + Tailwind CSS + vite-plugin-pwa** ใช้ **Bun** จัดการแพ็กเกจและ lockfile

หน้าตาส่วนสุ่มเลข ข้อความ ปุ่ม ประวัติ และหน้าต่างแชร์อ้างอิงจาก `เครื่องสุ่มหวย.html` โดยตรง เพิ่มส่วน PWA แยกไว้ใต้ประวัติ โดยใช้สไตล์เดิม แสดงสถานะพร้อมใช้งานออฟไลน์ ปุ่มติดตั้ง และปุ่มอัปเดตเมื่อมีเวอร์ชันใหม่

## เริ่มใช้งาน

ใช้ Bun 1.3 ขึ้นไป และ Node.js 22.12 ขึ้นไปสำหรับเครื่องมือ Vite/Playwright

```bash
bun install --frozen-lockfile
bun run dev
```

โหมดพัฒนาไม่ลงทะเบียน Service Worker เพื่อป้องกันแคชรบกวนการแก้โค้ด ทดสอบ PWA จาก production build:

```bash
bun run build
bun run preview
```

เปิด `http://localhost:4173` ด้วยอินเทอร์เน็ตครั้งแรก และรอข้อความ **พร้อมใช้งานออฟไลน์** จากนั้น reload หรือเปิดแอปใหม่ได้โดยไม่มีอินเทอร์เน็ต ตรวจสถานะได้ที่ DevTools → Application → Service Workers (สถานะ activated) และ Cache Storage

สุ่มเลข ดูประวัติ สร้างรูปแชร์ และสร้าง QR ได้ออฟไลน์ ฟอนต์และไลบรารี QR รวมอยู่ใน build ภายใน origin เดียวกัน ไม่โหลด Google Fonts/CDN ระหว่างใช้งาน

ติดตั้งบน Android/คอมพิวเตอร์ผ่านปุ่ม “ติดตั้งแอป” ด้านล่างประวัติเมื่อเบราว์เซอร์พร้อมให้ติดตั้ง หรือผ่านเมนู “ติดตั้งแอป” ของเบราว์เซอร์ ปุ่มจะเปลี่ยนเป็น “ติดตั้งแล้ว” เมื่อติดตั้งสำเร็จ บน iPhone/iPad ใช้ Safari → แชร์ → เพิ่มไปยังหน้าจอโฮม การคัดลอกและแชร์ไปแอปอื่นขึ้นกับสิทธิ์และการรองรับของเบราว์เซอร์ บันทึกรูปด้วยการกดค้างหรือคลิกขวาตาม UI เดิม

## Deploy

นำไฟล์ใน `dist/` ขึ้น static hosting ที่ใช้ **HTTPS** หรือใช้ localhost เพื่อทดสอบ การเปิดไฟล์ด้วย `file://` หรือ HTTP บน LAN ไม่สามารถลงทะเบียน Service Worker ได้

สำหรับ subdirectory เช่น `https://example.com/lottery/`:

```bash
bun run build --base=/lottery/
```

วางไฟล์ใน `dist/` ใต้ `/lottery/` ตรวจว่า `sw.js` กับ `manifest.webmanifest` เข้าถึงได้จริง ตั้ง `Cache-Control: no-cache` สำหรับ `index.html` และ `sw.js` ส่วนไฟล์ hash ใน `assets/` ใช้ long-lived immutable cache ได้ QR ในรูปแชร์ชี้ไป URL ฐานของแอปที่กำลังเปิดอยู่

ตรวจเวอร์ชันเมื่อเปิดแอป กลับมาออนไลน์ หรือกลับมาที่แท็บ เมื่อมีเวอร์ชันใหม่จะแสดงปุ่ม “อัปเดตแอป” ปุ่มถูกปิดระหว่างสุ่มเพื่อไม่ให้โหลดหน้าซ้ำกลางการสุ่ม หากไม่ได้กดอัปเดต เวอร์ชันใหม่จะรอจนปิดหน้าต่าง/แท็บแอปทั้งหมดแล้วเปิดใหม่

## โครงสร้าง Atomic Design

```text
src/
  components/
    atoms/       Button, Toast
    molecules/   StepGuide
    organisms/   LotteryTicket, HistoryPanel, ShareDialog, PwaStatus
    templates/   AppLayout
  pages/         LotteryPage: พฤติกรรมและการ render แบบเดิม
  domain/        lottery: types, กติกาสุ่ม, ตรวจข้อมูลที่บันทึก
  services/      share-card: Canvas และ QR แบบเดิม
  pwa/           ลงทะเบียน Service Worker และเชื่อมสถานะ PWA
  main.ts        จุดเริ่มแอปและโหลดฟอนต์ภายในเครื่อง
  styles.css     CSS ต้นฉบับ + Tailwind โดยไม่ใช้ preflight/reset
public/icons/    ไอคอนติดตั้ง, maskable และ Apple touch icon
```

เก็บ CSS ต้นฉบับเพื่อรักษาหน้าตาเดิม ใช้ Tailwind `@apply` สำหรับโครงสร้างที่ให้ค่า CSS เท่าเดิม และไม่เปิด preflight ซึ่งจะเปลี่ยนค่าเริ่มต้นของหน้า

## ข้อมูลในเครื่อง

ใช้ localStorage key เดิม `lotto-random-v1` เพื่ออ่านประวัติเดิมเมื่ออยู่ origin เดียวกัน เก็บ 30 รายการล่าสุด พร้อมศูนย์นำหน้า การเปิดคนละ origin หรือย้ายจาก `file://` ไม่ย้ายประวัติอัตโนมัติ การล้างข้อมูลเว็บไซต์อาจลบทั้งประวัติและแคช ต้องเปิดออนไลน์ใหม่เพื่อเตรียมออฟไลน์

## ตรวจสอบ

```bash
bun run typecheck
bun run test
bunx playwright install chromium  # ครั้งแรกหากยังไม่มี browser
bun run build
bun run test:e2e
```

หากใช้ Chrome/Chromium ที่ติดตั้งไว้แล้ว ตั้ง `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` เป็น path ของ executable ได้

- Unit tests: วงจร 2 → 3 → 6, ศูนย์นำหน้า, ย้อนกลับ/รีเซ็ต, ขีดจำกัดประวัติ, ข้อมูลเสีย และ rejection sampling
- Browser tests: production Service Worker, ปิดเน็ตแล้ว reload/เปิดใหม่, สุ่มทุกขนาด, ประวัติ, รูปแชร์ 5 ธีม กรณี storage ใช้ไม่ได้ และวงจรปุ่มติดตั้ง
- Visual regression: เปรียบเทียบ screenshot กับ HTML ต้นฉบับโดยใช้ฟอนต์เดียวกัน ที่ความกว้าง 390/1280 px ทั้ง light/dark mode โดยแยกส่วน PWA ออกจากการเปรียบเทียบกับต้นฉบับ

เอกสาร: [Vite PWA](https://vite-pwa-org.netlify.app/guide/) · [Bun TypeScript](https://bun.sh/docs/runtime/typescript) · [Tailwind CSS](https://tailwindcss.com/docs/installation/using-vite)
