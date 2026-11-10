// Test fixture for lib/sandboxHooks.test.mjs: a page-colors hook, imports a module the sandbox does not allow.
// Exposes a default export. No dependencies.
import fs from 'node:fs';
export default () => fs;
