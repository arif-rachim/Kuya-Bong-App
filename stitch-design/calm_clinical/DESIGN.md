---
name: Calm Clinical
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#3e4949'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#6e7979'
  outline-variant: '#bdc9c8'
  surface-tint: '#006a6a'
  primary: '#006565'
  on-primary: '#ffffff'
  primary-container: '#008080'
  on-primary-container: '#e3fffe'
  inverse-primary: '#76d6d5'
  secondary: '#556158'
  on-secondary: '#ffffff'
  secondary-container: '#d9e6da'
  on-secondary-container: '#5b675e'
  tertiary: '#406060'
  on-tertiary: '#ffffff'
  tertiary-container: '#587979'
  on-tertiary-container: '#e6fffe'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#93f2f2'
  primary-fixed-dim: '#76d6d5'
  on-primary-fixed: '#002020'
  on-primary-fixed-variant: '#004f4f'
  secondary-fixed: '#d9e6da'
  secondary-fixed-dim: '#bdcabe'
  on-secondary-fixed: '#131e17'
  on-secondary-fixed-variant: '#3e4a41'
  tertiary-fixed: '#c6e9e9'
  tertiary-fixed-dim: '#abcdcd'
  on-tertiary-fixed: '#002020'
  on-tertiary-fixed-variant: '#2c4c4c'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  margin-mobile: 20px
  margin-desktop: 120px
  gutter: 24px
---

## Brand & Style

The design system is built for the "Calm Clinical" aesthetic, specifically tailored for a physiotherapy and chiropractic healthcare environment. The brand personality is rooted in **reliability, serenity, and precision**. It aims to reduce patient anxiety through a UI that feels stable and medical-grade, yet warmly approachable.

The target audience includes patients across a wide age spectrum, with a specific focus on older adults who require high legibility and intuitive navigation. The design style is a blend of **Modern Corporate** and **Soft Minimalism**. It utilizes generous whitespace to prevent cognitive overload, clear visual hierarchies to guide the booking flow, and a tactile quality that suggests comfort and care. The emotional response should be one of "expert relief"—the feeling that the user is in safe, professional hands.

## Colors

The palette is designed for high accessibility and a soothing clinical feel.

- **Primary (Teal - #008080):** Used for primary actions, active states, and branding. It provides a strong, trustworthy anchor.
- **Secondary (Soft Green - #E8F5E9):** Used for large surface areas, backgrounds, and success states. This "minty" wash reduces eye strain.
- **Tertiary (Charcoal - #2F4F4F):** Used for secondary text and deep backgrounds where high contrast is required against white.
- **Neutral (#121212):** Pure charcoal-black for primary headers to ensure maximum AAA-grade contrast on white backgrounds.

**Clinic Distinction:**
To differentiate locations, Clinic A uses a deeper "Deep Sea Teal" (#005F5F) accent, while Clinic B utilizes a "Healing Leaf" Green (#4CAF50). These are applied to location badges, map markers, and specific clinic-header underlines.

## Typography

The design system utilizes **Inter** exclusively for its exceptional legibility and neutral, professional tone. 

The scale is intentionally oversized to accommodate patients with varying degrees of visual acuity. High-contrast ratios are strictly maintained between text and background. For mobile, headline sizes are reduced to ensure critical information remains above the fold without sacrificing readability. Body text never drops below 16px for primary content to ensure "Older Adult Friendly" standards are met.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** approach for desktop and a **Fluid Grid** for mobile. 

- **Desktop:** A 12-column grid centered in a 1440px container.
- **Mobile:** A single-column layout with 20px side margins to ensure touch targets don't hit the edge of the glass.

The spacing rhythm is based on an 8px base unit. We prioritize "generous breathing room" (using the `lg` and `xl` tokens) between sections to separate Clinic A and Clinic B services clearly, preventing accidental selection. Stacked elements (like list items) use `md` (24px) spacing to provide large, clear tap targets.

## Elevation & Depth

This design system uses **Tonal Layering** combined with **Ambient Shadows** to create a sense of organized calm.

- **Background:** The base layer is pure white or the secondary Soft Green (#E8F5E9).
- **Cards:** White cards on a Soft Green background use a very soft, diffused shadow (0px 4px 20px, 5% opacity Teal-tinted black). This creates a "floating" effect that signals interactivity without looking aggressive.
- **Interactive Elements:** Buttons use a solid, flat primary color with no shadow to maintain high contrast. When pressed, they move to a slightly darker tonal shade rather than using a drop shadow.
- **Clinic Differentiation:** Depth is also used to separate locations; Clinic A cards might feature a subtle left-border accent, while Clinic B cards use a soft inner-glow to distinguish the two.

## Shapes

The shape language is defined by **Soft Friendliness**. We utilize a base roundedness of 16px (`rounded-lg` in this system) for all primary UI containers.

- **Buttons & Inputs:** Use the 16px corner radius to feel comfortable and safe to touch.
- **Chips & Badges:** Use a pill-shape (full roundedness) to contrast against the more structural cards.
- **Avatars/Clinic Icons:** Use a subtle 12px radius to maintain consistency with the clinical aesthetic while avoiding the "sharpness" of rectangles or the "playfulness" of circles.

## Components

- **Buttons:** Large height (56px minimum) for accessibility. Primary buttons use #008080 with white text. Secondary buttons use a Teal outline.
- **Clinic Cards:** Prominent cards with 16px padding. Include a clear location icon and either the "Deep Sea" or "Healing Leaf" accent color to denote the clinic branch.
- **Input Fields:** Thick borders (2px) when focused using the Primary Teal. Placeholder text is kept at high-contrast Charcoal (#2F4F4F) to ensure visibility.
- **Time Slots:** Large, selectable chips (80px x 56px) that use the Primary Teal for the selected state and Soft Green for the available state.
- **Progress Steppers:** Horizontal bars at the top of the booking flow. These use thick 8px lines with rounded caps to show the patient where they are in the 1-2-3 booking process.
- **Checkboxes/Radio Buttons:** Oversized (24px x 24px) to accommodate motor-skill challenges, featuring a clear tick/dot in Primary Teal.