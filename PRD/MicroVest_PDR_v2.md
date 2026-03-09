# MicroVest — Project Design Requirements Document (PDR)
### Fractional Stock Investment Platform | v2.0 | March 9, 2026
**Stack:** Pure HTML5 · CSS3 · Vanilla JavaScript — Zero external frameworks

---

## TABLE OF CONTENTS

1. Project Overview & Problem Statement
2. API Decision (Final Answer)
3. Design Philosophy & Visual Identity
4. Typography System
5. Color System & Tokens
6. Spacing & Layout System
7. Component Design Specifications
   - 7.1 Navigation Bar
   - 7.2 Stock Cards
   - 7.3 Buttons
   - 7.4 Badges & Tags
   - 7.5 Modal / Calculator
   - 7.6 Portfolio Chart (CSS Only)
   - 7.7 Table
   - 7.8 Accordion (Glossary)
   - 7.9 Quiz Component
8. Animation & Motion System
9. Responsive Breakpoints
10. File Architecture
11. Page Specifications
    - 11.1 stocks.html
    - 11.2 portfolio.html
    - 11.3 education.html
12. JavaScript Architecture
13. HTML5 Usage Map
14. CSS3 Usage Map
15. JavaScript Usage Map
16. Build Order
17. Viva Defence Guide

---

## 1. PROJECT OVERVIEW & PROBLEM STATEMENT

**Product Name:** MicroVest
**Tagline:** "Own a Piece of the Future"
**Industry:** Investment / FinTech
**Target User:** Young investors (18–30) with limited capital who want exposure to expensive stocks
**Core Problem:** Stocks like NVDA ($875) or META ($520) are inaccessible to users with small budgets. MicroVest lets users buy $5 or $25 worth of any stock, owning a fraction of a share.

**Three Pages Required:**
| File | Purpose |
|------|---------|
| `stocks.html` | Browse all stocks, see live simulated prices, buy fractions |
| `portfolio.html` | View your holdings, portfolio value chart, P&L tracking |
| `education.html` | Learn investing concepts, glossary, interactive quiz |

**Four JS Features Required (checklist — do not miss):**
- [x] Real-time price simulation (setInterval engine)
- [x] Buy fraction calculator (fraction = dollar_amount / current_price)
- [x] Risk rating filter (filter stock grid by Low / Medium / High)
- [x] Portfolio total calculation (sum of all holdings × current price)

---

## 2. API DECISION — FINAL ANSWER

**We do NOT use any external API.**

The URL `https://open.er-api.com/v6/latest` returns foreign exchange rates (USD to EUR, GBP, JPY etc.) — completely unrelated to stock prices. Using it would be a critical error.

The project specification says **"Real-time price simulation"**, which means we BUILD the simulation in JavaScript. This is intentional — it tests your JS skills, not your ability to call an API.

**Our approach:** A `PriceSimulator` class in `simulator.js` uses `setInterval()` running every 2 seconds to update each stock's price using a realistic random walk algorithm (Geometric Brownian Motion simplified). This demonstrates:
- JS Classes (OOP)
- setInterval / clearInterval
- Closures
- DOM manipulation
- Math.random() with volatility scaling

This is the correct, complete, and syllabus-aligned approach.

---

## 3. DESIGN PHILOSOPHY & VISUAL IDENTITY

### 3.1 Theme Decision: Dark Glassmorphism + Aurora Glow

**Chosen Aesthetic: "Deep Space Finance"**

Inspiration: Bloomberg Terminal meets modern FinTech (Robinhood dark, Webull pro)
Direction: Dark base with glassmorphic cards + subtle aurora gradient accents

**Why this theme?**
- Finance apps universally use dark mode — reduces eye strain for trading sessions
- Glassmorphism (frosted glass cards) looks premium without being flashy
- Aurora gradient accents (cyan + violet) give it personality without being childish
- Numbers (prices, %change) are easier to read on dark backgrounds
- Stands out from generic light-mode college projects

### 3.2 NOT Apple-style, NOT pure glassmorphism

Apple's style is ultra-minimal, lots of white space, very light. That won't work here —
a stock platform needs dense information display.

Pure glassmorphism (all-glass everything) becomes unreadable with lots of data.

**Our hybrid:** Dark solid background + glass cards (backdrop-filter: blur) + aurora mesh gradient background layer. Think: a dark night sky with northern lights faintly visible, and frosted glass panels floating over it.

### 3.3 The One Thing People Will Remember

When you open the page — the background has a very subtle animated aurora gradient (slowly shifting cyan→violet mesh). Stock price updates flash the card border (green for up, red for down) for 0.5s. The whole thing feels alive.

---

## 4. TYPOGRAPHY SYSTEM

**Rules:**
- NO Arial, NO Inter, NO Roboto (too generic)
- Use Google Fonts (loaded via `<link>` in `<head>` — no build tool needed)
- 3-font system: Display + Body + Monospace

### Font Stack

```css
/* Display font — headings, page titles, hero text */
--font-display: 'Syne', sans-serif;
/* Syne is geometric, modern, distinctive — used by design studios */
/* Weights used: 600, 700, 800 */

/* Body font — paragraphs, labels, descriptions */
--font-body: 'DM Sans', sans-serif;
/* DM Sans: clean but has character, great readability */
/* Weights used: 300, 400, 500 */

/* Monospace font — ALL numbers (prices, percentages, shares) */
--font-mono: 'Space Mono', monospace;
/* Space Mono: technical feel, perfect for financial data */
/* Weights used: 400, 700 */
```

