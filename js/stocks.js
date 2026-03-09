/* ============================================
   MicroVest — Stocks Page Logic (stocks.js)
   Indian stocks, INR, Sparklines, Theme Toggle
   Includes all original fixes + Polish Plan changes
   ============================================ */

let currentFilter = "all";
let currentSort = "default";
let searchQuery = "";
let sim; // module-scope (Fix B pattern, needed for sparklines)
const sparklineCharts = {}; // Store Chart.js instances

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
  // Destroy stale Chart.js instances — canvas refs change on every re-render
  Object.values(sparklineCharts).forEach((c) => c.destroy());
  for (const key in sparklineCharts) delete sparklineCharts[key];

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
        <article class="stock-card" data-ticker="${stock.ticker}" style="--card-index: ${index}" onclick="openModal('${stock.ticker}')">
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
              <span class="stock-card__price price-value" id="price-${stock.ticker}">₹${price.toFixed(2)}</span>
              <span class="stock-card__change ${changeClass} change-value" id="change-${stock.ticker}">${changeSign}${changePct.toFixed(2)}%</span>
            </div>
            <div class="sparkline-container">
              <canvas class="sparkline-canvas" id="sparkline-${stock.ticker}"></canvas>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  // Init sparklines
  stocks.forEach((stock) => {
    const history = sim ? sim.getPriceHistory(stock.ticker) : [stock.basePrice];
    updateSparkline(stock.ticker, history || [stock.basePrice]);
  });
}

// ── Price Update Handler ──
function onPriceUpdate(ticker, price, pct) {
  priceState.set(ticker, { price, changePct: pct });

  const card = document.querySelector(`[data-ticker="${ticker}"]`);
  if (!card) return;

  const priceEl = document.getElementById(`price-${ticker}`);
  const changeEl = document.getElementById(`change-${ticker}`);

  if (priceEl) {
    const startValue = parseFloat(priceEl.textContent.replace("₹", ""));
    animateValue(priceEl, startValue, price, 800, "₹");
  }

  if (changeEl) {
    const sign = pct >= 0 ? "+" : "";
    const startPct = parseFloat(
      changeEl.textContent.replace("%", "").replace("+", ""),
    );
    animateValue(changeEl, startPct, pct, 800, sign, "%");
    changeEl.className = `stock-card__change ${pct >= 0 ? "stock-card__change--up" : "stock-card__change--down"} change-value`;
  }

  // Flash animation
  card.classList.remove("price-up", "price-down");
  void card.offsetWidth;
  card.classList.add(pct >= 0 ? "price-up" : "price-down");

  updateSparkline(ticker, sim.getPriceHistory(ticker));

  // Update modal if it's currently open for this ticker
  if (currentModalTicker === ticker) {
    updateModalRealTime(ticker, price, pct, sim.getPriceHistory(ticker));
  }
}

// ── Sparkline (Chart.js) ──
function updateSparkline(ticker, history) {
  const canvas = document.getElementById(`sparkline-${ticker}`);
  if (!canvas || !history || history.length < 2) return;

  const isUp = history[history.length - 1] >= history[0];
  const color = isUp ? "#22c55e" : "#ef4444";
  const bgColor = isUp ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)";

  if (sparklineCharts[ticker]) {
    sparklineCharts[ticker].data.datasets[0].data = history;
    sparklineCharts[ticker].data.datasets[0].borderColor = color;
    sparklineCharts[ticker].data.datasets[0].backgroundColor = bgColor;
    sparklineCharts[ticker].update("none"); // Update without full animation for smoothness
  } else {
    const ctx = canvas.getContext("2d");
    sparklineCharts[ticker] = new Chart(ctx, {
      type: "line",
      data: {
        labels: history.map((_, i) => i),
        datasets: [
          {
            data: history,
            borderColor: color,
            backgroundColor: bgColor,
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.4, // Smooth curves
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: {
            display: false,
            min: Math.min(...history) * 0.99,
            max: Math.max(...history) * 1.01,
          },
        },
        layout: { padding: 0 },
      },
    });
  }

  const card = document.querySelector(`[data-ticker="${ticker}"]`);
  if (card) {
    card.classList.toggle("trending-down", !isUp);
  }
}

// ── Number Animation (Tweening) ──
function animateValue(obj, start, end, duration, prefix = "", suffix = "") {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = start + (end - start) * easeProgress;
    obj.textContent = `${prefix}${current.toFixed(2)}${suffix}`;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.textContent = `${prefix}${end.toFixed(2)}${suffix}`;
    }
  };
  window.requestAnimationFrame(step);
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

// ── Apple-Style 3D Modal ──
let currentModalTicker = null;
let modalMainChart = null;

