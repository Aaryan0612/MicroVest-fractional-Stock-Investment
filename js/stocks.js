/* ============================================
   MicroVest — Stocks Page Logic (stocks.js)
   Indian stocks, INR, Sparklines, Theme Toggle
   Includes all original fixes + Polish Plan changes
   ============================================ */

let currentFilter = "all";
let currentSort = "default";
let searchQuery = "";
let sim; // module-scope (Fix B pattern, needed for sparklines)

const priceState = new Map(
  STOCKS.map((s) => [s.ticker, { price: s.basePrice, changePct: 0 }]),
);

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  sim = new PriceSimulator(STOCKS);

  renderStocks(STOCKS);
  initFilterButtons();
  initSortSelect();
  initSearch();
  initNavToggle();

  sim.subscribe(onPriceUpdate);
  sim.start();
});

// ── Render Stock Cards ──
function renderStocks(stocks) {
  const grid = document.getElementById("stocks-grid");

  if (stocks.length === 0) {
    grid.innerHTML = `
      <div class="stocks-empty">
        <div class="stocks-empty__icon">🔍</div>
        <p class="stocks-empty__text">No stocks match your filters</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = stocks
    .map((stock, index) => {
      const ps = priceState.get(stock.ticker);
      const price = ps ? ps.price : stock.basePrice;
      const changePct = ps ? ps.changePct : 0;
      const changeClass =
        changePct >= 0 ? "stock-card__change--up" : "stock-card__change--down";
      const changeSign = changePct >= 0 ? "+" : "";

      const rangePct =
        ((price - stock.price52wLow) /
          (stock.price52wHigh - stock.price52wLow)) *
        100;
      const clampedPct = Math.min(Math.max(rangePct, 0), 100);

      return `
        <article class="stock-card" data-ticker="${stock.ticker}" style="--card-index: ${index}">
          <div class="stock-card__header">
            <div class="stock-card__info">
              <span class="stock-card__ticker">${stock.ticker}</span>
              <span class="stock-card__name">${stock.name}</span>
            </div>
            <div class="stock-card__tags">
              <span class="badge badge--${stock.risk}">${stock.risk}</span>
              <span class="sector-tag">${stock.sector}</span>
            </div>
          </div>
          <div class="stock-card__body">
            <div class="stock-card__price-section">
              <span class="stock-card__price price-value">₹${price.toFixed(2)}</span>
              <span class="stock-card__change ${changeClass} change-value">${changeSign}${changePct.toFixed(2)}%</span>
            </div>
            <div class="sparkline-container">
              <svg class="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
                <polyline class="sparkline-line" points="" />
              </svg>
            </div>
            <div class="range-bar">
              <div class="range-bar__label">
                <span>52W Low: ₹${stock.price52wLow.toFixed(2)}</span>
                <span>52W High: ₹${stock.price52wHigh.toFixed(2)}</span>
              </div>
              <div class="range-track">
                <div class="range-fill" style="width: ${clampedPct}%"></div>
                <div class="range-thumb" style="left: ${clampedPct}%"></div>
              </div>
            </div>
          </div>
          <div class="stock-card__footer">
            <button class="stock-card__invest-btn" onclick="openCalculator('${stock.ticker}')">
              💰 Invest Now
            </button>
          </div>
          <div class="calculator-panel" data-calc="${stock.ticker}">
            <div class="calculator-panel__inner">
              <div class="calculator-panel__input-group">
                <label class="calculator-panel__label" for="amount-${stock.ticker}">Investment Amount (₹)</label>
                <input
                  type="number"
                  id="amount-${stock.ticker}"
                  class="calculator-panel__input"
                  placeholder="Enter amount (e.g. 500)"
                  min="10"
                  max="1000000"
                  step="0.01"
                  oninput="updateCalcPreview('${stock.ticker}')"
                />
              </div>
              <div class="calculator-panel__result" id="calc-result-${stock.ticker}">
                <div class="calculator-panel__result-row">
                  <span>Shares you'll get:</span>
                  <span id="calc-shares-${stock.ticker}">0.0000</span>
                </div>
                <div class="calculator-panel__result-row">
                  <span>Platform fee (0.5%):</span>
                  <span id="calc-fee-${stock.ticker}">₹0.00</span>
                </div>
                <div class="calculator-panel__result-row">
                  <span>Total cost:</span>
                  <span id="calc-total-${stock.ticker}">₹0.00</span>
                </div>
              </div>
              <div class="calculator-panel__actions">
                <button class="btn btn-primary btn-sm" onclick="confirmPurchase('${stock.ticker}')">
                  ✅ Confirm Purchase
                </button>
                <button class="btn btn-ghost btn-sm" onclick="closeCalculator('${stock.ticker}')">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  // Init range bars + sparklines
  stocks.forEach((stock) => {
    const ps = priceState.get(stock.ticker);
    updateRangeBar(stock.ticker, ps ? ps.price : stock.basePrice);
    const history = sim ? sim.getPriceHistory(stock.ticker) : [stock.basePrice];
    updateSparkline(stock.ticker, history || [stock.basePrice]);
  });
}

// ── Price Update Handler ──
function onPriceUpdate(ticker, price, pct) {
  priceState.set(ticker, { price, changePct: pct });

  const card = document.querySelector(`[data-ticker="${ticker}"]`);
  if (!card) return;

  const priceEl = card.querySelector(".price-value");
  const changeEl = card.querySelector(".change-value");

  if (priceEl) priceEl.textContent = `₹${price.toFixed(2)}`;
  if (changeEl) {
    const sign = pct >= 0 ? "+" : "";
    changeEl.textContent = `${sign}${pct.toFixed(2)}%`;
    changeEl.className = `stock-card__change ${pct >= 0 ? "stock-card__change--up" : "stock-card__change--down"} change-value`;
  }

  // Flash animation
  card.classList.remove("price-up", "price-down");
  void card.offsetWidth;
  card.classList.add(pct >= 0 ? "price-up" : "price-down");

  updateRangeBar(ticker, price);
  updateSparkline(ticker, sim.getPriceHistory(ticker));
}

// ── 52W Range Bar ──
function updateRangeBar(ticker, currentPrice) {
  const stock = STOCKS.find((s) => s.ticker === ticker);
  if (!stock) return;
  const pct =
    ((currentPrice - stock.price52wLow) /
      (stock.price52wHigh - stock.price52wLow)) *
    100;
  const clamped = Math.min(Math.max(pct, 0), 100);

  const thumb = document.querySelector(
    `[data-ticker="${ticker}"] .range-thumb`,
  );
  const fill = document.querySelector(`[data-ticker="${ticker}"] .range-fill`);
  if (thumb) thumb.style.left = `${clamped}%`;
  if (fill) fill.style.width = `${clamped}%`;
}

// ── Sparkline (Pass 5) ──
function updateSparkline(ticker, history) {
  const svg = document.querySelector(
    `[data-ticker="${ticker}"] .sparkline-line`,
  );
  if (!svg || !history || history.length < 2) return;

  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;

  const points = history
    .map((price, i) => {
      const x = (i / (history.length - 1)) * 100;
      const y = 30 - ((price - min) / range) * 26 + 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  svg.setAttribute("points", points);

  const card = document.querySelector(`[data-ticker="${ticker}"]`);
  if (card) {
    const trending = history[history.length - 1] >= history[0] ? "up" : "down";
    card.classList.toggle("trending-down", trending === "down");
  }
}

// ── Filtering & Sorting ──
function getFilteredSorted() {
  let filtered = STOCKS.filter((stock) => {
    if (currentFilter !== "all" && stock.risk !== currentFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        stock.ticker.toLowerCase().includes(q) ||
        stock.name.toLowerCase().includes(q) ||
        stock.sector.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (currentSort !== "default") {
    filtered = [...filtered].sort((a, b) => {
      switch (currentSort) {
        case "change-desc":
          return (
            (priceState.get(b.ticker)?.changePct ?? 0) -
            (priceState.get(a.ticker)?.changePct ?? 0)
          );
        case "change-asc":
          return (
            (priceState.get(a.ticker)?.changePct ?? 0) -
            (priceState.get(b.ticker)?.changePct ?? 0)
          );
        case "price-desc":
          return (
            (priceState.get(b.ticker)?.price ?? b.basePrice) -
            (priceState.get(a.ticker)?.price ?? a.basePrice)
          );
        case "price-asc":
          return (
            (priceState.get(a.ticker)?.price ?? a.basePrice) -
            (priceState.get(b.ticker)?.price ?? b.basePrice)
          );
        case "name-asc":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }

  return filtered;
}

function applyFiltersAndRender() {
  const filtered = getFilteredSorted();
  renderStocks(filtered);
}

function initFilterButtons() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("filter-btn--active"));
      btn.classList.add("filter-btn--active");
      currentFilter = btn.dataset.filter;
      applyFiltersAndRender();
    });
  });
}

function initSortSelect() {
  const select = document.getElementById("stock-sort");
  select.addEventListener("change", () => {
    currentSort = select.value;
    applyFiltersAndRender();
  });
}

function initSearch() {
  const input = document.getElementById("stock-search");
  let debounceTimer;
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = input.value.trim();
      applyFiltersAndRender();
    }, 200);
  });
}