**Google Fonts import (paste in every HTML <head>):**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```

### Type Scale (defined in variables.css)

```css
--text-xs:    0.75rem;   /* 12px — footnotes, micro labels */
--text-sm:    0.875rem;  /* 14px — card metadata, table rows */
--text-base:  1rem;      /* 16px — body copy */
--text-lg:    1.125rem;  /* 18px — card titles, section intros */
--text-xl:    1.25rem;   /* 20px — sub-headings */
--text-2xl:   1.5rem;    /* 24px — section headings */
--text-3xl:   1.875rem;  /* 30px — page headings */
--text-4xl:   2.25rem;   /* 36px — hero title */
--text-5xl:   3rem;      /* 48px — portfolio total value (big impact) */
```

### Typography Rules
- All prices, percentages, share counts → `font-family: var(--font-mono)`
- All headings (h1–h3) → `font-family: var(--font-display)`
- Body text, labels, descriptions → `font-family: var(--font-body)`
- Numbers that change (live prices) → monospace prevents layout shift on update

---

## 5. COLOR SYSTEM & TOKENS

All colors live in `variables.css`. Never hardcode a hex anywhere else.

### 5.1 Background Layers
```css
--bg-base:       #080C14;   /* Deepest dark — page background */
--bg-surface:    #0F1621;   /* Card backgrounds */
--bg-elevated:   #161E2E;   /* Hover states, elevated cards */
--bg-border:     #1E2D45;   /* Card borders, dividers */
--bg-overlay:    rgba(15, 22, 33, 0.85); /* Glassmorphism backdrop */
```

### 5.2 Text Colors
```css
--text-primary:  #E8F0FE;   /* Main text — slightly blue-tinted white */
--text-secondary:#8BA3C7;   /* Supporting text, labels */
--text-muted:    #4A6080;   /* Placeholder, disabled text */
--text-inverse:  #080C14;   /* Text on light backgrounds */
```

### 5.3 Brand & Accent Colors
```css
--accent-cyan:   #00D4FF;   /* Primary CTA, links, active states */
--accent-violet: #7B61FF;   /* Secondary accent, risk medium */
--accent-gold:   #FFB830;   /* Premium feature labels, warnings */
--brand-gradient: linear-gradient(135deg, #00D4FF 0%, #7B61FF 100%);
```

### 5.4 Semantic (Finance) Colors
```css
--up-strong:     #00E676;   /* Stock up — bright green */
--up-muted:      rgba(0, 230, 118, 0.12); /* Up background tint */
--down-strong:   #FF3D57;   /* Stock down — vivid red */
--down-muted:    rgba(255, 61, 87, 0.12); /* Down background tint */
--neutral:       #8BA3C7;   /* Unchanged / 0% */
```

### 5.5 Risk Rating Colors
```css
--risk-low:      #00E676;   /* Low risk — green */
--risk-low-bg:   rgba(0, 230, 118, 0.10);
--risk-medium:   #FFB830;   /* Medium risk — amber */
--risk-medium-bg:rgba(255, 184, 48, 0.10);
--risk-high:     #FF3D57;   /* High risk — red */
--risk-high-bg:  rgba(255, 61, 87, 0.10);
```

### 5.6 Glass Effect Tokens
```css
--glass-bg:      rgba(15, 22, 33, 0.60);   /* Frosted glass fill */
--glass-border:  rgba(0, 212, 255, 0.12);  /* Subtle cyan border */
--glass-blur:    blur(16px);               /* backdrop-filter value */
--glass-shadow:  0 8px 32px rgba(0, 0, 0, 0.40); /* Card shadow */
```

### 5.7 Aurora Background (Animated Mesh)
The page background is `--bg-base` (#080C14) with a pseudo-element or dedicated div containing:
```css
/* Two radial gradients that animate slowly */
background:
  radial-gradient(ellipse 80% 60% at 20% 30%, rgba(0, 212, 255, 0.08) 0%, transparent 70%),
  radial-gradient(ellipse 60% 80% at 80% 70%, rgba(123, 97, 255, 0.08) 0%, transparent 70%);
animation: aurora-shift 12s ease-in-out infinite alternate;
```

---

## 6. SPACING & LAYOUT SYSTEM

```css
/* Spacing scale — use ONLY these values */
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px
--space-20:  80px

/* Border Radius */
--radius-sm:   6px    /* Badges, small tags */
--radius-md:   12px   /* Cards, inputs, buttons */
--radius-lg:   20px   /* Modal, large panels */
--radius-xl:   28px   /* Hero cards */
--radius-full: 9999px /* Pills, avatar */

/* Shadows */
--shadow-sm:  0 2px 8px rgba(0,0,0,0.3);
--shadow-md:  0 8px 32px rgba(0,0,0,0.4);
--shadow-lg:  0 16px 64px rgba(0,0,0,0.5);
--shadow-glow-cyan:   0 0 20px rgba(0, 212, 255, 0.25);
--shadow-glow-up:     0 0 16px rgba(0, 230, 118, 0.30);
--shadow-glow-down:   0 0 16px rgba(255, 61, 87, 0.30);

/* Transitions */
--transition-fast:   150ms ease;
--transition-base:   250ms ease;
--transition-slow:   400ms ease;
```

---

## 7. COMPONENT DESIGN SPECIFICATIONS

### 7.1 Navigation Bar

**Style:** Glassmorphic sticky navbar — transparent background with backdrop blur.
Becomes more opaque when user scrolls (JS scroll event adds `.scrolled` class).

**Structure:**
```
[LOGO]  [Nav Links]                    [Portfolio Link + CTA]
MicroVest  Stocks | Portfolio | Learn       [View Portfolio →]
```

**Visual Spec:**
- Position: `sticky` `top: 0` `z-index: 1000`
- Background: `rgba(8, 12, 20, 0.70)` + `backdrop-filter: blur(20px)`
- Bottom border: `1px solid rgba(0, 212, 255, 0.10)`
- Height: `64px`
- `.scrolled` class adds: `background: rgba(8, 12, 20, 0.92)` and `box-shadow: 0 4px 24px rgba(0,0,0,0.4)`
- Logo: "M·V" monogram in `--font-display` weight 800 + "MicroVest" in regular — cyan gradient text
- Nav links: `--font-body` weight 500, `--text-secondary` color, hover → `--accent-cyan` with underline slide animation
- **Active page** link has `--accent-cyan` color + a small 2px cyan dot below it
- CTA button "View Portfolio": small, filled with `--brand-gradient`, `--radius-full`, `14px`
- Mobile: hamburger icon (pure CSS animated bars → X) with dropdown slide menu

**Nav Active State CSS Trick:**
Each HTML page adds a class on `<body>`: `<body class="page-stocks">`, `<body class="page-portfolio">` etc. The CSS selects the right nav link automatically.

---

### 7.2 Stock Cards

**Layout:** CSS Grid container. 3 columns on desktop, 2 on tablet, 1 on mobile.

**Card Visual Spec:**
- Background: `var(--glass-bg)` with `backdrop-filter: var(--glass-blur)`
- Border: `1px solid var(--glass-border)`
- Border-radius: `var(--radius-xl)` = 28px
- Padding: `var(--space-6)` = 24px
- Hover: `translateY(-4px)` + `box-shadow: var(--shadow-glow-cyan)` — card lifts up
- Transition: `var(--transition-base)` on all properties

**Card Content Layout (top to bottom):**

```
┌─────────────────────────────────────────┐
│ [AAPL]  Apple Inc.         [● LOW RISK] │  ← Row 1: ticker + name + risk badge
│                         [Technology]    │  ← Row 2: sector badge (right aligned)
│ ─────────────────────────────────────── │
│ $182.50                      ▲ +0.66%  │  ← Row 3: price (mono) + change %
│ +$1.20 today                            │  ← Row 4: abs change
│ ─────────────────────────────────────── │
│ 52-Week Range                           │  ← Row 5: 52W label
│ $164.08 ━━━━━━●━━━━━━━━━━━ $199.62     │  ← Row 6: range bar (custom CSS)
│ ─────────────────────────────────────── │
│           [Buy Fraction →]              │  ← Row 7: CTA button
└─────────────────────────────────────────┘
```

**Price Flash Animation:**
When price updates (every 2s), JS adds class `.price-up` or `.price-down`:
- `.price-up` → card border flashes `var(--up-strong)` glow for 0.5s, then fades
- `.price-down` → card border flashes `var(--down-strong)` glow for 0.5s, then fades
- Price number itself background flashes subtly (up-muted or down-muted)

**52-Week Range Bar:**
```
$164.08 [━━━━━━●━━━━━━━━━━━━] $199.62
```
The dot position = `((current_price - low_52w) / (high_52w - low_52w)) * 100%`
Built with a `<div class="range-track">` + `<div class="range-thumb">` positioned absolutely.
The track is `--bg-border`. The portion below thumb is `--accent-cyan`.

**Ticker Styling:**
- Font: `var(--font-display)` size `var(--text-2xl)` weight 800
- Color: `--accent-cyan`
- Letter spacing: `0.05em`

---

### 7.3 Buttons

Three variants — all defined in `components.css`:

**Primary Button (filled gradient):**
```css
.btn-primary {
  background: var(--brand-gradient);
  color: var(--text-inverse);
  font-family: var(--font-body);
  font-weight: 500;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-full);
  border: none;
  cursor: pointer;
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}
.btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0); }
```

**Secondary Button (outlined):**
```css
.btn-secondary {
  background: transparent;
  color: var(--accent-cyan);
  border: 1px solid var(--accent-cyan);
  /* Same padding/radius as primary */
}
.btn-secondary:hover {
  background: rgba(0, 212, 255, 0.08);
}
```

**Ghost Button (filter toggles):**
```css
.btn-ghost {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--bg-border);
}
.btn-ghost.active {
  background: rgba(0, 212, 255, 0.12);
  color: var(--accent-cyan);
  border-color: rgba(0, 212, 255, 0.40);
}
```

---

### 7.4 Badges & Tags

**Risk Badge:**
```
● Low Risk    (green dot + green text on green-tinted bg)
● Medium Risk (amber dot + amber text on amber-tinted bg)
● High Risk   (red dot + red text on red-tinted bg)
```
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 3px 10px;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.badge--low    { color: var(--risk-low);    background: var(--risk-low-bg);    }
.badge--medium { color: var(--risk-medium); background: var(--risk-medium-bg); }
.badge--high   { color: var(--risk-high);   background: var(--risk-high-bg);   }
```

