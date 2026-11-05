// A JSON file: one entry of a folder (a price, a testimonial, a category) or a single file (a fixed
// page, the menu). The files are written as JSON.stringify(data, null, 2) like the existing ones, with
// the keys in their order, so a save only changes what was edited. An earlier version (Versions.tsx)
// is opened as changes that are not saved. Exposes DataForm (default). Its values from the file and back: dataFileValues.ts;
// a menu's fields: DataFileFields.tsx.
import { useMemo, useState } from 'react';
import { entryName, slugify, slugOf, type DataFile, type FilesCollection, type FolderCollection } from './schema';
import { config, header, keptBy, sharing, siteName, usesOf } from '@site/editor';
import { apps, asWritten, collections } from './site';
import { kindDraw } from './apps';
import { ConflictError, type RepoFile } from './github';
import { clean, newItem, newValue, problemAt } from './check';
import { FieldInput, FieldList, Fields, useWrongField, WrongField, type FieldContext } from './fields';
import { CreateFab } from './CreateFab';
import { DataFileFields } from './DataFileFields';
import { dataOf, fieldsOf, listOnly, valuesOf } from './dataFileValues';
import SectionsField from './SectionsField';
import { notOffered, withPageBlocks } from './registry';
import { shownAt, useUploads } from './images';
import { splitPicture } from '../lib/crop.mjs';
import { useMediaPicker } from './Media';
import FormFrame, { savedStatus, useSavedAt } from './FormFrame';
import { savedOn, VersionNotice, VersionsButton, WithVersions, type ShownVersion } from './Versions';
import { Button, CheckList, FoldSection, FormColumns, Group, Preview, FormHeading, SharePreview, Notice, ListItem } from './ui';
import { SearchPreview } from './SearchPreview';
import { searchedAs } from './googleResult.mjs';
import { plain, SEO_FIELDS, seoRating, SHARE_FIELDS, sharedAs } from './seo';
import type { Env } from './App';
import { kindAndName, lower, nameOf, savedText } from './deploy';
import { siteT, t } from './i18n';

type Props = {
  collection: FolderCollection | FilesCollection;
  dataFile?: DataFile;
  file: RepoFile;
  env: Env;
  /** A new entry of this kind (FolderCollection.kinds), picked in the list's create FAB menu. */
  kind?: string;
};

// The form starts again with an earlier version, or with the one saved now.
export default function DataForm(props: Props) {
  return (
    <WithVersions notify={props.env.notify}>
      {(version, onVersion) => <Form {...props} version={version} onVersion={onVersion} />}
    </WithVersions>
  );
}

