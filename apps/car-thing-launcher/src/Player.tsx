import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { formatTime, VIDEOS } from './videos';

// the device's decoder sometimes stalls in the last fraction of a second without firing ended, so never reach it
const END_MARGIN = 0.5;
const TICK_MS = 250;
const STALL_MS = 1500;

type Props = { index: number; onEnded: () => void; onBack: () => void };

export function Player({ index, onEnded, onBack }: Props) {
  const v = VIDEOS[index];
  const video = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(v.duration ?? 0);
  const [paused, setPaused] = useState(false);
  const ended = useEffectEvent(onEnded);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    setTime(0);
    setDuration(v.duration ?? 0);
    void el.play().catch(() => {});

    let last = -1;
    let stuckSince = performance.now();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      ended();
    };
    const tick = setInterval(() => {
      const now = performance.now();
      setTime(el.currentTime);
      if (el.duration && el.currentTime >= el.duration - END_MARGIN) return finish();
      if (el.paused || el.currentTime !== last) {
        last = el.currentTime;
        stuckSince = now;
      } else if (now - stuckSince > STALL_MS) {
        stuckSince = now;
        el.currentTime = Math.min(el.currentTime + 0.1, el.duration || Infinity);
      }
    }, TICK_MS);
    const onMetadata = () => el.duration && setDuration(el.duration);
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);

    el.addEventListener('ended', finish);
    el.addEventListener('loadedmetadata', onMetadata);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    return () => {
      clearInterval(tick);
      el.removeEventListener('ended', finish);
      el.removeEventListener('loadedmetadata', onMetadata);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [v]);

  const toggle = () => {
    const el = video.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  };

  return (
    <div className="relative h-full w-full bg-black" onClick={toggle}>
      <video
        key={v.src}
        ref={video}
        src={v.src}
        poster={v.poster ?? undefined}
        className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
      />
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="h-0 w-0 border-y-[26px] border-l-[42px] border-y-transparent border-l-fg" />
        </div>
      )}

      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-6 pt-6 pb-10">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onBack();
          }}
          className="text-body text-near active:text-fg">
          ← All videos
        </button>
        <span className="text-eyebrow tracking-wide text-soft uppercase">
          {index + 1} / {VIDEOS.length}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-6 pt-16 pb-7">
        <h2 className="font-display text-hero leading-tight font-semibold tracking-display">{v.title}</h2>
        {v.description && <p className="mt-1 line-clamp-3 text-body text-near">{v.description}</p>}
        <div className="mt-4 h-[4px] overflow-hidden rounded-full bg-rule-strong">
          <div
            className="h-full bg-accent"
            style={{
              width: `${duration ? Math.min(100, (time / duration) * 100) : 0}%`,
              transition: `width ${TICK_MS}ms linear`,
            }}
          />
        </div>
        <div className="mt-2 flex justify-between font-mono text-hint text-soft">
          <span>{formatTime(time)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
