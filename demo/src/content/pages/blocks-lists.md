---
title: "Lists"
description: "Lists and expanding lists, in the Plain and the Segmented design, and expanding lists marked as a FAQ, shown live."
path: "/blocks/lists/"
seoTitle: "Lists | Morpheme"
seoDescription: "Lists and expanding lists, in the Plain and the Segmented design, and expanding lists marked as a FAQ, shown live."
---

# Lists

[All blocks](/blocks/)

Drawn by the List component: the List and List - Expand blocks, each in the Plain and the Segmented design, and a List - Expand marked as a FAQ. The check list is a type, on the Type page.

## List

### Plain design

Rows under each other, as your theme draws a list. A row can have an icon, a text and a page. A List or a List - Expand can also take its rows from an existing list, such as the blog or the testimonials, instead of typed rows.

<div data-block="list" data-props="{&quot;items&quot;:[{&quot;icon&quot;:&quot;schedule&quot;,&quot;title&quot;:&quot;Scheduled&quot;,&quot;text&quot;:&quot;Publishes on its own at the time you pick.&quot;},{&quot;icon&quot;:&quot;info&quot;,&quot;title&quot;:&quot;Draft&quot;,&quot;text&quot;:&quot;Stays in the editor until you publish it.&quot;},{&quot;icon&quot;:&quot;door_open&quot;,&quot;title&quot;:&quot;Hidden&quot;,&quot;text&quot;:&quot;Opens at its address but stays off Google.&quot;}]}"></div>

### Segmented design

Each row on its own surface, with a small gap between the rows (the segmented list of Material 3).

<div data-block="list" data-props="{&quot;design&quot;:&quot;segmented&quot;,&quot;items&quot;:[{&quot;icon&quot;:&quot;schedule&quot;,&quot;title&quot;:&quot;Monday to Friday&quot;,&quot;text&quot;:&quot;9 am to 5 pm&quot;},{&quot;icon&quot;:&quot;coffee&quot;,&quot;title&quot;:&quot;Saturday&quot;,&quot;text&quot;:&quot;10 am to 2 pm&quot;},{&quot;icon&quot;:&quot;door_open&quot;,&quot;title&quot;:&quot;Sunday&quot;,&quot;text&quot;:&quot;Closed&quot;}]}"></div>

## List in one column

<div data-block="list" data-props="{&quot;columns&quot;:false,&quot;items&quot;:[{&quot;icon&quot;:&quot;schedule&quot;,&quot;title&quot;:&quot;Scheduled&quot;,&quot;text&quot;:&quot;Publishes on its own at the time you pick.&quot;},{&quot;icon&quot;:&quot;info&quot;,&quot;title&quot;:&quot;Draft&quot;,&quot;text&quot;:&quot;Stays in the editor until you publish it.&quot;},{&quot;icon&quot;:&quot;door_open&quot;,&quot;title&quot;:&quot;Hidden&quot;,&quot;text&quot;:&quot;Opens at its address but stays off Google.&quot;}]}"></div>

## List with links

<div data-block="list" data-props="{&quot;items&quot;:[{&quot;icon&quot;:&quot;menu_book&quot;,&quot;title&quot;:&quot;Blocks&quot;,&quot;text&quot;:&quot;Every block a page can be built from.&quot;,&quot;href&quot;:&quot;#&quot;},{&quot;icon&quot;:&quot;lightbulb&quot;,&quot;title&quot;:&quot;App store&quot;,&quot;text&quot;:&quot;Apps and themes you install with one tap.&quot;,&quot;href&quot;:&quot;#&quot;},{&quot;icon&quot;:&quot;info&quot;,&quot;title&quot;:&quot;About&quot;,&quot;text&quot;:&quot;What the editor is built on.&quot;,&quot;href&quot;:&quot;#&quot;}]}"></div>

## List from the blog

<div data-block="list" data-props="{&quot;from&quot;:&quot;posts&quot;,&quot;howMany&quot;:3}"></div>

## List with a row limit

With `Maximum rows`, only the first rows show and a text button shows the rest.

