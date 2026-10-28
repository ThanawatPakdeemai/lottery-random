import { Button } from '../atoms/Button';

export function ShareDialog(): string {
  return `<div class="shade" id="shade" hidden>
      <div
        class="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shareTitle"
      >
        <div class="sheet-head">
          <h2 id="shareTitle">รูปผลการสุ่ม</h2>
          ${Button('shareClose', 'ปิด')}
        </div>
        <img id="shareImg" alt="รูปผลการสุ่มหวย" width="1080" height="720" />
        <h3 class="theme-title">ธีม · รูปผลสุ่มหวย</h3>
        <div
          class="themes"
          id="themes"
          role="group"
          aria-label="เลือกธีม"
        ></div>
        <p class="note" id="shareInfo"></p>
        <p class="note">
          <b
            >บนมือถือให้กดค้างที่รูปแล้วเลือกบันทึกรูป
            บนคอมพิวเตอร์คลิกขวาที่รูปแล้วเลือกบันทึกรูปภาพ</b
          >
        </p>
        <div class="actions">
          ${Button('shareCopy', 'คัดลอกรูป')}
          <button class="ghost" id="shareNative" type="button" hidden>
            แชร์ไปแอปอื่น
          </button>
        </div>
      </div>
    </div>`;
}
