#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { extname, join, parse, resolve } from 'node:path';

// phone videos are 4k and hundreds of MB, and github refuses files over 100 MB, so every video is encoded once to
// the portrait screen size and that copy is what gets committed; the original is parked in a gitignored folder
const WIDTH = 480;
const HEIGHT = 800;
const FPS = 30;
const INPUT_EXTS = ['.mp4', '.mov', '.m4v', '.webm', '.mkv'];

const dir = resolve(process.argv[2] ?? join(import.meta.dir, '..', 'videos'));
const originals = join(dir, 'originals');
const mb = (file: string) => `${(statSync(file).size / 1e6).toFixed(1)} MB`;

type Stream = { codec_type: string; codec_name: string; width?: number; height?: number };

function hasFfmpeg(): boolean {
  return ['ffmpeg', 'ffprobe'].every(cmd => !spawnSync(cmd, ['-version']).error);
}

function isShrunk(file: string): boolean {
  if (extname(file).toLowerCase() !== '.mp4') return false;
  const args = ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height', '-of', 'json', file];
  const probe = spawnSync('ffprobe', args, { encoding: 'utf8' });
  if (probe.status !== 0) throw new Error(`could not read ${file}: ${probe.stderr.trim()}`);
  const streams: Stream[] = JSON.parse(probe.stdout).streams ?? [];
  const [video] = streams;
  return streams.length === 1 && video.codec_name === 'h264' && video.width === WIDTH && video.height === HEIGHT;
}

function parkingSpot(file: string): string {
  const { name, ext } = parse(file);
  let target = join(originals, file);
  for (let n = 2; existsSync(target); n++) target = join(originals, `${name}-${n}${ext}`);
  return target;
}

function shrink(file: string): void {
  const input = join(dir, file);
  const output = join(dir, `${parse(file).name}.mp4`);
  if (output !== input && existsSync(output)) {
    throw new Error(`videos/${file} would become ${parse(output).base}, but that file already exists; rename one`);
  }
  const partial = `${output}.part`;
  console.log(`shrinking videos/${file} (${mb(input)}) to ${WIDTH}x${HEIGHT}...`);
  const ffmpeg = spawnSync(
    'ffmpeg',
    [
      ['-hide_banner', '-loglevel', 'error', '-stats', '-y', '-i', input],
      ['-map', '0:v:0', '-an', '-map_metadata', '-1'],
      ['-vf', `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},fps=${FPS}`],
      ['-c:v', 'libx264', '-profile:v', 'main', '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'slow'],
      ['-movflags', '+faststart', '-f', 'mp4', partial],
    ].flat(),
    { stdio: 'inherit' },
  );
  if (ffmpeg.status !== 0) {
    rmSync(partial, { force: true });
    throw new Error(`ffmpeg could not convert videos/${file}`);
  }
  mkdirSync(originals, { recursive: true });
  const parked = parkingSpot(file);
  renameSync(input, parked);
  renameSync(partial, output);
  console.log(
    `  done: videos/${parse(output).base} is ${mb(output)}; the original is in videos/originals/${parse(parked).base}`,
  );
}

if (existsSync(dir)) {
  for (const f of readdirSync(dir)) if (f.endsWith('.part')) rmSync(join(dir, f));
  const videos = readdirSync(dir).filter(f => INPUT_EXTS.includes(extname(f).toLowerCase()));

  if (videos.length && !hasFfmpeg()) {
    console.warn('ffmpeg is not installed, so videos are used as they are. install it with: brew install ffmpeg');
  } else {
    try {
      for (const file of videos) if (!isShrunk(join(dir, file))) shrink(file);
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }
}
