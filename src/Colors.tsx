// "Udseende" › "Farver" (#udseende/farver): the site's colours, for light and dark mode, in the site's file of
// colours (config.colors, packages/editor/lib/colors.ts). One mode at a time, picked at the top (it
// starts in the one the editor is shown in), and the editor is shown in it while the screen is open
// (theme.ts holdTheme). Each mode has a little page drawn in its colours, the pairs that are too hard to
// read (colorPairs in src/site/colors.ts, WCAG AA) and a field for each colour (colorFields). Colours
// that are hard to read together cannot be saved; "Gem" then shows the mode they are in. "Brug
// standardfarverne" puts back the ones the site was designed with (defaultColors). "Dynamiske farver"
// makes all of them, in both modes, from one source colour, Material 3's way (dynamic colour,
// lib/dynamic-colors.ts, each colour by its role, colorRoles): the source colour picked or taken from a
// picture, a scheme variant and a contrast level, kept in the file with the colours; changing a colour by
// hand turns it off. Material's other source of dynamic colour, each page's own picture, is an app ("Indholdsbaserede
// farver", src/apps/content-colors/: pageColors in packages/editor/site/pageColors.ts). While an app installed changes the pages'
// colours (hooks/page-colors.ts), each mode shows the pages' colours instead (PageColors), as the site was last built
// (/editor/page-colors.json, packages/editor/scripts/page-colors.mjs): first a notice that the apps give them, with a button to the
// site's own, which are only the fallback ("Reservefarver", #udseende/farver/reservefarver, a page of the same form, so
// what is unsaved stays), then the apps, each to its settings, the pages with colours from a picture (the picture, the
// page and its colours in the mode open), and those with the site's own. Saved with "Gem ændringer" in one commit; the
// editor shows the new colours at once (theme.ts applyColors), the site when it is built again.
import { useEffect, useMemo, useState } from 'react';
import { Image, Moon, Sun } from '@phosphor-icons/react';
import { ConflictError, type RepoFile } from './github';
import FormFrame, { useFormPages } from './FormFrame';
import {
  Button,
  ColorField,
  ColorSwatches,
  ColorsPreview,
  EmptyNote,
  FormColumns,
  FormHeading,
  Group,
  Label,
  LeadingIcon,
  LeadingImage,
  LinkButton,
  Notice,
  SupportingText,
  SegmentedButton,
  Select,
  SwitchRow,
  ProblemNote,
  TrailingIcon,
  listItemClass,
  staticListItemClass,
} from './ui';
import type { Env } from './App';
import { SAVED } from './deploy';
import { colorProblems, lowContrast, MODES, type Colors as ColorsData, type Mode } from '../lib/colors';
import { CONTRASTS, dynamicColors, dynamicProblems, VARIANTS, type Contrast, type Dynamic, type Variant } from '../lib/dynamic-colors';
import { colorFields, colorPairs, colorRoles, config, defaultColors } from '@site/editor';
import { colorsInPicture, pickImage, shownAt } from './images';
import { holdTheme, shownMode } from './theme';
import { locale, siteT, t } from './i18n';
import { apps as siteApps } from './site';
import { appSettings, installedApps, type SiteApp } from './apps';
import { settingsRoute } from './AppList';
import { splitPicture } from '../lib/crop.mjs';

const names = colorFields.map((f) => f.name);

/** The site's colours as the editor has them, or the ones it was designed with when the file is missing
 * or cannot be read (`unreadable`). */
export function colorsOf(files: RepoFile[]): ColorsData & { unreadable?: boolean } {
  const file = files.find((f) => f.path === config.colors);
  try {
    const colors = JSON.parse(file?.text ?? '');
    if (!colorProblems(colors, names).length && (colors.dynamic === undefined || !dynamicProblems(colors.dynamic).length)) return colors;
  } catch {}
  return { ...defaultColors, unreadable: true };
}

const fileOf = (colors: ColorsData) => {
  const sets = Object.fromEntries(MODES.map((m) => [m, Object.fromEntries(names.map((n) => [n, colors[m][n]]))]));
  const dynamic = colors.dynamic && { source: colors.dynamic.source, variant: colors.dynamic.variant, contrast: colors.dynamic.contrast };
  return `${JSON.stringify({ ...sets, ...(dynamic && { dynamic }) }, null, 2)}\n`;
};

