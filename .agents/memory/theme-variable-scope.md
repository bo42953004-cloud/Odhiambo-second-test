---
name: Theme variable scope
description: Theme overrides must account for platform variables declared directly on body
---

Theme customization needs to write its resolved color variables to both `html` and `body`, not only the document root. Admin palette application must also resolve a light or dark palette from the selected preset instead of leaving dark preset values inline.

**Why:** The platform's light/dark theme classes can declare the same CSS variables directly on `body`, which overrides inherited values from `html`; standalone routes such as the landing page can otherwise render a dark-to-white wash or low-contrast text. Inline dark admin variables likewise prevent the light class from changing the full site.

**How to apply:** Keep `html` and `body` theme classes synchronized, reapply admin colors after theme changes, and verify the computed palette on a fresh route before relying on inherited root variables.