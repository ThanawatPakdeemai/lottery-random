import { StepGuide } from "../molecules/StepGuide";
import { LotteryTicket } from "../organisms/LotteryTicket";
import { HistoryPanel } from "../organisms/HistoryPanel";
import { ShareDialog } from "../organisms/ShareDialog";
import { PwaStatus } from "../organisms/PwaStatus";
import { Toast } from "../atoms/Toast";

export function AppLayout(): string {
  return `<div class="wrap"><header>
        <h1>เครื่องสุ่มหวย</h1>
        <p class="sub">
          กดปุ่มเดียว สุ่มต่อเนื่องเป็นรอบ 2 ตัว → 3 ตัว → 6 ตัว
        </p>
      </header>
    ${StepGuide()}
    ${LotteryTicket()}
    ${HistoryPanel()}
    <footer id="appFooter" class="grid gap-5">
      <p class="text-center text-xs text-muted m-0">เก็บประวัติ 30 รายการล่าสุดไว้ในอุปกรณ์นี้</p>
      ${PwaStatus()}
    </footer>
  </div>
  ${Toast()}
  ${ShareDialog()}`;
}
