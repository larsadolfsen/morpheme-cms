---
title: "About the Material 3 Theme"
seoTitle: "About Material Design 3 | Interstellar CMS"
seoDescription: "Google Material Design 3 (Material) implemented for Astro: 3-tier design tokens, local Roboto typography, 5 scaffold slots, and edge-native CMS parity."
keyword: "Material Design 3 Theme"
---

# Material Design 3: Built for Modern Astro

The official Material theme in Interstellar CMS implements Google’s Material Design 3 specification without compromise.

![Earth and space station satellite view from Unsplash](/images/uploads/2026/10/space-station.jpg)

## 3-Tier Design Tokens

Design systems break when component implementations leak into brand tokens. Interstellar enforces a mathematical 3-tier token hierarchy:

1. **Reference Tokens (`md.ref.*`):** 13 tonal steps calculated using Google’s HCT (Hue, Chroma, Tone) perceptual algorithm.
2. **System Tokens (`md.sys.*`):** Semantic application roles: Primary, Secondary, Surface Containers (Lowest to Highest), and Elevation Levels 0 to 5.
3. **Component Tokens (`md.comp.*`):** Over 508 isolated properties mapping System tokens directly to individual components.

<div data-block="cards" data-props="{&quot;design&quot;:&quot;image&quot;,&quot;items&quot;:[{&quot;image&quot;:&quot;/images/uploads/2026/10/modern-architecture.jpg&quot;,&quot;title&quot;:&quot;5 Scaffold Slots&quot;,&quot;text&quot;:&quot;Top App Bar, Navigation Pane, Primary Content, Supporting Pane, and Scrim adapting across all 5 Window Size Classes.&quot;},{&quot;image&quot;:&quot;/images/uploads/2026/10/fluid-gradient.jpg&quot;,&quot;title&quot;:&quot;Google HCT Color&quot;,&quot;text&quot;:&quot;Perceptually uniform contrast guaranteeing WCAG AA accessibility in light and dark modes.&quot;},{&quot;image&quot;:&quot;/images/uploads/2026/10/developer-setup.jpg&quot;,&quot;title&quot;:&quot;Local Font Suite&quot;,&quot;text&quot;:&quot;Roboto Flex, Roboto Plain, Roboto Serif, and Roboto Mono preloaded locally as WOFF2 with zero external CDN calls.&quot;}]}"></div>

## 100% Shared Theme Parity

Traditional CMS architectures suffer from visual drift: what editors see in the admin preview rarely matches the live website.

In Interstellar CMS, both the public Astro site and the `/editor/` import the exact same tokens, fonts, and blocks from `@theme`. Keystrokes in the editor render with pixel-perfect accuracy against responsive device viewports.
