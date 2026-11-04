// "Videresendelser" (Redirects.tsx, redirectData.ts).
export const redirects = {
  notLoaded: (error: string) => `Couldn’t load the redirects: ${error}`,
  noFrom: 'Type the address that should redirect.',
  noTo: 'Type the address it should redirect to.',
  toSelf: 'An address can’t redirect to itself.',
  pageHas: (from: string) => `There’s a page with the address ${from}. Give the page a new address instead.`,
  alreadyRedirects: (from: string) => `There’s already a redirect from ${from}. Edit it in the list.`,
  /** Deleting one; `via`: how many other addresses send on through it. */
  deleteAsk: (from: string, via: number) => `Delete the redirect from ${from}? The address then shows the not-found page.`,
  /** redirectData.ts: the addresses that come back to one, joined by arrows. */
  loop: (addresses: string) => `The redirects would go in a loop (${addresses}).`,
  /** checkSite.ts: a redirect that sends on through another, before the site is built. */
  chain: (from: string, to: string, end: string) =>
    `${from} redirects to ${to}, which itself redirects to ${end}. Send it straight to ${end}.`,
  chainRule: (line: string, flat: string) => `The rule "${line}" redirects through another. Write it as "${flat}".`,
  count: (n: number) => `${n} ${n === 1 ? 'address' : 'addresses'}`,
  /** The row under "Videresendelser" with all the redirects, and its screen's title. */
  all: 'All redirects',
  new: 'New redirect',
  intro: 'Addresses that send visitors on to another page.',
  searchLabel: 'Search the redirects',
  /** The orders of the two lists (Redirects.tsx): by address, by the page it sends to, by visits, by the last visit. */
  sorts: { az: 'A–Z', za: 'Z–A', page: 'By page', visits: 'Most visits first', last: 'Most recently visited first' },
  /** The funnel over the redirects that shows only those to one page or post. */
  pageFilter: 'Show by page',
  /** Over the posts among its choices. */
  postsGroup: 'Blog posts',
  loading: 'Loading the redirects…',
  /** None, or none matching the search. */
  none: (query: string) => `No redirects${query ? ` with "${query}"` : ''}`,
  from: 'From',
  fromHint: 'For example, /old-page/.',
  to: 'To',
  toHint: 'For example, /about/, or / for the home page.',
  /** Where it sends to; `noPage`: an address of the site no page in the editor has. */
  sendsTo: (name: string, noPage: boolean) => `Goes to ${name}${noPage ? ', which isn’t a page in the editor' : ''}.`,
  deleteRedirect: 'Delete redirect',
  /** "Ikke fundet": the addresses visitors came to that do not exist (notFound.ts). */
  missing: {
    /** Its row under "Videresendelser" and its screen's title. */
    title: 'Not found',
    intro: 'Addresses visitors tried to open that don’t exist.',
    searchLabel: 'Search the addresses',
    loading: 'Loading the addresses…',
    notLoaded: (error: string) => `Couldn’t load the addresses that don’t exist: ${error}`,
    /** The site does not keep them (yet). */
    notKept: 'The website doesn’t yet record addresses that don’t exist',
    none: (query: string) => (query ? `No addresses with "${query}"` : 'No addresses yet'),
    /** Under the address in the list: how many visits, and the last (when.ts). */
    seen: (n: number, last: string) => `${n} ${n === 1 ? 'visit' : 'visits'}, last ${last}`,
    /** In the sheet; `from`: where the last visitor came from (a page, another site), or ''. */
    details: (n: number, first: string, last: string, from: string) =>
      `${n === 1 ? `Visited once, ${last}` : `Visited ${n} times, first ${first} and last ${last}`}.${from ? ` The last visitor came from ${from}.` : ''}`,
    sendOn: 'Redirect',
    forget: 'Remove from the list',
    forgotten: 'Removed from the list',
    notForgotten: (error: string) => `Couldn’t remove the address from the list: ${error}`,
  },
  /** The commits, in the site's language (siteT). */
  commit: {
    add: (from: string, to: string) => `Editor: redirect ${from} to ${to}`,
    change: (from: string, to: string) => `Editor: ${from} now redirects to ${to}`,
    delete: (from: string) => `Editor: delete the redirect from ${from}`,
  },
};
