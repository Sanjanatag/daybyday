export const DAILY_QUOTES = [
  'Small steps every day beat perfect plans on paper.',
  'Consistency is the bridge between goals and accomplishment.',
  'Your future self is watching — make them proud.',
  'Progress, not perfection, builds unstoppable habits.',
  'Show up today. Motivation follows action.',
  'Discipline is choosing what you want most over what you want now.',
  'One focused hour beats a week of distracted effort.',
  'The streak is proof you can trust yourself again tomorrow.',
  'Every application sent is a vote for your future career.',
  'DSA reps today are interview confidence tomorrow.',
]

export function quoteForDay(dayOfYear) {
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length]
}
