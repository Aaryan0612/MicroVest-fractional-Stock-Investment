/* ============================================
   MicroVest — Portfolio Page Logic (portfolio.js)
   INR currency, Value Trend Chart, Theme Toggle
   Includes all original fixes + Polish Plan changes
   ============================================ */

let sim;
const portfolioValueHistory = []; // Pass 5: track value over time

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  sim = new PriceSimulator(STOCKS);
  const holdings = loadPortfolio();

  let renderPending = false;
  sim.subscribe(() => {
    if (!renderPending) {
      renderPending = true;
      setTimeout(() => {
        const h = loadPortfolio();
        const prices = sim.getCurrentPrices();
        renderAll(h, prices);
        // Pass 5: record snapshot for trend chart
        const totals = calculateTotals(h, prices);
        recordValueSnapshot(totals.totalValue);
        renderPending = false;
      }, 0);
    }
  });

  sim.start();
  renderAll(holdings, sim.getCurrentPrices());

  // Record initial value
  const initTotals = calculateTotals(holdings, sim.getCurrentPrices());
  recordValueSnapshot(initTotals.totalValue);

  initNavToggle();
});

function loadPortfolio() {
  return JSON.parse(localStorage.getItem("portfolio") || "[]");
}

function calculateTotals(holdings, prices) {
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
  result.gainPct =
    result.invested > 0 ? (result.gainLoss / result.invested) * 100 : 0;
  return result;
}

function renderAll(holdings, prices) {
  const totals = calculateTotals(holdings, prices);
  renderSummaryCards(totals);
  renderChart(holdings, prices);
  renderTable(holdings, prices);
}

function renderSummaryCards(totals) {
  const totalValueEl = document.getElementById("total-value");
  const investedEl = document.getElementById("total-invested");
  const gainLossEl = document.getElementById("total-gainloss");
  const gainPctEl = document.getElementById("total-gainpct");

  if (totalValueEl)
    totalValueEl.textContent = `₹${totals.totalValue.toFixed(2)}`;
  if (investedEl) investedEl.textContent = `₹${totals.invested.toFixed(2)}`;

  if (gainLossEl) {
    const sign = totals.gainLoss >= 0 ? "+" : "";
    gainLossEl.textContent = `${sign}₹${Math.abs(totals.gainLoss).toFixed(2)}`;
    gainLossEl.className = `summary-card__value text-mono ${totals.gainLoss >= 0 ? "text-gain" : "text-loss"}`;
  }

  if (gainPctEl) {
    const sign = totals.gainPct >= 0 ? "+" : "";
    gainPctEl.textContent = `${sign}${totals.gainPct.toFixed(2)}%`;
    gainPctEl.className = `summary-card__value text-mono ${totals.gainPct >= 0 ? "text-gain" : "text-loss"}`;
  }
}

function renderChart(holdings, prices) {
  const container = document.getElementById("chart-bars");
  if (!container) return;

  if (holdings.length === 0) {
    container.innerHTML =
      '<p style="color: var(--text-muted); text-align: center; padding: var(--space-6);">No holdings to display.</p>';
    return;
  }

  let totalValue = 0;
  const holdingValues = holdings.map((h) => {
    const price = prices.get(h.ticker) ?? h.avgBuy;
    const value = price * h.shares;
    totalValue += value;
    return { ticker: h.ticker, value };
  });

  holdingValues.sort((a, b) => b.value - a.value);

  container.innerHTML = holdingValues
    .map((hv) => {
      const pct = totalValue > 0 ? (hv.value / totalValue) * 100 : 0;
      return `
        <div class="chart-bar">
          <span class="chart-bar__label">${hv.ticker}</span>
          <div class="chart-bar__track">
            <div class="chart-bar__fill" style="--bar-width: ${pct}%"></div>
          </div>
          <span class="chart-bar__value">${pct.toFixed(1)}%</span>
        </div>
      `;
    })
    .join("");
}

function renderTable(holdings, prices) {
  const tbody = document.getElementById("holdings-tbody");
  const empty = document.getElementById("empty-portfolio");

  if (holdings.length === 0) {
    if (tbody) tbody.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;
  if (!tbody) return;

  tbody.innerHTML = holdings
    .map((h) => {
      const stock = STOCKS.find((s) => s.ticker === h.ticker);
      const currentPrice = prices.get(h.ticker) ?? h.avgBuy;
      const currentValue = currentPrice * h.shares;
      const gainLoss = currentValue - h.invested;
      const gainPct = h.invested > 0 ? (gainLoss / h.invested) * 100 : 0;
      const isGain = gainLoss >= 0;
      const sign = isGain ? "+" : "";
      const colorClass = isGain ? "text-gain" : "text-loss";

      return `
        <tr>
          <td>
            <div class="stock-info">
              <span class="stock-info__ticker">${h.ticker}</span>
              <span class="stock-info__name">${stock?.name || h.ticker}</span>
            </div>
          </td>
          <td class="mono">${h.shares.toFixed(4)}</td>
          <td class="mono">₹${h.avgBuy.toFixed(2)}</td>
          <td class="mono">₹${currentPrice.toFixed(2)}</td>
          <td class="mono">₹${currentValue.toFixed(2)}</td>
          <td>
            <div class="gain-cell">
              <span class="gain-cell__amount ${colorClass}">${sign}₹${Math.abs(gainLoss).toFixed(2)}</span>
              <span class="gain-cell__pct ${colorClass}">${sign}${gainPct.toFixed(2)}%</span>
            </div>
          </td>
          <td>
            <button class="remove-btn" onclick="removeHolding('${h.ticker}')">Remove</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// ── Pass 5: Value Trend Chart ──
function recordValueSnapshot(totalValue) {
  portfolioValueHistory.push(totalValue);
  if (portfolioValueHistory.length > 40) portfolioValueHistory.shift();
  updateTrendChart();
}

function updateTrendChart() {
  const line = document.querySelector(".trend-line");
  const area = document.querySelector(".trend-area");
  const startEl = document.getElementById("trend-start");
  const endEl = document.getElementById("trend-end");

  if (!line || portfolioValueHistory.length < 2) return;

  const history = portfolioValueHistory;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;

  const points = history
    .map((val, i) => {
      const x = (i / (history.length - 1)) * 400;
      const y = 80 - ((val - min) / range) * 72 + 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  line.setAttribute("points", points);

  // Area fill path
  const lastX = ((history.length - 1) / (history.length - 1)) * 400;
  area.setAttribute(
    "d",
    `M0,80 L${points.split(" ").join(" L")} L${lastX},80 Z`,
  );

  if (startEl) startEl.textContent = `₹${history[0].toFixed(2)}`;
  if (endEl) endEl.textContent = `₹${history[history.length - 1].toFixed(2)}`;
}

function removeHolding(ticker) {
  const portfolio = JSON.parse(localStorage.getItem("portfolio") || "[]");
  const updated = portfolio.filter((h) => h.ticker !== ticker);
  localStorage.setItem("portfolio", JSON.stringify(updated));
  renderAll(updated, sim.getCurrentPrices());
  showToast(`Removed ${ticker} from portfolio.`, "success");
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
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
