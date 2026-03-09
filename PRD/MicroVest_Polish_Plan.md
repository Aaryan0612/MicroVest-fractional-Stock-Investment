# MicroVest — Polish & Enhancement Plan
### Version: Post-Build Polish Pass | Date: March 9, 2026
**Scope:** Indian stocks + INR · Simulator tuning · Visual effects · Theme toggle · Charts · Landing page

---

## CRITICAL RULE FOR ALL CHANGES
Do NOT touch any working logic. Every change in this plan is either:
- A **data replacement** (swap US stocks → Indian stocks)
- A **CSS addition/modification** (visual polish)
- A **new feature** added alongside existing code (theme toggle, charts, landing page)

If a feature currently works — filter, calculator, portfolio, quiz — it must still work identically after these changes.

---

## PASS 1 — Indian Stocks + INR Currency

### 1.1 Replace data.js completely

```javascript
const STOCKS = [
  {
    ticker: "RELIANCE",
    name: "Reliance Industries",
    sector: "Energy & Retail",
    basePrice: 2850.00,
    price52wLow: 2220.30,
    price52wHigh: 3217.90,
    risk: "low",
    volatility: 0.006,
  },
  {
    ticker: "TCS",
    name: "Tata Consultancy Services",
    sector: "Technology",
    basePrice: 3940.00,
    price52wLow: 3311.00,
    price52wHigh: 4592.25,
    risk: "low",
    volatility: 0.007,
  },
  {
    ticker: "HDFCBANK",
    name: "HDFC Bank Ltd",
    sector: "Banking",
    basePrice: 1672.00,
    price52wLow: 1430.15,
    price52wHigh: 1880.00,
    risk: "low",
    volatility: 0.005,
  },
  {
    ticker: "INFY",
    name: "Infosys Ltd",
    sector: "Technology",
    basePrice: 1555.00,
    price52wLow: 1285.00,
    price52wHigh: 1903.50,
    risk: "medium",
    volatility: 0.010,
  },
  {
    ticker: "ICICIBANK",
    name: "ICICI Bank Ltd",
    sector: "Banking",
    basePrice: 1198.00,
    price52wLow: 970.05,
    price52wHigh: 1362.35,
    risk: "medium",
    volatility: 0.011,
  },
  {
    ticker: "WIPRO",
    name: "Wipro Ltd",
    sector: "Technology",
    basePrice: 462.00,
    price52wLow: 370.20,
    price52wHigh: 570.50,
    risk: "medium",
    volatility: 0.012,
  },
  {
    ticker: "BAJFINANCE",
    name: "Bajaj Finance Ltd",
    sector: "Finance",
    basePrice: 7210.00,
    price52wLow: 6187.80,
    price52wHigh: 8192.00,
    risk: "medium",
    volatility: 0.013,
  },
  {
    ticker: "TATAMOTORS",
    name: "Tata Motors Ltd",
    sector: "Automotive",
    basePrice: 780.00,
    price52wLow: 604.00,
    price52wHigh: 1179.05,
    risk: "high",
    volatility: 0.020,
  },
  {
    ticker: "ADANIENT",
    name: "Adani Enterprises",
    sector: "Conglomerate",
    basePrice: 2340.00,
    price52wLow: 1701.05,
    price52wHigh: 3743.90,
    risk: "high",
    volatility: 0.024,
  },
  {
    ticker: "ZOMATO",
    name: "Zomato Ltd",
    sector: "Food Tech",
    basePrice: 224.00,
    price52wLow: 140.00,
    price52wHigh: 304.50,
    risk: "high",
    volatility: 0.022,
  },
];

const FEE_RATE = 0.005;         // 0.5% platform fee — unchanged
const SIM_INTERVAL_MS = 2000;   // 2s interval — unchanged
const CURRENCY_SYMBOL = "₹";   // NEW — use this everywhere instead of hardcoded $
```

### 1.2 Currency Symbol — Global Find & Replace

In every HTML file and every JS template literal, replace:
- `$` price prefix → `₹`
- "USD" references → "INR"
- Platform fee label: "Platform fee (0.5%)" → unchanged (fee logic same)

**Exact replacements needed:**

In `stocks.js` — renderStocks template literal:
```javascript
// BEFORE
`$${price.toFixed(2)}`
// AFTER
`₹${price.toFixed(2)}`
```

In `portfolio.js` — renderSummaryCards and renderTable:
```javascript
// BEFORE
`$${value.toFixed(2)}`
// AFTER  
`₹${value.toFixed(2)}`
```

In `education.html` — any hardcoded $ references in text → ₹

In the calculator panel (stocks.js or stocks.html):
```javascript
// BEFORE
`Platform fee (0.5%): $${fee}`
// AFTER
`Platform fee (0.5%): ₹${fee}`
```

In the buy confirmation toast:
```javascript
// BEFORE
`Bought ${shares} shares of ${name} for $${amount}`
// AFTER
`Bought ${shares} shares of ${name} for ₹${amount}`
```

### 1.3 Minimum Investment Update

