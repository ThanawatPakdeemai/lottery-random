import { Button } from "../atoms/Button";

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
          ${Button("shareClose", "ปิด")}
        </div>
        <img id="shareImg" alt="รูปผลการสุ่มหวย" width="1080" height="720" />
        <div class="sheet-body">
          <p class="text-sm text-muted">ธีมแชร์รูป</p>
          <div
            class="themes"
            id="themes"
            role="group"
            aria-label="เลือกธีม"
          ></div>
        </div>
        <p id="shareInfo" class="info my-3 text-sm text-muted"></p>
        <div class="actions">
          <button class="ghost share-save" id="shareSave" type="button" disabled>บันทึกรูป</button>
          ${Button("shareNative", "แชร์ไปแอปอื่น", true)}
        </div>
      </div>
    </div>`;
}