<div data-block="list" data-props="{&quot;maxRows&quot;:3,&quot;button&quot;:&quot;See all&quot;,&quot;buttonHref&quot;:&quot;#&quot;,&quot;items&quot;:[{&quot;title&quot;:&quot;Row 1&quot;,&quot;text&quot;:&quot;A short text about row 1.&quot;},{&quot;title&quot;:&quot;Row 2&quot;,&quot;text&quot;:&quot;A short text about row 2.&quot;},{&quot;title&quot;:&quot;Row 3&quot;,&quot;text&quot;:&quot;A short text about row 3.&quot;},{&quot;title&quot;:&quot;Row 4&quot;,&quot;text&quot;:&quot;A short text about row 4.&quot;},{&quot;title&quot;:&quot;Row 5&quot;,&quot;text&quot;:&quot;A short text about row 5.&quot;},{&quot;title&quot;:&quot;Row 6&quot;,&quot;text&quot;:&quot;A short text about row 6.&quot;}]}"></div>

## List with avatars

An avatar shows the row's image, or the first letter of its heading when the row has none.

### Plain design

<div data-block="list" data-props="{&quot;leading&quot;:&quot;avatar&quot;,&quot;items&quot;:[{&quot;title&quot;:&quot;Andromeda&quot;,&quot;text&quot;:&quot;The nearest large galaxy.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/andromeda.webp&quot;,&quot;alt&quot;:&quot;A spiral galaxy in the night sky&quot;},{&quot;title&quot;:&quot;Earth&quot;,&quot;text&quot;:&quot;Our planet, seen from space.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/earth-from-space.webp&quot;,&quot;alt&quot;:&quot;The Earth from space&quot;},{&quot;title&quot;:&quot;Moon&quot;,&quot;text&quot;:&quot;Shows its letter, as it has no image.&quot;},{&quot;title&quot;:&quot;Saturn&quot;,&quot;text&quot;:&quot;Shows its letter too.&quot;}]}"></div>

### Segmented design

<div data-block="list" data-props="{&quot;leading&quot;:&quot;avatar&quot;,&quot;design&quot;:&quot;segmented&quot;,&quot;items&quot;:[{&quot;title&quot;:&quot;Andromeda&quot;,&quot;text&quot;:&quot;The nearest large galaxy.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/andromeda.webp&quot;,&quot;alt&quot;:&quot;A spiral galaxy in the night sky&quot;},{&quot;title&quot;:&quot;Earth&quot;,&quot;text&quot;:&quot;Our planet, seen from space.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/earth-from-space.webp&quot;,&quot;alt&quot;:&quot;The Earth from space&quot;},{&quot;title&quot;:&quot;Moon&quot;,&quot;text&quot;:&quot;Shows its letter, as it has no image.&quot;},{&quot;title&quot;:&quot;Saturn&quot;,&quot;text&quot;:&quot;Shows its letter too.&quot;}]}"></div>

## List with images

A square or a landscape image leads each row.

### Square image, Plain design

<div data-block="list" data-props="{&quot;leading&quot;:&quot;square&quot;,&quot;items&quot;:[{&quot;title&quot;:&quot;Andromeda&quot;,&quot;text&quot;:&quot;The nearest large galaxy.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/andromeda.webp&quot;,&quot;alt&quot;:&quot;A spiral galaxy in the night sky&quot;},{&quot;title&quot;:&quot;Earth&quot;,&quot;text&quot;:&quot;Our planet, seen from space.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/earth-from-space.webp&quot;,&quot;alt&quot;:&quot;The Earth from space&quot;}]}"></div>

### Landscape image, Plain design

<div data-block="list" data-props="{&quot;leading&quot;:&quot;landscape&quot;,&quot;items&quot;:[{&quot;title&quot;:&quot;Andromeda&quot;,&quot;text&quot;:&quot;The nearest large galaxy.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/andromeda.webp&quot;,&quot;alt&quot;:&quot;A spiral galaxy in the night sky&quot;},{&quot;title&quot;:&quot;Earth&quot;,&quot;text&quot;:&quot;Our planet, seen from space.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/earth-from-space.webp&quot;,&quot;alt&quot;:&quot;The Earth from space&quot;}]}"></div>

### Square image, Segmented design

<div data-block="list" data-props="{&quot;leading&quot;:&quot;square&quot;,&quot;design&quot;:&quot;segmented&quot;,&quot;items&quot;:[{&quot;title&quot;:&quot;Andromeda&quot;,&quot;text&quot;:&quot;The nearest large galaxy.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/andromeda.webp&quot;,&quot;alt&quot;:&quot;A spiral galaxy in the night sky&quot;},{&quot;title&quot;:&quot;Earth&quot;,&quot;text&quot;:&quot;Our planet, seen from space.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/earth-from-space.webp&quot;,&quot;alt&quot;:&quot;The Earth from space&quot;}]}"></div>