The `●` dot is a `::before` pseudo-element — not a character typed in HTML.

**Sector Tag:** Smaller, same pattern but uses `--accent-violet` tint. Examples: Technology, Finance, E-Commerce.

---

### 7.5 Buy Fraction Modal / Calculator

Clicking "Buy Fraction →" on any card opens an inline panel that slides down within the card (NOT a full-screen overlay — keeps context). The panel expands using CSS `max-height` transition from 0 to auto.

**Calculator Panel Layout:**
```
┌─────────────────────────────────────┐
│  Buy Fractional AAPL                │
│  Current price: $182.50             │
│                                     │
│  💵 I want to invest                │
│  ┌──────────────────────────────┐   │
│  │ $  [25.00            ] [MAX] │   │
│  └──────────────────────────────┘   │
│                                     │
│  You will receive:                  │
│  0.1370 shares of AAPL             │
│                                     │
│  Platform fee (0.5%): $0.13         │
│  Round-up label: "Invest $25.00"    │
│                                     │
│  [Cancel]        [Confirm Purchase] │
└─────────────────────────────────────┘
```

**JS Calculation on every keystroke (input event):**
```javascript
fraction   = investAmount / currentPrice;
fee        = investAmount * 0.005;
roundedAmt = Math.round(investAmount * 100) / 100;
```

