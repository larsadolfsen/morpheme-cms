// "Licenser" (#licenser), under "Indstillinger": the third-party work the site and the editor are made with, as the
// site was last built (/editor/licenses.json, licensesIntegration in packages/editor/lib/licenses.mjs), with a search by
// name, who made it and the licence's name. First the icon packs (the system's, each with the sets it takes icons from
// besides its own), then what the editor and the site's own code bring (the npm packages shipped in what is downloaded),
// then each theme the site is built with and each app installed, under its name: its own licence first, then what it
// brings (what it declares, its icon packs and what is shipped through them alone). Each row has the work's name, its
// version, licence and who made it, and what it is and where it is used; one with a text opens it
// (#licenser/<id>, LicensePage). An app's and a theme's page has its group too (OwnerLicenses), and one in the store,
// from the catalog, the same without the texts (StoreLicenseRows).
import { useEffect, useState } from 'react';
import { Certificate, Code, Image, Shapes, TextAa, type Icon } from '@phosphor-icons/react';
import Screen from './Screen';
import { EmptyNote, Group, GroupTitle, SearchRow, SupportingText, useKept, ListItem } from './ui';
import { backFrom } from './site';
import { apps } from './registry';
import { themes } from './themes';
import { byText } from './schema';
import { locale, t } from './i18n';
import {
  loadLicenses,
  UNLICENSED,
  type LicensedWork,
  type LicenseKind,
  type LicenseOwner,
  type LicensesFile,
  type LicenseWhere,
  type StoreLicenses,
  type ThirdParty,
} from './licenses';

export const LICENSES_ROUTE = 'licenser';

const KIND_ICONS: Record<LicenseKind, Icon> = { font: TextAa, icons: Shapes, library: Code, image: Image };

/** A licence's name as it is shown: its SPDX name, or "Alle rettigheder forbeholdt". */
export const licenseName = (license: string | null | undefined) => (license === UNLICENSED ? t.licenses.unlicensed : (license ?? ''));

/** An app's or a theme's name in the editor's language, by its owner id. */
const ownerName = (o: Pick<LicenseOwner, 'kind' | 'key' | 'name'>) =>
  (o.kind === 'app' ? apps.find((a) => a.id === o.key)?.label : themes.find((x) => x.id === o.key)?.name) ?? o.name;

/** Who brings a work, as a sentence's end: "i editoren og på sitet", "i temaet Material". */
function placesOf(where: LicenseWhere[], owners: LicenseOwner[]) {
  // The editor and the site first, then the themes and the apps.
  const rank = (w: LicenseWhere) => (w === 'editor' ? 0 : w === 'site' ? 1 : w.startsWith('tema/') ? 2 : 3);
  const named = [...where]
    .sort((a, b) => rank(a) - rank(b))
    .map((w) => {
      if (w === 'editor') return t.licenses.inEditor;
      if (w === 'site') return t.licenses.onSite;
      const owner = owners.find((o) => o.id === w);
      const name = owner ? ownerName(owner) : w.split('/')[1];
      return w.startsWith('app/') ? t.licenses.inApp(name) : t.licenses.inTheme(name);
    });
  return new Intl.ListFormat(locale, { type: 'conjunction' }).format(named);
}

/** What a work is and where it is used: "Kode i editoren, gennem @milkdown/kit"; `places`: whether to say where. */
function usageOf(work: LicensedWork, owners: LicenseOwner[], places: boolean) {
  const parts = [t.licenses.kinds[work.kind]];
  if (places && work.where.length) parts[0] += ` ${placesOf(work.where, owners)}`;
  if (work.kind === 'icons' && !work.where.length && !work.via) parts.push(t.licenses.offered);
  if (work.shipped === false) parts.push(t.licenses.notShipped);
  if (work.via?.length) parts.push(t.licenses.via(work.via.join(', ')));
  return parts.join(', ');
}

/** A work as a row: its kind's icon, its name, its version, its licence and who made it, and what it is; opening its
 * licence when `href`. */
function LicenseRow({
  icon,
  name,
  lines,
  version,
  href,
}: {
  icon: Icon;
  name: string;
  lines: string[];
  version?: string | null;
  href?: string;
}) {
  const under = [[version && t.licenses.version(version), lines[0]].filter(Boolean).join(' · '), ...lines.slice(1)].filter(Boolean);
  return (
    <ListItem
      href={href}
      icon={icon}
      headline={name}
      supporting={
        under.length > 0 &&
        under.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))
      }
      arrow={!!href}
    />
  );
}

