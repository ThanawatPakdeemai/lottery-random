# เครื่องสุ่มหวย PWA

แปลงจาก `เครื่องสุ่มหวย.html` เป็น **Vite + JavaScript modules + Tailwind CSS v4 + vite-plugin-pwa** เก็บต้นฉบับไว้สำหรับอ้างอิง

## เริ่มใช้งาน

ต้องมี Node.js 22.12 ขึ้นไป และ npm

```bash
npm ci
npm run dev
```

โหมดพัฒนาไม่มี Service Worker เพื่อไม่ให้แคชรบกวนการแก้โค้ด ทดสอบ PWA ด้วย production build:

```bash
npm run build
npm run preview
```

เปิด URL ที่ Vite แสดง (ปกติ `http://localhost:4173`) ขณะออนไลน์ รอข้อความ **พร้อมใช้งานออฟไลน์** จากนั้นปิดเน็ตและ reload/เปิดแอปใหม่ได้ สุ่มเลข ดูประวัติ สร้าง QR และบันทึกรูป PNG ได้โดยไม่ต้องเรียก CDN หรือ API

ติดตั้งผ่านปุ่ม “ติดตั้งแอป” ในเบราว์เซอร์ที่รองรับ หรือใช้เมนูติดตั้งของเบราว์เซอร์ สำหรับ iOS ใช้ Safari → แชร์ → เพิ่มไปยังหน้าจอโฮม การแชร์ไปแอปอื่น/คัดลอกภาพขึ้นกับความสามารถและสิทธิ์ของเบราว์เซอร์ มีปุ่มบันทึกรูปเป็นทางเลือก

## Deploy

อัปโหลดโฟลเดอร์ `dist/` ไป static hosting ที่ใช้ **HTTPS** (หรือใช้ localhost เพื่อพัฒนา) การเปิดไฟล์ด้วย `file://` ไม่สามารถติดตั้ง Service Worker ได้ และการเปิดผ่าน HTTP บน LAN ไม่รองรับ PWA

หากใช้ subdirectory เช่น `https://example.com/lottery/`:

```bash
npm run build -- --base=/lottery/
```

วางไฟล์ใน `dist/` ใต้ `/lottery/` และให้ hosting ส่ง `index.html` สำหรับเส้นทางแอป ตรวจว่า `sw.js`/`manifest.webmanifest` เข้าถึงได้จริง และตั้ง `Cache-Control: no-cache` ให้ `sw.js` กับ `index.html`; ไฟล์ hash ใต้ `assets/` ใช้ long-lived immutable cache ได้ QR ในรูปแชร์จะชี้ URL ฐานของแอปที่กำลังเปิดอยู่ ไม่ใช้ URL ของต้นฉบับ

เมื่อ deploy เวอร์ชันใหม่ แอปแจ้งปุ่ม “อัปเดตแอป” ผู้ใช้เลือกอัปเดตเอง และปุ่มจะถูกปิดระหว่างสุ่ม จึงไม่โหลดหน้าใหม่กลางการสุ่ม แอปตรวจเวอร์ชันเมื่อกลับมาหน้าแอปหรือกลับมาออนไลน์

## Atomic Design

```text
src/
  components/
    atoms/       Button, Digit, Toast
    molecules/   StepGuide, NumberDisplay, HistoryRow
    organisms/   LotteryTicket, HistoryPanel, ShareDialog, PwaStatus
    templates/   AppLayout
  pages/         LotteryPage: ประกอบหน้าจอและจัดการ interaction
  domain/        lottery: กติกาสุ่ม, ลำดับรอบ, ตรวจข้อมูล
  services/      storage, share-card: localStorage และ Canvas/QR
  pwa/           ลงทะเบียน Service Worker และวงจรอัปเดต
  styles.css     Tailwind theme, base และปุ่มที่ใช้ร่วมกัน
public/icons/    ไอคอนติดตั้ง, maskable, Apple touch icon
```

UI ใช้ Tailwind utilities; CSS ส่วนกลางมีเฉพาะ theme, base, dark mode, reduced motion และปุ่มที่ใช้ร่วมกัน ฟอนต์จาก Fontsource และ QR จาก npm ถูกรวมใน build และ precache ภายใน origin เดียวกัน

## ข้อมูลและพฤติกรรม

- สุ่ม 2 → 3 → 6 ตัวด้วย `crypto.getRandomValues` และ rejection sampling เพื่อไม่ให้เกิด modulo bias เก็บศูนย์นำหน้าเป็น string
- เก็บประวัติ 30 รายการล่าสุด กดรายการเพื่อสร้างรูปย้อนหลังได้ รูปแชร์มี 5 ธีม
- ย้อนกลับ/รีเซ็ตลำดับโดยคงประวัติ และล้างประวัติแยกได้
- ใช้ localStorage key เดิม `lotto-random-v1` เพื่ออ่านข้อมูลเดิมได้ **เมื่ออยู่ origin เดียวกัน** ข้อมูลจากไฟล์ `file://` หรือคนละ origin ไม่ย้ายข้ามอัตโนมัติ
- ตรวจข้อมูลที่โหลดและรองรับ localStorage เสียหาย/ถูกปิด หากบันทึกไม่ได้จะแจ้งผู้ใช้และทำงานในหน่วยความจำ
- ประวัติและแคชอยู่ในอุปกรณ์/เบราว์เซอร์นี้ การล้างข้อมูลเว็บหรือการลบแคชโดยระบบอาจทำให้ต้องเปิดออนไลน์ใหม่
- สุ่มเพื่อความบันเทิง ผลไม่เกี่ยวกับสลากจริง

## ทดสอบ

```bash
npm test
npx playwright install chromium   # ครั้งแรกหากยังไม่มี browser
npm run build
npm run test:e2e
```

หากต้องใช้ Chromium ที่มีอยู่แล้ว กำหนด `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` เป็น path ของ executable ก่อนรัน E2E ได้

Unit tests ครอบคลุมวงจรสุ่ม ศูนย์นำหน้า ย้อนกลับ รีเซ็ต ขีดจำกัดประวัติ การอ่านข้อมูลเก่า/ข้อมูลเสีย และ rejection sampling ส่วน Playwright ใช้ production preview ตรวจ manifest/icons, ปิดเน็ตแล้ว reload/เปิดหน้าใหม่, สุ่มทุกขนาด, บันทึก/คืนประวัติ, สร้างและดาวน์โหลดรูปทุกธีม, จอเล็ก, dark mode, reduced motion และป้องกันกดสุ่มซ้ำระหว่าง animation

เอกสารอ้างอิง: [Vite PWA](https://vite-pwa-org.netlify.app/guide/) · [Tailwind CSS with Vite](https://tailwindcss.com/docs/installation/using-vite)
# lottery-random