// ── Calculator ──
function openCalculator(ticker) {
  document.querySelectorAll(".calculator-panel.open").forEach((panel) => {
    panel.style.maxHeight = "0";
    panel.classList.remove("open");
  });

  const panel = document.querySelector(`[data-calc="${ticker}"]`);
  if (!panel) return;
  panel.classList.add("open");
  panel.style.maxHeight = panel.scrollHeight + "px";

  const input = document.getElementById(`amount-${ticker}`);
  if (input) {
    input.value = "";
    input.focus();
  }
  resetCalcPreview(ticker);
}

function closeCalculator(ticker) {
  const panel = document.querySelector(`[data-calc="${ticker}"]`);
  if (!panel) return;
  panel.style.maxHeight = "0";
  panel.classList.remove("open");
}

function resetCalcPreview(ticker) {
  const sharesEl = document.getElementById(`calc-shares-${ticker}`);
  const feeEl = document.getElementById(`calc-fee-${ticker}`);
  const totalEl = document.getElementById(`calc-total-${ticker}`);
  if (sharesEl) sharesEl.textContent = "0.0000";
  if (feeEl) feeEl.textContent = "₹0.00";
  if (totalEl) totalEl.textContent = "₹0.00";
}

function updateCalcPreview(ticker) {
  const input = document.getElementById(`amount-${ticker}`);
  const amount = parseFloat(input?.value) || 0;
  const ps = priceState.get(ticker);
  const price = ps
    ? ps.price
    : STOCKS.find((s) => s.ticker === ticker)?.basePrice || 0;
  const result = calculateFraction(amount, price);

  const sharesEl = document.getElementById(`calc-shares-${ticker}`);
  const feeEl = document.getElementById(`calc-fee-${ticker}`);
  const totalEl = document.getElementById(`calc-total-${ticker}`);

  if (sharesEl) sharesEl.textContent = result.shares.toFixed(4);
  if (feeEl) feeEl.textContent = `₹${result.fee.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `₹${(amount + result.fee).toFixed(2)}`;
}

function calculateFraction(amount, price) {
  if (amount <= 0 || price <= 0) return { shares: 0, fee: 0 };
  const fee = amount * FEE_RATE;
  const investable = amount - fee;
  const shares = investable / price;
  return { shares, fee };
}

function confirmPurchase(ticker) {
  const input = document.getElementById(`amount-${ticker}`);
  const amount = parseFloat(input?.value) || 0;

  if (amount < 10) {
    showToast("Please enter at least ₹10 to invest.", "error");
    return;
  }

  const ps = priceState.get(ticker);
  const price = ps
    ? ps.price
    : STOCKS.find((s) => s.ticker === ticker)?.basePrice || 0;
  const { shares, fee } = calculateFraction(amount, price);

  if (shares <= 0) {
    showToast("Invalid investment amount.", "error");
    return;
  }

  const portfolio = JSON.parse(localStorage.getItem("portfolio") || "[]");
  const existing = portfolio.find((h) => h.ticker === ticker);

  if (existing) {
    const totalShares = existing.shares + shares;
    const totalCost = existing.avgBuy * existing.shares + (amount - fee);
    existing.avgBuy = totalCost / totalShares;
    existing.shares = totalShares;
    existing.invested = totalCost;
  } else {
    portfolio.push({
      ticker,
      shares,
      avgBuy: (amount - fee) / shares,
      invested: amount - fee,
    });
  }

  localStorage.setItem("portfolio", JSON.stringify(portfolio));
  closeCalculator(ticker);

  const stock = STOCKS.find((s) => s.ticker === ticker);
  showToast(
    `✅ Bought ${shares.toFixed(4)} shares of ${stock?.name || ticker} for ₹${amount.toFixed(2)}`,
    "success",
  );
}

// ── Toast ──
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast toast--${type} show`;
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ── Theme Toggle (Pass 4) ──
function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  const icon = btn?.querySelector(".theme-icon");
  if (!btn) return;
  const saved = localStorage.getItem("mv-theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  if (icon) icon.textContent = saved === "light" ? "☀️" : "🌙";
  btn.addEventListener("click", () => {
    const next =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("mv-theme", next);
    if (icon) icon.textContent = next === "light" ? "☀️" : "🌙";
  });
}

// ── Nav Toggle ──
function initNavToggle() {
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => {
    toggle.classList.toggle("open");
    links.classList.toggle("open");
  });
  links.querySelectorAll(".navbar__link").forEach((link) => {
    link.addEventListener("click", () => {
      toggle.classList.remove("open");
      links.classList.remove("open");
    });
  });
}
