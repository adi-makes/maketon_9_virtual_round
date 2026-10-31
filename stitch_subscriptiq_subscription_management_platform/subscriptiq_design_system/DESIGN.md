---
name: SubscriptIQ Design System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464555'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#004d70'
  on-tertiary: '#ffffff'
  tertiary-container: '#006693'
  on-tertiary-container: '#b8e0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-lg:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.005em
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  mono-data-lg:
    fontFamily: JetBrains Mono
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  mono-data-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
  mono-data-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  gutter-lg: 2rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a high-precision, executive-tier SaaS aesthetic engineered for recurring revenue orchestration, billing telemetry, and subscription lifecycle management. Drawing structural clarity and restraint from platforms like Stripe, Linear, and Vercel, the interface communicates absolute operational reliability, zero-latency feedback, and institutional financial confidence.

### Brand Personality & Emotional Objectives
- **Precision & Authority:** Every layout boundary, balance metric, and MRR metric must feel immutable, calculated, and mathematically reliable.
- **Cognitive Clarity:** Dense multi-tier subscription data is structured through strict typographic hierarchies, micro-spacing grids, and low-noise neutral planes to eliminate billing confusion.
- **Restrained Modernism:** Avoid decorative flourish; visual interest is created through optical kerning, balanced contrast ratios, micro-interactions, and refined semantic indicators.

### Visual Architecture & Style
The system adopts an engineered **Minimalist Precision SaaS** visual language:
- Clean, architectural division using delicate, structural dividers rather than heavy fills.
- Crisp pure white container surfaces set over an ultra-pale slate backdrop.
- Refined indigo-violet foundational accents paired with surgical status signaling.
- High-density information architecture optimized for finance teams, founders, and billing engineers parsing high-volume accounts and recurring schedules.

## Colors

The color palette prioritizes high-contrast legibility, structural neutrality, and instant semantic comprehension for high-velocity billing scenarios.

### Surface & Foundation Hierarchy
- **Canvas Base:** `#f8fafc` (Slate 50) establishes a clean, glare-free working plane.
- **Subtle Layering Canvas:** `#f1f5f9` (Slate 100) serves secondary control panels, table header tracks, and inner utility wrappers.
- **Card & Component Surfaces:** `#ffffff` (Pure White) provides elevated, crisp focal points for data tables, metrics panels, and modal dialogs.
- **Structural Outlines:** `#e2e8f0` (Slate 200) for standard card borders, grid dividers, and input strokes. Active or hovered strokes scale to `#cbd5e1` (Slate 300).

### Typography Neutrals
- **Primary Ink:** `#0f172a` (Slate 900) for titles, large metric values, and primary labels.
- **Secondary Ink:** `#334155` (Slate 700) for body text and table rows.
- **Muted Ink:** `#64748b` (Slate 500) for secondary metadata, column headers, and currency units.
- **Faint / Disabled Ink:** `#94a3b8` (Slate 400) for empty states and disabled placeholders.

### Brand & Interactive Accents
- **Core Action Primary:** `#4f46e5` (Indigo 600) for high-intent primary buttons, active navigation markers, and verified indicators.
- **Hover / Interactive Accent:** `#6366f1` (Indigo 500) for interactive hover states and selected focus outlines.
- **Subtle Accent Wash:** `#eef2ff` (Indigo 50) for selected row highlights and primary icon badges.

### Financial Status Tokens
Status indicators use balanced text, outline, and surface treatments to prevent visual fatigue:
- **Active / Paid:** Surface `#ecfdf5`, Border `#a7f3d0`, Text `#047857` (Emerald)
- **Pending / In Review:** Surface `#fffbeb`, Border `#fde68a`, Text `#b45309` (Amber)
- **Overdue / Cancelled / Failed:** Surface `#fff1f2`, Border `#fecdd3`, Text `#be123c` (Rose)
- **Trial / Promotional:** Surface `#f0f9ff`, Border `#bae6fd`, Text `#0369a1` (Sky)
- **Draft / Archived:** Surface `#f8fafc`, Border `#e2e8f0`, Text `#475569` (Slate)

