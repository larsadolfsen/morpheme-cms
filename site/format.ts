const dateFmt = new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });

export const formatDate = (d: Date) => dateFmt.format(d);

export function readingMinutes(markdown: string | undefined) {
  const words = (markdown ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
