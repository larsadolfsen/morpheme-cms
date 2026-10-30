import { locale, t } from './i18n';

// "i dag kl. 13.42", "i går kl. 9.05", "1. okt. kl. 13.42" or, another year, "1. okt. 2023 kl. 13.42";
// in the editor's language. `short`: only the time today ("13.42").
export function when(date: Date, { short = false } = {}) {
  const day = (d: Date) => d.toLocaleDateString('sv');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const shown =
    day(date) === day(new Date())
      ? t.common.today
      : day(date) === day(yesterday)
        ? t.common.yesterday
        : date.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
          });
  const time = date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  if (short && shown === t.common.today) return time;
  return t.common.at(shown, time);
}
