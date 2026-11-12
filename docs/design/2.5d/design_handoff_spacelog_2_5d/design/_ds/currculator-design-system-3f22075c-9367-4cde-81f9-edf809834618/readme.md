# Currculator Design System

## Context
**Currculator** — assumed to be a currency calculator / converter (web + app). The only inputs were the company name and a written visual-language brief describing a photography-first, near-invisible-UI aesthetic (full-bleed alternating tiles, one blue accent, pill CTAs, SF Pro type). No codebase, Figma, logo, screenshots or copy were provided. All product copy, sample rates and screens in this system are placeholders written to exercise the language; replace them with real material.

This is an original system for Currculator that follows the brief's *principles*. It does not include any third-party logos, product names, imagery or proprietary font files.

## Index
- `styles.css` — entry point (imports only) → `tokens/` colors, typography, spacing, radii, elevation, fonts, base (reset + press/focus/grid helpers)
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Shapes, Brand)
- `components/` — React primitives (see below), each with `.d.ts` + `.prompt.md` and one card per folder
- `ui_kits/website/` — click-through site: Home, Converter, Currencies
- `thumbnail.html`, `SKILL.md`

## Components
- **buttons/** — Button (primary, secondary, dark, pearl, hero), IconButton, TextLink
- **navigation/** — GlobalNav, SubNav, StickyBar, Footer
- **surfaces/** — ProductTile, UtilityCard, QuoteCard
- **forms/** — SearchInput, OptionChip

Inventory follows the brief's component list 1:1 (global-nav, sub-nav-frosted, button variants, icon-circular, text-link(-on-dark), product tiles light/parchment/dark/-2/-3, store-utility-card, configurator-option-chip(-selected), environment-quote-card → QuoteCard, floating-sticky-bar → StickyBar, search-input, footer). Variants are props, not separate components.

## Content fundamentals
- **Voice:** calm, declarative, confident. Short headlines that state a capability: "Convert anything." "Live rates. Even offline."
- **Structure per tile:** name or claim (headline) → one-line tagline → two actions. Never more than one idea per tile.
- **Casing:** Sentence case everywhere, including buttons ("Learn more", "Open converter"). Product/tier names capitalized (Currculator Pro).
- **Punctuation:** Hero headlines may end with a period for finality. No exclamation marks.
- **Person:** Talk *to* "you" sparingly ("your pairs, on your home screen"); the company rarely says "we" except in trust copy ("Our data").
- **CTAs:** 1–3 words, verb-first. Primary + secondary pair: "Upgrade" / "Learn more".
- **Numbers:** precise, formatted with separators (1,356.62 USD); legal/fine-print states caveats plainly.
- **No emoji**, no exclamation, no hype adjectives.

## Visual foundations
- **Color:** one accent — Action Blue #0066cc — for every interactive element. #0071e3 only for focus/selected; #2997ff only for links on dark. Surfaces: white, parchment #f5f5f7, pearl #fafafc, near-black tiles #272729/#2a2a2c/#252527, true black for the global nav. All text is one ink #1d1d1f; muted steps #333 / #7a7a7a / #ccc on dark.
- **Type:** SF Pro Display (≥19px) / SF Pro Text, falling back to Inter. Headlines 600 with negative tracking; body 17px/1.47; weights 300/400/600/700 only — 500 never. 300 reserved for button-large and lead-airy. Classes `.cc-type-*` mirror every role.
- **Backgrounds:** flat colour or full-bleed photography. No gradients, textures, patterns or illustrations. Section changes are colour changes.
- **Layout:** full-bleed tiles stacked with 0 gap; 80px vertical tile padding (48px ≤735px); 980px text container, 1440px grid container; 20px grid gutters; 5→4→3→2→1 column utility grids at 1440/1068/834/640.
- **Imagery:** product renders (here: app UI cards) centred, ≥40px from copy, with the system's single shadow. Photography should be crisp, natural, cool-neutral; dark enough under white type.
- **Elevation:** flat by default; 1px rgba(0,0,0,.08) hairline for cards and bars; frosted saturate(180%) blur(20px) on parchment 80% for sticky bars; exactly one shadow `rgba(0,0,0,.22) 3px 5px 30px` for product renders only.
- **Radii:** 0 tiles · 8 utility rect · 11 pearl · 18 cards · pill for every action (CTAs, chips, search) · 50% icon chips.
- **Cards:** white, 1px #e0e0e0, 18px radius, 24px padding, no shadow.
- **Borders:** behave like rings (soft, low contrast); never coloured accents.
- **Transparency & blur:** only on sticky bars and translucent icon chips over imagery.
- **Hover:** intentionally undocumented — no hover styling beyond link underline. **Press:** `scale(0.95)` on all buttons/chips (200ms ease). **Focus:** 2px #0071e3 outline, 2px offset.
- **Animation:** minimal. Press-scale transitions only; content does not bounce or slide. If needed, short fades with standard ease.

## Iconography
- No icon set was provided. Substituted **Lucide** (thin 2px stroke, rounded caps — the closest open match to a quiet system-symbol style) loaded from CDN as static SVGs: `https://unpkg.com/lucide-static@0.469.0/icons/<name>.svg`. Used: search, user, menu, chevron-left/right, arrow-left-right.
- Icons are monochrome: ink on light, inverted (white @80%) on black nav. 14–18px.
- No emoji, no unicode glyphs as icons. Currency symbols (€, ¥, £) are typographic content, not icons.
- **No logo was supplied.** The wordmark is "Currculator" set in the type system (tagline weight). Do not draw a mark.

## Fonts
SF Pro Display / SF Pro Text are named first; on Apple platforms `-apple-system` resolves to them. Elsewhere **Inter** (Google Fonts) is the substitute. When on Inter, consider tightening display tracking by −0.01em and body line-height to 1.44.

## Intentional additions
- `.cc-grid-utility`, `.cc-tile-pair`, `.cc-tile` CSS helpers — encode the responsive collapse rules from the brief.
