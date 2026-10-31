// Prices and terms. Used by the prices page, the front page, the booking
// pages and the structured data. Edited in the editor (/editor/); this file only adds types and the
// values derived from them:
// - src/data/prices/*.json: one file per price ("Priser"). `order` is the order on the prices page
//   (set with the arrows in the editor).
// - src/data/prices.json: the rest of the prices page ("Sider" â€º "Faste sider" â€º "Prissiden"): its sections
//   (src/data/pages.ts) and the payment details.
import data from './prices.json';

export type Service = {
  name: string;
  duration: string;
  price: number; // kr
  href: string;
  /** Shown large at the top of the prices page. */
  featured: boolean;
  /** Shown in the short price list on the front page and the booking pages. */
  frontPage: boolean;
  priceNote?: string;
  /** Klippekort: number of sessions and how much you save in kr. */
  punchCard?: { sessions: number; saving: number };
  note?: string;
};

// Each price file says where it is shown ("placement": top = at the top of the prices page and on
// the front page, list-front = in the price list and on the front page, list = only in the price
// list) and gives the klippekort as number of sessions and total price.
type ServiceData = {
  name: string;
  duration: string;
  price: number;
  href: string;
  placement: string;
  priceNote?: string;
  punchCardSessions?: number;
  punchCardPrice?: number;
  note?: string;
  order: number;
};

const files = import.meta.glob<ServiceData>('./prices/*.json', { eager: true, import: 'default' });

export const services: Service[] = Object.entries(files)
  .sort(([fa, a], [fb, b]) => a.order - b.order || fa.localeCompare(fb))
  .map(([, s]) => ({
    name: s.name,
    duration: s.duration,
    price: s.price,
    href: s.href,
    featured: s.placement === 'top',
    frontPage: s.placement !== 'list',
    priceNote: s.priceNote || undefined,
    punchCard:
      s.punchCardSessions && s.punchCardPrice
        ? { sessions: s.punchCardSessions, saving: s.punchCardSessions * s.price - s.punchCardPrice }
        : undefined,
    note: s.note || undefined,
  }));

/** Heading, intro and Google texts of the prices page. */
export const pricesPage = {
  heading: data.heading,
  intro: data.intro,
  seoTitle: data.seoTitle,
  seoDescription: data.seoDescription,
};

export const payment = {
  ...data.payment,
  mobilePayUrl: `https://www.mobilepay.dk/erhverv/betalingslink/betalingslink-svar?phone=${(data.payment.mobilePay || '').replace(/\D/g, '')}`,
};

const kr = new Intl.NumberFormat('da-DK');
export const formatKr = (n: number) => `${kr.format(n)} kr`;

