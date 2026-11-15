// The video block's own thumbnail (its `thumbnail` field, an image of the site), or '' when it has none, and its alternative text.
import { resolveAlt } from '../../imageAlt.mjs';

/** @param {Record<string, any>} props */
export const thumbnailOf = (props) => String(props?.thumbnail ?? '').trim();

/**
 * The alternative text the thumbnail is drawn with, by the one rule for images in use (src/imageAlt.mjs): the block's own `alt`, else the
 * Library's text for the image, else none. An empty text is a decorative image (`alt=""`), never made up. The play button's name is the
 * video's title, not this.
 * @param {Record<string, any>} props
 * @param {{ alt?: string; decorative?: boolean } | undefined} [library] What the Library holds for the thumbnail.
 */
export const thumbnailAlt = (props, library) => resolveAlt({ alt: String(props?.alt ?? '') }, library).alt;