**HTML5 Validation:**
```html
<input type="number" min="1" max="10000" step="0.01"
       required placeholder="Enter amount in $">
```
Error shown using CSS `input:invalid` styles — red border, error message via `::after`.

"Confirm Purchase" writes to `localStorage` and updates the portfolio page.

---

### 7.6 Portfolio Chart (Pure CSS — No Canvas, No Library)

This is the **most impressive CSS feature** of the project.

**Type:** Horizontal stacked/individual bar chart showing portfolio allocation.

**Each row:**
```
AAPL  ████████████████░░░░░░░░  34.2%  $342.00
NVDA  ████████░░░░░░░░░░░░░░░░  18.7%  $187.00
TSLA  █████░░░░░░░░░░░░░░░░░░░  12.1%  $121.00
```

**CSS Implementation:**
```css
.chart-bar-fill {
  height: 100%;
  width: var(--bar-width);   /* Set by JS: style="--bar-width: 34.2%" */
  background: var(--brand-gradient);
  border-radius: var(--radius-sm);
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); /* Spring animation */
}
```

JS sets `--bar-width` as a CSS custom property on each bar. When portfolio values change (price tick), bars animate to their new widths automatically. This is a clever use of CSS Custom Properties + transitions.

**Summary Cards (top of portfolio page):**
```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Total Value      │ │ Total Invested   │ │ Total Gain/Loss  │ │ Holdings         │
│ $1,024.50        │ │ $950.00          │ │ +$74.50 (+7.84%) │ │ 5 stocks         │
│ (mono font)      │ │                  │ │ (green)          │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```
Flexbox row, each is a glass card, total value uses `var(--text-5xl)` = 48px.

---

### 7.7 Holdings Table (portfolio.html)

```
┌────────┬─────────┬───────────┬───────────┬──────────┬──────────┬──────────┐
│ Stock  │ Shares  │ Avg Buy   │ Curr Price│ Value    │ Gain/Loss│ Action   │
├────────┼─────────┼───────────┼───────────┼──────────┼──────────┼──────────┤
│ AAPL   │ 0.1370  │ $182.50   │ $184.20   │ $25.24   │ +$0.23   │ [Remove] │
│ NVDA   │ 0.0571  │ $875.00   │ $881.30   │ $50.32   │ +$0.36   │ [Remove] │
└────────┴─────────┴───────────┴───────────┴──────────┴──────────┴──────────┘
```

- All number columns: `font-family: var(--font-mono)`
- Gain/Loss column: green if positive, red if negative (JS adds class `.gain` or `.loss`)
- Table uses `<thead>`, `<tbody>`, `<th scope="col">` — semantic HTML5
- Zebra striping via `tbody tr:nth-child(even)` selector
- Hover row highlight via `tbody tr:hover`
- Remove button: `btn-ghost` small, on click removes from localStorage and re-renders

---

### 7.8 Accordion (Glossary in education.html)

15 terms in the glossary (e.g., "What is a Fraction?", "What is 52-Week High?", "What is Volatility?")

**HTML Structure:**
```html
<div class="accordion">
  <div class="accordion-item">
    <button class="accordion-trigger" aria-expanded="false">
      What is a Fractional Share?
      <span class="accordion-icon">+</span>
    </button>
    <div class="accordion-content" aria-hidden="true">
      <p>A fractional share is a portion of one full share...</p>
    </div>
  </div>
</div>
```

**CSS:** `accordion-content` has `max-height: 0; overflow: hidden; transition: max-height 0.35s ease`
**JS:** Toggles `aria-expanded`, sets `max-height` to `scrollHeight` (or 0), rotates icon `+` → `×`
**A11y:** Uses `aria-expanded` and `aria-hidden` — shows knowledge of accessibility.

---

### 7.9 Quiz Component (education.html)

5 multiple-choice questions. Pure JS, no form submission.

**Flow:**
1. Question displayed with 4 options (A, B, C, D) as buttons
2. User clicks answer → immediate feedback (correct = green glow, wrong = red glow + show correct)
3. "Next Question →" button appears
4. After Q5 → Score screen: "You scored 4/5 — Great investor mindset! 🎉"
5. "Retake Quiz" resets state

**JS State:**
```javascript
const quizState = {
  currentQuestion: 0,
  score: 0,
  answered: false
};
```

