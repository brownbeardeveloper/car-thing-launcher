export type Quote = { text: string; by: string };

export const QUOTES: Quote[] = [
  { text: 'Simplicity is the ultimate sophistication.', by: 'Leonardo da Vinci' },
  { text: 'The secret of getting ahead is getting started.', by: 'Mark Twain' },
  { text: 'We are what we repeatedly do.', by: 'Will Durant' },
  { text: 'Well done is better than well said.', by: 'Benjamin Franklin' },
  { text: 'It always seems impossible until it is done.', by: 'Nelson Mandela' },
  { text: 'Stay hungry. Stay foolish.', by: 'Steve Jobs' },
  { text: 'Do what you can, with what you have, where you are.', by: 'Theodore Roosevelt' },
  { text: 'Small steps every day add up to big results.', by: 'Unknown' },
  { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', by: 'James Clear' },
  { text: 'The best way out is always through.', by: 'Robert Frost' },
  { text: 'Focus is saying no to a hundred good ideas.', by: 'Steve Jobs' },
  { text: 'Nothing will work unless you do.', by: 'Maya Angelou' },
  { text: 'Act as if what you do makes a difference. It does.', by: 'William James' },
  { text: 'How we spend our days is, of course, how we spend our lives.', by: 'Annie Dillard' },
  { text: 'Discipline is choosing between what you want now and what you want most.', by: 'Abraham Lincoln' },
  { text: 'Make each day your masterpiece.', by: 'John Wooden' },
  { text: 'Less, but better.', by: 'Dieter Rams' },
  { text: 'Start where you are. Use what you have. Do what you can.', by: 'Arthur Ashe' },
  { text: 'Energy and persistence conquer all things.', by: 'Benjamin Franklin' },
  { text: 'The journey of a thousand miles begins with one step.', by: 'Lao Tzu' },
  { text: 'Quality is not an act, it is a habit.', by: 'Aristotle' },
  { text: 'What you do today can improve all your tomorrows.', by: 'Ralph Marston' },
  { text: 'Be so good they can’t ignore you.', by: 'Steve Martin' },
  { text: 'Slow is smooth, and smooth is fast.', by: 'Proverb' },
  { text: 'Done is better than perfect.', by: 'Sheryl Sandberg' },
  { text: 'Believe you can and you’re halfway there.', by: 'Theodore Roosevelt' },
  { text: 'Keep your eyes on the stars, and your feet on the ground.', by: 'Theodore Roosevelt' },
  { text: 'The only way to do great work is to love what you do.', by: 'Steve Jobs' },
  { text: 'Courage is grace under pressure.', by: 'Ernest Hemingway' },
  { text: 'Little by little, one travels far.', by: 'J. R. R. Tolkien' },
  { text: 'You miss one hundred percent of the shots you don’t take.', by: 'Wayne Gretzky' },
];

export function dayOfYear(year: number, month: number, day: number) {
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86_400_000);
}

export function daysInYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

// a fixed stride through the list so consecutive days never land on neighbours
export function quoteFor(year: number, doy: number) {
  const i = ((year * 7 + doy) * 11) % QUOTES.length;
  return QUOTES[i];
}
