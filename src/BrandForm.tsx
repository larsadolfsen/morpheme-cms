// "Udseende" › "Logo og ikon" (#appearance/logo): a new logo (the mark by the site's name) and a new icon (the browser
// tab, Google and the editor's app icon), made from a picture the owner picks (brand.ts), in the site's colours
// ("Farver"). Both are saved together in one commit with "Gem ændringer".
import { useEffect, useState } from 'react';
import { ConflictError, type RepoFile } from './github';
import FormFrame from './FormFrame';
import { Button } from './ui';
import { pickImage } from './images';
import { BRAND_FILES, FAVICON, iconFiles, LOGO, logoFile, openPicture, solid, type Picture } from './brand';
import type { Env } from './App';
import { colorsOf } from './Colors';
import { savedText } from './deploy';
import { siteName } from '@site/editor';
import { locale, siteT, t } from './i18n';

const svgUrl = (text: string) => URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));

export default function BrandForm({ env }: { env: Env }) {
  const notify = env.notify;
  const [loaded, setLoaded] = useState<Record<string, RepoFile> | null>(null);
  // The files to save, by path, and what the previews show.
  const [changes, setChanges] = useState<Record<string, string | Uint8Array>>({});
  const [logo, setLogo] = useState<{ url: string; picture: Picture | null }>({ url: '/logo.svg', picture: null });
  const [icon, setIcon] = useState('/editor/icon-192.png');
  const [saving, setSaving] = useState(false);
  // Drawing the icons takes a moment.
  const [drawing, setDrawing] = useState(false);
  const dirty = Object.keys(changes).length > 0;

  useEffect(() => {
    env
      .load(BRAND_FILES)
      .then((files) => setLoaded(Object.fromEntries(files.map((f) => [f.path, f]))))
      .catch((e) => notify({ text: t.company.brand.notLoaded((e as Error).message), error: true }));
  }, []);

  // Asks for a picture and opens it; null if none was picked or it cannot be used.
  async function pick(): Promise<Picture | null> {
    const file = await pickImage();
    if (!file) return null;
    try {
      const picture = await openPicture(file);
      notify(null);
      return picture;
    } catch (e) {
      notify({ text: (e as Error).message, error: true });
      return null;
    }
  }

  async function newLogo() {
    const picture = await pick();
    if (!picture) return;
    if (solid(picture)) return notify({ text: t.company.brand.solid, error: true });
    const text = logoFile(picture);
    setLogo({ url: svgUrl(text), picture });
    setChanges((c) => ({ ...c, [LOGO]: text }));
  }

  async function newIcon(picture: Picture | null, fromLogo: boolean) {
    if (!picture) return;
    setDrawing(true);
    try {
      const { bg, accent } = colorsOf(env.files).light;
      const { files, preview } = await iconFiles(picture, fromLogo, { bg, accent });
      setIcon(preview);
      setChanges((c) => ({ ...c, ...files }));
    } catch (e) {
      notify({ text: (e as Error).message, error: true });
    } finally {
      setDrawing(false);
    }
  }

  // The icon from the logo: the new one if one was picked, else the one on the site.
  async function iconFromLogo() {
    const picture =
      logo.picture ??
      (await openPicture(new Blob([loaded![LOGO].text], { type: 'image/svg+xml' })).catch((e) => {
        notify({ text: (e as Error).message, error: true });
        return null;
      }));
    await newIcon(picture, true);
  }

  async function save() {
    // Without the files on the site (still loading, or it failed), their ids are unknown, and the save
    // would be refused as a new file where one exists.
    if (!loaded) return notify({ text: t.company.brand.notLoadedYet, error: true });
    const paths = Object.keys(changes);
    const message = siteT.company.commit.brand(LOGO in changes, FAVICON in changes);
    const files = paths.map((path) => ({ path, content: changes[path], oid: loaded[path]?.oid ?? null }));
    const change = t.app.changes.edited(
      new Intl.ListFormat(locale, { type: 'conjunction' }).format([
        ...(LOGO in changes ? [t.app.changes.logo] : []),
        ...(FAVICON in changes ? [t.app.changes.icon] : []),
      ]),
    );
    setSaving(true);
    notify({ text: t.common.saving });
    try {
      const oids = await env.commit(message, files, change);
      setLoaded((all) => ({
        ...all,
        ...Object.fromEntries(
          paths.map((path) => [path, { path, oid: oids[path], text: typeof changes[path] === 'string' ? changes[path] : '' }]),
        ),
      }));
      setChanges({});
      notify({ text: savedText(change), kind: 'saved' });
      return true;
    } catch (e) {
      notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setSaving(false);
    }
  }

  const mask = { maskImage: `url(${logo.url})`, WebkitMaskImage: `url(${logo.url})` };
  return (
    <FormFrame
      title={t.common.parts.brand}
      back={{ href: '#appearance', label: t.common.parts.appearance }}
      dirty={dirty}
      saving={saving || drawing}
      onSave={save}
    >
      <section>
        <h2 className="mb-1 font-medium">{t.company.brand.logo}</h2>
        <p className="mb-3 text-sm text-muted">{t.company.brand.logoHint}</p>
        <div className="flex flex-wrap items-center gap-4">
          <div data-logo-preview className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3">
            <span
              aria-hidden="true"
              className="h-10 w-9 shrink-0 bg-accent [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]"
              style={mask}
            />
            <span className="font-medium tracking-tight">{siteName}</span>
          </div>
          <Button kind="outlined" size="small" disabled={saving} onClick={newLogo}>
            {t.company.brand.newLogo}
          </Button>
        </div>
      </section>
      <section>
        <h2 className="mb-1 font-medium">{t.company.brand.icon}</h2>
        <div className="flex flex-wrap items-center gap-4">
          <img
            data-icon-preview
            src={icon}
            alt=""
            className={`size-16 shrink-0 rounded-2xl shadow-soft ${drawing ? 'animate-pulse opacity-50' : ''}`}
          />
          <Button kind="outlined" size="small" disabled={saving || drawing} onClick={async () => newIcon(await pick(), false)}>
            {t.company.brand.newIcon}
          </Button>
          <Button kind="outlined" size="small" disabled={saving || drawing || !loaded} onClick={iconFromLogo}>
            {t.company.brand.iconFromLogo}
          </Button>
        </div>
      </section>
    </FormFrame>
  );
}
