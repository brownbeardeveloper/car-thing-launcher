import type { ClockFields } from '../clock';
import { currentStep, ROUTINE } from '../routine';

function duration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function Today({ f }: { f: ClockFields }) {
  const { index, next, progress, remaining } = currentStep(f.hour * 60 + f.minute);
  const step = ROUTINE[index];
  const shown = [-1, 0, 1, 2, 3].map(o => ({ offset: o, step: ROUTINE[(index + o + ROUTINE.length) % ROUTINE.length] }));

  return (
    <div className="grid h-full grid-cols-[1fr_300px] items-center gap-12 px-14 pb-6">
      <div>
        <p className="text-[13px] font-semibold tracking-[0.12em] text-accent uppercase">Now</p>
        <h2 className="mt-2 text-[52px] leading-[1.05] font-semibold tracking-[-0.03em]">{step.title}</h2>
        {step.note && <p className="mt-3 text-[19px] font-light text-soft">{step.note}</p>}
        <div className="mt-9 h-[5px] w-full overflow-hidden rounded-full bg-rule-strong">
          <div
            className="h-full rounded-full bg-fg transition-[width] duration-1000 ease-out"
            style={{ width: `${Math.max(2, progress * 100)}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-[14px] text-dim tabular-nums">
          <span>{duration(remaining)} left</span>
          <span>
            {next.title} at {next.at}
          </span>
        </div>
      </div>

      <ol className="flex flex-col">
        {shown.map(({ offset, step }) => (
          <li
            key={offset}
            className={`flex items-baseline gap-5 rounded-2xl px-5 py-[13px] ${offset === 0 ? 'bg-neutral-soft' : ''}`}>
            <span
              className={`w-12 shrink-0 text-[15px] tabular-nums ${offset === 0 ? 'text-accent' : offset < 0 ? 'text-edge' : 'text-dim'}`}>
              {step.at}
            </span>
            <span
              className={`truncate text-[19px] ${offset === 0 ? 'font-medium text-fg' : offset < 0 ? 'text-edge line-through decoration-1' : 'text-soft'}`}>
              {step.title}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