### Landscape image, Segmented design

<div data-block="list" data-props="{&quot;leading&quot;:&quot;landscape&quot;,&quot;design&quot;:&quot;segmented&quot;,&quot;items&quot;:[{&quot;title&quot;:&quot;Andromeda&quot;,&quot;text&quot;:&quot;The nearest large galaxy.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/andromeda.webp&quot;,&quot;alt&quot;:&quot;A spiral galaxy in the night sky&quot;},{&quot;title&quot;:&quot;Earth&quot;,&quot;text&quot;:&quot;Our planet, seen from space.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/earth-from-space.webp&quot;,&quot;alt&quot;:&quot;The Earth from space&quot;}]}"></div>

## List - Expand with avatars

An avatar shows the row's image, or the first letter of its heading when the row has none.

### Plain design

<div data-block="expand" data-props="{&quot;leading&quot;:&quot;avatar&quot;,&quot;items&quot;:[{&quot;title&quot;:&quot;Andromeda&quot;,&quot;text&quot;:&quot;The nearest large galaxy.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/andromeda.webp&quot;,&quot;alt&quot;:&quot;A spiral galaxy in the night sky&quot;},{&quot;title&quot;:&quot;Earth&quot;,&quot;text&quot;:&quot;Our planet, seen from space.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/earth-from-space.webp&quot;,&quot;alt&quot;:&quot;The Earth from space&quot;},{&quot;title&quot;:&quot;Moon&quot;,&quot;text&quot;:&quot;Shows its letter, as it has no image.&quot;},{&quot;title&quot;:&quot;Saturn&quot;,&quot;text&quot;:&quot;Shows its letter too.&quot;}]}"></div>

### Segmented design

<div data-block="expand" data-props="{&quot;leading&quot;:&quot;avatar&quot;,&quot;design&quot;:&quot;segmented&quot;,&quot;items&quot;:[{&quot;title&quot;:&quot;Andromeda&quot;,&quot;text&quot;:&quot;The nearest large galaxy.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/andromeda.webp&quot;,&quot;alt&quot;:&quot;A spiral galaxy in the night sky&quot;},{&quot;title&quot;:&quot;Earth&quot;,&quot;text&quot;:&quot;Our planet, seen from space.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/earth-from-space.webp&quot;,&quot;alt&quot;:&quot;The Earth from space&quot;},{&quot;title&quot;:&quot;Moon&quot;,&quot;text&quot;:&quot;Shows its letter, as it has no image.&quot;},{&quot;title&quot;:&quot;Saturn&quot;,&quot;text&quot;:&quot;Shows its letter too.&quot;}]}"></div>

## List - Expand with images

A square or a landscape image leads each row.

### Square image, Plain design

<div data-block="expand" data-props="{&quot;leading&quot;:&quot;square&quot;,&quot;items&quot;:[{&quot;title&quot;:&quot;Andromeda&quot;,&quot;text&quot;:&quot;The nearest large galaxy.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/andromeda.webp&quot;,&quot;alt&quot;:&quot;A spiral galaxy in the night sky&quot;},{&quot;title&quot;:&quot;Earth&quot;,&quot;text&quot;:&quot;Our planet, seen from space.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/earth-from-space.webp&quot;,&quot;alt&quot;:&quot;The Earth from space&quot;}]}"></div>

### Landscape image, Plain design

<div data-block="expand" data-props="{&quot;leading&quot;:&quot;landscape&quot;,&quot;items&quot;:[{&quot;title&quot;:&quot;Andromeda&quot;,&quot;text&quot;:&quot;The nearest large galaxy.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/andromeda.webp&quot;,&quot;alt&quot;:&quot;A spiral galaxy in the night sky&quot;},{&quot;title&quot;:&quot;Earth&quot;,&quot;text&quot;:&quot;Our planet, seen from space.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/earth-from-space.webp&quot;,&quot;alt&quot;:&quot;The Earth from space&quot;}]}"></div>

### Square image, Segmented design

<div data-block="expand" data-props="{&quot;leading&quot;:&quot;square&quot;,&quot;design&quot;:&quot;segmented&quot;,&quot;items&quot;:[{&quot;title&quot;:&quot;Andromeda&quot;,&quot;text&quot;:&quot;The nearest large galaxy.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/andromeda.webp&quot;,&quot;alt&quot;:&quot;A spiral galaxy in the night sky&quot;},{&quot;title&quot;:&quot;Earth&quot;,&quot;text&quot;:&quot;Our planet, seen from space.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/earth-from-space.webp&quot;,&quot;alt&quot;:&quot;The Earth from space&quot;}]}"></div>

