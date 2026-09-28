import { formatTime, VIDEOS, type Video } from './videos';

export function Home({ onPlay }: { onPlay: (index: number) => void }) {
  return (
    <div className="flex h-full w-full flex-col bg-screen">
      <header className="px-7 pt-9 pb-5">
        <h1 className="font-display text-screen-title font-semibold tracking-display">Videos</h1>
        <p className="mt-1 text-body text-soft">Turn the dial or tap a video</p>
      </header>
      <ul className="flex flex-1 flex-col gap-4 overflow-y-auto px-7 pb-7 [scrollbar-width:none]">
        {VIDEOS.map((v, i) => (
          <li key={v.src}>
            <button
              type="button"
              onClick={() => onPlay(i)}
              className="flex w-full items-center gap-5 text-left active:scale-[0.98] active:opacity-80">
              <div className="relative h-[142px] w-[80px] shrink-0 overflow-hidden rounded-[12px] bg-neutral-soft">
                <Thumbnail video={v} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-title font-medium">{v.title}</p>
                {v.description && <p className="mt-1 line-clamp-2 text-body text-soft">{v.description}</p>}
                {v.duration !== null && <p className="mt-2 font-mono text-hint text-dim">{formatTime(v.duration)}</p>}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Thumbnail({ video }: { video: Video }) {
  const className = 'h-full w-full object-cover';
  if (video.poster) return <img src={video.poster} alt="" className={className} draggable={false} />;
  // no poster image: let the decoder paint a frame half a second in, past any fade from black
  return <video src={`${video.src}#t=0.5`} className={className} muted playsInline preload="metadata" />;
}
