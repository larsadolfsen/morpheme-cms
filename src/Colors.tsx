// "Appearance" › "Colors" (#appearance/colors): the site's colours, for light and dark mode, in the site's file of
// colours (config.colors, packages/editor/lib/colors.ts). The first tab, "Generator", where the screen starts, or one
// mode at a time, picked with the tabs after it, and the editor is shown in the mode while the screen is open
// (theme.ts holdTheme). Each mode has a little page drawn in its colours, the pairs that are too hard to
// read (colorPairs in @site/colors, WCAG AA) and a field for each colour (colorFields). Colours
// that are hard to read together cannot be saved; "Save" then shows the mode they are in. "Reset to
// default colors" puts back the ones the site was designed with (defaultColors). The generator is dynamic colour for
// both modes at once, with its three base colours at the top (ColorTiles) and the little page in each mode under the
// fields: it
// makes all of them, in both modes, from one source colour, Material 3's way (dynamic colour,
// lib/dynamic-colors.ts, each colour by its role, colorRoles): the source colour picked or taken from a
// picture, or dragged on a colour wheel (ColorWheel), a colour harmony (HARMONIES: where the secondary and tertiary
// colours are on the wheel from it) and a contrast level, kept in the file with the colours. Choosing one of them makes
// the colours from them; changing a colour by hand turns it off. Material's other source of dynamic colour, each page's own picture, is an app ("Content-based
// colors", src/apps/content-colors/: pageColors in packages/editor/site/pageColors.ts). While an app installed changes the pages'
// colours (hooks/page-colors.ts), each mode shows the pages' colours instead (PageColors), as the site was last built
// (/editor/page-colors.json, packages/editor/scripts/page-colors.mjs): first a notice that the apps give them, with a button to the
// site's own, which are only the fallback ("Fallback colors", #appearance/colors/fallback-colors, a page of the same form, so
// what is unsaved stays), then the apps, each to its settings, the pages with colours from a picture (the picture, the
// page and its colours in the mode open), and those with the site's own. Saved with "Save changes" in one commit; the
// editor shows the new colours at once (theme.ts applyColors), the site when it is built again.
import { useEffect, useMemo, useState } from 'react';
import { Image, Moon, Palette, Sun } from '@phosphor-icons/react';
import { ConflictError, type RepoFile } from './github';
import FormFrame, { useFormPages } from './FormFrame';
import {
  Button,
  ChipSet,
  ColorField,
  ColorSwatches,
  ColorTiles,
  ColorWheel,
  ColorsPreview,
  EmptyNote,
  FilterChip,
  FormColumns,
  FormField,
  Group,
  Label,
  LeadingImage,
  LinkButton,
  Notice,
  SupportingText,
  SegmentedButton,
  ProblemNote,
  ListItem,
} from './ui';
import type { Env } from './App';
import { savedText } from './deploy';
import { colorProblems, lowContrast, MODES, type Colors as ColorsData, type Mode } from '../lib/colors';
import {
  completeColors,
  CONTRASTS,
  dynamicColors,
  dynamicProblems,
  BASE_COLORS,
  HARMONIES,
  canSetBaseColor,
  withBaseColor,
  wheelColor,
  wheelColors,
  wheelDots,
  type Contrast,
  type Dynamic,
} from '../lib/dynamic-colors';
import { colorRoles, config, defaultColors } from '@site/editor';
import { colorsInPicture, pickImage, shownAt } from './images';
import { holdTheme, shownMode } from './theme';
import { locale, siteT, t } from './i18n';
import { colorFields, colorPairs, apps as siteApps } from './site';
import { activeApps, appSettings, type SiteApp } from './apps';
import { settingsRoute } from './AppList';
import { splitPicture } from '../lib/crop.mjs';

const names = colorFields.map((f) => f.name);

/** The site's colours as the editor has them (with those a file written before them does not have made, completeColors),
 * or the ones it was designed with when the file is missing or cannot be read (`unreadable`). */
