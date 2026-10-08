import { layoutUiScale } from "./settings";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

function layoutHeight(viewW: number, viewH: number, monitorW = viewW, monitorH = viewH): number {
  return viewH / layoutUiScale(viewW, viewH, monitorW, monitorH);
}

check(layoutUiScale(1920, 1080, 1920, 1080) === 1.5, "1080p fullscreen keeps a 1280×720 layout");
check(layoutHeight(1920, 1080) >= 720, "1080p layout height stays at the reference");
check(layoutUiScale(2560, 1440, 2560, 1440) === 2, "1440p fullscreen still uses half the monitor");
check(layoutUiScale(3840, 2160, 3840, 2160) === 2, "4K fullscreen stays at half-monitor scale");
check(layoutUiScale(1366, 768, 1366, 768) === 1.05, "a short laptop does not scale the layout away");
check(layoutHeight(1366, 768) >= 720, "a short laptop keeps the reference layout height");
check(layoutUiScale(1280, 720, 1920, 1080) === 1, "a reference-sized window stays at scale 1");
check(layoutUiScale(2560, 1080, 2560, 1080) === 1.5, "a short ultrawide is limited by height");
check(layoutHeight(2560, 1080) >= 720, "a short ultrawide keeps the reference layout height");
check(layoutUiScale(1280, 720, 1280, 720) === 1, "a 720p monitor is not scaled up");
check(layoutUiScale(800, 500, 800, 500) === 0.75, "scale does not drop below the minimum");

if (failed > 0) throw new Error(`${failed} ui scale checks failed`);
console.log("ui scale checks passed");