const byline = (license: string | null | undefined, author: string | null | undefined) =>
  [licenseName(license), author].filter(Boolean).join(' · ');
const hrefOf = (id: string) => `#${LICENSES_ROUTE}/${id}`;

function WorkRow({ work, owners, places, open = true }: { work: LicensedWork; owners: LicenseOwner[]; places: boolean; open?: boolean }) {
  return (
    <LicenseRow
      icon={KIND_ICONS[work.kind]}
      name={work.name}
      lines={[byline(work.license, work.author), usageOf(work, owners, places)]}
      version={work.version}
      href={open && work.text ? hrefOf(work.id) : undefined}
    />
  );
}

/** An app's or a theme's own licence, first in its group. */
function OwnRow({
  owner,
  open = true,
}: {
  open?: boolean;
  owner: Pick<LicenseOwner, 'id' | 'kind' | 'key' | 'name' | 'author' | 'license' | 'version'> & { text?: string | null };
}) {
  return (
    <LicenseRow
      icon={Certificate}
      name={t.licenses.own(ownerName(owner))}
      lines={[byline(owner.license, owner.author)]}
      version={owner.version}
      href={open && owner.text ? hrefOf(owner.id) : undefined}
    />
  );
}

/** The licences as the site was last built: undefined while they load, null when there are none. */
function useLicenses() {
  const [file, setFile] = useState<LicensesFile | null>();
  useEffect(() => {
    let on = true;
    loadLicenses().then((x) => on && setFile(x));
    return () => {
      on = false;
    };
  }, []);
  return file;
}

/** An app's or a theme's works, from the file. */
const worksOf = (owner: LicenseOwner, file: LicensesFile) =>
  owner.works.map((id) => file.works.find((w) => w.id === id)).filter((w): w is LicensedWork => !!w);

export default function Licenses() {
  const file = useLicenses();
  const [query, setQuery] = useKept('licenser-soeg', '');
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (...texts: (string | null | undefined)[]) => {
    const all = texts.filter(Boolean).join(' ').toLowerCase();
    return words.every((w) => all.includes(w));
  };
  const fits = (w: LicensedWork) => matches(w.name, w.author, w.license, licenseName(w.license));
  const sorted = (works: LicensedWork[]) => [...works].sort((a, b) => byText(a.name, b.name));

  const owners = file?.owners ?? [];
  // The system's icon packs (a theme's own are under it, `where` it).
  const packs = file ? sorted(file.works.filter((w) => w.kind === 'icons' && !w.where.some((x) => x.startsWith('tema/')))) : [];
  const system = file ? sorted(file.works.filter((w) => w.kind !== 'icons' && w.where.some((x) => x === 'editor' || x === 'site'))) : [];
  // The themes the site is built with, then the apps installed, each A–Å.
  const inUse = owners
    .filter((o) => o.inUse)
    .sort((a, b) => (a.kind === b.kind ? byText(ownerName(a), ownerName(b)) : a.kind === 'theme' ? -1 : 1));
  const groups = [
    { key: 'icons', title: t.licenses.icons, own: null, works: packs.filter(fits) },
    { key: 'system', title: t.licenses.system, own: null, works: system.filter(fits) },
    ...inUse.map((o) => ({
      key: o.id,
      title: o.kind === 'app' ? t.licenses.app(ownerName(o)) : t.licenses.theme(ownerName(o)),
      own: matches(ownerName(o), o.author, o.license, licenseName(o.license)) ? o : null,
      works: file ? worksOf(o, file).filter(fits) : [],
    })),
  ].filter((g) => g.own || g.works.length);

  return (
    <Screen title={t.common.parts.licenses} wide back={backFrom(LICENSES_ROUTE)}>
      {file === undefined ? (
        <EmptyNote busy>{t.licenses.loading}</EmptyNote>
      ) : file === null ? (
        <EmptyNote>{t.licenses.missing}</EmptyNote>
      ) : (
        <>
          <SearchRow value={query} onChange={setQuery} label={t.common.searchIn(t.common.parts.licenses)} className="mb-6" />
          {groups.length ? (
            groups.map((g) => (
              <Group key={g.key} title={g.title}>
                {g.own && <OwnRow owner={g.own} />}
                {g.works.map((w) => (
                  <WorkRow key={w.id} work={w} owners={owners} places={g.key === 'system' || g.key === 'icons'} />
                ))}
              </Group>
            ))
          ) : (
            <p className="mb-8 px-1 text-muted">{t.common.noMatch}</p>
          )}
        </>
      )}
    </Screen>
  );
}

