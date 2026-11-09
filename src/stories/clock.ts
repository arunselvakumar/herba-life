/**
 * Moves the browser clock so `new Date()` and `Date.now()` start at `now`
 * and keep ticking from there. Components that read the clock (relative
 * times, "today", greetings) then match the fixtures on every run. Time still
 * advances, so waitFor() timeouts and animations behave normally.
 * Returns a function that restores the real clock.
 */
export function shiftClock(now: Date): () => void {
  const RealDate = globalThis.Date;
  const offset = now.getTime() - RealDate.now();

  class ShiftedDate extends RealDate {
    constructor(...args: unknown[]) {
      if (args.length === 0) super(RealDate.now() + offset);
      else super(...(args as [string | number | Date]));
    }
    static override now() {
      return RealDate.now() + offset;
    }
  }

  globalThis.Date = ShiftedDate as DateConstructor;
  return () => {
    globalThis.Date = RealDate;
  };
}