The hero text says "as little as $1" — update to:
```html
<!-- BEFORE -->
start investing with fractional shares — as little as $1
<!-- AFTER -->
start investing with fractional shares — as little as ₹10
```

Also update the HTML5 input validation in the calculator:
```html
<!-- BEFORE -->
<input type="number" min="1" max="10000" step="0.01">
<!-- AFTER -->
<input type="number" min="10" max="1000000" step="0.01">
```
(₹10 minimum, ₹10 lakh maximum — realistic for Indian market)

---

## PASS 2 — Simulator Volatility Tuning

### 2.1 Dampen price swings (in simulator.js)

The current formula causes ±2% swings every 2 seconds which looks chaotic. Real trading apps show micro-movements.

```javascript
// CURRENT — too aggressive
#calcNewPrice(stock) {
  return stock.price * (1 + stock.volatility * (Math.random() - 0.5) * 2);
}

// REPLACE WITH — realistic micro-movements
#calcNewPrice(stock) {
  // 0.3× dampening factor — much more realistic
  const change = stock.volatility * (Math.random() - 0.5) * 0.3;
  const newPrice = stock.price * (1 + change);
  // Price drift guard: never go below 60% or above 160% of basePrice
  const floor = stock.basePrice * 0.60;
  const ceiling = stock.basePrice * 1.60;
  return Math.min(Math.max(newPrice, floor), ceiling);
}
```

The drift guard is important — without it, after 30 minutes of simulation, ZOMATO could drift to ₹5 or ₹900. The guard keeps prices believable.

---

## PASS 3 — Visual Effects Polish

### 3.1 Aurora Background — Make it actually visible

In `base.css`, find the aurora background element (`.aurora-bg` or `body::before`) and update:

```css
/* CURRENT — too faint, basically invisible */
background:
  radial-gradient(ellipse 80% 60% at 20% 30%, rgba(0, 212, 255, 0.08) 0%, transparent 70%),
  radial-gradient(ellipse 60% 80% at 80% 70%, rgba(123, 97, 255, 0.08) 0%, transparent 70%);

/* REPLACE WITH — visible but not distracting */
background:
  radial-gradient(ellipse 90% 70% at 15% 25%, rgba(0, 212, 255, 0.14) 0%, transparent 65%),
  radial-gradient(ellipse 70% 90% at 85% 75%, rgba(123, 97, 255, 0.14) 0%, transparent 65%),
  radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0, 180, 255, 0.04) 0%, transparent 100%);
```

Also ensure the keyframe actually moves the gradients:
```css
@keyframes aurora-shift {
  0% {
    background-position: 0% 0%;
    transform: scale(1);
  }
  50% {
    background-position: 3% 5%;
    transform: scale(1.03);
  }
  100% {
    background-position: -3% 3%;
    transform: scale(0.98);
  }
}
/* Apply to the aurora element */
.aurora-bg {
  animation: aurora-shift 12s ease-in-out infinite alternate;
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}
```

### 3.2 Glass Cards — Make frosted glass actually visible

In `components.css`, find `.glass-card` and update:

```css
/* REPLACE — stronger glass effect */
.glass-card {
  background: rgba(15, 22, 33, 0.75);        /* slightly more opaque */
  backdrop-filter: blur(20px) saturate(150%); /* saturate makes colors pop through glass */
  -webkit-backdrop-filter: blur(20px) saturate(150%); /* Safari support */
  border: 1px solid rgba(0, 212, 255, 0.18);  /* brighter cyan border */
  border-radius: var(--radius-xl);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.06); /* subtle top inner glow */
}
```

The `inset 0 1px 0 rgba(255,255,255,0.06)` is the key — it adds a microscopic bright line at the very top of the card simulating light hitting a glass surface. Very premium feel.

### 3.3 Card Hover Effect — Lift + Directional Shadow

In `stocks.css`, find the card hover rule and replace:

```css
/* CURRENT */
.stock-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-glow-cyan);
}

/* REPLACE WITH — directional shadow: bright edges, dark bottom */
.stock-card {
  transition:
    transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), /* spring ease */
    box-shadow 0.28s ease,
    border-color 0.28s ease;
}

.stock-card:hover {
  transform: translateY(-7px);
  border-color: rgba(0, 212, 255, 0.40);  /* border brightens on hover */
  box-shadow:
    0 -4px 20px rgba(0, 212, 255, 0.12),  /* top: cyan glow */
    4px 0 16px rgba(0, 212, 255, 0.07),   /* right: subtle cyan */
    -4px 0 16px rgba(0, 212, 255, 0.07),  /* left: subtle cyan */
    0 20px 50px rgba(0, 0, 0, 0.70),      /* bottom: deep dark shadow */
    0 8px 20px rgba(0, 0, 0, 0.50);       /* mid: base shadow */
}
```

The spring cubic-bezier `(0.34, 1.56, 0.64, 1)` gives a slight overshoot on the lift — card bounces up just a tiny bit past -7px before settling. Very satisfying.

