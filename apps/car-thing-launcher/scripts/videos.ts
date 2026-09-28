import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, parse, resolve } from 'node:path';
import { normalizePath, type Plugin } from 'vite';

const MODULE_ID = 'virtual:videos';
const RESOLVED_ID = `\0${MODULE_ID}`;
const LIST_FILE = 'videos.json';
const VIDEO_EXTS = ['.mp4'];
const POSTER_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

type Entry = { file: string; title?: string; description?: string };

// turns a folder of videos plus an optional videos.json into `import videos from 'virtual:videos'`, so adding a
// video never means touching code; every mistake fails the build instead of blanking the device screen
export function videos(folder = 'videos'): Plugin {
  let dir = '';
  return {
    name: 'videos',
    configResolved(config) {
      dir = resolve(config.root, folder);
    },
    resolveId(id) {
      if (id === MODULE_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id !== RESOLVED_ID) return;
      try {
        return generate(dir, folder);
      } catch (err) {
        this.error(err instanceof Error ? err.message : String(err));
      }
    },
    configureServer(server) {
      server.watcher.add(dir);
      const reload = (path: string) => {
        if (!path.startsWith(dir)) return;
        const { moduleGraph } = server.environments.client;
        const mod = moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', reload).on('unlink', reload).on('change', reload);
    },
  };
}

function generate(dir: string, folder: string): string {
  const files = existsSync(dir) ? readdirSync(dir).sort() : [];
  const clips = files.filter(f => VIDEO_EXTS.includes(extname(f).toLowerCase()));
  // shrinking turns beach.mov into beach.mp4, so a listed name matches any clip with the same base name
  const listed = readList(dir, folder).map(entry => {
    const file = clips.includes(entry.file) ? entry.file : clips.find(c => parse(c).name === parse(entry.file).name);
    if (!file)
      throw new Error(`${folder}/${LIST_FILE} lists "${entry.file}" but ${folder}/${entry.file} does not exist`);
    return { ...entry, file };
  });
  const unlisted = clips.filter(file => !listed.some(e => e.file === file)).map(file => ({ file }));
  const entries: Entry[] = [...listed, ...unlisted];
  if (!entries.length) throw new Error(`${folder}/ has no videos; put an .mp4 file in it`);

  const imports: string[] = [];
  const items = entries.map((entry, i) => {
    const name = parse(entry.file).name;
    const poster = files.find(f => parse(f).name === name && POSTER_EXTS.includes(extname(f).toLowerCase()));
    imports.push(`import src${i} from ${JSON.stringify(`${normalizePath(join(dir, entry.file))}?url`)};`);
    if (poster) imports.push(`import poster${i} from ${JSON.stringify(`${normalizePath(join(dir, poster))}?url`)};`);
    const title = JSON.stringify(entry.title?.trim() || titleFromFile(entry.file));
    const description = JSON.stringify(entry.description?.trim() ?? '');
    const duration = mp4Duration(readFileSync(join(dir, entry.file))) ?? null;
    const posterRef = poster ? `poster${i}` : 'null';
    return `  { src: src${i}, poster: ${posterRef}, title: ${title}, description: ${description}, duration: ${duration} },`;
  });

  return `${imports.join('\n')}\nexport default [\n${items.join('\n')}\n];\n`;
}

function readList(dir: string, folder: string): Entry[] {
  const path = join(dir, LIST_FILE);
  const where = `${folder}/${LIST_FILE}`;
  if (!existsSync(path)) return [];

  let data: unknown;
  try {
    data = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`${where} is not valid JSON (${reason}). look for a missing or extra comma or quote`);
  }
  if (!Array.isArray(data)) {
    throw new Error(`${where} must be a list like [{ "file": "video1.mp4", "title": "My video" }]`);
  }

  const seen = new Set<string>();
  return data.map((raw: Record<string, unknown>, i) => {
    const at = `${where}, entry ${i + 1}`;
    if (typeof raw?.file !== 'string' || !raw.file) throw new Error(`${at} needs a "file", like "video1.mp4"`);
    if (seen.has(raw.file)) throw new Error(`${at}: "${raw.file}" is listed more than once`);
    seen.add(raw.file);
    for (const key of ['title', 'description']) {
      if (raw[key] != null && typeof raw[key] !== 'string') throw new Error(`${at}: "${key}" must be text in quotes`);
    }
    return raw as Entry;
  });
}

function titleFromFile(file: string): string {
  const words = parse(file).name.replace(/[_-]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// seconds from the movie header box (moov > mvhd); undefined when the file is not a readable mp4
function mp4Duration(buf: Buffer): number | undefined {
  const find = (start: number, end: number, type: string) => {
    for (let at = start; at + 8 <= end;) {
      let size = buf.readUInt32BE(at);
      let header = 8;
      if (size === 1) {
        size = Number(buf.readBigUInt64BE(at + 8));
        header = 16;
      } else if (size === 0) {
        size = end - at;
      }
      if (size < header) return;
      if (buf.toString('latin1', at + 4, at + 8) === type) return { start: at + header, end: Math.min(at + size, end) };
      at += size;
    }
  };
  try {
    const moov = find(0, buf.length, 'moov');
    const mvhd = moov && find(moov.start, moov.end, 'mvhd');
    if (!mvhd) return;
    const v1 = buf[mvhd.start] === 1;
    const timescale = buf.readUInt32BE(mvhd.start + (v1 ? 20 : 12));
    const units = v1 ? Number(buf.readBigUInt64BE(mvhd.start + 24)) : buf.readUInt32BE(mvhd.start + 16);
    return timescale ? units / timescale : undefined;
  } catch {
    return;
  }
}