---

## 8. ANIMATION & MOTION SYSTEM

All animations defined in `base.css` or relevant page CSS.

| Animation | What it does | Type | Duration |
|-----------|-------------|------|---------|
| `aurora-shift` | Background gradient slowly drifts | `@keyframes` | 12s infinite |
| `price-flash-up` | Card border glows green on price up | `@keyframes` | 0.5s |
| `price-flash-down` | Card border glows red on price down | `@keyframes` | 0.5s |
| `card-enter` | Stock cards fade+slide in on load | `@keyframes` | 0.4s staggered |
| `bar-fill` | Portfolio bars animate to width | CSS transition | 0.6s spring |
| `accordion-open` | Accordion max-height transition | CSS transition | 0.35s ease |
| `nav-underline` | Nav link underline slides in | CSS transition | 0.2s ease |
| `card-lift` | Card translateY(-4px) on hover | CSS transition | 0.25s ease |
| `btn-press` | Button scale(0.97) on active | CSS transition | 0.1s |
| `ticker-pulse` | Price number background flash | `@keyframes` | 0.5s |

**Performance rules:**
- Only animate `transform`, `opacity`, and CSS custom properties (GPU-accelerated)
- Never animate `width`, `height`, `top`, `left` directly (causes reflow)
- Exception: `max-height` in accordion is acceptable for this project scale

---

## 9. RESPONSIVE BREAKPOINTS

```css
/* Mobile first approach — base styles target mobile */

/* Tablet */
@media (min-width: 640px) {
  /* Stock grid: 2 columns */
  /* Nav: show links */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Stock grid: 3 columns */
  /* Portfolio: sidebar layout */
}

/* Wide */
@media (min-width: 1280px) {
  /* Max content width: 1200px centered */
}
```

**Mobile nav:** Hamburger icon (3 lines → X animated purely in CSS using transform). Menu slides down as full-width panel.

---

## 10. FILE ARCHITECTURE

```
microvest/
│
├── index.html               ← Redirect to stocks.html (optional, nice touch)
├── stocks.html              ← Page 1
├── portfolio.html           ← Page 2
├── education.html           ← Page 3
│
├── css/
│   ├── variables.css        ← ALL design tokens (colors, fonts, spacing, shadows)
│   ├── base.css             ← CSS reset, body, typography, nav, footer, aurora bg
│   ├── components.css       ← Buttons, badges, glass cards, accordion, modal panel
│   ├── stocks.css           ← Stock grid, filter bar, price display, range bar
│   ├── portfolio.css        ← Summary cards, chart bars, holdings table
│   └── education.css        ← Module cards, glossary, quiz, hero section
│
└── js/
    ├── data.js              ← CONST STOCKS array — single source of truth
    ├── simulator.js         ← PriceSimulator class + price history
    ├── stocks.js            ← renderStocks(), filterByRisk(), sortStocks(), buyCalculator()
    ├── portfolio.js         ← loadPortfolio(), renderChart(), calculateTotals(), renderTable()
    └── education.js        ← initAccordion(), initQuiz(), quizState management
```

**CSS Load Order in every HTML file:**
```html
<link rel="stylesheet" href="css/variables.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/[page-specific].css">
```

**JS Load Order in every HTML file (before `</body>`):**
```html
<script src="js/data.js"></script>
<script src="js/simulator.js"></script>
<script src="js/[page-specific].js"></script>
```

`data.js` first because every other file depends on `STOCKS`.
`simulator.js` second because stocks.js and portfolio.js both use `PriceSimulator`.

---

## 11. PAGE SPECIFICATIONS

### 11.1 stocks.html

**`<head>`:**
- `<meta charset="UTF-8">`
- `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- `<meta name="description" content="MicroVest - Buy fractional shares of top stocks starting from $1">`
- Google Fonts link
- CSS links (variables → base → components → stocks)
- `<title>MicroVest | Stocks</title>`

**`<body class="page-stocks">`:**

**`<header>` — Sticky Nav** (shared across all pages)

**`<main>`:**

Section 1 — Page Hero:
```html
<section class="page-hero">
  <h1>Today's <span class="gradient-text">Markets</span></h1>
  <p>Buy fractional shares starting from $1. No minimums.</p>
</section>
```

Section 2 — Filter Bar:
```html
<section class="filter-bar" aria-label="Stock filters">
  <div class="filter-search">
    <input type="search" id="stock-search" placeholder="Search ticker or company...">
  </div>
  <div class="filter-risk" role="group" aria-label="Filter by risk">
    <button class="btn-ghost active" data-risk="all">All</button>
    <button class="btn-ghost" data-risk="low">● Low</button>
    <button class="btn-ghost" data-risk="medium">● Medium</button>
    <button class="btn-ghost" data-risk="high">● High</button>
  </div>
  <div class="filter-sort">
    <select id="sort-select">
      <option value="default">Sort by...</option>
      <option value="price-asc">Price ↑</option>
      <option value="price-desc">Price ↓</option>
      <option value="change-desc">Top Gainers</option>
      <option value="change-asc">Top Losers</option>
      <option value="name-asc">Name A–Z</option>
    </select>
  </div>
</section>
```

Section 3 — Stock Grid:
```html
<section class="stocks-grid" id="stocks-grid" aria-label="Stock listings">
  <!-- Cards injected by stocks.js -->
</section>
```

Section 4 — Live indicator:
```html
<aside class="live-indicator" aria-live="polite">
  <span class="pulse-dot"></span> Live simulation — updates every 2s