### Landscape image, Segmented design

<div data-block="expand" data-props="{&quot;leading&quot;:&quot;landscape&quot;,&quot;design&quot;:&quot;segmented&quot;,&quot;items&quot;:[{&quot;title&quot;:&quot;Andromeda&quot;,&quot;text&quot;:&quot;The nearest large galaxy.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/andromeda.webp&quot;,&quot;alt&quot;:&quot;A spiral galaxy in the night sky&quot;},{&quot;title&quot;:&quot;Earth&quot;,&quot;text&quot;:&quot;Our planet, seen from space.&quot;,&quot;image&quot;:&quot;/images/uploads/2026/10/earth-from-space.webp&quot;,&quot;alt&quot;:&quot;The Earth from space&quot;}]}"></div>

## List with links, Segmented design

<div data-block="list" data-props="{&quot;design&quot;:&quot;segmented&quot;,&quot;items&quot;:[{&quot;icon&quot;:&quot;menu_book&quot;,&quot;title&quot;:&quot;Blocks&quot;,&quot;text&quot;:&quot;Every block a page can be built from.&quot;,&quot;href&quot;:&quot;#&quot;},{&quot;icon&quot;:&quot;lightbulb&quot;,&quot;title&quot;:&quot;App store&quot;,&quot;text&quot;:&quot;Apps and themes you install with one tap.&quot;,&quot;href&quot;:&quot;#&quot;},{&quot;icon&quot;:&quot;info&quot;,&quot;title&quot;:&quot;About&quot;,&quot;text&quot;:&quot;What the editor is built on.&quot;,&quot;href&quot;:&quot;#&quot;}]}"></div>

## List - Expand

### Plain design

Rows that fold out with a text and a link, with a text button under the last row. A row with a page and no text shows the beginning of the page.

<div data-block="expand" data-props="{&quot;items&quot;:[{&quot;icon&quot;:&quot;schedule&quot;,&quot;title&quot;:&quot;Opening hours&quot;,&quot;text&quot;:&quot;Monday to Friday, 9 am to 5 pm.\n\nSaturday, 10 am to 2 pm.&quot;},{&quot;icon&quot;:&quot;location_on&quot;,&quot;title&quot;:&quot;Where to find us&quot;,&quot;text&quot;:&quot;Ground floor, next to the station.&quot;,&quot;href&quot;:&quot;#&quot;},{&quot;icon&quot;:&quot;info&quot;,&quot;title&quot;:&quot;Good to know&quot;,&quot;text&quot;:&quot;Bring your booking number.&quot;}]}"></div>

### Segmented design

<div data-block="expand" data-props="{&quot;design&quot;:&quot;segmented&quot;,&quot;button&quot;:&quot;See all&quot;,&quot;buttonHref&quot;:&quot;#&quot;,&quot;only&quot;:true,&quot;items&quot;:[{&quot;icon&quot;:&quot;schedule&quot;,&quot;title&quot;:&quot;Opening hours&quot;,&quot;text&quot;:&quot;Monday to Friday, 9 am to 5 pm.\n\nSaturday, 10 am to 2 pm.&quot;},{&quot;icon&quot;:&quot;location_on&quot;,&quot;title&quot;:&quot;Where to find us&quot;,&quot;text&quot;:&quot;Ground floor, next to the station.&quot;,&quot;href&quot;:&quot;#&quot;},{&quot;icon&quot;:&quot;info&quot;,&quot;title&quot;:&quot;Good to know&quot;,&quot;text&quot;:&quot;Bring your booking number.&quot;}]}"></div>

## List - Expand with page links

### Plain design

<div data-block="expand" data-props="{&quot;items&quot;:[{&quot;title&quot;:&quot;Blocks&quot;,&quot;text&quot;:&quot;Every block a page can be built from.&quot;,&quot;href&quot;:&quot;/blocks/&quot;},{&quot;title&quot;:&quot;About&quot;,&quot;href&quot;:&quot;/about/&quot;}]}"></div>

### Segmented design