function Form({
  collection,
  dataFile,
  file,
  env,
  kind,
  version,
  onVersion,
}: Props & { version: ShownVersion | null; onVersion: (v: ShownVersion | null) => void }) {
  // A fixed page's sections with every block a page can have (`pageBlocks`); those turned off or of an app not
  // installed are not offered under "Indsæt" (`off`), but drawn and checked where they are, as on a page.
  const off = useMemo(() => notOffered(env.files), [env.files]);
  const fields = useMemo(
    () => withPageBlocks(dataFile ? fieldsOf(dataFile) : (collection as FolderCollection).fields),
    [dataFile, collection],
  );
  const [base, setBase] = useState(file);
  const isNew = !base.path;
  const kinds = collection.kind === 'folder' ? collection.kinds : undefined;
  const initial = useMemo(
    () =>
      isNew
        ? { ...newValue(fields), ...(kinds && kind ? { [kinds]: kind } : {}) }
        : valuesOf(base.text, fields, dataFile, collection, env.files),
    [base],
  );
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    version ? valuesOf(version.text, fields, dataFile, collection, env.files) : initial,
  );
  const notify = env.notify;
  // A form that cannot be saved: why, as a message, and the field marked (useWrongField in fields.tsx), with the section
  // it is in opened first (below).
  const wrongField = useWrongField(
    (text) => notify({ text, error: true }),
    (path) => {
      const name = path.split('.')[0];
      if (SEO_FIELDS.includes(name)) setSeoOpen(true);
      if (SHARE_FIELDS.includes(name)) setShareOpen(true);
    },
  );
  // The sections for search engines and social media, folded from the start, as on a page (EntryForm.tsx).
  const [seoOpen, setSeoOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  // A file is named by its label, as in its list (Forside, Menu …); a fixed page (`pages`) says when it was last saved.
  const fixed = collection.kind === 'files' && !!collection.pages;
  // When a fixed page was last saved, in the top bar as on the pages.
  const [savedAt, setSavedAt] = useSavedAt(env, fixed ? base.path : '');

  // Pictures in the text of a fixed page (the front page's picture …), saved with the file.
  const pictures = useUploads(notify);
  const [pickImage, picker] = useMediaPicker(env.media, pictures);
  const context: FieldContext = {
    relations: env.relations,
    lists: env.lists,
    testimonials: env.testimonials,
    site: env.site,
    pickImage,
    // A fixed page's address, for what is shown on it (a button among its sections that opens a promotion).
    page: fixed && dataFile!.view.endsWith('/') ? dataFile!.view : undefined,
  };

  // Only the pages (the fixed ones here) link to themselves on the site.
  const view = fixed ? dataFile!.view : undefined;

  async function save() {
    if (wrongField.stop(problemAt(fields, values))) return;
    let data = dataOf(fields, values, dataFile);
    // Looked through now that it is saved (FolderCollection.fresh).
    if (collection.kind === 'folder' && collection.fresh) delete (data as Record<string, unknown>)[collection.fresh.field];
    let path = base.path;
    if (isNew) {
      const folder = collection as FolderCollection;
      // Of a kind without a field to name it (the contact bar), by the kind's name, in the site's language. Only the
      // fields of its kind count (`data`): not the default of another kind's name.
      const named = data as Record<string, unknown>;
      const from = [folder.slugFrom].flat().find((name) => String(named[name] ?? '').trim());
      const writtenKind = asWritten(folder)
        .fields.find((f) => f.name === folder.kinds)
        ?.options?.find((o) => o.value === kindNow)?.label;
      const slug = slugify(String((from && named[from]) || writtenKind || ''));
      if (!slug) return notify({ text: t.forms.nameNeedsLetters, error: true });
      // With -2, -3 … when the name is taken (a second bar, named Handlingslinje like the first).
      path = `${folder.folder}/${slug}.json`;
      for (let n = 2; env.files.some((f) => f.path === path); n++) path = `${folder.folder}/${slug}-${n}.json`;
      // A new entry comes last; `order` is the first key, as in the existing files.
      if (folder.orderable) data = { order: env.nextOrder(folder), ...(data as object) };
    }
    const text = `${JSON.stringify(data, null, 2)}\n`;
    if (text === base.text) return notify({ text: t.forms.nothingToSave });
    // Something on the site needs it as it was (a button that opens a promotion on a page): where, with a link there.
    const kept = !isNew && !dataFile ? keptBy(collection, path, data as Record<string, unknown>, env.files) : null;
    if (kept) return notify(kept);
    const what = dataFile ? asWritten(dataFile).label.toLowerCase() : `"${slugOf(path, (collection as FolderCollection).folder)}"`;
    const used = pictures.usedIn(text);
    const message = isNew
      ? siteT.forms.commit.create(asWritten(collection).create!, what)
      : version
        ? siteT.history.commit.restoreVersion(dataFile ? what : `${asWritten(collection).singular} ${what}`, savedOn(version))
        : dataFile
          ? siteT.forms.commit.edit(what)
          : siteT.forms.commit.editOne(asWritten(collection).singular, what);
    const changes = [{ path, content: text, oid: base.oid || null }, ...used.map((u) => ({ path: u.path, content: u.bytes, oid: null }))];
    const entry = dataFile ? lower(dataFile.label) : kindAndName(collection.singular, nameOf(collection, { path, text }));
    const change = isNew ? t.app.changes.created(entry) : version ? t.app.changes.restored(entry) : t.app.changes.edited(entry);
    setSaving(true);
    notify({ text: t.common.saving });
    try {
      const oids = await env.commit(message, changes, change);
      pictures.markSaved(used);
      if (fixed) setSavedAt(new Date());
      const saved = { path, oid: oids[path], text };
      setBase(saved);
      setValues(listOnly(dataFile) ? { [dataFile!.root!.name]: JSON.parse(text) } : JSON.parse(text));
      env.onSaved(saved);
      notify({ text: savedText(change), kind: 'saved' });
      // The version is now the one saved: the form as usual again.
      if (version) onVersion(null);
      return true;
    } catch (e) {
      notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setSaving(false);
    }
  }

  // A fixed page is laid out like a page: its H1, its text (the introduction and the sections), then
  // the other fields, the first its address.
  const text = fields.find((f) => f.type === 'blocks');
  const top = text ? fields.filter((f) => f.name === 'heading') : [];
  const others = text ? fields.filter((f) => f !== text && !top.includes(f) && f.name !== text.intro) : fields;
  // The fields for search engines (a fixed page's, a tag's) in their own section at the end, which folds in and out, with
  // the SEO rating first, as on a page (EntryForm.tsx): its H1 is its own field (the heading, a tag's name), and an empty
  // Google description is the introduction's (a tag's: a text with the number of its posts, Category.astro). Then the
  // picture when it is shared under "Sociale medier", under a preview of the shared link, as on a page.
  const seoFields = others.filter((f) => SEO_FIELDS.includes(f.name));
  const shareFields = others.filter((f) => SHARE_FIELDS.includes(f.name));
  const rest = others.filter((f) => !seoFields.includes(f) && !shareFields.includes(f));
  const seoNow = JSON.stringify([
    values.heading,
    values.name,
    values.intro,
    values.seoTitle,
    values.seoDescription,
    values.keyword,
    values.noindex,
    values.canonical,
  ]);
  const rating = useMemo(() => {
    if (!seoFields.length) return [];
    const h1 = String(values.heading ?? values.name ?? '');
    const intro = text?.intro ? String(values[text.intro] ?? '') : '';
    return seoRating({
      post: false,
      title: h1,
      h1,
      body: intro,
      seoTitle: String(values.seoTitle ?? ''),
      seoDescription: String(values.seoDescription ?? ''),
      descriptionFrom: intro.trim() ? t.forms.seoRating.fromIntro : t.forms.seoRating.fromCount,
      // The blog page's, which has the same fields as a page.
      keyword: String(values.keyword ?? ''),
      noindex: values.noindex === true,
      canonical: String(values.canonical ?? ''),
      relations: env.relations,
    });
  }, [seoNow, seoFields.length]);
  // The page as the site writes it (BlogIndex.astro): the heading or the tag's name with the site's name after it, and the
  // introduction or, on a tag, the number of its posts on the blog.
  const pageNow = () => {
    const name = String(values.heading ?? values.name ?? '');
    const intro = text?.intro ? plain(String(values[text.intro] ?? '')) : '';
    const tag = collection.kind === 'folder' && base.path ? slugOf(base.path, collection.folder) : '';
    const count = env.site.posts.filter((p) => p.categories.includes(tag)).length;
    return {
      title: name,
      seoTitle: String(values.seoTitle ?? ''),
      seoDescription: String(values.seoDescription ?? ''),
      description: intro || (collection.kind === 'folder' ? siteT.forms.tagShared(count, name) : ''),
      site: sharing,
    };
  };
  // The link as shared.
  const card = () => sharedAs({ ...pageNow(), shareImage: String(values.shareImage ?? '') });
  // The Google result (SearchPreview) at the page's address on the site: a fixed page's own, a tag's /blog/kategori/<file
  // name>/ (its name for one not saved yet).
  const resultPath = () => {
    if (fixed) return dataFile!.view;
    if (collection.kind !== 'folder') return '/';
    return `/blog/kategori/${base.path ? slugOf(base.path, collection.folder) : slugify(String(values.name ?? ''))}/`;
  };
  const result = seoFields.length > 0 && seoOpen ? searchedAs(pageNow()) : null;
  const seoSection = seoFields.length > 0 && (
    <FoldSection title={t.forms.seo} open={seoOpen} onToggle={() => setSeoOpen(!seoOpen)}>
      {rating.length > 0 && <CheckList title={t.forms.seoRating.title} items={rating} />}
      {result && (
        <SearchPreview
          domain={config.domain}
          path={resultPath()}
          siteName={sharing.name}
          title={result.title}
          description={result.description}
        />
      )}
      <FieldList fields={seoFields} value={values} onChange={(v) => setValues(v as Record<string, unknown>)} />
    </FoldSection>
  );
  const shared = shareFields.length > 0 && shareOpen ? card() : null;
  const shareSection = shareFields.length > 0 && (
    <FoldSection title={t.forms.share} open={shareOpen} onToggle={() => setShareOpen(!shareOpen)}>
      {shared && (
        <SharePreview
          image={shownAt(splitPicture(shared.image).src)}
          domain={config.domain}
          title={shared.title}
          description={shared.description}
        />
      )}
      <FieldList fields={shareFields} value={values} onChange={(v) => setValues(v as Record<string, unknown>)} />
    </FoldSection>
  );
  // The other fields as they are now, for the previews of the sections (MarkdownEditor.tsx draws
  // them again when these change, not at every key in the text).
  const othersNow = JSON.stringify(Object.fromEntries(others.map((f) => [f.name, values[f.name]])));
  const page = useMemo(() => dataFile && { file: dataFile.file, values: JSON.parse(othersNow) as Record<string, unknown> }, [othersNow]);
  const field = (f: (typeof fields)[number]) => (
    <FieldInput key={f.name} field={f} value={values[f.name]} onChange={(v) => setValues({ ...values, [f.name]: v })} />
  );

  const folder = collection.kind === 'folder' ? collection : null;
  // An entry of a list of kinds (Promovering): how it looks on the site, with the fields as they are now,
  // beside them; drawn by its kind, an app's (AppKind.draw, or its part in the list's own drawing, kindDraw; once for each
  // of its variants: Mailchimp's before and after a signup) or the list's own (FolderCollection.draws: the pop-up).
  const kindField = folder?.kinds ? folder.fields.find((f) => f.name === folder.kinds) : undefined;
  const kindNow = kindField ? String(values[kindField.name] ?? kindField.default ?? '') : '';
  const kindLabel = kindField?.options?.find((o) => o.value === kindNow)?.label ?? '';
  const appKind = apps.find((a) => a.id === kindNow)?.kinds?.[collection.id];
  const draw = (appKind && kindDraw(appKind, folder ?? undefined)) ?? folder?.draws?.[kindNow];
  const drawn =
    draw &&
    (appKind?.variants ?? [{ label: '', props: {} }]).map((v) => ({
      label: v.label,
      node: draw({ ...values, ...v.props }, { lists: env.lists, testimonials: env.testimonials, relations: env.relations, site: env.site }),
    }));
  // A file that is a list (the menus) is added to with the FAB, like the other lists; its own fields
  // ("Aktiveret") stand above it.
  const root = dataFile?.root;
  // Where the entry is used on the site (a tag: its posts, testimonials, promotions and blocks), each opening it.
  const uses = useMemo(() => (folder && !isNew ? usesOf(folder, env.files)(base) : []), [folder, isNew, env.files, base]);
  const items = root ? ((values[root.name] ?? []) as unknown[]) : [];
  const setItems = (v: unknown) => setValues({ ...values, [root!.name]: v });

  return (
    <Fields.Provider value={context}>
      <WrongField.Provider value={wrongField.field}>
        <FormFrame
          title={dataFile ? dataFile.label : isNew ? collection.create! : entryName(folder!, clean(fields, initial)) || kindLabel}
          back={
            header.includes(collection.id)
              ? { href: '#appearance/header', label: t.common.parts.header }
              : collection.id === 'footer'
                ? { href: '#appearance/footer', label: t.common.parts.footer }
                : collection.kind === 'files' && collection.files.length === 1
                  ? { href: '#', label: siteName }
                  : { href: `#list/${collection.id}`, label: collection.label }
          }
          status={fixed ? savedStatus({ savedAt, saving, deleting }) : undefined}
          view={view}
          actions={!isNew && <VersionsButton env={env} path={base.path} onPick={onVersion} />}
          dirty={dirty}
          saving={saving || deleting}
          deleting={deleting}
          onSave={save}
          onDelete={folder?.deletable && !isNew ? () => env.remove(folder, base, setDeleting) : undefined}
          deleteLabel={t.forms.deleteOne(collection.singular)}
          panel={!!text || !!drawn}
          wide={!!root}
        >
          {version && <VersionNotice version={version} onCurrent={() => onVersion(null)} />}
          {/* Added by something else and not yet looked through (FolderCollection.fresh): saved, it no longer is. */}
          {folder?.fresh && values[folder.fresh.field] === true && (
            <Notice
              title={folder.fresh.label(values)}
              action={
                <Button kind="outlined" size="small" disabled={saving} onClick={() => void save()}>
                  {folder.fresh.approve}
                </Button>
              }
            >
              {folder.fresh.notice}
            </Notice>
          )}
          {text ? (
            <FormColumns
              main={
                <>
                  {top.map(field)}
                  <SectionsField
                    field={text}
                    value={(values[text.name] ?? []) as Record<string, unknown>[]}
                    intro={text.intro ? String(values[text.intro] ?? '') : undefined}
                    page={page}
                    off={off}
                    onChange={(sections, intro) =>
                      setValues((v) => ({ ...v, [text.name]: sections, ...(text.intro ? { [text.intro]: intro } : {}) }))
                    }
                  />
                </>
              }
              side={
                <>
                  <FormHeading first>{t.forms.otherFields}</FormHeading>
                  <FieldInput
                    field={{ name: 'path', label: t.forms.address, type: 'readonly' }}
                    value={dataFile!.view}
                    onChange={() => {}}
                  />
                  {rest.map(field)}
                  {seoSection}
                  {shareSection}
                </>
              }
            />
          ) : root ? (
            <div className="space-y-6">
              <DataFileFields dataFile={dataFile!} value={values} onChange={setValues} />
            </div>
          ) : drawn ? (
            // On a wide computer screen the drawing in the wide column and the fields beside it at the
            // right (FormColumns, as under "Standardblokke"); narrower, the fields and then the drawing.
            <FormColumns
              first={<FieldList fields={fields} value={values} onChange={(v) => setValues(v as Record<string, unknown>)} />}
              main={
                <div>
                  <p className="mb-2 font-medium">{t.company.preview}</p>
                  <div className="space-y-6">
                    {drawn.map((d) => (
                      <section key={d.label}>
                        {d.label && <h3 className="mb-2 text-sm font-medium text-muted">{d.label}</h3>}
                        <Preview>{d.node}</Preview>
                      </section>
                    ))}
                  </div>
                </div>
              }
            />
          ) : seoFields.length ? (
            <div className="space-y-6">
              <FieldList fields={rest} value={values} onChange={(v) => setValues(v as Record<string, unknown>)} />
              {seoSection}
              {shareSection}
            </div>
          ) : (
            <FieldList fields={fields} value={values} onChange={(v) => setValues(v as Record<string, unknown>)} />
          )}
          {uses.length > 0 && (
            <Group title={t.forms.usedOn}>
              {uses.map((u) => (
                <ListItem key={u.path} href={`#${u.path}`} headline={u.name} arrow />
              ))}
            </Group>
          )}
          {/* A single-file list: a new item in it. */}
          {root && <CreateFab label={t.forms.addOne(root.singular!)} onClick={() => setItems([...items, newItem(root)])} />}
        </FormFrame>
        {picker}
      </WrongField.Provider>
    </Fields.Provider>
  );
}
