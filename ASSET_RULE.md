# asset_rule.md

# Asset Export Rules

This document defines the asset export structure and design-to-frontend integration rules.

The goal is:

* reusable assets
* realtime-compatible UI
* responsive fullscreen rendering
* smooth animation integration

---

# Asset Folder Structure

/public/assets
/background
/ui
/effects
/teams

---

# Layer Structure

Assets are separated into layers.

---

# 1. Background Layer

Folder:
/background

Examples:

* stadium-bg.webp
* sky-bg.webp

Purpose:

* fullscreen background
* stadium visuals
* crowd
* lighting
* field

Rules:

* static only
* no dynamic content
* no score
* no team name
* no ranking text

Recommended Format:

* .webp

---

# 2. UI Layer

Folder:
/ui

Examples:

* header.webp
* row-bg.webp
* badge-gold.svg
* badge-silver.svg

Purpose:

* reusable UI graphics
* scoreboard frame
* ranking badges
* title graphics

Rules:

* reusable only
* no dynamic score
* no team name
* no ranking number
* no hardcoded text

Recommended Formats:

* .webp
* .svg

---

# 3. Decoration Layer

Folder:
/effects

Examples:

* confetti.webp
* sparkle.svg
* doodle-star.svg
* paper-plane.svg

Purpose:

* visual decoration
* atmosphere effects

Rules:

* static only
* reusable
* lightweight assets

Recommended Formats:

* .webp
* .svg

---

# 4. Team Layer

Folder:
/teams

Examples:

* team-blue.webp
* team-red.webp

Purpose:

* team avatar
* mascot
* team logo

Rules:

* transparent background preferred
* reusable
* optimized size

Recommended Formats:

* .webp
* .png

---

# 5. Dynamic Layer

IMPORTANT:
Dynamic content MUST NOT be exported as images.

DO NOT EXPORT:

* score
* ranking number
* team name
* animated values

Frontend MUST render these using React.

Examples:

Correct:

<div class="score">920</div>

Incorrect:
score-920.png

---

# Naming Convention

Use lowercase filenames only.

Use kebab-case.

Examples:

* row-bg.webp
* badge-gold.svg
* stadium-bg.webp

DO NOT USE:

* final-v2-final.png
* test123.png

---

# Resolution Rules

Base design resolution:

* 1920x1200

Primary aspect ratio:

* 16:10

Supported:

* 1152x768
* 1920x1200

---

# Responsive Safe Area

Important content MUST NOT be placed near screen edges.

Keep safe padding for:

* LCD overscan
* fullscreen scaling
* responsive layout

---

# Animation Compatibility Rules

Scoreboard rows MUST remain separated.

Correct:

* row background separated
* score rendered separately

Incorrect:

* flattened row image with score baked in

---

# Frontend Integration Rules

Frontend controls:

* score
* ranking
* animation
* realtime updates

Designer controls:

* theme
* graphics
* decorations
* atmosphere

---

# Export Rules

## Background Assets

Use:

* .webp

---

# UI Assets

Use:

* .webp
* .svg

---

# Icons

Use:

* .svg

---

# Transparent Assets

Use:

* .png
* .webp

---

# Performance Rules

Assets MUST:

* be optimized
* use compressed formats
* avoid oversized textures
* support fullscreen rendering

---

# Forbidden Rules

DO NOT:

* flatten all layers into one image
* export dynamic score as PNG
* export ranking as image
* hardcode team names into assets
* merge dynamic content into row backgrounds

---

# Frontend Dynamic Rendering

Frontend MUST render:

* score
* rank
* team name
* realtime updates

using React components.

---

# Asset Replacement Rules

Designer assets can be replaced later without changing frontend logic.

Frontend must remain asset-independent.

---

# Final Goal

The asset system must support:

* realtime rendering
* animated ranking reorder
* fullscreen LCD display
* scalable event themes
* future theme replacement