export function colorsOf(files: RepoFile[]): ColorsData & { unreadable?: boolean } {
  const file = files.find((f) => f.path === config.colors);
  try {
    const colors = completeColors(JSON.parse(file?.text ?? ''), colorRoles);
    if (!colorProblems(colors, names).length && (colors.dynamic === undefined || !dynamicProblems(colors.dynamic).length)) return colors;
  } catch {}
  return { ...defaultColors, unreadable: true };
}

const fileOf = (colors: ColorsData) => {
  const sets = Object.fromEntries(MODES.map((m) => [m, Object.fromEntries(names.map((n) => [n, colors[m][n]]))]));
  const d = colors.dynamic;
  const dynamic = d && {
    source: d.source,
    ...(d.harmony ? { harmony: d.harmony } : { variant: d.variant }),
    contrast: d.contrast,
    ...(d.sourceLocked && { sourceLocked: true }),
  };
  return `${JSON.stringify({ ...sets, ...(dynamic && { dynamic }) }, null, 2)}\n`;
};

/** The colours made from a choice of dynamic colour, with the choice. */
const madeFrom = (dynamic: Dynamic): Pick<ColorsData, 'light' | 'dark' | 'dynamic'> => ({ ...dynamicColors(dynamic, colorRoles), dynamic });

// The colour wheel's edge and middle, the same for every choice.
const wheel = wheelColors();

const ratio = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 1 });

// What a save of the colours changed (deploy.ts).
const CHANGE = t.app.changes.edited(t.app.changes.colors);

/** The screen's tabs: a mode's colours, or the generator (dynamic colour), for both. */
type Tab = Mode | 'generator';

/** The page with the site's own colours, while an app changes the pages' colours: the fallback. */
export const FALLBACK_ROUTE = 'appearance/colors/fallback-colors';

/** The apps installed that change the pages' colours (hooks/page-colors.ts). */
const colorApps = (files: RepoFile[]) => {
  const installed = activeApps(files);
  return siteApps.filter((a) => installed.includes(a.id) && a.needs.changes?.includes('page-colors'));
};

