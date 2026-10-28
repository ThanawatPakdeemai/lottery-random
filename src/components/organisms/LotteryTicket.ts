import { Button } from '../atoms/Button';

export function LotteryTicket(): string {
  return `<section class="ticket" aria-label="ผลการสุ่ม">
        <div class="result">
          <div class="meta">
            <span id="metaLeft"><strong>พร้อมสุ่ม</strong></span>
            <span class="rngtxt" id="metaRight">00–99</span>
          </div>
          <div class="display" id="display" data-n="2" role="status" aria-live="polite" aria-atomic="true" aria-label="ยังไม่ได้สุ่ม"></div>
        </div>
        <div class="stub">
          <button class="go" id="go" type="button"></button>
          <div class="row">
            <p class="note">สุ่มเพื่อความบันเทิง ผลไม่เกี่ยวกับสลากจริง</p>
            <div class="actions">
              ${Button('back', 'ย้อนกลับ', true)}
              ${Button('reset', 'รีเซ็ต', true)}
              ${Button('copy', 'คัดลอกเลข', true)}
              ${Button('share', 'แชร์ผลการสุ่ม', true)}
            </div>
          </div>
        </div>
      </section>`;
}
