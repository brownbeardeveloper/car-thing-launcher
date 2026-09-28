import { useEffect, useState } from 'react';
import { Home } from './Home';
import { Player } from './Player';
import { VIDEOS } from './videos';

const HOME = -1;
const LAST = VIDEOS.length - 1;
// the panel is 800x480 landscape but the device is held standing with the dial at the bottom, so turn the ui a
// quarter counterclockwise; for dial on top use 'translate(800px, 0) rotate(90deg)'
const STANDING = 'translate(0, 480px) rotate(-90deg)';

export default function App() {
  // HOME or the index of the playing video
  const [view, setView] = useState(HOME);

  useEffect(() => {
    // left of the first video is the start page, right of the last stays put
    const step = (dir: number) => setView(v => Math.max(HOME, Math.min(LAST, v + dir)));

    // a rotary detent is one big delta, a trackpad swipe is a stream of small ones, so gate the stream
    let acc = 0;
    let quietUntil = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      const now = performance.now();
      if (Math.abs(e.deltaX) >= 30) {
        step(Math.sign(e.deltaX));
        return;
      }
      if (now < quietUntil) {
        quietUntil = now + 200;
        return;
      }
      acc += e.deltaX;
      if (Math.abs(acc) >= 40) {
        step(Math.sign(acc));
        acc = 0;
        quietUntil = now + 200;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const preset = ['1', '2', '3', '4'].indexOf(e.key);
      if (preset >= 0 && preset <= LAST) setView(preset);
      else if (e.key === 'Escape') setView(HOME);
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div
      className="absolute top-0 left-0 h-[800px] w-[480px] origin-top-left overflow-hidden bg-screen"
      style={{ transform: STANDING }}>
      {view === HOME ? (
        <Home onPlay={setView} />
      ) : (
        <Player index={view} onEnded={() => setView(v => (v < LAST ? v + 1 : HOME))} onBack={() => setView(HOME)} />
      )}
    </div>
  );
}