### 3.4 Price Flash — Make green/red glow visible on card border

In `stocks.css`, ensure the keyframes and classes are:

```css
@keyframes price-flash-up {
  0%   { border-color: rgba(0, 212, 255, 0.18); box-shadow: 0 8px 32px rgba(0,0,0,0.45); }
  25%  { border-color: rgba(0, 230, 118, 0.80); box-shadow: 0 0 25px rgba(0, 230, 118, 0.40), 0 8px 32px rgba(0,0,0,0.45); }
  100% { border-color: rgba(0, 212, 255, 0.18); box-shadow: 0 8px 32px rgba(0,0,0,0.45); }
}

@keyframes price-flash-down {
  0%   { border-color: rgba(0, 212, 255, 0.18); box-shadow: 0 8px 32px rgba(0,0,0,0.45); }
  25%  { border-color: rgba(255, 61, 87, 0.80);  box-shadow: 0 0 25px rgba(255, 61, 87, 0.40),  0 8px 32px rgba(0,0,0,0.45); }
  100% { border-color: rgba(0, 212, 255, 0.18); box-shadow: 0 8px 32px rgba(0,0,0,0.45); }
}

.stock-card.price-up   { animation: price-flash-up   0.6s ease forwards; }
.stock-card.price-down { animation: price-flash-down 0.6s ease forwards; }
```

In `stocks.js`, ensure the flash class is removed after animation ends so it can re-trigger:
```javascript
function onPriceUpdate(ticker, price, pct) {
  priceState.set(ticker, { price, changePct: pct });
  const card = document.querySelector(`[data-ticker="${ticker}"]`);
  if (!card) return;

  // Remove old flash class before adding new one (allows re-trigger)
  card.classList.remove('price-up', 'price-down');

  // Force reflow so browser registers the class removal before re-adding
  void card.offsetWidth; // ← this one line forces reflow

  card.classList.add(pct >= 0 ? 'price-up' : 'price-down');

  // ... rest of DOM updates
}
```

### 3.5 Navbar Glassmorphism

In `base.css`, find the `header` or `nav` styles:

```css
/* REPLACE */
header, nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(8, 12, 20, 0.65);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border-bottom: 1px solid rgba(0, 212, 255, 0.12);
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

header.scrolled, nav.scrolled {
  background: rgba(8, 12, 20, 0.90);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.50);
  border-bottom-color: rgba(0, 212, 255, 0.20);
}
```

### 3.6 Nav Link Hover — Underline Slide Animation

In `base.css`, find nav link styles:

```css
nav a {
  position: relative;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-base);
  padding-bottom: 4px;
}

/* Underline slide-in from left */
nav a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--brand-gradient);
  border-radius: 2px;
  transition: width 0.25s ease;
}

nav a:hover {
  color: var(--text-primary);
}

nav a:hover::after,
nav a.active::after {
  width: 100%;
}
```

---

## PASS 4 — Dark/Light Theme Toggle

### 4.1 Light theme tokens — add to variables.css

Add this block at the BOTTOM of `variables.css`, after the existing `:root` block:

```css
/* ===================== LIGHT THEME OVERRIDES ===================== */
:root[data-theme="light"] {
  /* Backgrounds */
  --bg-base:       #F0F4FF;
  --bg-surface:    #FFFFFF;
  --bg-elevated:   #E8EEFF;
  --bg-border:     #D0D8F0;
  --bg-overlay:    rgba(240, 244, 255, 0.90);

  /* Text */
  --text-primary:  #0D1117;
  --text-secondary:#3A4A6B;
  --text-muted:    #7A8AAB;
  --text-inverse:  #F0F4FF;

  /* Glass */
  --glass-bg:      rgba(255, 255, 255, 0.70);
  --glass-border:  rgba(0, 130, 200, 0.20);
  --glass-shadow:  0 8px 32px rgba(0, 100, 200, 0.12);

  /* Brand stays the same — cyan + violet work on both themes */

  /* Shadows lighter */
  --shadow-md:     0 8px 32px rgba(0, 80, 180, 0.12);
  --shadow-lg:     0 16px 64px rgba(0, 80, 180, 0.16);
}
```

### 4.2 Aurora light theme version

```css
:root[data-theme="light"] .aurora-bg {
  background:
    radial-gradient(ellipse 90% 70% at 15% 25%, rgba(0, 150, 255, 0.08) 0%, transparent 65%),
    radial-gradient(ellipse 70% 90% at 85% 75%, rgba(100, 80, 255, 0.06) 0%, transparent 65%);
}
```

### 4.3 Theme Toggle Button — add to navbar HTML (all 3 pages)

Place this inside the `<nav>` element, to the left of the "View Portfolio" CTA button:

```html
<button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme" title="Switch theme">
  <span class="theme-icon">🌙</span>
</button>
```

### 4.4 Theme Toggle CSS — add to components.css