function openModal(ticker) {
  currentModalTicker = ticker;
  const stock = STOCKS.find((s) => s.ticker === ticker);
  const ps = priceState.get(ticker);
  const history = sim.getPriceHistory(ticker) || [stock.basePrice];
  const price = ps ? ps.price : stock.basePrice;
  const pct = ps ? ps.changePct : 0;

  // Populate basic info
  document.getElementById("modal-ticker").textContent = stock.ticker;
  document.getElementById("modal-name").textContent = stock.name;
  document.getElementById("calc-ticker-display").textContent = stock.ticker;
  document.getElementById("modal-high").textContent =
    `₹${stock.price52wHigh.toFixed(2)}`;
  document.getElementById("modal-low").textContent =
    `₹${stock.price52wLow.toFixed(2)}`;

  const riskBadge = document.getElementById("modal-risk");
  riskBadge.textContent = stock.risk;
  riskBadge.className = `badge badge--${stock.risk}`;

  document.getElementById("modal-price").textContent = `₹${price.toFixed(2)}`;

  const changeEl = document.getElementById("modal-change");
  changeEl.textContent = `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
  changeEl.className = `modal-change badge ${pct >= 0 ? "badge--low" : "badge--high"}`;

  // Ensure modal is on front side
  flipModalToChart();

  // Clear input
  const input = document.getElementById("modal-invest-amount");
  if (input) input.value = "";
  resetCalcPreviewModal();

  // Draw chart
  drawModalChart(ticker, history);

  // Show modal
  const overlay = document.getElementById("stock-modal");
  overlay.classList.add("open");
}

function closeModal() {
  const overlay = document.getElementById("stock-modal");
  overlay.classList.remove("open");
  currentModalTicker = null;
}

function flipModalToCalc() {
  document.getElementById("modal-flipper").classList.add("is-flipped");
  setTimeout(() => {
    document.getElementById("modal-invest-amount").focus();
  }, 400);
}

function flipModalToChart() {
  document.getElementById("modal-flipper").classList.remove("is-flipped");
}

function drawModalChart(ticker, history) {
  const canvas = document.getElementById("modal-main-chart");
  if (!canvas) return;

  const isUp = history[history.length - 1] >= history[0];
  const color = isUp ? "#22c55e" : "#ef4444";

  if (modalMainChart) {
    modalMainChart.destroy();
  }

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 180);
  gradient.addColorStop(
    0,
    isUp ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)",
  );
  gradient.addColorStop(
    1,
    isUp ? "rgba(34, 197, 94, 0)" : "rgba(239, 68, 68, 0)",
  );

  modalMainChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: history.map((_, i) => i),
      datasets: [
        {
          data: history,
          borderColor: color,
          backgroundColor: gradient,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: color,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(10,14,26,0.92)",
          borderColor: "rgba(148,163,184,0.2)",
          borderWidth: 1,
          titleColor: "#f1f5f9",
          bodyColor: "#94a3b8",
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function (context) {
              return " ₹" + context.parsed.y.toFixed(2);
            },
          },
        },
      },
      scales: {
        x: { display: false },
        y: {
          display: true,
          position: "right",
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: {
            color: "rgba(148,163,184,0.75)",
            font: { size: 10, family: "'JetBrains Mono',monospace" },
            callback: (v) => "₹" + Number(v).toFixed(0),
            maxTicksLimit: 5,
          },
          min: Math.min(...history) * 0.98,
          max: Math.max(...history) * 1.02,
        },
      },
      layout: { padding: { left: 0, right: 4, top: 4, bottom: 0 } },
    },
  });
}

function updateModalRealTime(ticker, price, pct, history) {
  const priceEl = document.getElementById("modal-price");
  const changeEl = document.getElementById("modal-change");

  if (priceEl && changeEl) {
    const startValue = parseFloat(priceEl.textContent.replace("₹", ""));
    animateValue(priceEl, startValue, price, 800, "₹");

    const startPct = parseFloat(
      changeEl.textContent.replace("%", "").replace("+", ""),
    );
    const sign = pct >= 0 ? "+" : "";
    animateValue(changeEl, startPct, pct, 800, sign, "%");
    changeEl.className = `modal-change badge ${pct >= 0 ? "badge--low" : "badge--high"}`;
  }

  if (modalMainChart && history) {
    const isUp = history[history.length - 1] >= history[0];
    const color = isUp ? "#22c55e" : "#ef4444";

    // Attempting to just update data properties to avoid flickering
    modalMainChart.data.datasets[0].data = history;
    modalMainChart.data.datasets[0].borderColor = color;
    modalMainChart.options.scales.y.min = Math.min(...history) * 0.98;
    modalMainChart.options.scales.y.max = Math.max(...history) * 1.02;
    modalMainChart.update("none");
  }

  // Update calculator preview if amounts change behind the scenes
  updateCalcPreviewModal();
}

// ── Calculator Modal Logic ──
function resetCalcPreviewModal() {
  document.getElementById("modal-calc-shares").textContent = "0.0000";
  document.getElementById("modal-calc-fee").textContent = "₹0.00";
  document.getElementById("modal-calc-total").textContent = "₹0.00";
}

function addInvestmentModal(addAmount) {
  const input = document.getElementById("modal-invest-amount");
  const current = parseFloat(input.value) || 0;
  input.value = (current + addAmount).toFixed(2);
  updateCalcPreviewModal();
}

function roundUpInvestmentModal() {
  const input = document.getElementById("modal-invest-amount");
  const current = parseFloat(input.value) || 0;
  if (current === 0) {
    input.value = "100.00";
  } else {
    const nextHundred = Math.ceil((current + 0.01) / 100) * 100;
    input.value = nextHundred.toFixed(2);
  }
  updateCalcPreviewModal();
}

function updateCalcPreviewModal() {
  if (!currentModalTicker) return;
  const input = document.getElementById("modal-invest-amount");
  if (!input) return;

  const amount = parseFloat(input.value) || 0;
  const ps = priceState.get(currentModalTicker);
  const price = ps
    ? ps.price
    : STOCKS.find((s) => s.ticker === currentModalTicker)?.basePrice || 0;

  const result = calculateFraction(amount, price);

  document.getElementById("modal-calc-shares").textContent =
    result.shares.toFixed(4);
  document.getElementById("modal-calc-fee").textContent =
    `₹${result.fee.toFixed(2)}`;
  document.getElementById("modal-calc-total").textContent =
    `₹${(amount + result.fee).toFixed(2)}`;
}

function confirmPurchaseModal() {
  if (!currentModalTicker) return;
  const input = document.getElementById("modal-invest-amount");
  const amount = parseFloat(input?.value) || 0;

  if (amount < 10) {
    showToast("Please enter at least ₹10 to invest.", "error");
    return;
  }

  const ps = priceState.get(currentModalTicker);
  const price = ps
    ? ps.price
    : STOCKS.find((s) => s.ticker === currentModalTicker)?.basePrice || 0;
  const { shares, fee } = calculateFraction(amount, price);

  if (shares <= 0) {
    showToast("Invalid investment amount.", "error");
    return;
  }

  const portfolio = JSON.parse(localStorage.getItem("portfolio") || "[]");
  const existing = portfolio.find((h) => h.ticker === currentModalTicker);

  if (existing) {
    const totalShares = existing.shares + shares;
    const totalCost = existing.avgBuy * existing.shares + (amount - fee);
    existing.avgBuy = totalCost / totalShares;
    existing.shares = totalShares;
    existing.invested = totalCost;
  } else {
    portfolio.push({
      ticker: currentModalTicker,
      shares,
      avgBuy: (amount - fee) / shares,
      invested: amount - fee,
    });
  }

  localStorage.setItem("portfolio", JSON.stringify(portfolio));

  // Persist this investment step so the portfolio staircase chart can replay it
  const totalInvested = portfolio.reduce((sum, h) => sum + h.invested, 0);
  const pLog = JSON.parse(localStorage.getItem("mv-purchase-log") || "[]");
  pLog.push({ invested: parseFloat(totalInvested.toFixed(2)) });
  if (pLog.length > 60) pLog.shift();
  localStorage.setItem("mv-purchase-log", JSON.stringify(pLog));

  closeModal();

  const stock = STOCKS.find((s) => s.ticker === currentModalTicker);
  showToast(
    `✅ Bought ${shares.toFixed(4)} shares of ${stock?.name || currentModalTicker} for ₹${amount.toFixed(2)}`,
    "success",
  );
}

// ── Calculator Core Logic ──
function calculateFraction(amount, price) {
  if (amount <= 0 || price <= 0) return { shares: 0, fee: 0 };
  const fee = amount * FEE_RATE;
  const investable = amount - fee;
  const shares = investable / price;
  return { shares, fee };
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
  const overlay = document.getElementById("nav-overlay");
  if (!toggle || !links) return;

  const close = () => {
    toggle.classList.remove("open");
    links.classList.remove("open");
    overlay?.classList.remove("open");
    document.body.style.overflow = "";
  };

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.classList.toggle("open", isOpen);
    overlay?.classList.toggle("open", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  overlay?.addEventListener("click", close);

  links.querySelectorAll(".navbar__link").forEach((link) => {
    link.addEventListener("click", close);
  });
}