</aside>
```

**`<footer>`:** Brief footer with "MicroVest is a simulated platform for educational purposes."

---

### 11.2 portfolio.html

**`<body class="page-portfolio">`:**

**`<main>`:**

Section 1 — Summary Cards Row (Flexbox, 4 cards):
```html
<section class="portfolio-summary" aria-label="Portfolio overview">
  <article class="summary-card" id="total-value">...</article>
  <article class="summary-card" id="total-invested">...</article>
  <article class="summary-card" id="total-gain">...</article>
  <article class="summary-card" id="holdings-count">...</article>
</section>
```

Section 2 — Allocation Chart:
```html
<section class="portfolio-chart" aria-label="Portfolio allocation">
  <h2>Allocation Breakdown</h2>
  <div class="chart-container" id="chart-container">
    <!-- Bars injected by portfolio.js -->
  </div>
</section>
```

Section 3 — Holdings Table:
```html
<section class="holdings-section" aria-label="Your holdings">
  <h2>Your Holdings</h2>
  <table class="holdings-table" id="holdings-table">
    <thead>
      <tr>
        <th scope="col">Stock</th>
        <th scope="col">Shares</th>
        <th scope="col">Avg. Buy</th>
        <th scope="col">Current</th>
        <th scope="col">Value</th>
        <th scope="col">Gain/Loss</th>
        <th scope="col">Action</th>
      </tr>
    </thead>
    <tbody id="holdings-tbody">
      <!-- Rows injected by portfolio.js -->
    </tbody>
  </table>
  <p class="empty-state" id="empty-portfolio" hidden>
    No holdings yet. <a href="stocks.html">Browse stocks →</a>
  </p>
</section>
```

---

### 11.3 education.html

**`<body class="page-education">`:**

**`<main>`:**

Section 1 — What is Fractional Investing? (3 icon cards, CSS Grid)

Section 2 — Risk Rating Guide (3 cards: Low / Medium / High with full descriptions)

Section 3 — How to Read a Stock Card (annotated diagram built with HTML/CSS)

Section 4 — Glossary Accordion (15 terms)

Section 5 — Test Your Knowledge Quiz (5 questions)

Section 6 — How Our Simulator Works (text with code snippet styling)

---

## 12. JAVASCRIPT ARCHITECTURE

### data.js — Stock Constants

```javascript
const STOCKS = [
  {
    ticker:    'AAPL',
    name:      'Apple Inc.',
    sector:    'Technology',
    basePrice:  182.50,
    price52wLow:  164.08,
    price52wHigh: 199.62,
    risk:      'low',
    volatility: 0.008,   // ← Controls how wildly price moves in simulator
  },
  // ... 9 more stocks
];

// Transaction fee rate
const FEE_RATE = 0.005; // 0.5%

// Simulation interval
const SIM_INTERVAL_MS = 2000; // 2 seconds
```

The `volatility` field (0.005 to 0.025) controls how much each stock moves. TSLA and NVDA have high volatility, BRK.B has low — mirrors reality and ties into risk ratings.

---

### simulator.js — PriceSimulator Class

```javascript
class PriceSimulator {
  #stocks;          // Private — array of stock objects with current prices
  #history;         // Private — Map(ticker → last 10 prices)
  #intervalId;      // Private — setInterval reference
  #callbacks;       // Private — registered subscriber functions

  constructor(stocksData) { ... }
  start() { ... }      // Begins setInterval
  stop()  { ... }      // Clears interval
  subscribe(fn) { ... } // Pages register a callback: fn(ticker, newPrice, changePercent)
  #tick() { ... }       // Private — called every 2s, updates all prices
  #calcNewPrice(stock) { ... } // Random walk algorithm
  getCurrentPrices() { ... }  // Returns Map of all current prices
  getPriceHistory(ticker) { ... }
}
```

**Private fields** (`#`) demonstrate modern JS encapsulation — great for viva.
**Observer pattern** (`subscribe`) means pages don't need to know about the simulator's internals.

---

### stocks.js

```javascript
// State
let currentFilter = 'all';
let currentSort   = 'default';
let searchQuery   = '';

// Init
document.addEventListener('DOMContentLoaded', () => {
  const sim = new PriceSimulator(STOCKS);
  renderStocks(STOCKS);
  sim.subscribe(onPriceUpdate);
  sim.start();
  initFilterButtons();
  initSortSelect();
  initSearch();
});

function renderStocks(stocks) { ... }      // Creates card HTML, appends to grid
function onPriceUpdate(ticker, price, pct) { ... } // DOM update + flash animation
function getFilteredSorted() { ... }       // Applies filter + sort + search
function openCalculator(ticker) { ... }    // Expands inline calculator panel
function calculateFraction(amount, price) { // Returns { shares, fee, total }
  return {
    shares: (amount / price).toFixed(4),
    fee:    (amount * FEE_RATE).toFixed(2),
    total:  amount.toFixed(2)
  };
}
function confirmPurchase(ticker, shares, amount) { ... } // Writes to localStorage
```

---

### portfolio.js

```javascript
function loadPortfolio() { ... }        // Reads localStorage, returns holdings array
function calculateTotals(holdings, prices) { ... } // Returns { totalValue, invested, gainLoss, pct }
function renderSummaryCards(totals) { ... }
function renderChart(holdings, prices) { ... }  // Sets CSS custom property --bar-width
function renderTable(holdings, prices) { ... }  // Builds table rows
function removeHolding(ticker) { ... }          // Deletes from localStorage, re-renders
```

