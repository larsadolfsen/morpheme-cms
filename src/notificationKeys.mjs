// A notification's key and the deletion by keys (notificationData.ts). Exposes notificationKey, withoutKeys.
// No dependencies, so node can import it.

/** A notification's key: when it came and its text. */
export const notificationKey = (n) => `${n.at}-${n.text}`;

/** The notifications except those with these keys. */
export const withoutKeys = (items, keys) => items.filter((n) => !keys.includes(notificationKey(n)));
