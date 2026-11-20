// TEST-ONLY drawing of the block in load.ts (scripts/check-side.mjs): a paragraph the check looks for in the built page.
// Exposes a React component given the block's view.
export default function SideTest({ view }: { view: { path: string; length: number } }) {
  return (
    <p data-side-test={view.path} data-side-length={view.length}>
      Side test block
    </p>
  );
}
