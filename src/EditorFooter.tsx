// The editor's footer: one line under the content of every screen (Screen.tsx), with a link to "Licenser" (#licenser,
// Licenses.tsx). Exposes EditorFooter. Uses LinkButton from ui.tsx; the safe area at the bottom is Screen's main.
import { t } from './i18n';
import { LinkButton } from './ui';

export default function EditorFooter() {
  return (
    <footer className="mt-12 flex justify-center">
      <LinkButton href="#licenser" kind="text" size="small">
        {t.common.parts.licenses}
      </LinkButton>
    </footer>
  );
}
