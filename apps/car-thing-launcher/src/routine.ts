export type Step = { at: string; title: string; note?: string };

export const ROUTINE: Step[] = [
  { at: '06:30', title: 'Wake up', note: 'Water, stretch, daylight' },
  { at: '07:00', title: 'Breakfast', note: 'No screens' },
  { at: '08:00', title: 'Commute', note: 'Podcast or silence' },
  { at: '09:00', title: 'Deep work', note: 'One thing at a time' },
  { at: '12:00', title: 'Lunch', note: 'Step outside' },
  { at: '13:00', title: 'Meetings & email' },
  { at: '17:00', title: 'Workout' },
  { at: '19:00', title: 'Dinner' },
  { at: '21:00', title: 'Read', note: 'Paper, not glass' },
  { at: '22:30', title: 'Wind down', note: 'Lights low, phone away' },
];

export function minutesOf(at: string) {
  const [h, m] = at.split(':').map(Number);
  return h * 60 + m;
}

// the day wraps, so before the first step it is still the last step of yesterday
export function currentStep(nowMin: number) {
  let index = ROUTINE.length - 1;
  for (let i = 0; i < ROUTINE.length; i++) if (minutesOf(ROUTINE[i].at) <= nowMin) index = i;
  const start = minutesOf(ROUTINE[index].at);
  const next = ROUTINE[(index + 1) % ROUTINE.length];
  const end = minutesOf(next.at);
  const span = (end - start + 1440) % 1440 || 1440;
  const elapsed = (nowMin - start + 1440) % 1440;
  return { index, next, progress: elapsed / span, remaining: span - elapsed };
}