/** `fallback`: the page with the site's own colours is open (FALLBACK_ROUTE). */
export default function Colors({ env, files, fallback }: { env: Env; files: RepoFile[]; fallback?: boolean }) {
  const notify = env.notify;
  const loaded = useMemo(() => colorsOf(files), [files]);
  const [colors, setColors] = useState<ColorsData>(loaded);
  const [saving, setSaving] = useState(false);
  // It starts on the generator, or, on the page with the site's own colours (the fallback), in the mode the editor is
  // shown in.
  const [tab, setTab] = useState<Tab>(fallback ? shownMode : 'generator');
  // The mode the editor is shown in: the tab's, or on the generator the last one open (at first the one it is in).
  const [mode, setMode] = useState<Mode>(shownMode);
  useEffect(() => holdTheme(mode), [mode]);
  const show = (tab: Tab) => {
    setTab(tab);
    if (tab !== 'generator') setMode(tab);
  };
  const changing = useMemo(() => colorApps(files), [files]);
  useEffect(() => () => holdTheme(null), []);
  // While an app changes the pages' colours, the modes show the pages', and the site's own are on a page of the form.
  useFormPages(changing.length ? ['appearance/colors', FALLBACK_ROUTE] : []);
  const ownShown = fallback || !changing.length;
  const appNames = new Intl.ListFormat(locale).format(changing.map((a) => a.label));
  const file = files.find((f) => f.path === config.colors);
  const text = fileOf(colors);
  // Not changed while they are the file's (with the colours one written before them did not have, which a save adds).
  const dirty = text !== file?.text && (!!loaded.unreadable || text !== fileOf(loaded));
  const low = Object.fromEntries(MODES.map((m) => [m, lowContrast(colors[m], colorPairs)])) as Record<Mode, ReturnType<typeof lowContrast>>;
  const isDefault = text === fileOf(defaultColors);
  // The colours to pick from in a colour's sheet: the site's own, in both modes, and the ones it was made with.
  const swatches = [...new Set([colors, defaultColors].flatMap((c) => MODES.flatMap((m) => names.map((n) => c[m][n].toLowerCase()))))];
  const dynamic = colors.dynamic;
  const d = t.colors.dynamic;

  // A colour changed by hand: they are no longer made from the source colour.
  const set = (mode: Mode, name: string, value: string) => {
    if (dynamic) notify({ text: d.turnedOff });
    setColors(({ dynamic: _, ...c }) => ({ ...c, [mode]: { ...c[mode], [name]: value } }));
  };
  // The generator's choice: the one the colours were made from, else where it starts (the accent colour in light mode,
  // the first harmony, Material's standard contrast). Choosing makes the colours from it.
  const choiceOf = (c: ColorsData): Dynamic => c.dynamic ?? { source: c.light.primary, harmony: HARMONIES[0], contrast: 'standard' };
  const choice = choiceOf(colors);
  const update = (change: (d: Dynamic) => Dynamic) => setColors((c) => ({ ...c, ...madeFrom(change(choiceOf(c))) }));
  const setDynamic = (change: Partial<Dynamic>) => update((d) => ({ ...d, ...change }));

  async function fromPicture() {
    const file = await pickImage();
    if (!file) return;
    try {
      const found = await colorsInPicture(file);
      if (!found.length) return notify({ text: d.noColorInPicture, error: true });
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
      show(hard);
      if (!ownShown) location.hash = `#${FALLBACK_ROUTE}`;
      return notify({ text: t.colors.cannotSave, error: true });
    }
    const path = config.colors;
    const changes = [{ path, content: text, oid: file?.oid || null }];
    setSaving(true);
    notify({ text: t.common.saving });
    try {
      const oids = await env.commit(siteT.colors.commit, changes, CHANGE);
      env.onSaved({ path, oid: oids[path], text });
      notify({ text: savedText(CHANGE), kind: 'saved' });
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
          ? { href: '#appearance/colors', label: t.common.parts.colors, guard: (go) => go() }
          : { href: '#appearance', label: t.common.parts.appearance }
      }
      dirty={dirty}
      saving={saving}
      onSave={save}
      panel
      tabs={{
        label: t.colors.modes,
        value: tab,
        options: [
          { value: 'generator', label: d.tab, icon: Palette },
          { value: 'light', label: t.colors.light, icon: Sun },
          { value: 'dark', label: t.colors.dark, icon: Moon },
        ],
        onChange: show,
      }}
    >
      {tab === 'generator' ? (
        generator()
      ) : ownShown ? (
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

  // A mode's little page and the pairs in it that are too hard to read.
  function preview(mode: Mode) {
    return (
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
    );
  }

  // "Generator": dynamic colour, for both modes: the three base colours, the colour wheel with the harmonies, the
  // source colour and the contrast, and the little page in each mode beside them (on a phone under them).
  function generator() {
    const dots = wheelDots(choice);
    return (
      <>
        {loaded.unreadable && file && <ProblemNote>{t.colors.unreadable}</ProblemNote>}
        <FormColumns
          cards={false}
          sticky
          main={
            <section className="space-y-5">
              <FormField label={d.base}>
                <div className="space-y-3">
                  <ColorTiles
                    label={d.base}
                    colors={BASE_COLORS.map((which, i) => ({
                      color: dots[i].color,
                      name: [d.source, t.colors.preview.secondary, t.colors.preview.tertiary][i],
                      disabled: !canSetBaseColor(choice, which),
                      onChange: (color, lock) => update((c) => withBaseColor(c, which, color, lock)),
                      // Only the source colour has a lock.
                      ...(which === 'source' && {
                        locked: !!choice.sourceLocked,
                        onLock: (locked: boolean) => update(({ sourceLocked: _, ...c }) => (locked ? { ...c, sourceLocked: true } : c)),
                      }),
                    }))}
                  />
                  <Button kind="outlined" size="small" icon={Image} onClick={fromPicture}>
                    {d.fromPicture}
                  </Button>
                </div>
              </FormField>
              {/* Named by the harmony chosen, else (a file with a variant) "Harmony". */}
              <FormField label={choice.harmony ? d.harmonies[choice.harmony] : d.harmony} hint={d.harmonyHint}>
                <div className="space-y-4">
                  <ChipSet label={d.harmony} scroll>
                    {HARMONIES.map((h) => (
                      <FilterChip key={h} selected={choice.harmony === h} onClick={() => setDynamic({ harmony: h, variant: undefined })}>
                        {d.harmonies[h]}
                      </FilterChip>
                    ))}
                  </ChipSet>
                  <ColorWheel
                    edge={wheel.edge}
                    middle={wheel.middle}
                    dots={dots.map((dot, i) => ({ ...dot, locked: !i && !!choice.sourceLocked }))}
                    label={d.wheel}
                    valueText={choice.source}
                    disabled={choice.sourceLocked}
                    onMove={(x, y) =>
                      // A harmony from the wheel on, as the dots are its (a variant's palettes do not follow the chroma).
                      update((c) => ({ ...c, source: wheelColor(x, y), harmony: c.harmony ?? HARMONIES[0], variant: undefined }))
                    }
                  />
                </div>
              </FormField>
              <FormField label={d.contrast} hint={d.contrastHint}>
                <SegmentedButton<Contrast>
                  label={d.contrast}
                  value={choice.contrast}
                  options={(Object.keys(CONTRASTS) as Contrast[]).map((c) => ({ value: c, label: d.contrasts[c] }))}
                  onChange={(contrast) => setDynamic({ contrast })}
                />
              </FormField>
            </section>
          }
          side={
            <div className="space-y-6">
              {MODES.map((m) => (
                <div key={m}>{preview(m)}</div>
              ))}
            </div>
          }
        />
      </>
    );
  }

  // A mode's colours: the preview and the fields (a function, not a component, so the fields keep their focus).
  function modeColors() {
    return (
      <>
        <p className="text-on-surface-variant">{changing.length ? t.colors.pages.fallbackIntro(appNames) : t.colors.intro}</p>
        {loaded.unreadable && file && <ProblemNote>{t.colors.unreadable}</ProblemNote>}
        {/* On a wide computer screen the colours in the wide column, and the preview beside them, in view
          while they are changed. */}
        <FormColumns
          cards={false}
          sticky
          first={preview(mode)}
          main={
            <>
              <div className="grid gap-5 medium:grid-cols-2">
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
const SHOWN = ['primary', 'surface-container-high', 'surface', 'on-surface'];

/** "Pages": the apps that change the pages' colours, each to its settings, and each page's colours as the site was last
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
  // An app's settings chosen in a list ("Contrast: Standard · Variant: Like the content").
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
    <ListItem
      key={page.path}
      leading={page.picture && <LeadingImage src={shownAt(splitPicture(page.picture).src)} />}
      headline={nameAt(page.path)}
      supporting={page.path}
      truncate
      trailing={<ColorSwatches colors={SHOWN.map((n) => page[mode][n])} label={p.swatches(t.colors[mode])} />}
    />
  );

  return (
    <>
      <p className="text-on-surface-variant">{p.intro}</p>
      <Group title={p.apps}>
        {apps.map((app) => (
          <ListItem
            key={app.id}
            href={`#${settingsRoute(app) ?? `apps/${app.id}`}`}
            icon={app.icon}
            headline={app.label}
            supporting={chosen(app)}
            arrow
          />
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
