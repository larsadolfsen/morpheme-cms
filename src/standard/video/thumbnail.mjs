// The video block's own thumbnail (its `thumbnail` field, an image of the site), or '' when it has none.
/** @param {Record<string, any>} props */
export const thumbnailOf = (props) => String(props?.thumbnail ?? '').trim();