---

### education.js

```javascript
function initAccordion() { ... }   // Queries all .accordion-trigger, adds click events
function toggleAccordion(btn) { ... } // Sets aria-expanded, max-height

const QUIZ_QUESTIONS = [
  {
    q: "What is a fractional share?",
    options: ["A", "B", "C", "D"],
    correct: 0
  },
  // 4 more...
];

const quizState = { current: 0, score: 0, answered: false };

function renderQuestion(index) { ... }
function handleAnswer(selectedIndex) { ... }
function showResults() { ... }
function resetQuiz() { ... }
```

---

## 13. HTML5 USAGE MAP

| HTML5 Feature | Used In | Syllabus Module |
|--------------|---------|----------------|
| `<header>`, `<nav>`, `<main>`, `<footer>` | All pages | HTML5 Semantics |
| `<section>`, `<article>`, `<aside>` | All pages | HTML5 Semantics |
| `<meta charset>`, `<meta viewport>`, `<meta description>` | All pages | HTML Meta Tags |
| `<input type="number" min max step>` | stocks.html calculator | HTML5 Forms |
| `<input type="search">` | stocks.html filter | HTML5 Forms |
| `<select>` + `<option>` | stocks.html sort | HTML5 Forms |
| HTML5 Form Validation (`required`, `min`, `pattern`) | Calculator | HTML5 Form Validation |
| `<table>`, `<thead>`, `<tbody>`, `<th scope>` | portfolio.html | HTML5 Tables |
| `<button aria-expanded>` | Accordion | HTML5 Semantics |
| `data-*` attributes (`data-ticker`, `data-risk`) | Cards, filters | HTML5 Semantics |
| `aria-label`, `aria-live`, `role` | Throughout | HTML Best Practices |
| Heading hierarchy h1→h2→h3 | All pages | HTML5 Lists and Headings |
| `<a href>` inter-page nav | Nav, links | Text and Links in HTML5 |
| `hidden` attribute | Empty state | HTML5 Fundamentals |

---

## 14. CSS3 USAGE MAP

| CSS3 Feature | Used In | Syllabus Topic |
|-------------|---------|---------------|
| CSS Custom Properties (variables) | variables.css — entire system | Modern CSS |
| `@import` / CSS file linking | Every HTML page | External Style Sheets |
| CSS Grid | Stock card grid, education modules | Grid |
| Flexbox | Nav, summary cards, chart rows, filter bar | Flexbox |
| `backdrop-filter: blur()` | Nav, all glass cards | Advanced CSS |
| `position: sticky` | Navbar | Positioning |
| `position: absolute` | Range bar thumb, badge dot | Positioning |
| Box model (margin/padding/border) | All cards | Box Model |
| Height & Width | Cards, bars | Height & Width |
| `@keyframes aurora-shift` | Background animation | Keyframe Animation |
| `@keyframes price-flash` | Price update flash | Keyframe Animation |
| CSS Transitions | Hover, accordion, bar chart | Transitions |
| `transform: translateY, scale` | Card hover, btn active | 2D Transform |
| `@media (min-width: ...)` | Responsive layouts | Media Queries |
| CSS combinators (`.card > .price`) | Component scoping | Combinators |
| `::before`, `::after` | Badge dot, underline animation | (Advanced CSS) |
| `:hover`, `:focus`, `:active` | All interactive elements | CSS Styling |
| `nth-child(even)` | Table zebra stripe | CSS ID and Class |
| `calc()` | Layout math, dynamic widths | CSS Units |
| CSS Custom Property as JS bridge | Chart bar widths | Modern CSS |
| Background gradient | Aurora, gradient text, buttons | Background Styling |
| `font-family`, `font-size`, `font-weight` | Typography system | Text Formatting |
| Working with Fonts | Google Fonts import | Working with Fonts |
| `display: grid` / `display: flex` | Layouts | Display Property |
| Float | NOT used (Grid/Flex preferred) | — |

---

## 15. JAVASCRIPT USAGE MAP

| JS Feature | Used In | Syllabus Module |
|-----------|---------|----------------|
| `class` keyword | `PriceSimulator`, `Portfolio` | Classes |
| Private fields (`#field`) | simulator.js | OOP Concepts (Encapsulation) |
| `extends` | `Stock extends BaseAsset` | OOP (Inheritance) |
| Prototype methods | Manual prototype demo in education | Prototypes |
| Constructor function | Object creation | Object Creation |
| `setInterval` / `clearInterval` | simulator.js `start()`/`stop()` | (Functions) |
| Closures | Price history inside class scope | Advanced Functions |
| Anonymous functions | All event callbacks | Function Types |
| Arrow functions | Array methods, callbacks | Function Types |
| `const` / `let` (scope) | Throughout | Variables, Scope |
| `Array.filter()` | Risk filter, search | Array Methods |
| `Array.map()` | Render stock cards | Array Methods |
| `Array.reduce()` | Portfolio total calculation | Array Methods |
| `Array.sort()` | Sort stocks | Array Methods |
| Template literals | HTML generation | Basic Syntax |
| Destructuring | `const { ticker, price } = stock` | Modern JS |
| Spread operator | State copying | Modern JS |
| `document.querySelector` / `querySelectorAll` | DOM selection | DOM Manipulation |
| `element.innerHTML` / `textContent` | DOM updates | DOM Manipulation |
| `element.classList.add/remove/toggle` | Price flash, accordion | DOM Manipulation |
| `addEventListener` | All UI interactions | Event Handling |
| Event delegation | Filter buttons | Advanced Concepts (Event Bubbling) |
| `localStorage.setItem/getItem/removeItem` | Portfolio persistence | (APIs) |
| `JSON.stringify` / `JSON.parse` | Serialise portfolio | (Data) |
| `Math.random()`, `Math.round()` | Simulator, calculator | Expressions & Operators |
| Form `input` event | Live calculator | Form Handling |
| `input.validity` / `setCustomValidity` | Validation | Form Handling |
| Conditional (`if/else`, ternary) | Risk colors, gain/loss | Control Structures |
| `for...of` loop | Render loops | Control Structures |
| `DOMContentLoaded` | Page init | DOM |
| `data-*` attribute access | `dataset.ticker`, `dataset.risk` | DOM |
| Hoisting awareness | All `const`/`let` declarations | Advanced Concepts |
| `scrollY` scroll event | Nav glass effect | Event Handling |

