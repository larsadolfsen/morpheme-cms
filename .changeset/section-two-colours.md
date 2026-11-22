---
'@morphemecms/cms': patch
---

Coloured sections are painted with Material 3's container of their colour, with the container's on-colour for text and icons, and a section with an image puts its text on a panel of M3's inverse surface. `check:color-roles` fails on a mix of a colour role and on a role in a section that is not M3's pair.
