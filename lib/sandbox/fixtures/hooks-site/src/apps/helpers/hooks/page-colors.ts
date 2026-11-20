// Test fixture for lib/sandboxHooks.test.mjs: a page-colors hook, uses both helpers.
// Exposes a default export. No dependencies.
export default async (
  input: { pictures: string[]; colors: unknown },
  helpers: { pixels(p: string): Promise<Uint8ClampedArray | undefined>; readable(c: unknown): Promise<boolean> },
) => {
  const pixels = await helpers.pixels(input.pictures[0]);
  const readable = await helpers.readable(input.colors);
  return pixels && pixels.length === 4 && readable
    ? { light: { bg: '#010101', accent: '#020202' }, dark: { bg: '#030303', accent: '#040404' } }
    : undefined;
};
