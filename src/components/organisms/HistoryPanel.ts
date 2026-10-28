import { Button } from "../atoms/Button";

export function HistoryPanel(): string {
  return `<section class="hist" aria-label="ประวัติการสุ่ม">
        <div class="hist-head">
          <h2>ประวัติการสุ่ม</h2>
          ${Button("clear", "ล้างประวัติ", true)}
        </div>
        <ol id="histList"></ol>
      </section>`;
}
