// The editor's frame (App.tsx, FormFrame.tsx, ask.tsx), logging in and saving to GitHub (github.ts, cache.ts), pictures (images.ts) and addresses (addresses.ts, checkSite.ts).
export const app = {
  logIn: 'Log in with GitHub',
  loading: 'Loading the website’s content…',
  cannotSave: (login: string) => `The account ${login} doesn’t have access to save. Log in with another GitHub account under Account.`,
  notFound: 'Not found',
  nothingAt: (route: string) => `There’s nothing at the address ${route}`,
  /** The chip in the top bar: from Save until the website is rebuilt, then when it is, or when it failed. */
  building: 'Updating the website…',
  /** After a save, when the website has been updated with it (or not); `changes`: what the saves since the last update
   * changed, as a list (changesText in deploy.ts). */
  siteUpdated: (changes: string) => `The website has been updated: ${changes}.`,
  siteNotUpdated: (changes: string) => `The website wasn’t updated (${changes}). Restore the previous version under Earlier versions.`,
  /** What a save changed (deploy.ts): said right after it and, with the other saves since, when the website has been
   * updated. Each starts with a small letter, as it stands inside a sentence; `what` is a thing (`named`: its kind and
   * its name) or a part of the website. */
  changes: {
    named: (kind: string, name: string) => `${kind} “${name}”`,
    edited: (what: string) => `${what} changed`,
    setTo: (what: string, value: string) => `${what} set to ${value}`,
    created: (what: string) => `${what} created`,
    added: (what: string) => `${what} added`,
    deleted: (what: string) => `${what} deleted`,
    restored: (what: string) => `${what} restored`,
    moved: (what: string, address: string) => `${what} moved to ${address}`,
    renamed: (what: string, name: string) => `${what} renamed to “${name}”`,
    order: (label: string) => `new order of ${label}`,
    turnedOn: (what: string) => `${what} turned on`,
    turnedOff: (what: string) => `${what} turned off`,
    chosen: (what: string) => `${what} chosen`,
    installed: (what: string, version?: string) => (version ? `${what} ${version} installed` : `${what} installed`),
    updated: (what: string, version: string) => `${what} updated to ${version}`,
    uninstalled: (what: string) => `${what} uninstalled`,
    /** After the first three. */
    more: (count: number) => (count === 1 ? '1 other change' : `${count} other changes`),
    block: 'block',
    app: 'app',
    theme: 'theme',
    iconPack: 'icon pack',
    motion: 'motion',
    sideColumn: 'side column',
    colors: 'colors',
    redirect: (from: string) => `redirect from ${from}`,
    logo: 'logo',
    icon: 'icon',
    r2Caching: 'R2 caching',
    place: 'storage location',
    contentOnlyBuilds: 'content-only builds',
    paidBuilds: 'Workers Paid plan',
  },
  /** Why a new page or post cannot have an address. */
  addressTaken: (address: string) => `There’s already a page or blog post with the address ${address}.`,
  addressRedirects: (address: string, name: string) => `The address ${address} currently sends visitors on to ${name}.`,
  addressLoop: (loop: string) => `The address can’t be changed, because the redirects would go in a loop (${loop}).`,
  deleteEntry: (singular: string) => `Delete ${singular}? It can be restored under Deleted.`,
  notDeleted: (error: string) => `Couldn’t delete: ${error}`,
  /** The top bar's line under the title, and the save bar (FormFrame.tsx); the dots hop after it. */
  busy: { saving: 'Saving', deleting: 'Deleting' },
  lastSaved: (when: string) => `Last changed ${when}`,
  notSavedYet: 'Not saved yet',
  /** Leaving a form with changes that are not saved (mayLeave, FormFrame.tsx): "Save", "Discard" or "Cancel". */
  unsavedTitle: 'Save the changes?',
  unsaved: 'You have changes that aren’t saved',
  discard: 'Discard',
  /** Before the browser asks to show notifications (askToNotify, notificationData.ts), and its button. */
  askNotify: 'Get a message when your changes are live?',
  askNotifyYes: 'Yes, tell me',
  /** A sheet closed with changes (closeChanged, ask.tsx). */
  unsavedSheet: 'You have changes that aren’t saved. Do you want to keep them?',
  viewOnSite: 'View on the website',
  /** GitHub (github.ts). */
  loggedOut: 'You have been logged out. Log in again.',
  githubAnswered: (status: number) => `GitHub returned error ${status}. Try again.`,
  pictureNotLoaded: 'The picture couldn’t be loaded from GitHub. Check your connection and try again.',
  pictureNotWhole: 'The picture couldn’t be loaded completely. Try again.',
  changedElsewhere: 'The file was changed elsewhere. Copy your text and reload the page.',
  fileExists: 'There’s already a file with that name. Try again, or choose another title.',
  /** A picture made ready before upload (images.ts). */
  pictureNotOpened: 'The picture couldn’t be opened. Use a JPEG, PNG, or WebP picture.',
  pictureNotReady: 'The picture couldn’t be prepared',
  preparingPicture: 'Preparing the picture…',
  /** The check before the website is updated (checkSite.ts). */
  invalidJson: 'The file isn’t valid JSON',
  blocksOff: 'Turned off',
  block: 'Block',
  appsInstalled: 'Installed',
  app: 'App',
  /** The commits, in the site's language (siteT). */
  commit: {
    delete: (singular: string, slug: string) => `Editor: delete ${singular} "${slug}"`,
    reorder: (label: string) => `Editor: new order for ${label}`,
  },
};
