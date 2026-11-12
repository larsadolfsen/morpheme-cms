// Whether check:content already ran for this commit (morpheme ci-build sets MORPHEME_CONTENT_CHECKED before the build).
// Exposes alreadyChecked. No dependencies; apart from check-content.mjs so a test can import it without running the check.

/**
 * @param {string | undefined} envValue the MORPHEME_CONTENT_CHECKED variable
 * @param {string} head `git rev-parse HEAD`
 * @returns {boolean} true only when the variable is the commit being built
 */
export function alreadyChecked(envValue, head) {
  return typeof envValue === 'string' && envValue !== '' && envValue === head;
}