```css
.theme-toggle {
  background: var(--bg-elevated);
  border: 1px solid var(--bg-border);
  border-radius: var(--radius-full);
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: 16px;
  flex-shrink: 0;
}

.theme-toggle:hover {
  background: var(--bg-border);
  transform: scale(1.08) rotate(15deg); /* slight rotation on hover — fun */
  border-color: var(--accent-cyan);
}
```

### 4.5 Theme Toggle JS — add to base.css's scroll listener block in each page JS

Add this function to EACH page's JS file (stocks.js, portfolio.js, education.js). Paste it at the top of the DOMContentLoaded block in each:

```javascript
// ── Theme Toggle ──────────────────────────────────────────
function initThemeToggle() {
  const btn  = document.getElementById('theme-toggle');
  const icon = btn?.querySelector('.theme-icon');
  if (!btn) return;

  // Restore saved theme
  const saved = localStorage.getItem('mv-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  if (icon) icon.textContent = saved === 'light' ? '☀️' : '🌙';

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mv-theme', next);
    if (icon) icon.textContent = next === 'light' ? '☀️' : '🌙';
  });
}

// Call it inside DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle(); // ← add this line to each page's DOMContentLoaded
  // ... rest of existing init code unchanged
});
```

---

## PASS 5 — Charts & Sparklines

### 5.1 Mini Sparkline on Each Stock Card

The simulator already stores the last 10 prices in `getPriceHistory(ticker)`. We render this as a tiny SVG sparkline inside each card.

**Where it goes:** Below the price/change% row, above the 52W range bar.

**HTML structure** (added inside renderStocks template):

```javascript
// Inside renderStocks template literal, after the price display:
`<div class="sparkline-container">
  <svg class="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
    <polyline class="sparkline-line" points="" />
  </svg>
</div>`
```

**CSS — add to stocks.css:**

```css
.sparkline-container {
  height: 36px;
  margin: var(--space-3) 0;
  overflow: hidden;
}

.sparkline {
  width: 100%;
  height: 100%;
}

.sparkline-line {
  fill: none;
  stroke: var(--accent-cyan);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.stock-card:hover .sparkline-line {
  opacity: 1;
  stroke-width: 2;
}

/* Red sparkline for stocks trending down */
.stock-card.trending-down .sparkline-line {
  stroke: var(--down-strong);
}
```

**JS — add updateSparkline function to stocks.js:**

```javascript
function updateSparkline(ticker, history) {
  const svg = document.querySelector(`[data-ticker="${ticker}"] .sparkline-line`);
  if (!svg || !history || history.length < 2) return;

  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1; // guard divide-by-zero

  // Map each price to an SVG coordinate point
  const points = history.map((price, i) => {
    const x = (i / (history.length - 1)) * 100;       // 0 to 100 across width
    const y = 30 - ((price - min) / range) * 26 + 2;  // 2 to 28 (2px padding)
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  svg.setAttribute('points', points);

  // Update trending class on card
  const card = document.querySelector(`[data-ticker="${ticker}"]`);
  if (card) {
    const trending = history[history.length - 1] >= history[0] ? 'up' : 'down';
    card.classList.toggle('trending-down', trending === 'down');
  }
}
```

**Call updateSparkline in onPriceUpdate:**

```javascript
function onPriceUpdate(ticker, price, pct) {
  priceState.set(ticker, { price, changePct: pct });
  const card = document.querySelector(`[data-ticker="${ticker}"]`);
  if (!card) return;

  // existing flash + DOM update code...

  // ADD THIS LINE — update sparkline with latest history
  const sim = /* your module-scope sim reference */;
  updateSparkline(ticker, sim.getPriceHistory(ticker));
}
```

**Also call updateSparkline on initial render** (inside renderStocks, after cards are inserted):
```javascript
function renderStocks(stocks) {
  // existing template literal rendering...

  // After rendering, init sparklines with basePrice repeated
  stocks.forEach(stock => {
    const history = [stock.basePrice]; // start with just base price
    updateSparkline(stock.ticker, history);
  });
}
```

**IMPORTANT NOTE:** In stocks.js, `sim` is created inside DOMContentLoaded — for `onPriceUpdate` to access it for `getPriceHistory`, declare `let sim` at module scope just like in portfolio.js (same Fix B pattern). This is a small but necessary change:

```javascript
// TOP OF stocks.js — module scope
let sim; // add this

document.addEventListener('DOMContentLoaded', () => {
  sim = new PriceSimulator(STOCKS); // assign, don't redeclare
  // ... rest unchanged
});
```

### 5.2 Portfolio Value Trend (portfolio.html)

The portfolio page already has the allocation bar chart. Add a simple **value-over-time line** above the allocation section.

**HTML — add to portfolio.html** after the summary cards section:

```html
<section class="value-trend-section" aria-label="Portfolio value trend">
  <h2>Value Over Time</h2>
  <div class="trend-chart-container">
    <svg class="trend-chart" id="trend-chart" viewBox="0 0 400 80" preserveAspectRatio="none">
      <defs>
        <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(0, 212, 255, 0.3)" />
          <stop offset="100%" stop-color="rgba(0, 212, 255, 0)" />
        </linearGradient>
      </defs>
      <path class="trend-area" d="" fill="url(#trend-gradient)" />
      <polyline class="trend-line" points="" />
    </svg>
    <div class="trend-labels">
      <span class="trend-label-start" id="trend-start">--</span>
      <span class="trend-label-end" id="trend-end">--</span>
    </div>
  </div>
</section>
```

**CSS — add to portfolio.css:**

```css
.value-trend-section {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
}

.trend-chart-container {
  position: relative;
  height: 80px;
  margin-top: var(--space-4);
}

.trend-chart {
  width: 100%;
  height: 100%;
}

.trend-line {
  fill: none;
  stroke: var(--accent-cyan);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.trend-area {
  transition: d 0.4s ease; /* animates the area fill */
}

.trend-labels {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
}
```

**JS — add to portfolio.js:**

```javascript
// Track portfolio value history (session only)
const portfolioValueHistory = [];

// Call this inside the sim.subscribe callback, after renderAll
function recordValueSnapshot(totalValue) {
  portfolioValueHistory.push(totalValue);
  if (portfolioValueHistory.length > 40) portfolioValueHistory.shift(); // keep last 40 ticks
  updateTrendChart();
}

function updateTrendChart() {
  const line = document.querySelector('.trend-line');
  const area = document.querySelector('.trend-area');
  const startEl = document.getElementById('trend-start');
  const endEl   = document.getElementById('trend-end');

  if (!line || portfolioValueHistory.length < 2) return;

  const history = portfolioValueHistory;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;

  const points = history.map((val, i) => {
    const x = (i / (history.length - 1)) * 400;
    const y = 80 - ((val - min) / range) * 72 + 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  line.setAttribute('points', points);

  // Area path: line points + close down to bottom
  const firstX = 0, lastX = 400;
  area.setAttribute('d', `M0,80 L${points.split(' ').join(' L')} L${lastX},80 Z`);

  // Labels
  if (startEl) startEl.textContent = `₹${history[0].toFixed(2)}`;
  if (endEl)   endEl.textContent   = `₹${history[history.length - 1].toFixed(2)}`;
}

// Inside sim.subscribe callback in DOMContentLoaded — add this line:
sim.subscribe(() => {
  if (!renderPending) {
    renderPending = true;
    setTimeout(() => {
      const h = loadPortfolio();
      const prices = sim.getCurrentPrices();
      renderAll(h, prices);
      // ADD THIS:
      const totals = calculateTotals(h, prices);
      recordValueSnapshot(totals.totalValue);
      renderPending = false;
    }, 0);
  }
});
```

---

## PASS 6 — Landing Page (index.html)

Replace the current redirect `index.html` with a full landing page.

### 6.1 Full index.html structure

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="MicroVest — Buy fractional shares of top Indian stocks starting from ₹10. Simulated platform for learning.">
  <title>MicroVest | Fractional Stock Investing</title>
  <!-- Same Google Fonts as other pages -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <!-- Same CSS load order -->
  <link rel="stylesheet" href="css/variables.css">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/components.css">
  <link rel="stylesheet" href="css/landing.css">  <!-- NEW page-specific CSS -->
