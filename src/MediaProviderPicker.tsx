// One source of pictures an installed app adds to the picker (a media provider): a search, the pictures found and, when the source
// needs a key, a field for it. Everything goes through the Worker (src/mediaProviders.ts). Exposes MediaProviderPicker.
import { useEffect, useState, type ReactElement } from 'react';
import { Button, EmptyNote, Notice, SearchBar, TextField } from './ui';
import { t } from './i18n';
import {
  ProviderError,
  providerImage,
  providerNeedsKey,
  saveProviderKey,
  searchProvider,
  type MediaItem,
  type ProviderRef,
} from './mediaProviders';

export default function MediaProviderPicker({
  provider,
  busy,
  onPick,
}: {
  provider: ProviderRef;
  busy: boolean;
  onPick: (item: MediaItem) => void;
}): ReactElement {
  const text = t.media.providers;
  const [needsKey, setNeedsKey] = useState<boolean | null>(null);
  const [key, setKey] = useState('');
  const [keyProblem, setKeyProblem] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    providerNeedsKey(provider)
      .then(setNeedsKey)
      .catch(() => setNeedsKey(false));
  }, [provider.app, provider.id]);

  // A new search, a moment after the last key typed; later pages are added by "Show more".
  useEffect(() => {
    if (needsKey !== false) return;
    let stale = false;
    setLoading(true);
    setError(null);
    const timer = setTimeout(
      () => {
        searchProvider(provider, query.trim(), 1)
          .then((r) => {
            if (stale) return;
            setItems(r.items);
            setPages(r.totalPages);
            setPage(1);
          })
          .catch((e) => {
            if (stale) return;
            // The provider turned the key down: ask for it again.
            if (e instanceof ProviderError && e.status === 409) setNeedsKey(true);
            else setError(text.failed);
          })
          .finally(() => !stale && setLoading(false));
      },
      query ? 350 : 0,
    );
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [needsKey, query, provider.app, provider.id]);

  async function more() {
    setLoading(true);
    try {
      const r = await searchProvider(provider, query.trim(), page + 1);
      setItems((all) => [...all, ...r.items.filter((i) => !all.some((a) => a.id === i.id))]);
      setPage(page + 1);
      setPages(r.totalPages);
    } catch {
      setError(text.failed);
    } finally {
      setLoading(false);
    }
  }

  async function connect() {
    setKeyProblem(null);
    try {
      await saveProviderKey(provider, key);
      setKey('');
      setNeedsKey(false);
    } catch (e) {
      setKeyProblem(e instanceof ProviderError && e.status === 403 ? text.needsSave : text.keyWrong);
    }
  }

  if (needsKey === null) return <EmptyNote busy>{text.loading}</EmptyNote>;
  if (needsKey)
    return (
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void connect();
        }}
      >
        <p className="font-medium">{text.keyTitle(provider.label)}</p>
        <p className="text-on-surface-variant">{text.keyText(provider.label)}</p>
        <TextField
          label={text.keyLabel}
          type="password"
          autoComplete="off"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          problem={keyProblem ?? undefined}
        />
        <Button type="submit" disabled={!key.trim()}>
          {text.saveKey}
        </Button>
      </form>
    );

  return (
    <div className="flex flex-col gap-3">
      <SearchBar value={query} onChange={setQuery} label={text.search(provider.label)} />
      {error ? <Notice role="alert">{error}</Notice> : null}
      {items.length ? (
        <ul className="grid grid-cols-3 gap-1.5 medium:grid-cols-4 expanded:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] expanded:gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={busy}
                className="group block aspect-square w-full overflow-hidden rounded-lg bg-surface-container-high disabled:opacity-60"
                aria-label={item.alt || text.credit(item.credit.name, provider.label)}
                onClick={() => onPick(item)}
              >
                <img src={providerImage(provider, item.thumb)} alt="" loading="lazy" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : loading ? (
        <EmptyNote busy>{text.loading}</EmptyNote>
      ) : (
        <EmptyNote>{text.none}</EmptyNote>
      )}
      {items.length && (pages === null || page < pages) ? (
        <Button kind="outlined" busy={loading} onClick={() => void more()}>
          {text.more}
        </Button>
      ) : null}
    </div>
  );
}