---

## 16. BUILD ORDER

```
PHASE 1 — FOUNDATION
────────────────────
□ 1. data.js          → Define STOCKS array, FEE_RATE, SIM_INTERVAL_MS
□ 2. variables.css    → All design tokens (colors, fonts, spacing, shadows)
□ 3. base.css         → Reset, body, aurora background, typography rules, nav, footer

PHASE 2 — SHARED COMPONENTS
─────────────────────────────
□ 4. components.css   → .btn-*, .badge-*, .glass-card, accordion, modal panel
□ 5. simulator.js     → PriceSimulator class (full implementation + test in console)

PHASE 3 — PAGE 1 (stocks)
──────────────────────────
□ 6. stocks.html      → Full semantic HTML structure (no styling yet)
□ 7. stocks.css       → Stock grid, filter bar, card styles, range bar
□ 8. stocks.js        → renderStocks, filters, simulator subscribe, buy calculator

PHASE 4 — PAGE 2 (portfolio)
──────────────────────────────
□ 9.  portfolio.html  → Full semantic HTML structure
□ 10. portfolio.css   → Summary cards, chart bars, holdings table
□ 11. portfolio.js    → loadPortfolio, calculateTotals, renderChart, renderTable

PHASE 5 — PAGE 3 (education)
──────────────────────────────
□ 12. education.html  → Full semantic HTML structure
□ 13. education.css   → Module cards, glossary, quiz styles
□ 14. education.js    → initAccordion, initQuiz, quizState

PHASE 6 — POLISH
─────────────────
□ 15. Responsive testing (1280 → 1024 → 768 → 375)
□ 16. Cross-page navigation testing
□ 17. localStorage portfolio persistence testing
□ 18. Price simulation visual testing (30 seconds running)
□ 19. Form validation testing
□ 20. All 4 required features final check
```

---

## 17. VIVA DEFENCE GUIDE

For every line of code, you must be able to answer "why". Here are the expected viva questions:

**Q: Why did you use a class for the PriceSimulator?**
A: To encapsulate all simulation logic — the interval, price history, and callbacks — into one object. Private fields (`#`) prevent external code from breaking internal state. This is OOP encapsulation.

**Q: What is the difference between `let` and `const`?**
A: `const` is for values that won't be reassigned (objects, arrays, DOM references). `let` is for values that change (counters, state flags). Both are block-scoped, unlike `var`.

**Q: How does your price simulation work?**
A: `setInterval` calls `#tick()` every 2 seconds. Each tick generates a new price using a simplified random walk: `newPrice = currentPrice * (1 + volatility * (Math.random() - 0.5) * 2)`. Higher `volatility` value = bigger swings = higher risk stocks.

**Q: What is localStorage and why did you use it?**
A: localStorage is a browser key-value store that persists data even after the tab closes. We use it to save the portfolio so purchases on stocks.html are visible on portfolio.html.

**Q: How does your CSS chart work without a library?**
A: Each bar has a CSS custom property `--bar-width` set by JavaScript. The CSS rule `width: var(--bar-width)` reads this. When JS updates the property, the transition animates the bar smoothly. No canvas, no SVG, no library needed.

**Q: What is event delegation?**
A: Instead of adding a click listener to each filter button separately, we add one listener to the parent `.filter-risk` container and check `event.target.dataset.risk`. This is more efficient and demonstrates understanding of event bubbling.

**Q: How is Flexbox different from Grid?**
A: Flexbox is one-dimensional (either row OR column). Grid is two-dimensional (rows AND columns simultaneously). We use Flexbox for nav and summary cards (single-row layouts) and Grid for the stock cards (2D grid).

**Q: What are semantic HTML tags and why do they matter?**
A: Tags like `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` describe the meaning of content, not just its appearance. They help screen readers (accessibility), search engine crawlers (SEO), and make code maintainable.

**Q: What is the box model?**
A: Every HTML element is a rectangular box. From inside out: content → padding → border → margin. We use `box-sizing: border-box` (in base.css reset) so that padding and border are included in the element's declared width, not added on top.

**Q: What is a CSS custom property (variable)?**
A: A variable defined in `:root { --name: value }` that can be used anywhere with `var(--name)`. Changing it in one place updates every element using it. Our entire design system lives in `variables.css`.

---

*PDR v2.0 — Complete. Ready to Build.*