/** The colours made from a choice of dynamic colour, with the choice. */
const madeFrom = (dynamic: Dynamic): Pick<ColorsData, 'light' | 'dark' | 'dynamic'> => ({ ...dynamicColors(dynamic, colorRoles), dynamic });

const ratio = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 1 });

/** The page with the site's own colours, while an app changes the pages' colours: the fallback. */
export const FALLBACK_ROUTE = 'udseende/farver/reservefarver';

/** The apps installed that change the pages' colours (hooks/page-colors.ts). */
const colorApps = (files: RepoFile[]) => {
  const installed = installedApps(files);
  return siteApps.filter((a) => installed.includes(a.id) && a.needs.changes?.includes('page-colors'));
};

/** `fallback`: the page with the site's own colours is open (FALLBACK_ROUTE). */
export default function Colors({ env, files, fallback }: { env: Env; files: RepoFile[]; fallback?: boolean }) {
  const notify = env.notify;
  const loaded = useMemo(() => colorsOf(files), [files]);
  const [colors, setColors] = useState<ColorsData>(loaded);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<Mode>(shownMode);
  useEffect(() => holdTheme(mode), [mode]);
  const changing = useMemo(() => colorApps(files), [files]);
  useEffect(() => () => holdTheme(null), []);
  // While an app changes the pages' colours, the modes show the pages', and the site's own are on a page of the form.
  useFormPages(changing.length ? ['udseende/farver', FALLBACK_ROUTE] : []);
  const ownShown = fallback || !changing.length;
  const appNames = new Intl.ListFormat(locale).format(changing.map((a) => a.label));
  const file = files.find((f) => f.path === config.colors);
  const text = fileOf(colors);
  const dirty = text !== file?.text;
  const low = Object.fromEntries(MODES.map((m) => [m, lowContrast(colors[m], colorPairs)])) as Record<Mode, ReturnType<typeof lowContrast>>;
  const isDefault = text === fileOf(defaultColors);
  // The colours found in the last picture picked for the source colour.
  const [inPicture, setInPicture] = useState<string[]>([]);
  // The colours to pick from in a colour's sheet: the site's own, in both modes, and the ones it was made with.
  const swatches = [...new Set([colors, defaultColors].flatMap((c) => MODES.flatMap((m) => names.map((n) => c[m][n].toLowerCase()))))];
  const dynamic = colors.dynamic;
  const d = t.colors.dynamic;

  // A colour changed by hand: they are no longer made from the source colour.
  const set = (mode: Mode, name: string, value: string) => {
    if (dynamic) notify({ text: d.turnedOff });
    setColors(({ dynamic: _, ...c }) => ({ ...c, [mode]: { ...c[mode], [name]: value } }));
  };
  const setDynamic = (change: Partial<Dynamic>) => dynamic && setColors((c) => ({ ...c, ...madeFrom({ ...dynamic, ...change }) }));

  async function fromPicture() {
    const file = await pickImage();
    if (!file) return;
    try {
      const found = await colorsInPicture(file);
      if (!found.length) return notify({ text: d.noColorInPicture, error: true });
      setInPicture(found);
      setDynamic({ source: found[0] });
      notify({ text: d.fromPictureDone });
    } catch {
      notify({ text: t.app.pictureNotOpened, error: true });
    }
  }

  async function save() {
    // The colours that are hard to read are shown with the mode they are in.
    const hard = MODES.find((m) => low[m].length);
    if (hard) {
      setMode(hard);
      if (!ownShown) location.hash = `#${FALLBACK_ROUTE}`;
      return notify({ text: t.colors.cannotSave, error: true });
    }
    const path = config.colors;
    const changes = [{ path, content: text, oid: file?.oid || null }];
    setSaving(true);
    notify({ text: t.common.saving });
    try {
      const oids = await env.commit(siteT.colors.commit, changes);
      env.onSaved({ path, oid: oids[path], text });
      notify({ text: SAVED, kind: 'saved' });
      return true;
    } catch (e) {
      notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormFrame
      title={changing.length && fallback ? t.colors.pages.fallback : t.common.parts.colors}
      back={
        changing.length && fallback
          ? { href: '#udseende/farver', label: t.common.parts.colors, guard: (go) => go() }
          : { href: '#udseende', label: t.common.parts.appearance }
      }
      dirty={dirty}
      saving={saving}
      onSave={save}
      panel
      tabs={{
        label: t.colors.modes,
        value: mode,
        options: [
          { value: 'light', label: t.colors.light, icon: Sun },
          { value: 'dark', label: t.colors.dark, icon: Moon },
        ],
        onChange: setMode,
      }}
    >
      {ownShown ? (
        modeColors()
      ) : (
        <>
          {/* The pages' colours come from the apps: said first, with the way to the site's own, the fallback. */}
          <Notice
            title={t.colors.pages.title}
            action={
              <LinkButton kind="outlined" size="small" href={`#${FALLBACK_ROUTE}`}>
                {t.colors.pages.showFallback}
              </LinkButton>
            }
          >
            {t.colors.pages.byApps(appNames)}
          </Notice>
          <PageColors env={env} files={files} apps={changing} mode={mode} />
        </>
      )}
    </FormFrame>
  );

  // A mode's colours: the preview and the fields (a function, not a component, so the fields keep their focus).
  function modeColors() {
    return (
      <>
        <p className="text-muted">{changing.length ? t.colors.pages.fallbackIntro(appNames) : t.colors.intro}</p>
        {loaded.unreadable && file && <ProblemNote>{t.colors.unreadable}</ProblemNote>}
        {/* On a wide computer screen the colours in the wide column, and the preview beside them, in view
          while they are changed. */}
        <FormColumns
          cards={false}
          sticky
          first={
            <section className="space-y-4">
              <ColorsPreview colors={colors[mode]} title={t.colors.preview.title(t.colors[mode])} />
              {low[mode].length > 0 && (
                <ProblemNote alert>
                  <ul className="space-y-1">
                    {low[mode].map((pair) => (
                      <li key={`${pair.text}-${pair.on}`}>{t.colors.tooLow(pair.what, ratio(pair.ratio), ratio(pair.min))}</li>
                    ))}
                  </ul>
                </ProblemNote>
              )}
            </section>
          }
          main={
            <>
              <section className="space-y-5">
                <FormHeading first>{d.title}</FormHeading>
                <SwitchRow
                  label={d.enabled}
                  texts={[d.on, d.off]}
                  hint={d.hint}
                  selected={!!dynamic}
                  disabled={saving}
                  onChange={(on) =>
                    setColors(({ dynamic: _, ...c }) =>
                      on ? { ...c, ...madeFrom({ source: c.light.accent, variant: VARIANTS[0], contrast: 'standard' }) } : c,
                    )
                  }
                />
                {dynamic && (
                  <>
                    <div>
                      <Label htmlFor="color-source" hint={d.sourceHint}>
                        {d.source}
                      </Label>
                      <div className="flex flex-wrap items-start gap-3">
                        <ColorField
                          id="color-source"
                          label={d.source}
                          value={dynamic.source}
                          swatches={[...new Set([...inPicture, ...swatches])]}
                          onChange={(source) => setDynamic({ source })}
                        />
                        <Button kind="outlined" size="small" icon={Image} onClick={fromPicture}>
                          {d.fromPicture}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Select<Variant>
                        id="color-variant"
                        label={d.variant}
                        hint={d.variantHint}
                        title={d.variant}
                        value={dynamic.variant}
                        options={VARIANTS.map((v) => ({ value: v, label: d.variants[v] }))}
                        onChange={(variant) => setDynamic({ variant })}
                      />
                    </div>
                    <div>
                      <Label hint={d.contrastHint}>{d.contrast}</Label>
                      <SegmentedButton<Contrast>
                        label={d.contrast}
                        value={dynamic.contrast}
                        options={(Object.keys(CONTRASTS) as Contrast[]).map((c) => ({ value: c, label: d.contrasts[c] }))}
                        onChange={(contrast) => setDynamic({ contrast })}
                      />
                    </div>
                  </>
                )}
              </section>
              <FormHeading>{d.colors}</FormHeading>
              <div className="grid gap-5 sm:grid-cols-2">
                {colorFields.map((field) => {
                  const id = `color-${mode}-${field.name}`;
                  return (
                    <div key={field.name}>
                      <Label htmlFor={id} hint={field.hint}>
                        {field.label}
                      </Label>
                      <ColorField
                        id={id}
                        label={field.label}
                        value={colors[mode][field.name]}
                        swatches={swatches}
                        onChange={(v) => set(mode, field.name, v)}
                      />
                    </div>
                  );
                })}
              </div>
              <section className="space-y-2">
                <Button kind="outlined" size="small" disabled={isDefault || saving} onClick={() => setColors(defaultColors)}>
                  {t.colors.standard}
                </Button>
                <SupportingText>{t.colors.standardHint}</SupportingText>
                <SupportingText>{t.colors.icons}</SupportingText>
              </section>
            </>
          }
        />
      </>
    );
  }
}

/** A page's colours as the site was last built (packages/editor/scripts/page-colors.mjs): its address, its colours in both modes, and,
 * when an app changed them, the app (its id) and the picture they came from. */
type BuiltPage = { path: string; light: Record<string, string>; dark: Record<string, string>; app?: string; picture?: string };

// The colours shown of a page, by their names: the accent colour, the light colour, the background and the text.
const SHOWN = ['accent', 'tint', 'bg', 'ink'];

/** "Sider": the apps that change the pages' colours, each to its settings, and each page's colours as the site was last
 * built, those from a picture first. */
function PageColors({ env, files, apps, mode }: { env: Env; files: RepoFile[]; apps: SiteApp[]; mode: Mode }) {
  const p = t.colors.pages;
  // undefined while they are fetched, null when the site has none (not built since, or not built at all).
  const [pages, setPages] = useState<BuiltPage[] | null>();
  useEffect(() => {
    let current = true;
    fetch('/editor/page-colors.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => (Array.isArray(json?.pages) ? (json.pages as BuiltPage[]) : null))
      .catch(() => null)
      .then((found) => current && setPages(found));
    return () => {
      current = false;
    };
  }, []);
  const settings = useMemo(() => appSettings(files, apps), [files, apps]);
  const { relations } = env;
  // A page's name, as the editor has it, else its address.
  const nameAt = (path: string) =>
    [...relations.fixed, ...relations.pages].find((o) => o.value === path)?.label ??
    relations.blog.find((o) => `/${o.value}/` === path)?.label ??
    relations.categories.find((o) => `/blog/kategori/${o.value}/` === path)?.label ??
    path;
  // An app's settings chosen in a list ("Kontrast: Standard · Variant: Som indholdet").
  const chosen = (app: SiteApp) =>
    (app.settings?.fields ?? [])
      .flatMap((f) => {
        const option = f.options?.find((o) => o.value === settings[app.id]?.[f.name]);
        return option ? [`${f.label}: ${option.label}`] : [];
      })
      .join(' · ');
  const fromApp = pages?.filter((page) => page.app) ?? [];
  const own = pages?.filter((page) => !page.app) ?? [];
  const row = (page: BuiltPage) => (
    <li key={page.path}>
      <span className={staticListItemClass}>
        {page.picture && <LeadingImage src={shownAt(splitPicture(page.picture).src)} />}
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{nameAt(page.path)}</span>
          <span className="block truncate text-sm text-muted">{page.path}</span>
        </span>
        <ColorSwatches colors={SHOWN.map((n) => page[mode][n])} label={p.swatches(t.colors[mode])} />
      </span>
    </li>
  );

  return (
    <>
      <p className="text-muted">{p.intro}</p>
      <Group title={p.apps}>
        {apps.map((app) => (
          <li key={app.id}>
            <a href={`#${settingsRoute(app) ?? `apps/${app.id}`}`} className={listItemClass}>
              <LeadingIcon icon={app.icon} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{app.label}</span>
                {chosen(app) && <span className="block text-sm text-muted">{chosen(app)}</span>}
              </span>
              <TrailingIcon />
            </a>
          </li>
        ))}
      </Group>
      {pages === undefined ? (
        <EmptyNote busy>{p.loading}</EmptyNote>
      ) : pages === null ? (
        <EmptyNote>{p.missing}</EmptyNote>
      ) : (
        <>
          {fromApp.length > 0 && <Group title={p.fromApp}>{fromApp.map(row)}</Group>}
          {own.length > 0 && <Group title={p.own}>{own.map(row)}</Group>}
        </>
      )}
    </>
  );
}