</head>
<body class="page-landing">

  <!-- Aurora background (same as all pages) -->
  <div class="aurora-bg" aria-hidden="true"></div>

  <!-- ── NAVBAR (same structure as other pages) ── -->
  <header id="main-header">
    <nav class="nav-container">
      <a href="index.html" class="nav-logo">
        <span class="logo-mark">M</span>
        <span class="logo-text">MicroVest</span>
      </a>
      <div class="nav-links">
        <a href="stocks.html">Stocks</a>
        <a href="portfolio.html">Portfolio</a>
        <a href="education.html">Learn</a>
      </div>
      <div class="nav-actions">
        <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
          <span class="theme-icon">🌙</span>
        </button>
        <a href="stocks.html" class="btn-primary">Start Investing →</a>
      </div>
    </nav>
  </header>

  <main>

    <!-- ── SECTION 1: HERO ── -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="pulse-dot"></span>
          Live Simulation Active
        </div>
        <h1 class="hero-title">
          Invest in India's
          <span class="gradient-text">Top Companies</span>
          from ₹10
        </h1>
        <p class="hero-subtitle">
          MicroVest lets you buy fractional shares of RELIANCE, TCS, HDFC Bank and more —
          no need to buy a full share. Start small, learn real investing.
        </p>
        <div class="hero-cta-group">
          <a href="stocks.html" class="btn-primary btn-large">
            Explore Stocks →
          </a>
          <a href="education.html" class="btn-secondary btn-large">
            Learn First
          </a>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <span class="stat-value">10</span>
            <span class="stat-label">Indian Stocks</span>
          </div>
          <div class="hero-stat">
            <span class="stat-value">₹10</span>
            <span class="stat-label">Minimum</span>
          </div>
          <div class="hero-stat">
            <span class="stat-value">0.5%</span>
            <span class="stat-label">Platform Fee</span>
          </div>
          <div class="hero-stat">
            <span class="stat-value">Live</span>
            <span class="stat-label">Simulation</span>
          </div>
        </div>
      </div>
      <!-- Hero visual: animated mini stock ticker -->
      <div class="hero-visual" aria-hidden="true">
        <div class="ticker-preview">
          <!-- JS will populate these with live-simulated prices from data.js -->
          <div class="ticker-item" data-preview="RELIANCE">
            <span class="ticker-sym">RELIANCE</span>
            <span class="ticker-price">₹2,850.00</span>
            <span class="ticker-change up">+0.42%</span>
          </div>
          <div class="ticker-item" data-preview="TCS">
            <span class="ticker-sym">TCS</span>
            <span class="ticker-price">₹3,940.00</span>
            <span class="ticker-change down">-0.18%</span>
          </div>
          <div class="ticker-item" data-preview="ZOMATO">
            <span class="ticker-sym">ZOMATO</span>
            <span class="ticker-price">₹224.00</span>
            <span class="ticker-change up">+1.24%</span>
          </div>
          <div class="ticker-item" data-preview="TATAMOTORS">
            <span class="ticker-sym">TATAMOTORS</span>
            <span class="ticker-price">₹780.00</span>
            <span class="ticker-change down">-0.55%</span>
          </div>
          <div class="ticker-item" data-preview="NVDA">
            <span class="ticker-sym">ADANIENT</span>
            <span class="ticker-price">₹2,340.00</span>
            <span class="ticker-change up">+0.91%</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── SECTION 2: HOW IT WORKS ── -->
    <section class="how-section">
      <div class="section-header">
        <h2>How MicroVest Works</h2>
        <p>Three simple steps to start your investment journey</p>
      </div>
      <div class="steps-grid">
        <div class="step-card">
          <div class="step-number">01</div>
          <div class="step-icon">🔍</div>
          <h3>Browse Stocks</h3>
          <p>Explore 10 top Indian companies with real-time simulated prices, risk ratings, and 52-week ranges.</p>
        </div>
        <div class="step-card">
          <div class="step-number">02</div>
          <div class="step-icon">💰</div>
          <h3>Buy a Fraction</h3>
          <p>Enter any amount from ₹10. Our calculator shows exactly how many shares you'll receive instantly.</p>
        </div>
        <div class="step-card">
          <div class="step-number">03</div>
          <div class="step-icon">📈</div>
          <h3>Track & Learn</h3>
          <p>Watch your portfolio grow in real time. Understand gain/loss, allocation, and market movements.</p>
        </div>
      </div>
    </section>

    <!-- ── SECTION 3: FEATURED STOCKS ── -->
    <section class="featured-section">
      <div class="section-header">
        <h2>Featured Stocks</h2>
        <p>A snapshot of what you can invest in today</p>
      </div>
      <div class="featured-grid">
        <!-- 4 preview cards — static, just for visual. Link to stocks.html -->
        <div class="featured-card risk-low">
          <div class="featured-ticker">RELIANCE</div>
          <div class="featured-name">Reliance Industries</div>
          <div class="featured-price">₹2,850.00</div>
          <div class="featured-badge badge badge--low">LOW RISK</div>
        </div>
        <div class="featured-card risk-medium">
          <div class="featured-ticker">INFY</div>
          <div class="featured-name">Infosys Ltd</div>
          <div class="featured-price">₹1,555.00</div>
          <div class="featured-badge badge badge--medium">MEDIUM RISK</div>
        </div>
        <div class="featured-card risk-high">
          <div class="featured-ticker">ZOMATO</div>
          <div class="featured-name">Zomato Ltd</div>
          <div class="featured-price">₹224.00</div>
          <div class="featured-badge badge badge--high">HIGH RISK</div>
        </div>
        <div class="featured-card risk-low">
          <div class="featured-ticker">TCS</div>
          <div class="featured-name">Tata Consultancy Services</div>
          <div class="featured-price">₹3,940.00</div>
          <div class="featured-badge badge badge--low">LOW RISK</div>
        </div>
      </div>
      <div class="featured-cta">
        <a href="stocks.html" class="btn-primary">View All 10 Stocks →</a>
      </div>
    </section>

    <!-- ── SECTION 4: DISCLAIMER ── -->
    <section class="disclaimer-section">
      <div class="disclaimer-card">
        <span class="disclaimer-icon">⚠️</span>
        <p>MicroVest is a <strong>simulated educational platform</strong>. No real money is involved. Prices are algorithmically generated and do not reflect actual market data. Built for learning purposes only.</p>
      </div>
    </section>

  </main>

  <!-- Same footer -->
  <footer>
    <p>MicroVest © 2026 — Simulated platform for educational purposes. Not real financial advice.</p>
  </footer>

  <!-- JS: data.js for stock names, landing.js for interactions -->
  <script src="js/data.js"></script>
  <script src="js/landing.js"></script>
