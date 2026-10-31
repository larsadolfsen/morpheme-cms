import { viewOf, type UnsplashImageView } from './view';

export default async function load(props: Record<string, any>): Promise<UnsplashImageView | null> {
  return viewOf(props);
}