## Typography

The typographic hierarchy couples **Geist** for crisp human-interface interaction with **JetBrains Mono** for numerical accuracy and data-heavy ledger presentation.

### Usage Standards
- **Font Pairing:** Use Geist for primary headlines, navigation labels, and UI controls. Use JetBrains Mono exclusively for numerical amounts, Indian Rupee (`₹`) financial values, invoice identifiers, timestamps, and API keys.
- **Financial Metric Rendering:** All currency values must use tabular figures with consistent decimal sizing. For high-level KPI cards, display amounts using `mono-data-lg` with the Indian Rupee symbol rendered cleanly alongside: `₹1,24,500.00`.
- **Case Rules:** All micro table headers and section tags (`label-sm`) must use uppercase styling (`text-transform: uppercase`) paired with tracking expansion (`letter-spacing: 0.03em`) and neutral slate tinting (`#64748b`).
- **Pacing & Truncation:** Limit long customer subscription identifiers and descriptions with automatic ellipses, pairing them with an immediate hover tooltip.

## Layout & Spacing

The system is calibrated around a disciplined 4px/8px structural increment, ensuring dashboard layouts lock into alignment across differing viewports.

### Grid & Layout Structure
- **Global Structure:** A fixed-width navigation rail (64px collapsed, 240px expanded) docked left, an optional secondary contextual rail (280px) for drill-downs, and a fluid main workspace.
- **Grid System:** 12-column fluid grid in the main canvas. Cards span 3 columns (KPI metrics), 4 columns (breakdowns, charts), 6 columns (cohort summaries), or 12 columns (data tables).
- **Responsive Breakpoints:**
  - **Desktop (>= 1280px):** 12 columns, 32px canvas margin, 24px column gutter.
  - **Tablet (768px - 1279px):** 8 columns, 24px canvas margin, 16px column gutter; secondary rail collapses into overlay panels.
  - **Mobile (< 768px):** 4 columns, 16px canvas margin, 12px column gutter; navigation docks to bottom or hamburger app bar; metric cards stack vertically.

### Information Density Rules
- High density is maintained through compact row heights (`36px` to `44px`) inside data tables.
- Card padding remains strict: `space-lg` (24px) for desktop header panels, scaling to `space-md` (16px) on mobile viewports.
- Related label-value pairs use `space-xs` (4px), while independent component groups adhere to `space-md` (16px) or `space-lg` (24px).

## Elevation & Depth

Depth is established through low-opacity ambient shadows paired with crisp border outlines (`#e2e8f0`). Heavy dropshadows are avoided to retain a technical, high-performance look.

### Elevation Hierarchy
1. **Flat / Base Layer (0dp):** Canvas `#f8fafc`. Borders are flush; no shadow.
2. **Surface / Card Layer (1dp):** Pure White (`#ffffff`) with 1px border (`#e2e8f0`) and subtle micro-shadow:
   `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
3. **Elevated / Hover Layer (2dp):** Triggered on card hover or interactive row actions:
   `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`. Border shifts to `#cbd5e1`.
4. **Dropdowns & Popovers (3dp):** Context menus, date pickers, filter popovers:
   `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`. 1px border `#e2e8f0`.
5. **Modals & Slide-overs (4dp):** Payment method drawers, checkout configurations:
   `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`. Backed by an overlay backdrop: `rgba(15, 23, 42, 0.4)` with `backdrop-filter: blur(4px)`.

### Border Integrity
Every card, badge, and input surface maintains a hairline 1px border to separate stacked pure-white elements from background panels without relying on heavy shadows.

## Shapes

The design uses balanced, modern geometric rounding that softens administrative interfaces while maintaining alignment with monospace numbers and tabular grids.

