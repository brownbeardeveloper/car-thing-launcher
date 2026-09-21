import type { ClockFields } from '../clock';
import { dayOfYear, daysInYear, quoteFor } from '../quotes';

export function Motivation({ f }: { f: ClockFields }) {
  const doy = dayOfYear(f.year, f.month, f.day);
  const total = daysInYear(f.year);
  const quote = quoteFor(f.year, doy);

  return (
    <div className="flex h-full flex-col justify-center px-20 pb-6">
      <p className="text-[13px] font-semibold tracking-[0.12em] text-accent uppercase">Today’s thought</p>
      <blockquote className="mt-5 text-[40px] leading-[1.18] font-medium tracking-[-0.025em] text-balance">
        {quote.text}
      </blockquote>
      <p className="mt-5 text-[19px] font-light text-soft">{quote.by}</p>

      <div className="mt-12 flex items-center gap-5">
        <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-rule-strong">
          <div className="h-full rounded-full bg-fg" style={{ width: `${(doy / total) * 100}%` }} />
        </div>
        <span className="text-[14px] text-dim tabular-nums">
          Day {doy} of {total}
        </span>
      </div>
    </div>
  );
}
