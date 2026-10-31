// The sections of the fixed pages besides the front page (src/data/home.ts), from their JSON files,
// som redigeres i editoren ("Sider" â€º "Faste sider"). How sections work: src/data/sections.ts.
import prices from './prices.json';
import contact from './contact.json';
import testimonials from './testimonials-page.json';
import services from './services-page.json';
import blog from './blog-page.json';
import about from './about-page.json';
import notFound from './not-found-page.json';
import type { SectionsOf } from './sections';

/** A row with an icon (routes and practical notes on the contact page). */
export type IconItem = { title: string; text: string; icon: string; more?: string; href?: string };

export type PricesSection = SectionsOf<{
  featured: object;
  list: { terms: string };
  cancellation: { heading: string; intro?: string; items: { when: string; cost: string }[] };
  payment: { heading: string; note?: string };
  urgent: { heading: string; text: string };
}>;

export type ContactSection = SectionsOf<{
  reach: { phoneHeading: string; emailHeading: string; bookHeading: string; bookText: string };
  where: { image?: string; imageAlt?: string; heading: string; text: string };
  routes: { heading: string; items: IconItem[] };
  notes: { items: IconItem[] };
}>;

export type TestimonialsSection = SectionsOf<{ testimonials: object }>;
/** A group on the services page: its heading, the page it links to, and its pages by address. */
export type ServiceGroup = { title: string; href: string; paths: string[] };
export type ServicesSection = SectionsOf<{ services: { groups: ServiceGroup[] } }>;
export type BlogSection = SectionsOf<{ posts: object }>;

/** A card that links to another page (the subpages on the about page). */
export type LinkCard = { title: string; text: string; icon: string; href: string };

// The about page: "story" is tekst fra om-os.
export type AboutSection = SectionsOf<{ story: object; links: { items: LinkCard[] } }>;

// The 404 page: the pages most people look for, and how to get in touch, side by side.
export type NotFoundSection = SectionsOf<{
  help: { popularHeading: string; popular: { label: string; href: string }[]; askHeading: string; askText: string };
}>;

export const pricesSections = prices.sections as PricesSection[];
export const contactSections = contact.sections as ContactSection[];
export const testimonialsSections = testimonials.sections as TestimonialsSection[];
export const servicesSections = services.sections as ServicesSection[];
export const blogSections = blog.sections as BlogSection[];
export const aboutSections = about.sections as AboutSection[];
export const notFoundSections = notFound.sections as NotFoundSection[];

