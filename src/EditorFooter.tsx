// The editor's footer: at the bottom of every screen (Screen.tsx), under the content, or at the bottom of the window when
// the content is short (the start screen): a divider and the link to "Licenser" (#licenses, Licenses.tsx). Exposes
// EditorFooter. Uses LinkButton from ui.tsx and the theme's Divider; the safe area at the bottom is Screen's main.
import { t } from './i18n';
import { LinkButton } from './ui';
import { SiteDivider } from './themeUi';

export default function EditorFooter() {
  return (
    <footer className="mt-auto pt-12">
      <SiteDivider />
      <div className="flex justify-center pt-4">
        <LinkButton href="#licenses" kind="text" size="small">
          {t.common.parts.licenses}
        </LinkButton>
      </div>
    </footer>
  );
}