</body>
</html>
```

### 6.2 landing.css — new file

```css
/* ── HERO ── */
.hero-section {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  gap: var(--space-16);
  padding: var(--space-16) var(--space-8);
  max-width: 1200px;
  margin: 0 auto;
}

.hero-content { flex: 1; }

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background: rgba(0, 230, 118, 0.10);
  border: 1px solid rgba(0, 230, 118, 0.25);
  color: var(--up-strong);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-family: var(--font-body);
  font-weight: 500;
  margin-bottom: var(--space-6);
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 5vw, 4rem); /* fluid font size */
  font-weight: 800;
  line-height: 1.1;
  color: var(--text-primary);
  margin-bottom: var(--space-6);
}

.gradient-text {
  background: var(--brand-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  line-height: 1.7;
  max-width: 520px;
  margin-bottom: var(--space-8);
}

.hero-cta-group {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin-bottom: var(--space-10);
}

.btn-large {
  padding: var(--space-4) var(--space-8) !important;
  font-size: var(--text-base) !important;
}

.hero-stats {
  display: flex;
  gap: var(--space-8);
  flex-wrap: wrap;
}

.hero-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--accent-cyan);
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ── TICKER PREVIEW (hero right side) ── */
.hero-visual { flex: 0 0 340px; }

.ticker-preview {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.ticker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--bg-border);
  transition: border-color 0.3s ease;
}

.ticker-item.flash-up   { border-color: var(--up-strong);   }
.ticker-item.flash-down { border-color: var(--down-strong); }

.ticker-sym   { font-family: var(--font-display); font-size: var(--text-sm); font-weight: 700; color: var(--text-primary); }
.ticker-price { font-family: var(--font-mono); font-size: var(--text-sm); color: var(--text-secondary); }
.ticker-change { font-family: var(--font-mono); font-size: var(--text-xs); font-weight: 700; }
.ticker-change.up   { color: var(--up-strong);   }
.ticker-change.down { color: var(--down-strong); }

/* ── HOW IT WORKS ── */
.how-section {
  padding: var(--space-20) var(--space-8);
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: var(--space-12);
}

.section-header h2 {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-3);
}

.section-header p {
  color: var(--text-secondary);
  font-size: var(--text-lg);
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}

.step-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  position: relative;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.step-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-glow-cyan);
}

.step-number {
  font-family: var(--font-mono);
  font-size: var(--text-4xl);
  font-weight: 700;
  color: rgba(0, 212, 255, 0.12);
  position: absolute;
  top: var(--space-4);
  right: var(--space-5);
  line-height: 1;
}

.step-icon {
  font-size: 2rem;
  margin-bottom: var(--space-4);
}

.step-card h3 {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-3);
}

.step-card p {
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: var(--text-base);
}

/* ── FEATURED STOCKS ── */
.featured-section {
  padding: var(--space-20) var(--space-8);
  max-width: 1200px;
  margin: 0 auto;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.featured-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.featured-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-glow-cyan); }
.featured-ticker { font-family: var(--font-display); font-size: var(--text-xl); font-weight: 800; color: var(--accent-cyan); margin-bottom: var(--space-1); }
.featured-name   { font-size: var(--text-sm); color: var(--text-muted); margin-bottom: var(--space-3); }
.featured-price  { font-family: var(--font-mono); font-size: var(--text-lg); font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-3); }

.featured-cta { text-align: center; }

/* ── DISCLAIMER ── */
.disclaimer-section {
  padding: var(--space-8);
  max-width: 800px;
  margin: 0 auto var(--space-16);
}

.disclaimer-card {
  background: rgba(255, 184, 48, 0.06);
  border: 1px solid rgba(255, 184, 48, 0.20);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.disclaimer-icon { font-size: 1.2rem; flex-shrink: 0; margin-top: 2px; }

/* ── RESPONSIVE ── */
@media (max-width: 1024px) {
  .hero-section { flex-direction: column; text-align: center; gap: var(--space-10); }
  .hero-subtitle { max-width: 100%; }
  .hero-cta-group { justify-content: center; }
  .hero-stats { justify-content: center; }
  .hero-visual { width: 100%; max-width: 400px; }
  .featured-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .steps-grid { grid-template-columns: 1fr; }
  .featured-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 480px) {
  .featured-grid { grid-template-columns: 1fr; }
}
```

### 6.3 landing.js — new file

```javascript
// landing.js — Landing page interactions only

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();       // same function as other pages
  initNavScroll();         // navbar scroll effect
  initTickerPreview();     // animate the hero ticker
});

// ── Nav scroll effect (same as other pages) ──
function initNavScroll() {
  window.addEventListener('scroll', () => {
    document.getElementById('main-header')
      .classList.toggle('scrolled', scrollY > 10);
  });
}

