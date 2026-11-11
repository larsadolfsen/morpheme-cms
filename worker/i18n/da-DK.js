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
  // The assistants' sign-in (worker/mcp-oauth.js).
  'This sign-in can’t be finished': 'Loginet kan ikke gennemføres',
  'Assistants are not set up on this site yet.': 'Assistenter er ikke sat op på denne hjemmeside endnu.',
  'This assistant isn’t known here, or its return address doesn’t match. Connect it again from the assistant.':
    'Assistenten er ikke kendt her, eller dens returadresse passer ikke. Forbind den igen fra assistenten.',
  'Connect it again from the assistant.': 'Forbind den igen fra assistenten.',
  '{login} can’t save this site, so an assistant can’t connect for them.':
    '{login} kan ikke gemme ændringer på denne hjemmeside, så en assistent kan ikke forbindes for vedkommende.',
  '{assistant} wants to connect to {site}.': '{assistant} vil forbindes til {site}.',
  'Signed in to GitHub as {login}.': 'Logget ind på GitHub som {login}.',
  'It can read your pages and posts and the settings of your apps. It can’t change anything.':
    'Den kan læse dine sider og indlæg og indstillingerne i dine apps. Den kan ikke ændre noget.',
  Allow: 'Tillad',
  Cancel: 'Annuller',
  'Connect {assistant}?': 'Forbind {assistant}?',
  'This must be done on the consent page.': 'Det skal gøres på godkendelsessiden.',
  // The page on the editor's old address (worker/editor-host.js). {address} is the link to the new address.
  'The editor has moved': 'Editoren er flyttet',
  'The editor has moved to {address} …': 'Editoren er flyttet til {address} …',
  // The commit of the scheduled pages and posts (worker/publish.js, lib/scheduled.mjs).
  'Publish scheduled: {names}': 'Udgiv planlagt: {names}',
  'blog post': 'blogindlæg',
  page: 'side',
};
