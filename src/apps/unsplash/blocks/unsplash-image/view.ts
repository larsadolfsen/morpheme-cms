export type UnsplashImageView = {
  src: string;
  alt: string;
  caption?: string;
  photographer?: string;
  photographerUrl?: string;
  unsplashUrl: string;
  aspect: string;
  fullWidth: boolean;
};

export function viewOf(props: Record<string, any>): UnsplashImageView | null {
  if (!props.src) return null;
  const app = encodeURIComponent('interstellar-cms');
  const unsplashUrl = `https://unsplash.com/?utm_source=${app}&utm_medium=referral`;
  
  let photographerUrl = props.photographerUrl ? String(props.photographerUrl) : undefined;
  if (photographerUrl && !photographerUrl.includes('utm_source')) {
    photographerUrl += `${photographerUrl.includes('?') ? '&' : '?'}utm_source=${app}&utm_medium=referral`;
  }

  return {
    src: String(props.src),
    alt: String(props.alt || props.caption || 'Foto fra Unsplash'),
    caption: props.caption ? String(props.caption) : undefined,
    photographer: props.photographer ? String(props.photographer) : undefined,
    photographerUrl,
    unsplashUrl,
    aspect: props.aspect ? String(props.aspect) : '16/9',
    fullWidth: Boolean(props.fullWidth),
  };
}
