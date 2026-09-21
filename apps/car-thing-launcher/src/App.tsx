import { BridgethingClient } from '@bridgething/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { clockFields, useClock } from './clock';
import { daemonUrl } from './daemon';
import { Motivation } from './pages/Motivation';
import { Today } from './pages/Today';
import { Welcome } from './pages/Welcome';

const PAGES = [Welcome, Today, Motivation];
const WIDTH = 800;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export default function App() {
  const client = useMemo(() => new BridgethingClient({ url: daemonUrl() }), []);
  const f = clockFields(useClock(client));

  const [page, setPage] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const pageRef = useRef(page);
  pageRef.current = page;

  useEffect(() => {
    const go = (next: number) => setPage(Math.max(0, Math.min(PAGES.length - 1, next)));

    // a rotary detent is one big delta, a trackpad swipe is a stream of small ones, so gate the stream
    let acc = 0;
    let quietUntil = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      const now = performance.now();
      if (Math.abs(e.deltaX) >= 30) {
        go(pageRef.current + Math.sign(e.deltaX));
        return;
      }
      if (now < quietUntil) {
        quietUntil = now + 200;
        return;
      }
      acc += e.deltaX;
      if (Math.abs(acc) >= 40) {
        go(pageRef.current + Math.sign(acc));
        acc = 0;
        quietUntil = now + 200;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= PAGES.length) go(n - 1);
      else if (e.key === 'Escape') go(0);
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const start = useRef<{ x: number; id: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (start.current?.id !== e.pointerId) return;
    let dx = e.clientX - start.current.x;
    // rubber band past the first and last page
    if ((page === 0 && dx > 0) || (page === PAGES.length - 1 && dx < 0)) dx /= 3;
    setDrag(dx);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (start.current?.id !== e.pointerId) return;
    start.current = null;
    if (drag !== null && Math.abs(drag) > 80) {
      setPage(p => Math.max(0, Math.min(PAGES.length - 1, p - Math.sign(drag))));
    }
    setDrag(null);
  };

  const offset = -page * WIDTH + (drag ?? 0);

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-screen"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}>
      <div
        className="flex h-full will-change-transform"
        style={{
          width: WIDTH * PAGES.length,
          transform: `translate3d(${offset}px,0,0)`,
          transition: drag === null ? `transform 650ms ${EASE}` : 'none',
        }}>
        {PAGES.map((Page, i) => {
          const active = i === page;
          return (
            <section
              key={i}
              aria-hidden={!active}
              className="h-full shrink-0"
              style={{
                width: WIDTH,
                opacity: active ? 1 : 0.25,
                transform: `scale(${active ? 1 : 0.94})`,
                transition: `opacity 650ms ${EASE}, transform 650ms ${EASE}`,
              }}>
              <Page f={f} />
            </section>
          );
        })}
      </div>

      <nav className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        {PAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Page ${i + 1}`}
            onClick={() => setPage(i)}
            onPointerDown={e => e.stopPropagation()}
            className="h-[7px] rounded-full bg-fg"
            style={{
              width: i === page ? 22 : 7,
              opacity: i === page ? 0.9 : 0.28,
              transition: `width 450ms ${EASE}, opacity 450ms ${EASE}`,
            }}
          />
        ))}
      </nav>
    </div>
  );
}
