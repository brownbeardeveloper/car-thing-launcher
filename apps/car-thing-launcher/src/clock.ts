import type { BridgethingClient } from '@bridgething/client';
import { useEffect, useRef, useState } from 'react';

type TimeInfo = {
  tzIana: string | null;
  locale: string | null;
  wallClockUnixS: number | null;
  utcOffsetMinutes: number | null;
  dstOffsetMinutes: number | null;
};

export type Clock = { ms: number; zone: TimeInfo | null };

export type ClockFields = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  time: string;
  date: string;
};

// the device has no rtc and chromium runs in utc, so the phone's wall clock and zone are the truth when known
export function useClock(client: BridgethingClient): Clock {
  const skew = useRef(0);
  const [zone, setZone] = useState<TimeInfo | null>(null);
  const [ms, setMs] = useState(() => Date.now());

  useEffect(() => {
    const apply = (t: TimeInfo) => {
      if (t.wallClockUnixS != null) {
        const next = t.wallClockUnixS * 1000 - Date.now();
        if (Math.abs(next - skew.current) > 5000) skew.current = next;
      }
      setZone(t);
      setMs(Date.now() + skew.current);
    };
    client.time.get().then(r => r.ok && apply(r.response.time));
    const offSnapshot = client.time.onSnapshot(m => apply(m.time));
    const offChanged = client.time.onChanged(m => apply(m.time));
    const id = setInterval(() => setMs(Date.now() + skew.current), 1000);
    return () => {
      offSnapshot();
      offChanged();
      clearInterval(id);
    };
  }, [client]);

  return { ms, zone };
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(key: string, locale: string, options: Intl.DateTimeFormatOptions) {
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, options);
    formatters.set(key, f);
  }
  return f;
}

function resolveZone(zone: TimeInfo | null): { timeZone: string; shiftMs: number } {
  if (zone?.tzIana) {
    try {
      new Intl.DateTimeFormat('en', { timeZone: zone.tzIana });
      return { timeZone: zone.tzIana, shiftMs: 0 };
    } catch {}
  }
  if (zone?.utcOffsetMinutes != null) {
    return { timeZone: 'UTC', shiftMs: (zone.utcOffsetMinutes + (zone.dstOffsetMinutes ?? 0)) * 60_000 };
  }
  return { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, shiftMs: 0 };
}

function uses12h(locale: string | null) {
  if (!locale) return false;
  try {
    const cycle = new Intl.DateTimeFormat(locale.replace('_', '-'), { hour: 'numeric' }).resolvedOptions().hourCycle;
    return cycle === 'h12' || cycle === 'h11';
  } catch {
    return false;
  }
}

export function clockFields(clock: Clock): ClockFields {
  const { timeZone, shiftMs } = resolveZone(clock.zone);
  const d = new Date(clock.ms + shiftMs);
  const h12 = uses12h(clock.zone?.locale ?? null);

  const parts = formatter(`parts:${timeZone}`, 'en-GB', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(p => p.type === type)?.value ?? 0);
  const [year, month, day, hour, minute] = (['year', 'month', 'day', 'hour', 'minute'] as const).map(part);
  const mm = String(minute).padStart(2, '0');
  const time = h12 ? `${hour % 12 || 12}:${mm}` : `${String(hour).padStart(2, '0')}:${mm}`;

  const date = formatter(`date:${timeZone}`, 'en-GB', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);

  return { year, month, day, hour, minute, time, date };
}

export function greeting(hour: number) {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
