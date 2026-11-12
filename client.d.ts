// The types a site with the CMS has besides its own (`/// <reference types="@morphemecms/cms/client" />` in its
// src/env.d.ts): the modules the build makes and the directive it adds (astro.mjs).
/// <reference path="./src/virtual.d.ts" />

declare module 'astro' {
  interface AstroClientDirectives {
    'client:interact'?: boolean;
  }
}
export {};
