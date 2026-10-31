// The fixed pages (the front page and the pages in src/pages/*.astro) are lists of sections, in their
// JSON files in src/data/, som redigeres in the editor (/editor/, "Sider" â€º "Faste sider"): brugeren kan flytte,
// hide (`hidden`), remove and add sections there. Each section has a `type` that says how it looks.
// A page's own types appear at most once; "text" (a heading and Markdown) efter behov, and
// "booking" (the invitation to book) once. The front page has its own types (src/data/home.ts); the
// other pages' are in src/data/pages.ts. Keep in step with the blocks in src/site/collections.ts.

/** The types every page in src/data/pages.ts can have besides its own. */
export type Shared = {
  text: { heading?: string; body: string };
  /** Its own heading and text; without them the shared ones (booking.json). */
  booking: { heading?: string; text?: string };
};

/** The sections of a page whose own types are `S`: each with its `type` and its texts. */
export type SectionsOf<S> = { [T in keyof (S & Shared)]: { type: T; hidden?: boolean } & (S & Shared)[T] }[keyof (S & Shared)];

/** The sections shown on the site. */
export const shown = <X extends { hidden?: boolean }>(sections: X[]) => sections.filter((s) => !s.hidden);

/** The space above a section below the page header of a fixed page (not the front page): less above the first. */
export const space = (i: number) => (i === 0 ? 'mt-10 md:mt-14' : 'mt-16 md:mt-24');

