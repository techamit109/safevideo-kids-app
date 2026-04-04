```markdown
# Design System Strategy: Dual-Core Harmony

## 1. Overview & Creative North Star: "The Guided Sanctuary"
This design system is built on the concept of **The Guided Sanctuary**. It rejects the "plastic" look of generic children's apps and the "sterile" look of standard management dashboards. Instead, it employs a sophisticated editorial approach that uses depth, motion, and tonal shifts to create two distinct yet harmonious environments.

*   **The Creative North Star:** We move beyond the "grid-of-boxes." We use **Intentional Asymmetry**—where content blocks of varying sizes overlap slightly—and **Tonal Layering** to create a sense of organic safety.
*   **The Transition:** The shift from Admin to User mode isn't just a color swap; it’s a structural evolution. Admin mode uses tighter spacing and sophisticated "Glassmorphism" for clarity, while User mode expands the "Roundedness Scale" and uses "Vibrant Depth" to create a tactile, toy-like interface.

---

## 2. Colors & Tonal Architecture
We utilize a Material-inspired palette, but our implementation is strictly "No-Line."

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. Use `surface_container_low` (#edf2f2) to define a section sitting on a `surface` (#f3f7f7) background. This creates a high-end, seamless "molded" look rather than a "constructed" one.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, fine-paper sheets. 
- **Base Layer:** `surface` (#f3f7f7)
- **Primary Content Area:** `surface_container` (#e4e9e9)
- **Floating Interactive Elements:** `surface_container_lowest` (#ffffff)
This nesting ensures that the user’s eye is led toward the interactive elements by brightness rather than harsh outlines.

### Signature Textures & Gradients
- **The Admin Glow:** Use a subtle linear gradient from `primary` (#00666d) to `primary_container` (#91ebf4) for hero headers.
- **The Kid’s Spark:** Use `secondary` (#7b5400) to `secondary_fixed_dim` (#ffb623) for play buttons to create a "golden-hour" glow that feels premium and inviting.

---

## 3. Typography: Editorial Authority vs. Playful Clarity
We pair **Plus Jakarta Sans** (Geometric/Modern) with **Be Vietnam Pro** (Clean/Functional) to balance character with legibility.

*   **Display (Plus Jakarta Sans):** Used for big, bold statements in the Kid’s mode. `display-lg` (3.5rem) should be used sparingly to create focal points in a sea of video thumbnails.
*   **Headlines (Plus Jakarta Sans):** These act as the "anchor" of the page. Use `headline-md` (1.75rem) with tighter letter-spacing for a sophisticated, editorial feel in the Admin dashboard.
*   **Body & Titles (Be Vietnam Pro):** Used for all functional data. `body-lg` (1rem) is the workhorse. The high x-height of Be Vietnam Pro ensures that even complex parental settings remain readable and trustworthy.

---

## 4. Elevation & Depth: The Layering Principle
We abandon traditional "drop shadows" for **Ambient Tonal Depth**.

*   **Tonal Layering:** Instead of a shadow, place a `surface_container_highest` (#d7dede) element behind a `surface_container_lowest` (#ffffff) element. The 4-step jump in tokens creates enough contrast to imply depth without visual noise.
*   **Ambient Shadows:** If an element must "float" (like a persistent 'Exit Kid Mode' button), use a 24px blur with 6% opacity, tinted with `on_surface` (#2b3030).
*   **Glassmorphism:** For the Admin navigation overlay, use `surface_container` at 80% opacity with a `20px` backdrop-blur. This keeps the parent connected to the background content while providing a focused workspace.
*   **The Ghost Border:** If a boundary is required for accessibility, use `outline_variant` (#a9aeae) at 15% opacity. Never use 100% opacity for lines.

---

## 5. Components

### Buttons
*   **Primary (Admin):** Pill-shaped (`full` roundedness), `primary` color (#00666d). No shadow.
*   **Primary (Kid):** Extra-large padding (`spacing-6`), `xl` roundedness (3rem), using the `secondary` (#7b5400) palette for high-contrast visibility.
*   **States:** On hover/press, shift the background color to the `_dim` or `_fixed_variant` equivalent rather than adding an outline.

### Cards & Content Lists
*   **Constraint:** **Forbid divider lines.** 
*   **Implementation:** Separate video entries using `spacing-4` (1.4rem) of vertical white space. Use a `surface_container_low` background for the card body to subtly lift it from the `surface` background.
*   **Kid's Mode Cards:** Use `lg` roundedness (2rem) and a `secondary_container` (#ffc96f) "footer" within the card for the video title to maximize tactile appeal.

### Input Fields
*   **Style:** Use "Filled" style with `surface_container_highest`. 
*   **Interaction:** On focus, transition the background to `primary_container` (#91ebf4) and add a 2px "Ghost Border" of `primary`.

### Additional Component: The "Parental Gate"
A full-screen modal using `tertiary_container` (#ea8cff). It uses `display-sm` typography for math-based challenges to ensure kids can't exit to settings. It should feel like a "friendly challenge" rather than a "lock screen."

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical spacing. If the left margin is `spacing-8`, try a right margin of `spacing-12` for a more editorial, custom feel in Admin mode.
*   **Do** use `primary_fixed_dim` for "soft" buttons that need to be accessible but not dominant.
*   **Do** leverage the `xl` roundedness for all Kid-facing interactive elements to imply "safety."

### Don’t:
*   **Don’t** use pure black (#000000) for text. Always use `on_surface` (#2b3030) to maintain the "soft" brand identity.
*   **Don’t** use the `error` color (#b31b25) for anything other than critical destructive actions. For "restricted content" warnings, use `tertiary` (#9128ad) to avoid scaring the child.
*   **Don’t** ever use a 1px solid border to separate the sidebar from the main content. Use a shift from `surface` to `surface_container_low`.```