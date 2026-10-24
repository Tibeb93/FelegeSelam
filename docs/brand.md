# Aemade Selam Sunday School — Brand Identity & Design System

## 1. Overview & Core Identity

The Aemade Selam Sunday School (አዕማደ ሰላም ሰንበት ትምህርት ቤት) management system is built upon a professional **Blue and White** visual identity. It conveys reverence, spiritual calm, academic structure, and institutional clarity.

The visual architecture is anchored by:
- **Deep Navy & Blue**: Foundations, headers, navigation bars, and primary interactive buttons.
- **Pure White & Soft Blue Surfaces**: Cards, modals, data tables, and high-readability canvases.
- **Accent Gold (#F2B233)**: Reserved strictly for high-priority calls to action (e.g., Primary "Admin Login" and "Register" buttons) and small dignified highlights.
- **Standard Semantic Statuses**: Present/Approved (`#1B8E5A`), Pending/Warning (`#E39B00`), Absent/Rejected/Urgent (`#C62828`).

---

## 2. Design Tokens (Single Source of Truth)

All color tokens are unified across `web/tailwind.config.ts`, `web/src/app/globals.css`, and backend export services (`/api`).

### Primary Palette (Blues)
| Token | Hex | HSL / CSS Var | Purpose & Application |
| :--- | :--- | :--- | :--- |
| **primary-900** | `#0A2E52` | `210 78% 18%` | Deep Navy: Sidebar background, hero gradient, footer |
| **primary-800** | `#0D3C68` | `210 77% 23%` | Active states in dark surfaces |
| **primary-700** | `#0F4C81` | `208 79% 28%` | Deep Blue: Top headers, primary buttons, table head |
| **primary-600** | `#1662A5` | `208 76% 37%` | Button hover states, active tab underlines |
| **primary-500** | `#1E78C8` | `208 74% 45%` | Primary links, focus ring, primary chart series |
| **primary-200** | `#B8D5F4` | `211 74% 84%` | Card borders, secondary chart bars |
| **primary-100** | `#E8F1FB` | `212 70% 95%` | Soft blue background, selected table rows, pills |
| **primary-50** | `#F3F7FC` | `213 60% 97%` | Subtle container background |

### Neutral & Surface Tokens (Light Mode)
| Token | Hex | HSL / CSS Var | Purpose & Application |
| :--- | :--- | :--- | :--- |
| **white** | `#FFFFFF` | `0 0% 100%` | Card surfaces, modal dialogs, sheet canvas |
| **text** | `#0F2438` | `210 58% 14%` | High-contrast body text & titles (Contrast 13.9:1) |
| **muted-text** | `#5B6B7C` | `211 15% 42%` | Subtitles, helper text, timestamps (Contrast 5.3:1) |
| **border** | `#D7E3F1` | `212 45% 89%` | Card borders, table dividers, input borders |

### Accent Gold Token
| Token | Hex | HSL / CSS Var | Purpose & Application |
| :--- | :--- | :--- | :--- |
| **accent-gold** | `#F2B233` | `41 88% 57%` | Reserved strictly for primary CTA (Admin Login) |
| **accent-gold-dark**| `#D99B1D` | `41 88% 48%` | Hover state for gold CTA buttons |

### Semantic Status Tokens
| State | Hex | HSL / CSS Var | Meaning |
| :--- | :--- | :--- | :--- |
| **Success** | `#1B8E5A` | `153 68% 33%` | Present, Approved, Paid, Active, Verified |
| **Warning** | `#E39B00` | `41 100% 45%` | Late, Pending review, Needs attention |
| **Danger** | `#C62828` | `0 67% 46%` | Absent, Rejected, Suspended, Urgent notice |

---

## 3. Dark Mode Specification

Dark mode retains the blue spiritual identity using deep navy layered surfaces instead of generic gray/black:

- **Background (Canvas)**: `#061B30` (`210 78% 11%`) — Deepest night navy.
- **Card / Surface**: `#0A2644` (`210 74% 15%`) — Elevated card surface.
- **Card Muted / Sub-surface**: `#0F355C` (`210 72% 21%`) — Nested container surface.
- **Border**: `#1A3E63` (`210 58% 25%`) — Subtle blue-tinted divider.
- **Foreground (Text)**: `#F0F6FC` (`210 60% 96%`) — Crisp readable text (Contrast 15.2:1).
- **Muted Foreground**: `#99B7D5` (`210 44% 72%`) — Clear secondary text (Contrast 5.8:1).
- **Focus Ring**: `#1E78C8` with 2px offset.

---

## 4. Typography & Amharic Hierarchy

All typography supports both Ge'ez/Ethiopic script and Latin characters with balanced x-heights and line heights:

1. **Font Families**:
   - Primary: `Noto Sans Ethiopic`, `system-ui`, `-apple-system`, `sans-serif`
   - Numeric / Code: `JetBrains Mono`, `Consolas`, `monospace`
2. **Hierarchy & Fidel Legibility**:
   - Fidel glyphs require +10% line height and slightly larger font size compared to Latin equivalents.
   - Body text: minimum `14px` (`text-sm`), preferably `16px` (`text-base`) with `leading-relaxed` (1.625).
   - Headings: `font-bold` with `font-ethiopic` tracking.
3. **Contrast Compliance (WCAG AA & AAA)**:
   - Main text `#0F2438` on `#FFFFFF`: **13.9:1** (Passes AAA)
   - Main text `#0F2438` on `#E8F1FB`: **12.3:1** (Passes AAA)
   - Muted text `#5B6B7C` on `#FFFFFF`: **5.3:1** (Passes AA)
   - Gold CTA `#F2B233` with `#0F2438` text: **7.8:1** (Passes AAA)
   - Dark mode `#F0F6FC` on `#061B30`: **15.2:1** (Passes AAA)
   - Dark mode muted `#99B7D5` on `#0A2644`: **5.8:1** (Passes AA)

---

## 5. UI Components & Layout Rules

### Header & Navigation
- **Public Header**: Deep Blue `#0F4C81` main bar with Navy `#0A2E52` micro-bar, circular School Logo, white navigational links, and gold `#F2B233` CTA for portal/login.
- **Admin Sidebar**: Deep Navy `#0A2E52` background, school logo at top, active items highlighted with deep blue `#0F4C81` background and gold `#F2B233` left indicator bar.

### Cards & Surfaces
- Standard cards feature `rounded-2xl`, white background `#FFFFFF`, subtle shadow `shadow-sm`, and a thin border `border-[#D7E3F1]`.
- Hero sections use a deep navy `#0A2E52` gradient background with large white typography and gold CTA.

### Status Badges & Indicators
- Badges use pill styling (`rounded-full px-2.5 py-0.5 text-xs font-semibold`).
- Mapped strictly to semantic colors:
  - `Active` / `Present` / `Approved` / `Paid`: Soft green fill `#E8F8F0`, dark green text `#1B8E5A`.
  - `Pending` / `Late` / `Warning`: Soft amber fill `#FEF3C7`, dark amber text `#E39B00`.
  - `Absent` / `Rejected` / `Urgent`: Soft rose fill `#FDE8E8`, dark red text `#C62828`.

### Charts (Recharts)
- Department distribution & metrics use a harmonized Blue palette:
  - Department 1: `#0F4C81` (Deep Blue)
  - Department 2: `#1E78C8` (Primary Blue)
  - Department 3: `#469BE6` (Sky Blue)
  - Department 4: `#7DBBF5` (Soft Blue)
  - Department 5: `#0A2E52` (Navy)
- Status series strictly map to status colors: Attendance Present = `#1B8E5A`, Absent = `#C62828`, Late = `#E39B00`.

---

## 6. Document & Export Templates (PDF / Word / Excel)

All exported documents generated by the NestJS API adhere to the blue identity:

1. **Member Roster PDF & Word**:
   - Header table filled with `#0F4C81`, white text, bordered with `#0A2E52`.
   - Title in deep navy with Orthodox cross symbol.
   - Alternating row zebra striping with soft blue `#F0F6FC`.
2. **Member ID Card PDF**:
   - Outer card border: `2px solid #0F4C81`.
   - Header banner: `#0F4C81` with gold `#F2B233` separator line and gold English subtitle.
   - Footer: Deep navy `#0A2E52` with soft blue `#E8F1FB` text.
   - Photo border in `#0F4C81` with QR code.
3. **Official Confirmation & Recommendation Letters**:
   - Title in deep blue `#0F4C81`.
   - Official seal box outlined with `#F2B233` dashed border.
   - Clean dark text `#0F2438` on pure white background.
4. **Course Completion Certificates**:
   - Outer certificate frame: `6px double #0F4C81`.
   - Inner decorative frame: `2px solid #D7E3F1`.
   - Central cross and student name underline in accent gold `#F2B233`.
   - QR verification badge with deep blue `#0F4C81` modules on white canvas.
5. **Income Receipt Vouchers**:
   - Header title in `#0F4C81`, voucher number badge in `#E8F1FB`.
   - Total amount box with deep blue `#0F4C81` border and soft blue background.
6. **Excel Workbooks (Contributions, Audit Logs, Forms)**:
   - Title block fill: `FF0F4C81` (Deep Blue), white bold font.
   - Metadata strip fill: `FFE8F1FB` (Soft Blue), dark text `FF0F2438`.
   - Table header fill: `FF0F4C81` with thin navy border.
   - Zebra striping fill: `FFF0F6FC`.

---

## 7. Golden Rules (Do's and Don'ts)

- **DO** use `#0F4C81` for primary buttons, navbar headers, and document titles.
- **DO** reserve `#F2B233` for the most prominent Call-to-Action button (Admin Login / Register) and small decorative highlights.
- **DO** verify text contrast $\ge 4.5:1$ (AA) for regular text and $\ge 3:1$ for large text across light and dark modes.
- **DO NOT** use gold `#F2B233` for body text or subtitle text on white cards (contrast fails).
- **DO NOT** use legacy green `#1B5E20` for branding, banners, or primary buttons (green is strictly semantic for `status.success`).
- **DO NOT** use pure black `#000000` for dark mode surfaces; always use the navy token set (`#061B30` / `#0A2644`).