// ── Hero ticker — lightweight simulation for landing page only ──
// Uses STOCKS from data.js to show realistic price previews
function initTickerPreview() {
  const items = document.querySelectorAll('.ticker-item');
  if (!items.length) return;

  // Map each ticker item to a stock from data.js
  const previewStocks = ['RELIANCE', 'TCS', 'ZOMATO', 'TATAMOTORS', 'ADANIENT'];
  const prices = {};

  previewStocks.forEach(ticker => {
    const stock = STOCKS.find(s => s.ticker === ticker);
    if (stock) prices[ticker] = stock.basePrice;
  });

  // Simulate price changes every 2s (lightweight — no full PriceSimulator)
  setInterval(() => {
    items.forEach(item => {
      const ticker = item.dataset.preview;
      const stock  = STOCKS.find(s => s.ticker === ticker);
      if (!stock) return;

      const prev = prices[ticker];
      const change = stock.volatility * (Math.random() - 0.5) * 0.3;
      prices[ticker] = prev * (1 + change);

      const pct = ((prices[ticker] - prev) / prev) * 100;
      const isUp = pct >= 0;

      // Update price
      item.querySelector('.ticker-price').textContent =
        `₹${prices[ticker].toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      // Update change %
      const changeEl = item.querySelector('.ticker-change');
      changeEl.textContent = `${isUp ? '+' : ''}${pct.toFixed(2)}%`;
      changeEl.className = `ticker-change ${isUp ? 'up' : 'down'}`;

      // Flash border
      item.classList.remove('flash-up', 'flash-down');
      void item.offsetWidth;
      item.classList.add(isUp ? 'flash-up' : 'flash-down');
      setTimeout(() => item.classList.remove('flash-up', 'flash-down'), 600);
    });
  }, 2000);
}

// ── Theme toggle (identical to other pages) ──
function initThemeToggle() {
  const btn  = document.getElementById('theme-toggle');
  const icon = btn?.querySelector('.theme-icon');
  if (!btn) return;
  const saved = localStorage.getItem('mv-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  if (icon) icon.textContent = saved === 'light' ? '☀️' : '🌙';
  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mv-theme', next);
    if (icon) icon.textContent = next === 'light' ? '☀️' : '🌙';
  });
}
```

---

## NEW FILES SUMMARY

| File | Status | Notes |
|------|--------|-------|
| `data.js` | REPLACE | 10 Indian stocks, ₹ prices, CURRENCY_SYMBOL constant |
| `variables.css` | APPEND | Light theme overrides at bottom |
| `base.css` | MODIFY | Aurora opacity, nav glassmorphism, nav link hover |
| `components.css` | MODIFY | Glass card update, theme toggle button |
| `stocks.css` | MODIFY | Card hover directional shadow, price flash keyframes |
| `stocks.js` | MODIFY | ₹ symbol, priceState updated, sparkline, sim module-scope, theme toggle |
| `portfolio.js` | MODIFY | ₹ symbol, value trend chart, theme toggle |
| `education.js` | MODIFY | Theme toggle init |
| `education.html` | MODIFY | ₹ references in text |
| `simulator.js` | MODIFY | Dampened volatility, drift guard |
| `index.html` | REPLACE | Full landing page |
| `css/landing.css` | NEW | Landing page styles |
| `js/landing.js` | NEW | Landing page interactions |

---

## VERIFICATION CHECKLIST (after build)

```
PASS 1 — Data
□ All 10 stocks show Indian companies (RELIANCE, TCS, HDFC etc.)
□ All prices show ₹ symbol — not $
□ Calculator shows ₹ for fee and total cost
□ Portfolio shows ₹ for all values
□ Minimum input is ₹10

PASS 2 — Simulator
□ Price changes are subtle (not wild ±2% jumps)
□ Prices don't drift wildly below/above 60-160% of base

PASS 3 — Visual
□ Aurora gradient faintly visible on dark background
□ Glass cards have visible frosted effect
□ Card hover: lifts + dark bottom shadow + bright edges
□ Price flash: green glow on border when up, red when down
□ Navbar: translucent with cyan bottom border visible
□ Nav links: underline slides in on hover

PASS 4 — Theme Toggle
□ Moon icon in navbar (all 4 pages including landing)
□ Click → switches to light mode instantly (all colors flip)
□ Click again → back to dark
□ Refresh → remembers preference (localStorage)
□ Logo, cards, text all readable in both themes

PASS 5 — Charts
□ Sparkline appears on each stock card
□ Sparkline updates every 2s with new prices
□ Trending-down sparkline is red, trending-up is cyan
□ Portfolio trend chart builds over time as prices tick
□ Value labels update on trend chart

PASS 6 — Landing Page
□ index.html loads as beautiful landing page (not a redirect)
□ Hero title, subtitle, CTA buttons visible
□ Stats row: 10 stocks / ₹10 / 0.5% / Live
□ 5 ticker items in hero visual — prices simulating every 2s
□ "How it works" 3-step cards visible
□ 4 featured stock preview cards visible
□ "View All 10 Stocks →" links to stocks.html
□ Disclaimer section visible
□ Theme toggle works on landing page
□ Mobile: hero stacks vertically, featured 2-col → 1-col
```

---

*Polish Plan v1.0 — Complete. Send this entire document to Antigravity.*