### Corner Radii Guidelines
- **Small Controls & Chips (`rounded-md` / 6px):** Checkboxes, tags, dropdown triggers, and micro status chips.
- **Interactive Inputs & Primary Buttons (`rounded-lg` / 8px):** Form fields, action buttons, table cell toolbars, and search bars.
- **Card Containers & Panels (`rounded-xl` / 12px):** Metric widgets, billing charts, data table wrappers, and side drawer corners.
- **Dialogs & Modals (`rounded-2xl` / 16px):** Subscription upgrade flows, invoice preview modals, and payment collection sheets.
- **Avatars & Radial Meters (`rounded-full`):** Customer profile icons and progress trackers.

## Components

### Buttons
- **Primary:** Background `#4f46e5`, text `#ffffff`, border transparent. Hover `#4338ca`. Active scale `0.98`. Focus ring: 2px offset with `#6366f1`.
- **Secondary / Outline:** Background `#ffffff`, text `#0f172a`, border 1px solid `#e2e8f0`. Hover background `#f8fafc`, border `#cbd5e1`.
- **Ghost:** Background transparent, text `#475569`. Hover background `#f1f5f9`, text `#0f172a`.
- **Destructive:** Background `#ffffff`, text `#be123c`, border 1px solid `#fecdd3`. Hover background `#fff1f2`.
- **Sizing:** Compact `h-8` (32px) with `px-3` for data table actions; Standard `h-10` (40px) with `px-4` for form controls.

### Status Badges & Chips
- Rendered as pill-shaped or soft-corner badges (`rounded-md`, 6px) with uppercase text (`label-sm`).
- **Active / Paid:** Surface `#ecfdf5`, Border `#a7f3d0`, Text `#047857`, Lucide `CheckCircle2` (12px).
- **Draft:** Surface `#f8fafc`, Border `#e2e8f0`, Text `#475569`, Lucide `FileEdit` (12px).
- **Pending:** Surface `#fffbeb`, Border `#fde68a`, Text `#b45309`, Lucide `Clock` (12px).
- **Overdue / Cancelled:** Surface `#fff1f2`, Border `#fecdd3`, Text `#be123c`, Lucide `AlertCircle` (12px).
- **Trial:** Surface `#f0f9ff`, Border `#bae6fd`, Text `#0369a1`, Lucide `Sparkles` (12px).

### Input Fields & Search
- Surface `#ffffff`, border 1px solid `#e2e8f0`, text `#0f172a`, placeholder text `#94a3b8`.
- Height: 36px (dense table filter) or 40px (standard form).
- Focus: Border `#4f46e5`, ring `2px solid rgba(99, 102, 241, 0.15)`.
- Currency prefix: Locked `JetBrains Mono` label with `₹` anchored to the left interior edge.

### Cards & Metric Panels
- Surface `#ffffff`, border 1px solid `#e2e8f0`, radius `rounded-xl` (12px), elevation 1dp.
- Metric Card Structure: Upper row contains small uppercase metric title (`label-sm`, `#64748b`) paired with a Lucide icon (`#4f46e5`, 16px). Center features large data point (`mono-data-lg`, `#0f172a`). Footer displays comparison percentage pill with green up-trend or rose down-trend micro arrow.

### Data Tables
- Header: Background `#f8fafc`, height 36px, typography `label-sm` in uppercase Slate 500, bottom border `#e2e8f0`.
- Rows: Background `#ffffff`, height 44px, border bottom 1px solid `#f1f5f9`. Hover state `#f8fafc`.
- Numbers, IDs, and amounts strictly right-aligned using `JetBrains Mono`. Text names and status tags left-aligned.

### Checkboxes & Radio Controls
- Checkbox: 16px x 16px square, radius 4px (`rounded`), border 1px solid `#cbd5e1`. Checked: Background `#4f46e5`, border `#4f46e5`, white checkmark icon.
- Radio: 16px circular boundary. Selected: 4px solid white inner dot surrounded by `#4f46e5` fill.

### Iconography
- Standardize on **Lucide Icons** rendered at 1.5px stroke width (`stroke-width="1.5"`).
- Sizing strictly constrained to 14px (inline metadata), 16px (inputs and buttons), and 20px (primary navigation items).