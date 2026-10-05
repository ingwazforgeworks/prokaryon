import { bootMark } from "./boot";

bootMark("scripts", 0.2);

void import("./main").catch((error: unknown) => {
  console.error(error);
  const report = (window as Window & { __boot?: (fraction: number, label?: string) => void }).__boot;
  const message = error instanceof Error ? error.message : "Could not load";
  report?.(0.2, message);
});
