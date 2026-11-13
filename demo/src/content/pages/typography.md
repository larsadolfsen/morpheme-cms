---
title: "Typography"
description: "Every text style you can use in Morpheme, shown live."
seoTitle: "Typography | Morpheme"
seoDescription: "Headings, paragraphs, lists, quotes, code, labels and every Material 3 text role, shown on each section color."
keyword: "typography"
---

# Typography

Everything you can do with text in the editor, drawn as the site draws it in your theme. Change the theme under Appearance and this page changes with it.

<p class="body-large">This is Body large, the intro of a text. Pick it from the T menu.</p>

## Headings

The editor offers Heading 1, 2 and 3. Heading 4 to 6 work in Markdown.

# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

## Paragraphs

One paragraph, in Body medium.

Morpheme keeps your text simple. A paragraph is plain text that wraps to the width of the screen, so it reads well on a phone and on a wide monitor. This one is long on purpose, so you can see how the lines break, how tall they are and how the text rests on the page.

Two paragraphs in a row show the space between them.

The first paragraph says one thing. It stops here.

The second paragraph says the next thing, with the space your theme sets between paragraphs.

## Text styles

The T menu sets the style of a paragraph.

<p class="body-large">Body large: an intro for the page or a section.</p>

Body medium: the plain paragraph, the default.

<p class="body-small">Body small: small print, notes and dates.</p>

> Quote: a line that stands out from the text.

In a list, the T menu sets the size of the words instead.

- Small words: <span class="body-small">Opening hours may change</span>
- Medium words: the plain text
- Large words: <span class="body-large">Welcome to the shop</span>

## Marks and links

Select words and use the toolbar: **bold**, *italic*, ***bold and italic***, a [link to a page](/about/), an [external link](https://astro.build) and `inline code`.

## Alignment

Align a paragraph or a Heading 3 and smaller. Left is the default.

Left aligned paragraph.

<div data-align="center"></div>

Center aligned paragraph.

<div data-align="right"></div>

Right aligned paragraph.

<div data-align="center"></div>

### Center aligned Heading 3

## Lists

A bulleted list:

- First point
- Second point
- Third point, with a longer text that wraps onto a second line on a narrow screen

A numbered list:

1. First step
2. Second step
3. Third step

A nested list:

- Plan
  - Pick a theme
  - Add pages
- Publish
  1. Check the page
  2. Tap Save

A check list:

- [x] Photos sized for every screen
- [x] Light and dark mode
- [ ] Your own domain

## Quote, code and rule

> Make it simple, then make it beautiful.

A code block:

```
npm create morpheme@latest
npm run dev
```

A horizontal rule:

---

## Table

Rows and columns of text. This table lists the roles used above.

<div data-block="table" data-props="{&quot;header&quot;:true,&quot;rows&quot;:[[&quot;Role&quot;,&quot;Where the site uses it&quot;],[&quot;Headline medium&quot;,&quot;Heading 2&quot;],[&quot;Title large&quot;,&quot;Heading 3&quot;],[&quot;Title medium&quot;,&quot;Heading 4&quot;],[&quot;Body large&quot;,&quot;Intro paragraph&quot;],[&quot;Body medium&quot;,&quot;Paragraph, list, quote, table&quot;],[&quot;Body small&quot;,&quot;Small print and notes&quot;],[&quot;Label medium&quot;,&quot;Label above a heading&quot;],[&quot;Label large&quot;,&quot;Buttons and tabs&quot;]]}"></div>

## Images

An image sits between paragraphs and scales to the screen. Its alt text describes it.

![The Moon against a black sky](/images/uploads/2026/10/moon.webp)

The editor has no caption field, so words under an image are a paragraph.

<p class="body-small">Photo: the Moon, a sample image.</p>

## Labels

A label sits above a heading. It is Label medium.

<p class="label-medium">Why Morpheme</p>

### A heading with a label

Buttons and tabs use Label large.

<div data-block="buttons" data-props="{&quot;items&quot;:[{&quot;label&quot;:&quot;Filled&quot;,&quot;to&quot;:&quot;page&quot;,&quot;href&quot;:&quot;/get-started/&quot;,&quot;kind&quot;:&quot;filled&quot;},{&quot;label&quot;:&quot;Tonal&quot;,&quot;to&quot;:&quot;page&quot;,&quot;href&quot;:&quot;/get-started/&quot;,&quot;kind&quot;:&quot;tonal&quot;},{&quot;label&quot;:&quot;Outlined&quot;,&quot;to&quot;:&quot;page&quot;,&quot;href&quot;:&quot;/get-started/&quot;,&quot;kind&quot;:&quot;outlined&quot;},{&quot;label&quot;:&quot;Text&quot;,&quot;to&quot;:&quot;page&quot;,&quot;href&quot;:&quot;/get-started/&quot;,&quot;kind&quot;:&quot;text&quot;}]}"></div>

## Material 3 text roles

The theme sets 15 roles: display, headline, title, body and label, each in large, medium and small. This page can draw these with its markup:

- Headline medium: Heading 2
- Title large: Heading 3
- Title medium: Heading 4
- Body large, medium and small: the T menu
- Label medium: the label above a heading
- Label large: buttons

The display roles, Headline large and small, Title small, and Label small have no text style in the editor, so blocks use them and this page does not show them.

<div data-section="surface"></div>

<p class="label-medium">Label on surface</p>

## Text on surface

<p class="body-large">Body large is the intro of a text. Use it for the one paragraph that tells visitors what the page is about.</p>

A paragraph in Body medium is the plain text. It wraps with the width of the screen, so a longer paragraph shows how the lines break and how much space sits between them. Here is a [link](/about/), some **bold text**, some *italic text* and a bit of `inline code`.

A second paragraph follows the first, with the space the theme puts between paragraphs.

<p class="body-small">Body small is for small print, notes and dates.</p>

<div data-section="primary"></div>

<p class="label-medium">Label on primary</p>

## Text on primary

<p class="body-large">Body large is the intro of a text. Use it for the one paragraph that tells visitors what the page is about.</p>

A paragraph in Body medium is the plain text. It wraps with the width of the screen, so a longer paragraph shows how the lines break and how much space sits between them. Here is a [link](/about/), some **bold text**, some *italic text* and a bit of `inline code`.

A second paragraph follows the first, with the space the theme puts between paragraphs.

<p class="body-small">Body small is for small print, notes and dates.</p>

<div data-section="secondary"></div>

<p class="label-medium">Label on secondary</p>

## Text on secondary

<p class="body-large">Body large is the intro of a text. Use it for the one paragraph that tells visitors what the page is about.</p>

A paragraph in Body medium is the plain text. It wraps with the width of the screen, so a longer paragraph shows how the lines break and how much space sits between them. Here is a [link](/about/), some **bold text**, some *italic text* and a bit of `inline code`.

A second paragraph follows the first, with the space the theme puts between paragraphs.

<p class="body-small">Body small is for small print, notes and dates.</p>

<div data-section="tertiary"></div>

<p class="label-medium">Label on tertiary</p>

## Text on tertiary

<p class="body-large">Body large is the intro of a text. Use it for the one paragraph that tells visitors what the page is about.</p>

A paragraph in Body medium is the plain text. It wraps with the width of the screen, so a longer paragraph shows how the lines break and how much space sits between them. Here is a [link](/about/), some **bold text**, some *italic text* and a bit of `inline code`.

A second paragraph follows the first, with the space the theme puts between paragraphs.

<p class="body-small">Body small is for small print, notes and dates.</p>