/** A licence's text in paragraphs, each with its lines flowing (a licence file is wrapped by hand at 80 characters), but
 * a line of dashes under a heading. */
const paragraphsOf = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !/^[-=_*~]+$/.test(line))
        .join(' '),
    )
    .filter(Boolean);

/** One licence (#licenser/<id>): a work's, or an app's or a theme's own: its name, licence, who made it, what it is and
 * its version, and its text. */
export function LicensePage({ id }: { id: string }) {
  const file = useLicenses();
  const work = file?.works.find((w) => w.id === id);
  const owner = file?.owners.find((o) => o.id === id);
  const name = work?.name ?? (owner ? t.licenses.own(ownerName(owner)) : t.common.parts.licenses);
  const text = work?.text ?? owner?.text;
  const back = { href: `#${LICENSES_ROUTE}`, label: t.common.parts.licenses };
  return (
    <Screen title={name} wide back={back}>
      {file === undefined ? (
        <EmptyNote busy>{t.licenses.loading}</EmptyNote>
      ) : !work && !owner ? (
        <EmptyNote>{file === null ? t.licenses.missing : t.licenses.notFound}</EmptyNote>
      ) : (
        <>
          <Group>
            {work ? <WorkRow work={work} owners={file?.owners ?? []} places open={false} /> : <OwnRow owner={owner!} open={false} />}
          </Group>
          <section className="mb-8">
            <GroupTitle>{t.licenses.text}</GroupTitle>
            {work?.standard && <SupportingText className="mb-3 px-4">{t.licenses.standardText(work.license)}</SupportingText>}
            {text ? (
              paragraphsOf(text).map((p, i) => (
                <p key={i} className="mb-3 px-4 break-words last:mb-0">
                  {p}
                </p>
              ))
            ) : (
              <p className="px-4 text-muted">{t.licenses.noText}</p>
            )}
          </section>
        </>
      )}
    </Screen>
  );
}

/** An app's or a theme's licences on its page, under "Licenser": its own, then what it brings, as the site was last
 * built (opening each licence under "Licenser"), else as it declares them (`declared`: an app installed or a theme
 * since the site was built). */
export function OwnerLicenses({
  id,
  name,
  author,
  version,
  declared,
}: {
  id: LicenseOwner['id'];
  name: string;
  author: string;
  version?: string | null;
  declared: { license?: string; thirdParty?: ThirdParty[] };
}) {
  const file = useLicenses();
  const owner = file?.owners.find((o) => o.id === id);
  const [kind, key] = id.split('/') as ['app' | 'tema', string];
  const self = owner ?? {
    id,
    kind: kind === 'app' ? ('app' as const) : ('theme' as const),
    key,
    name,
    author,
    version: version ?? null,
    license: declared.license ?? '',
    text: null,
  };
  return (
    <Group title={t.common.parts.licenses}>
      <OwnRow owner={self} />
      {owner && file
        ? worksOf(owner, file).map((w) => <WorkRow key={w.id} work={w} owners={file.owners} places={false} />)
        : (declared.thirdParty ?? []).map((x, i) =>
            'package' in x ? (
              <LicenseRow key={i} icon={KIND_ICONS[x.kind]} name={x.package} lines={[t.licenses.kinds[x.kind]]} />
            ) : (
              <LicenseRow key={i} icon={KIND_ICONS[x.kind]} name={x.name} lines={[byline(x.license, x.author)]} version={x.version} />
            ),
          )}
    </Group>
  );
}

/** An app's or a theme's licences on its page in the store, from the catalog (StoreLicenses: without the texts). */
export function StoreLicenseRows({
  licenses,
  name,
  author,
  version,
}: {
  licenses?: StoreLicenses;
  name: string;
  author: string;
  version?: string;
}) {
  if (!licenses) return null;
  return (
    <Group title={t.common.parts.licenses}>
      <LicenseRow icon={Certificate} name={t.licenses.own(name)} lines={[byline(licenses.license, author)]} version={version} />
      {licenses.works.map((w, i) => (
        <LicenseRow
          key={i}
          icon={KIND_ICONS[w.kind]}
          name={w.name}
          lines={[byline(w.license, w.author), t.licenses.kinds[w.kind]]}
          version={w.version}
        />
      ))}
    </Group>
  );
}
