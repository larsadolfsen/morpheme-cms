// The Danish of the Worker's messages to the owner and of its commit messages: the English text as written in the code, as the key.
// Exposes daDK (read by worker/say.js). No dependencies, so the Worker can use it.
export const daDK = {
  // The sign-in (worker/oauth.js).
  'GitHub login is not set up yet (GITHUB_CLIENT_ID/SECRET are missing).':
    'GitHub-login er ikke sat op endnu (mangler GITHUB_CLIENT_ID/SECRET).',
  'Unknown login.': 'Ukendt login.',
  'Login failed (invalid or expired request).': 'Login mislykkedes (ugyldig eller udløbet forespørgsel).',
  'Try again.': 'Prøv igen.',
  'Login failed: {reason}': 'Login mislykkedes: {reason}',
  'Back to the editor': 'Tilbage til editoren',
  'Signing in…': 'Logger ind…',
  // The page on the editor's old address (worker/editor-host.js). {address} is the link to the new address.
  'The editor has moved': 'Editoren er flyttet',
  'The editor has moved to {address} …': 'Editoren er flyttet til {address} …',
  // The commit of the scheduled pages and posts (worker/publish.js, lib/scheduled.mjs).
  'Publish scheduled: {names}': 'Udgiv planlagt: {names}',
  'blog post': 'blogindlæg',
  page: 'side',
};
