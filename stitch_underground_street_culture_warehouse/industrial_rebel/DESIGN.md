---
name: INDUSTRIAL REBEL
colors:
  surface: '#12131a'
  surface-dim: '#12131a'
  surface-bright: '#383941'
  surface-container-lowest: '#0d0e15'
  surface-container-low: '#1a1b22'
  surface-container: '#1e1f26'
  surface-container-high: '#292931'
  surface-container-highest: '#33343c'
  on-surface: '#e3e1ec'
  on-surface-variant: '#c4c7c7'
  inverse-surface: '#e3e1ec'
  inverse-on-surface: '#2f3038'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c9c6c5'
  primary: '#c9c6c5'
  on-primary: '#313030'
  primary-container: '#0a0a0a'
  on-primary-container: '#7b7979'
  inverse-primary: '#5f5e5e'
  secondary: '#ffe083'
  on-secondary: '#3c2f00'
  secondary-container: '#eec200'
  on-secondary-container: '#645000'
  tertiary: '#ffb4ab'
  on-tertiary: '#690005'
  tertiary-container: '#200001'
  on-tertiary-container: '#e03b34'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c9c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#ffe083'
  secondary-fixed-dim: '#eec200'
  on-secondary-fixed: '#231b00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb4ab'
  on-tertiary-fixed: '#410002'
  on-tertiary-fixed-variant: '#93000b'
  background: '#12131a'
  on-background: '#e3e1ec'
  surface-variant: '#33343c'
typography:
  display-xl:
    fontFamily: Anton
    fontSize: 120px
    fontWeight: '400'
    lineHeight: 100px
    letterSpacing: -0.04em
  display-xl-mobile:
    fontFamily: Anton
    fontSize: 64px
    fontWeight: '400'
    lineHeight: 60px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Anton
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 44px
  headline-md:
    fontFamily: Anton
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
spacing:
  unit: 4px
  gutter: 16px
  margin-safe: 24px
  stack-tight: 8px
  stack-loose: 48px
---

## Brand & Style

The design system is engineered for the "Underground Warehouse" aesthetic—a raw, high-energy environment that bridges the gap between digital e-commerce and a gritty, physical loading dock. The target audience is the Gen-Z street culture enthusiast who values exclusivity, speed, and rebellion over polished luxury.

The visual style is **Industrial Brutalism** mixed with **Street Editorial**. It rejects traditional whitespace in favor of "crowded" information density, utilizing heavy borders, technical overlays, and grain textures to simulate a flash-photographed warehouse catalog. Every interaction should feel tactile and mechanical, evoking the tension of a limited-edition drop.

## Colors

The palette is rooted in a "Construction Site" utility scheme. 

- **Basics**: Matte Black (`#0A0A0A`) serves as the primary void, while Dirty White (`#F5F5F5`) is used for high-contrast typography and surface areas that mimic paper labels.
- **Metallics**: Concrete Gray and Steel Silver are represented through gradients and grain-textured overlays rather than flat hex codes to maintain depth.
- **Accents**: Warning Yellow (`#FACC15`) is the primary call-to-action color, signifying urgency. Deep Red (`#B91C1C`) is reserved for "Sold Out" states and critical alerts. Hazard Orange (`#F97316`) is used for technical data highlights and price tags.

## Typography

Typography in this design system is aggressive and functional. 

- **Headlines**: Use **Anton** for its compressed, impactful profile. It should be treated as a graphic element—often oversized, overlapping images, or running off the edge of the screen.
- **Body**: **Hanken Grotesk** provides a sharp, modern editorial feel that remains legible against dark, textured backgrounds.
- **Technical Data**: **JetBrains Mono** is used for all "metadata"—serial numbers, SKU codes, sizing charts, and price points—to reinforce the warehouse inventory aesthetic.
- **Styling**: Headlines should predominantly use uppercase. Apply a subtle "ink-bleed" or "stamped" filter to display text to break the digital perfection.

## Layout & Spacing

The layout philosophy follows a **Fixed-Grid Industrial Model**. It mimics a manifest or a shipping blueprint.

- **Grid**: A strict 12-column grid for desktop, reducing to 2 columns for mobile. 
- **Borders**: Instead of white space, use heavy 2px or 3px borders (`#262626`) to separate sections.
- **Margins**: Content is often pushed to the very edges of the screen to create a sense of "overfilling" the container.
- **Reflow**: On mobile, elements stack vertically like shipping crates. Use "Warning Tape" patterns (diagonal stripes) as section dividers when a hard break is needed.

## Elevation & Depth

This design system avoids soft shadows and "airy" depth. It uses **Tonal Stacking** and **Tactile Textures**.

- **Surfaces**: Use a persistent film grain overlay (5-10% opacity) across the entire UI. Surfaces should look like matte plastic, brushed steel, or raw concrete.
- **Layering**: Depth is achieved through "stencils." Elements appear as if they are spray-painted onto the surface or bolted onto it.
- **Flash Aesthetic**: Use high-contrast "hotspots"—simulating a camera flash hitting a metallic surface—on product images and primary hero sections.
- **No Soft Shadows**: If a shadow is required for legibility, use a hard-edged, 100% opaque offset shadow in Warning Yellow or Hazard Orange to create a "sticker" effect.

## Shapes

The shape language is **strictly geometric and sharp**.

- **Corners**: Everything is 0px radius. Curves are prohibited as they conflict with the industrial, "warehouse crate" theme.
- **Clipping**: Use 45-degree "clipped corners" for buttons and badges to mimic industrial tags or heavy machinery plates.
- **Stroke**: Every container should have a visible stroke. Use a double-line stroke for primary sections to mimic reinforced steel beams.

## Components

- **Buttons**: "Crate-style" buttons. High-contrast (Yellow/Black), 0px radius, heavy 3px bottom-right offset shadow. Hover state should trigger a "Flash" effect (white screen-overlay flicker) and a slight distortion/glitch shift.
- **Inputs**: Field labels should look like barcode stickers. Use `JetBrains Mono` for placeholder text. Active states turn the entire field background to Steel Silver.
- **Cards (Product)**: Product images should feature "raw" photography (harsh lighting, messy backgrounds). The price and SKU are displayed in a "Hazard Label" badge in the top-right corner.
- **Navigation**: The menu is a full-screen "Manifest" list. Use large-scale `Anton` typography for links. Icons are sharp, 2px stroke, reminiscent of shipping symbols (fragile, this way up, dry storage).
- **Cart Icon**: Specifically shaped like a wire-mesh warehouse crate or a heavy-duty dolly.
- **Transitions**: Use "Motion Blur" and "Glitch" transitions between pages. Avoid smooth fades; use hard cuts or "shutter" effects.