<div data-block="expand" data-props="{&quot;design&quot;:&quot;segmented&quot;,&quot;items&quot;:[{&quot;title&quot;:&quot;Blocks&quot;,&quot;text&quot;:&quot;Every block a page can be built from.&quot;,&quot;href&quot;:&quot;#&quot;},{&quot;title&quot;:&quot;App store&quot;,&quot;text&quot;:&quot;Apps and themes you install with one tap.&quot;,&quot;href&quot;:&quot;#&quot;,&quot;buttons&quot;:[{&quot;label&quot;:&quot;Get started&quot;,&quot;href&quot;:&quot;#&quot;}]},{&quot;title&quot;:&quot;Morpheme&quot;,&quot;text&quot;:&quot;What the editor is built on.&quot;,&quot;href&quot;:&quot;#&quot;}]}"></div>

## List - Expand with a row limit

With `Maximum rows`, only the first rows show and a text button shows the rest.

### Plain design

<div data-block="expand" data-props="{&quot;maxRows&quot;:5,&quot;button&quot;:&quot;See all&quot;,&quot;buttonHref&quot;:&quot;#&quot;,&quot;only&quot;:true,&quot;items&quot;:[{&quot;title&quot;:&quot;Question 1&quot;,&quot;text&quot;:&quot;A short answer for question 1.&quot;},{&quot;title&quot;:&quot;Question 2&quot;,&quot;text&quot;:&quot;A short answer for question 2.&quot;},{&quot;title&quot;:&quot;Question 3&quot;,&quot;text&quot;:&quot;A short answer for question 3.&quot;},{&quot;title&quot;:&quot;Question 4&quot;,&quot;text&quot;:&quot;A short answer for question 4.&quot;},{&quot;title&quot;:&quot;Question 5&quot;,&quot;text&quot;:&quot;A short answer for question 5.&quot;},{&quot;title&quot;:&quot;Question 6&quot;,&quot;text&quot;:&quot;A short answer for question 6.&quot;},{&quot;title&quot;:&quot;Question 7&quot;,&quot;text&quot;:&quot;A short answer for question 7.&quot;},{&quot;title&quot;:&quot;Question 8&quot;,&quot;text&quot;:&quot;A short answer for question 8.&quot;}]}"></div>

### Segmented design

<div data-block="expand" data-props="{&quot;maxRows&quot;:5,&quot;button&quot;:&quot;See all&quot;,&quot;buttonHref&quot;:&quot;#&quot;,&quot;only&quot;:true,&quot;items&quot;:[{&quot;title&quot;:&quot;Question 1&quot;,&quot;text&quot;:&quot;A short answer for question 1.&quot;},{&quot;title&quot;:&quot;Question 2&quot;,&quot;text&quot;:&quot;A short answer for question 2.&quot;},{&quot;title&quot;:&quot;Question 3&quot;,&quot;text&quot;:&quot;A short answer for question 3.&quot;},{&quot;title&quot;:&quot;Question 4&quot;,&quot;text&quot;:&quot;A short answer for question 4.&quot;},{&quot;title&quot;:&quot;Question 5&quot;,&quot;text&quot;:&quot;A short answer for question 5.&quot;},{&quot;title&quot;:&quot;Question 6&quot;,&quot;text&quot;:&quot;A short answer for question 6.&quot;},{&quot;title&quot;:&quot;Question 7&quot;,&quot;text&quot;:&quot;A short answer for question 7.&quot;},{&quot;title&quot;:&quot;Question 8&quot;,&quot;text&quot;:&quot;A short answer for question 8.&quot;}],&quot;design&quot;:&quot;segmented&quot;}"></div>

## List - Expand from the testimonials

### Plain design

<div data-block="expand" data-props="{&quot;from&quot;:&quot;testimonials&quot;,&quot;howMany&quot;:3,&quot;button&quot;:&quot;Show all&quot;}"></div>

### Segmented design

<div data-block="expand" data-props="{&quot;from&quot;:&quot;testimonials&quot;,&quot;howMany&quot;:3,&quot;button&quot;:&quot;Show all&quot;,&quot;design&quot;:&quot;segmented&quot;}"></div>

## List - Expand as a FAQ

With `Mark as FAQ` the rows are questions and answers, ready for Google to show in search results. An answer can have bold, italic, links and lists.

<div data-block="expand" data-props="{&quot;design&quot;:&quot;segmented&quot;,&quot;faq&quot;:true,&quot;items&quot;:[{&quot;title&quot;:&quot;Can I use a block more than once on a page?&quot;,&quot;text&quot;:&quot;Yes. Each copy has its own content.&quot;},{&quot;title&quot;:&quot;Can I turn a block off?&quot;,&quot;text&quot;:&quot;Yes, under Block settings. It can’t be added again until you turn it back on.&quot;}]}"></div>
