# MicroVest

**A Fractional Stock Investment Simulation Platform**

MicroVest is a fully browser-based web application that simulates fractional stock investing in the Indian equity market. Built entirely with pure HTML5, CSS3, and Vanilla JavaScript — no frameworks, no libraries, no build tools — it lets any student explore the stock market with zero financial risk.

> 📄 **Case Study Report & Presentation** are in the [`Documentations/`](./Documentations/) folder.

---

## Table of Contents

1. [What is MicroVest?](#what-is-microvest)
2. [Pages & Features](#pages--features)
3. [Project Architecture](#project-architecture)
4. [File & Folder Structure](#file--folder-structure)
5. [How the Simulation Works](#how-the-simulation-works)
6. [JavaScript — How It All Works](#javascript--how-it-all-works)
7. [CSS Architecture](#css-architecture)
8. [The 10 Simulated Stocks](#the-10-simulated-stocks)
9. [Data Flow — End to End](#data-flow--end-to-end)
10. [Design System](#design-system)
11. [Running the Project](#running-the-project)

---

## What is MicroVest?

Most students understand what a stock is in theory but have never actually bought one. Real Indian blue-chip shares — TCS at ₹3,940, Reliance at ₹2,850 — are financially out of reach for a learner. MicroVest solves this with **fractional investing**: invest as little as ₹10 and receive a proportional fraction of a share. If TCS rises 2%, your ₹10 grows to ₹10.20 — exactly the same percentage return as a full shareholder.

All prices are driven by a **Geometric Brownian Motion (GBM) simulation** running in JavaScript — the same mathematical model used in professional quantitative finance. Prices update every 2 seconds across all 10 stocks simultaneously, giving the user a realistic, visceral feel of live market behaviour without any real money at stake.

---

## Pages & Features

| Page          | File             | What it does                                                                                                     |
| ------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Landing**   | `index.html`     | Hero, how-it-works section, simulated live ticker strip, featured stock cards                                    |
| **Market**    | `stocks.html`    | Browse all 10 stocks, filter by risk, sort, search, view sparkline charts, open modal to invest                  |
| **Portfolio** | `portfolio.html` | Holdings table, summary stats (total value, invested, gain/loss), allocation chart, value trend chart            |
| **Education** | `education.html` | Fractional investing concepts, risk level guide, stock card anatomy, 15-term glossary accordion, 5-question quiz |

**Cross-cutting features across all pages:**

- ☀️ / 🌙 Dark / Light theme toggle — persisted in `localStorage`
- Fully responsive layout across 5 breakpoints (375px → 1280px+)
- Animated glassmorphism cards with the _Deep Space Finance_ visual design
- Accessible — semantic HTML5 landmarks, ARIA attributes, keyboard navigable

---

## Project Architecture

MicroVest is built around **Separation of Concerns** — each file has exactly one responsibility.

```
Browser
│
├── HTML Layer (structure)         4 pages
│   index.html / stocks.html / portfolio.html / education.html
│
├── CSS Layer (presentation)       7 files, strict cascade order
│   variables.css → base.css → components.css → [page].css
│
└── JS Layer (behaviour)           6 files, no shared global state
    data.js → simulator.js → [page].js
```

**Key architectural decisions:**

- **Zero external runtime dependencies** — no React, Vue, Bootstrap, jQuery, Chart.js (except the sparklines on `stocks.js` which use Chart.js for smooth canvas rendering), no Webpack
- **Zero inline styles** — every style lives in CSS files
- **Zero `<style>` tags** in HTML — complete separation
- **CSS custom properties** as the single source of truth for the entire design system
- **localStorage** for all state persistence — portfolio, theme preference, purchase log

---

## File & Folder Structure

```
MicroVest/
│
├── index.html              Landing page
├── stocks.html             Market / trading page
├── portfolio.html          Portfolio tracker
├── education.html          Learning module
│
├── css/
│   ├── variables.css       Design tokens — ALL colours, fonts, spacing, radii
│   ├── base.css            Global reset, aurora background, navbar, @keyframes
│   ├── components.css      Reusable components — glass card, buttons, badges, accordion
│   ├── landing.css         Landing page layout only
│   ├── stocks.css          Stocks grid, stock cards, modal, filter bar
│   ├── portfolio.css       Summary cards, allocation bars, holdings table
│   └── education.css       Concept cards, quiz, glossary
│
├── js/
│   ├── data.js             STOCKS array (10 stocks) + FEE_RATE + SIM_INTERVAL_MS constants
│   ├── simulator.js        PriceSimulator class — GBM engine, Observer pattern
│   ├── landing.js          Hero ticker animation, theme toggle, navbar scroll
│   ├── stocks.js           Filter/sort/search, stock cards, modal, calculator, purchases
│   ├── portfolio.js        Holdings render, totals calculation, trend chart
│   └── education.js        Accordion state machine, quiz state machine, glossary
│
└── Documentations/
    ├── microvestReportFinal.docx      Full case study report
    ├── MicroVest_Case_Study_Report.docx
    ├── MicroVest_Case_Study_Report.html
    └── Sample Report.pdf
```

---

## How the Simulation Works

### Geometric Brownian Motion (GBM)

GBM is the industry-standard mathematical model for simulating stock price behaviour. It captures two key properties of real markets:

1. **Randomness** — prices can move up or down unpredictably
2. **Proportionality** — larger price changes are more likely for high-volatility stocks

The core formula used in `simulator.js`:

```javascript
#calcNewPrice(stock) {
  const change = stock.volatility * (Math.random() - 0.5) * 0.3;
  const newPrice = stock.price * (1 + change);
  const floor   = stock.basePrice * 0.6;   // max 40% drop from base
  const ceiling = stock.basePrice * 1.6;   // max 60% rise from base
  return Math.min(Math.max(newPrice, floor), ceiling);
}
```

Breaking this down:

| Part                         | What it does                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------- |
| `Math.random() - 0.5`        | Random number in `[-0.5, +0.5]` — equal chance of up or down                     |
| `× stock.volatility`         | Scales by the stock's individual volatility parameter                            |
| `× 0.3`                      | Global dampening factor — keeps movements realistic per 2-second tick            |
| `stock.price × (1 + change)` | Applies the percentage change proportionally to current price                    |
| `floor` / `ceiling` guard    | Clamps price to ±60% of base — prevents unlimited random drift in a long session |

**Volatility parameters** are individually calibrated per stock to reflect their real-world NSE behaviour:

| Stock      | Volatility | Risk Level | Notes                                        |
| ---------- | ---------- | ---------- | -------------------------------------------- |
| HDFCBANK   | 0.005      | Low        | Stable large-cap banking stock               |
| RELIANCE   | 0.006      | Low        | Diversified conglomerate, relatively stable  |
| TCS        | 0.007      | Low        | Large-cap IT, consistent earnings            |
| INFY       | 0.010      | Medium     | Mid-tier IT, more reactive to earnings       |
| ICICIBANK  | 0.011      | Medium     | Private bank, slightly more volatile         |
| WIPRO      | 0.012      | Medium     | IT, more volatile than TCS/INFY              |
| BAJFINANCE | 0.013      | Medium     | NBFC, reacts to rate changes                 |
| TATAMOTORS | 0.016      | High       | Auto sector, cyclical volatility             |
| SUNPHARMA  | 0.018      | High       | Pharma, regulatory risk                      |
| ADANIENT   | 0.024      | High       | Highest volatility — aggressive price swings |

### The Simulation Loop

```
setInterval fires every 2000ms (SIM_INTERVAL_MS)
        │
        ▼
PriceSimulator.#tick() runs for all 10 stocks
        │
        ├── #calcNewPrice(stock) → new price via GBM formula
        ├── history.push(newPrice) — keeps last 60 prices for charts
        └── callbacks.forEach(fn) → notifies all subscribers
                │
                ├── stocks.js → updates card price, change %, sparkline, flash animation
                ├── portfolio.js → recalculates all holdings value + redraws charts
                └── landing.js (hero ticker) → independent mini-simulation
```

---

## JavaScript — How It All Works

### `data.js` — The Single Source of Truth

Contains the `STOCKS` array (10 objects, each with `ticker`, `name`, `sector`, `basePrice`, `price52wLow`, `price52wHigh`, `risk`, `volatility`) and two constants:

```javascript
const FEE_RATE = 0.005; // 0.5% platform fee on every purchase
const SIM_INTERVAL_MS = 2000; // Price update interval in milliseconds
```

This file is loaded first on `stocks.html` and `portfolio.html` — it has no dependencies and knows nothing about any page.

---

### `simulator.js` — The Engine

`PriceSimulator` is an ES2022 class with **true private fields** (prefixed `#`) — they are syntactically enforced to be inaccessible from outside the class:

```javascript
class PriceSimulator {
  #stocks; // Array of live stock objects (copy of STOCKS + current price)
  #history; // Map<ticker → price[]> — last 60 prices per stock
  #intervalId; // Return value of setInterval, needed to cancel
  #callbacks; // Array of subscriber functions registered by pages
}
```

**Public API** (minimal by design):

| Method                    | What it does                                                                   |
| ------------------------- | ------------------------------------------------------------------------------ |
| `start()`                 | Starts the `setInterval` simulation loop                                       |
| `stop()`                  | Cancels the interval (`clearInterval`) — prevents memory leaks                 |
| `subscribe(fn)`           | Registers a callback `fn(ticker, price, changePct)`                            |
| `getCurrentPrices()`      | Returns a `Map<ticker → currentPrice>` snapshot                                |
| `getStock(ticker)`        | Returns a **spread copy** `{ ...stock }` — never a reference to internal state |
| `getPriceHistory(ticker)` | Returns the price history array for sparkline rendering                        |

`getStock()` returns a copy, not a reference — so external code cannot mutate `#stocks` by writing `sim.getStock("TCS").price = 9999`.

---

### Observer Pattern — `subscribe()`

MicroVest uses the **Observer design pattern** for decoupled event propagation:

```
PriceSimulator (Subject / Publisher)
       │
       │  sim.subscribe(onPriceUpdate)     ← stocks.js registers its handler
       │  sim.subscribe(onPriceUpdate)     ← portfolio.js registers its handler
       │
       ▼  every 2 seconds:
  #callbacks.forEach(fn => fn(ticker, price, pct))
       │
       ├──► stocks.js: updates card DOM, flashes animation, redraws sparkline
       └──► portfolio.js: recalculates totals, redraws trend chart
```

`PriceSimulator` knows nothing about which page it's on or what the callbacks do. Adding a new page only requires calling `sim.subscribe()` — the simulator itself never changes. This mirrors exactly how `addEventListener` works in the browser.

---

### `stocks.js` — Market Page

Responsibilities:

- **Render engine** — `renderStocks(stocks)` builds all 10 stock card HTML strings via `Array.map()` and injects them into the grid in one `innerHTML` assignment
- **Filter / Sort / Search** — `applyFiltersAndRender()` is the single entry point. It chains `Array.filter()` (by risk + search query) → `Array.sort()` (by the selected criterion) → `renderStocks()`
- **Debounced search** — `input` events are debounced by 200ms using `clearTimeout / setTimeout` to avoid re-rendering on every keystroke
- **Modal** — clicking a stock card opens a 3D-flip modal (`CSS perspective + rotateY`) showing a Chart.js price chart on the front and the investment calculator on the back
- **Calculator** — `calculateFraction(amount, price)` computes shares and fee in real time as the user types:

```javascript
function calculateFraction(amount, price) {
  const fee = amount * FEE_RATE; // 0.5%
  const investable = amount - fee;
  const shares = investable / price; // fractional shares
  return { shares, fee };
}
```

- **Purchase** — `confirmPurchaseModal()` reads the portfolio from `localStorage`, finds or creates a holding entry, applies the **weighted average merge**:

```javascript
// Merging an additional purchase into an existing holding
const totalShares = existing.shares + newShares;
const totalCost = existing.avgBuy * existing.shares + (amount - fee);
existing.avgBuy = totalCost / totalShares; // weighted average
```

Then saves back to `localStorage.setItem('portfolio', JSON.stringify(portfolio))`.

- **Sparklines** — rendered using Chart.js (type `'line'`, `pointRadius: 0`, `tension: 0.4`) for smooth canvas curves. Each sparkline instance is tracked in `sparklineCharts{}` Map and destroyed on re-render to prevent canvas memory leaks.

- **Number animation** — `animateValue()` uses `requestAnimationFrame` with an **ease-out cubic** easing function to smoothly tween displayed numbers between old and new values over 800ms.

---

### `portfolio.js` — Portfolio Page

Responsibilities:

- **Load holdings** from `localStorage` on every render cycle
- **Calculate totals** with a single `Array.reduce()` pass:

```javascript
const result = holdings.reduce(
  (acc, h) => {
    const currentValue = (prices.get(h.ticker) ?? h.avgBuy) * h.shares;
    acc.totalValue += currentValue;
    acc.invested += h.invested;
    acc.gainLoss += currentValue - h.invested;
    acc.count += 1;
    return acc;
  },
  { totalValue: 0, invested: 0, gainLoss: 0, gainPct: 0, count: 0 },
);

// Computed AFTER reduce — requires fully accumulated totals
result.gainPct =
  result.invested > 0 ? (result.gainLoss / result.invested) * 100 : 0;
```

- **Throttled rendering** — a `renderPending` flag prevents the DOM from being updated more than once per event loop tick even when 10 price updates arrive simultaneously
- **Allocation bars** — each bar's width is set via a per-element CSS custom property:

```javascript
bar.style.setProperty("--bar-width", pct + "%");
// CSS:  width: var(--bar-width);  transition: width 0.6s ease;
```

- **Value trend chart** — records `portfolioValueHistory[]` snapshots every 2 seconds and renders a Chart.js area chart showing portfolio value vs. invested amount over time
- **Purchase log replay** — `mv-purchase-log` in `localStorage` stores each purchase's total invested amount so the "invested" staircase line on the trend chart reflects the actual purchase history even after a page reload

---

### `education.js` — Education Page

**Accordion state machine** — only one term can be open at a time. On each click:

1. Close all other panels (`maxHeight = '0'`, `aria-expanded = 'false'`)
2. Toggle the clicked panel (`maxHeight = scrollHeight + 'px'`, `aria-expanded = 'true'`)

The `scrollHeight` trick: `maxHeight: 0 → scrollHeight` with a CSS `transition` creates a smooth expand/collapse without needing to know the content height in advance.

**Quiz state machine** — tracks `currentQuestion`, `score`, and `answered` state. Clicking an answer:

- Locks all other options (disabled)
- Applies `.correct` or `.incorrect` CSS classes
- Auto-advances to the next question after 1.2 seconds
- On completion, shows a score screen with a pass/fail message

---

### `landing.js` — Landing Page

The hero ticker uses a **self-contained mini price simulation** (not the full `PriceSimulator` class) — the same GBM formula, running independently:

```javascript
const change = 0.006 * (Math.random() - 0.5) * 0.3;
const newPrice = currentPrice * (1 + change);
```

Runs `setInterval` every 2000ms, updates the displayed price, change percentage, SVG sparkline polyline `points` attribute, and triggers the border flash animation.

**`void card.offsetWidth`** — accessing `offsetWidth` forces the browser to perform a synchronous layout reflow. This is needed to re-trigger the CSS flash animation: if you remove a class and immediately re-add it, the browser may batch the changes and see no state transition. The reflow flushes pending style changes, guaranteeing the animation always fires.

---

## CSS Architecture

7 CSS files load in a strict cascade order — each layer builds on the one below it:

```
1. variables.css   → :root { --token: value }          Specificity: 10 (pseudo-class)
2. base.css        → *, body, header, nav { ... }      Specificity: 0–1 (element)
3. components.css  → .glass-card, .btn { ... }         Specificity: 10–20 (class)
4. [page].css      → .stock-card:hover { ... }         Specificity: 20+ (compound class)
```

No `!important` is needed anywhere because the specificity hierarchy is designed upfront.

**Key CSS features used:**

| Feature                                                | Where                | Why                                                                         |
| ------------------------------------------------------ | -------------------- | --------------------------------------------------------------------------- |
| CSS Custom Properties (50+ tokens)                     | `variables.css`      | Single source of truth — change `--accent-primary` once, updates everywhere |
| `backdrop-filter: blur() saturate()`                   | `.glass-card`        | The defining glassmorphism property — frosted glass effect                  |
| `display: grid; grid-template-columns: repeat(3, 1fr)` | `.stocks-grid`       | 3-column responsive card grid                                               |
| `display: flex; justify-content: space-between`        | `.nav-container`     | Navbar layout                                                               |
| `position: sticky; top: 0`                             | `header`             | Navbar stays visible during scroll                                          |
| `position: fixed; inset: 0; z-index: -1`               | `.aurora-bg`         | Full-viewport aurora behind all content                                     |
| `@keyframes aurora-shift`                              | `base.css`           | 12s infinite gradient drift animation                                       |
| `@keyframes price-flash-up/down`                       | `stocks.css`         | 0.6s green/red border pulse on price tick                                   |
| `animation-delay: calc(var(--card-index) * 0.05s)`     | `.stock-card`        | Staggered 50ms-per-card entrance wave                                       |
| `cubic-bezier(0.34, 1.56, 0.64, 1)`                    | `.stock-card` hover  | Spring easing — card overshoots then settles                                |
| `clamp(2.5rem, 5vw, 4rem)`                             | `.hero-title`        | Fluid typography — scales between min/max                                   |
| `max-height: 0 → scrollHeight`                         | `.accordion-content` | Smooth expand/collapse without knowing height                               |
| `:root[data-theme='light']`                            | `variables.css`      | Full theme switch via one HTML attribute change                             |

---

## The 10 Simulated Stocks

All stocks are modelled on NSE-listed Indian equities with prices and volatility calibrated to approximate real-world behaviour.

| Ticker     | Company                   | Sector          | Base Price | Risk      |
| ---------- | ------------------------- | --------------- | ---------- | --------- |
| RELIANCE   | Reliance Industries       | Energy & Retail | ₹2,850     | 🟢 Low    |
| TCS        | Tata Consultancy Services | Technology      | ₹3,940     | 🟢 Low    |
| HDFCBANK   | HDFC Bank Ltd             | Banking         | ₹1,672     | 🟢 Low    |
| INFY       | Infosys Ltd               | Technology      | ₹1,555     | 🟡 Medium |
| ICICIBANK  | ICICI Bank Ltd            | Banking         | ₹1,198     | 🟡 Medium |
| WIPRO      | Wipro Ltd                 | Technology      | ₹462       | 🟡 Medium |
| BAJFINANCE | Bajaj Finance Ltd         | Finance         | ₹7,210     | 🟡 Medium |
| TATAMOTORS | Tata Motors Ltd           | Automotive      | ₹960       | 🔴 High   |
| SUNPHARMA  | Sun Pharma                | Pharmaceuticals | ₹1,720     | 🔴 High   |
| ADANIENT   | Adani Enterprises         | Conglomerate    | ₹2,490     | 🔴 High   |

**Platform fee:** 0.5% deducted from every purchase (`FEE_RATE = 0.005`). Minimum investment: ₹10.

---

## Data Flow — End to End

Here is the complete journey from a user clicking "Invest" to seeing their portfolio update:

```
User types ₹500 in the calculator (stocks.html)
        │
        ▼
updateCalcPreviewModal()
  → calculateFraction(500, currentPrice)
  → fee = 500 × 0.005 = ₹2.50
  → shares = (500 − 2.50) / currentPrice
  → Display: "0.1748 shares · Fee ₹2.50"
        │
User clicks "Confirm Purchase"
        │
        ▼
confirmPurchaseModal()
  → Load portfolio[] from localStorage
  → If ticker exists: weighted average merge
  → If new:          push new holding object
  → localStorage.setItem('portfolio', JSON.stringify(portfolio))
  → Append to mv-purchase-log (for trend chart history)
  → showToast("✅ Bought 0.1748 shares of Reliance...")
        │
        ▼  (user navigates to portfolio.html)
        │
document.addEventListener('DOMContentLoaded')
  → sim = new PriceSimulator(STOCKS)
  → holdings = loadPortfolio()           ← reads localStorage
  → sim.subscribe(callback)             ← Observer pattern
  → sim.start()                         ← setInterval fires every 2s
        │
Every 2 seconds:
        │
        ▼
PriceSimulator.#tick()
  → new price via GBM formula
  → notifies portfolio.js callback
        │
        ▼
portfolio.js onPriceUpdate()
  → calculateTotals(holdings, prices)   ← Array.reduce()
  → renderSummaryCards(totals)          ← DOM update with animateValue()
  → renderTable(holdings, prices)       ← innerHTML rebuild
  → recordValueSnapshot(value, invested) ← push to portfolioValueHistory[]
  → renderTrendChart()                  ← Chart.js area chart update
```

---

## Design System

MicroVest uses the **Deep Space Finance** design language — a premium, atmospheric aesthetic that positions the platform as a serious tool.

| Element         | Value                                                         | Rationale                                             |
| --------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| Background      | `#0a0e1a` (near-black navy)                                   | Financial data dashboard feel                         |
| Aurora gradient | Indigo `#6366f1` + Violet `#8b5cf6` + Cyan `#22d3ee`          | Visible through glass cards                           |
| Gain colour     | `#22c55e` (green)                                             | Universal financial convention                        |
| Loss colour     | `#ef4444` (red)                                               | Universal financial convention                        |
| Display font    | **Syne**                                                      | Geometric, authoritative headings                     |
| Body font       | **DM Sans**                                                   | Humanist, highly legible at small sizes               |
| Mono font       | **Space Mono**                                                | Equal-width digits — no layout shift on price updates |
| Card style      | Glassmorphism (`backdrop-filter: blur` + semi-transparent bg) | Depth and premium feel                                |
| Motion          | Spring easing `cubic-bezier(0.34, 1.56, 0.64, 1)`             | Natural, bouncy card lift                             |

**Dark / Light theming** is powered entirely by CSS custom properties. JavaScript writes one attribute:

```javascript
document.documentElement.setAttribute("data-theme", "light");
```

The CSS selector `:root[data-theme="light"]` activates and overrides the relevant tokens — no JavaScript ever touches `style` properties directly.

---

## Running the Project

MicroVest requires no installation, no build step, and no server.

**Open directly in a browser:**

```
open index.html
```

Or serve locally with any static file server (to avoid browser CORS restrictions with `localStorage` across file paths):

```bash
# Python
python3 -m http.server 8000

# Node.js (npx)
npx serve .
```

Then open `http://localhost:8000` in your browser.

**Browser support:** Chrome, Firefox, Safari, Edge (all modern versions). The `-webkit-backdrop-filter` vendor prefix is included for Safari compatibility.

---

> Built by **Aaryan Kuchekar** — ITM Skills University, School of Future Tech · Academic Year 2025–2026
