import { greeting, type ClockFields } from '../clock';

export function Welcome({ f }: { f: ClockFields }) {
  return (
    <div className="flex h-full flex-col items-center justify-center pb-6">
      <p className="text-[17px] font-medium text-soft">{f.date}</p>
      <p className="mt-1 text-[164px] leading-none font-extralight tracking-[-0.045em] tabular-nums">{f.time}</p>
      <p className="mt-5 text-[26px] font-light tracking-[-0.01em] text-near">{greeting(f.hour)}</p>
    </div>
  );
}
