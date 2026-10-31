import { useEffect, useRef, useState, type ReactElement } from 'react';
import {
  ArrowSquareOut,
  DownloadSimple,
  Gear,
  Globe,
  MagnifyingGlass,
  SlidersHorizontal,
  X,
} from '@phosphor-icons/react';
import {
  Button,
  EmptyNote,
  FilterChip,
  IconButton,
  Notice,
  SearchRow,
  SupportingText,
} from './ui';
import {
  getUnsplashAttribution,
  getUnsplashConfig,
  hasUnsplashConfig,
  importUnsplashToMedia,
  listUnsplashPhotos,
  searchUnsplashPhotos,
  trackUnsplashDownload,
  UNSPLASH_DOCS_URL,
  UNSPLASH_REGISTER_URL,
  type UnsplashOrientation,
  type UnsplashPhoto,
  type UnsplashRateLimit,
} from './unsplash';
import UnsplashSettings from './UnsplashSettings';
import type { Uploads } from './images';
import { publicPath } from './images';
import { t } from './i18n';

interface UnsplashPickerProps {
  onPick: (src: string, attribution?: ReturnType<typeof getUnsplashAttribution>) => void;
  uploads?: Uploads;
  notify?: (status: { text: string; error?: boolean } | null) => void;
}

export default function UnsplashPicker({ onPick, uploads, notify }: UnsplashPickerProps): ReactElement {
  const [configured, setConfigured] = useState(hasUnsplashConfig);
  const [showSettings, setShowSettings] = useState(!hasUnsplashConfig());
  const [query, setQuery] = useState('');
  const [orientation, setOrientation] = useState<UnsplashOrientation | ''>('');
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<UnsplashRateLimit | undefined>(undefined);
  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(null);
  const [importing, setImporting] = useState(false);

  // Search or fetch editorial photos
  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        if (query.trim()) {
          const res = await searchUnsplashPhotos({
            query: query.trim(),
            page: 1,
            per_page: 24,
            orientation: orientation || undefined,
          });
          if (!cancelled) {
            setPhotos(res.photos);
            setTotalPages(res.total_pages);
            setRateLimit(res.rateLimit);
            setPage(1);
          }
        } else {
          const res = await listUnsplashPhotos({
            page: 1,
            per_page: 24,
            order_by: 'popular',
          });
          if (!cancelled) {
            setPhotos(res.photos);
            setTotalPages(10);
            setRateLimit(res.rateLimit);
            setPage(1);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, query ? 350 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [configured, query, orientation]);

  // Load more photos
  async function loadMore() {
    if (loading || page >= totalPages) return;
    const nextPage = page + 1;
    setLoading(true);
    try {
      if (query.trim()) {
        const res = await searchUnsplashPhotos({
          query: query.trim(),
          page: nextPage,
          per_page: 24,
          orientation: orientation || undefined,
        });
        setPhotos((prev) => [...prev, ...res.photos]);
        setRateLimit(res.rateLimit);
        setPage(nextPage);
      } else {
        const res = await listUnsplashPhotos({
          page: nextPage,
          per_page: 24,
          order_by: 'popular',
        });
        setPhotos((prev) => [...prev, ...res.photos]);
        setRateLimit(res.rateLimit);
        setPage(nextPage);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Handle choosing a photo via direct hotlink (Unsplash default & recommended)
  async function chooseHotlink(photo: UnsplashPhoto) {
    if (photo.links?.download_location) {
      void trackUnsplashDownload(photo.links.download_location);
    }
    const attribution = getUnsplashAttribution(photo);
    // Unsplash regular image URL is high-res (1080px) and CDN cached
    onPick(photo.urls.regular, attribution);
  }

  // Handle importing a photo to local CMS media uploads
  async function chooseImport(photo: UnsplashPhoto) {
    setImporting(true);
    notify?.({ text: t.media.unsplash.importing });
    try {
      const { upload, attribution } = await importUnsplashToMedia(photo);
      // If uploads hook is available, add to form's upload queue
      if (uploads) {
        // Trigger save into uploads queue
        notify?.(null);
        onPick(publicPath(upload.path), attribution);
      } else {
        notify?.(null);
        onPick(publicPath(upload.path), attribution);
      }
    } catch (err) {
      notify?.({ text: (err as Error).message, error: true });
    } finally {
      setImporting(false);
    }
  }

  if (showSettings || !configured) {
    return (
      <div className="py-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{t.media.unsplash.setupTitle}</h2>
          {configured && (
            <IconButton
              icon={X}
              label={t.common.close}
              onClick={() => setShowSettings(false)}
            />
          )}
        </div>
        <UnsplashSettings
          onSaved={() => {
            setConfigured(hasUnsplashConfig());
            setShowSettings(false);
          }}
          onClose={configured ? () => setShowSettings(false) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top search & filter bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchRow
              value={query}
              onChange={setQuery}
              label={t.media.unsplash.search}
            />
          </div>
          <IconButton
            icon={Gear}
            label={t.media.unsplash.setupTitle}
            onClick={() => setShowSettings(true)}
          />
        </div>

        {/* Orientation filter chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <FilterChip
            selected={orientation === ''}
            onClick={() => setOrientation('')}
          >
            {t.media.unsplash.orientation.all}
          </FilterChip>
          <FilterChip
            selected={orientation === 'landscape'}
            onClick={() => setOrientation(orientation === 'landscape' ? '' : 'landscape')}
          >
            {t.media.unsplash.orientation.landscape}
          </FilterChip>
          <FilterChip
            selected={orientation === 'portrait'}
            onClick={() => setOrientation(orientation === 'portrait' ? '' : 'portrait')}
          >
            {t.media.unsplash.orientation.portrait}
          </FilterChip>
          <FilterChip
            selected={orientation === 'squarish'}
            onClick={() => setOrientation(orientation === 'squarish' ? '' : 'squarish')}
          >
            {t.media.unsplash.orientation.squarish}
          </FilterChip>

          {rateLimit && (
            <span className="ml-auto text-xs text-muted">
              {rateLimit.remaining} / {rateLimit.limit} req.
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-error-container p-3 text-sm text-on-error-container">
          <p className="font-medium">{error}</p>
          <p className="mt-1 text-xs opacity-80">
            {t.media.unsplash.keyInvalid}
          </p>
        </div>
      )}

      {/* Grid of photos */}
      <div className="relative min-h-[16rem]">
        {photos.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo) => {
              const attribution = getUnsplashAttribution(photo);
              return (
                <li key={photo.id} className="group relative overflow-hidden rounded-lg bg-tint">
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-surface-container">
                    <img
                      src={photo.urls.small}
                      alt={photo.alt_description || photo.description || ''}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-(--motion-spatial-duration) ease-(--motion-ease) group-hover:scale-105"
                    />

                    {/* Attribution overlay badge */}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/40 to-transparent p-2 text-white">
                      <a
                        href={attribution.photographerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex min-w-0 items-center gap-1.5 text-xs hover:underline"
                        title={attribution.text}
                      >
                        {photo.user.profile_image?.small && (
                          <img
                            src={photo.user.profile_image.small}
                            alt=""
                            className="size-4 shrink-0 rounded-full"
                          />
                        )}
                        <span className="truncate">{photo.user.name}</span>
                        <ArrowSquareOut size={12} className="shrink-0 opacity-70" />
                      </a>
                    </div>
                  </div>

                  {/* Action overlay */}
                  <div className="flex items-center gap-1 border-t border-line bg-surface p-1.5">
                    <Button
                      kind="text"
                      size="small"
                      className="flex-1 text-xs"
                      onClick={() => chooseHotlink(photo)}
                      title={t.media.unsplash.hotlink}
                    >
                      {t.media.unsplash.useImage}
                    </Button>
                    {uploads && (
                      <IconButton
                        icon={DownloadSimple}
                        label={t.media.unsplash.importToMedia}
                        onClick={() => chooseImport(photo)}
                        disabled={importing}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : !loading ? (
          <EmptyNote>{t.media.unsplash.noPhotos}</EmptyNote>
        ) : null}

        {loading && (
          <div className="flex items-center justify-center py-8 text-sm text-muted">
            <span className="editor-fade-in">{t.media.preparing}</span>
          </div>
        )}
      </div>

      {/* Pagination / Load more */}
      {photos.length > 0 && page < totalPages && (
        <div className="pt-2 text-center">
          <Button
            kind="outlined"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? '...' : t.common.more ?? 'Flere'}
          </Button>
        </div>
      )}
    </div>
  );
}
