// Test fixture for lib/sandboxHooks.test.mjs: a page-colors hook that makes its colours with the contentColors helper
// (the engine runs on the host), trying each of the page's images. Exposes a default export. No dependencies.
export default async (
  input: { pictures: string[] },
  helpers: { contentColors(picture: string, choice: { variant: string; contrast: string }): Promise<unknown> },
) => {
  for (const picture of input.pictures) {
    const made = await helpers.contentColors(picture, { variant: 'content', contrast: 'standard' });
    if (made) return made;
  }
  return undefined;
};
