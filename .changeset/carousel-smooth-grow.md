---
'@morphemecms/cms': patch
---

A carousel's items grow and shrink smoothly while you swipe it on a phone: where the browser supports scroll-driven animations, it ties each item's size to the scroll itself, so the script no longer runs on every frame. The distance between two cards also stays the carousel's gap while they move, where a card entering or leaving at the row's edge trailed twice as far from its neighbour. `Show all` stands at the right under the row, as Material 3 shows it, not in the middle.
