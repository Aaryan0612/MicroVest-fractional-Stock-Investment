/* ============================================
   MicroVest — Portfolio Page Logic (portfolio.js)
   INR currency, Value Trend Chart, Theme Toggle
   Includes all original fixes + Polish Plan changes
   ============================================ */

let sim;
const portfolioValueHistory = []; // Pass 5: track value over time
let trendChartInstance = null;

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
    animateValue(
      totalValueEl,
      getCurrentValue(totalValueEl),
      totals.totalValue,
      800,
      "$",
    );
  if (investedEl)
    animateValue(
      investedEl,
      getCurrentValue(investedEl),
      totals.invested,
      800,
      "$",
    );

  if (gainLossEl) {
    const sign = totals.gainLoss >= 0 ? "+" : "";
    animateValue(
      gainLossEl,
      getCurrentValue(gainLossEl),
      Math.abs(totals.gainLoss),
      800,
      sign + "$",
    );
    gainLossEl.className = `summary-card__value text-mono ${totals.gainLoss >= 0 ? "text-gain" : "text-loss"}`;
  }

  if (gainPctEl) {
    const sign = totals.gainPct >= 0 ? "+" : "";
    animateValue(
      gainPctEl,
      getCurrentValue(gainPctEl, "%"),
      totals.gainPct,
      800,
      sign,
      "%",
    );
    gainPctEl.className = `summary-card__value text-mono ${totals.gainPct >= 0 ? "text-gain" : "text-loss"}`;
  }
}

function getCurrentValue(el, ignoreSuffix = "") {
  if (!el) return 0;
  const text = el.textContent
    .replace("$", "")
    .replace("+", "")
    .replace(ignoreSuffix, "");
  const val = parseFloat(text);
  return isNaN(val) ? 0 : val;
}

// ── Number Animation (Tweening) ──
function animateValue(obj, start, end, duration, prefix = "", suffix = "") {
  if (start === end) {
    obj.textContent = `${prefix}${end.toFixed(2)}${suffix}`;
    return;
  }
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const Math_progress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
    const current = start + (end - start) * Math_progress;
    obj.textContent = `${prefix}${current.toFixed(2)}${suffix}`;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.textContent = `${prefix}${end.toFixed(2)}${suffix}`;
    }
  };
  window.requestAnimationFrame(step);
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
  const canvas = document.getElementById("portfolio-trend-chart");
  const startEl = document.getElementById("trend-start");
  const endEl = document.getElementById("trend-end");

  if (!canvas || portfolioValueHistory.length < 2) return;

  const history = portfolioValueHistory;

  if (trendChartInstance) {
    trendChartInstance.data.labels = history.map((_, i) => i);
    trendChartInstance.data.datasets[0].data = history;
    trendChartInstance.update("none");
  } else {
    const ctx = canvas.getContext("2d");

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 80);
    gradient.addColorStop(0, "rgba(0, 212, 255, 0.4)");
    gradient.addColorStop(1, "rgba(0, 212, 255, 0)");

    trendChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: history.map((_, i) => i),
        datasets: [
          {
            data: history,
            borderColor: "#00d4ff",
            backgroundColor: gradient,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return "₹" + context.parsed.y.toFixed(2);
              },
            },
          },
        },
        scales: {
          x: { display: false },
          y: {
            display: false,
            min: Math.min(...history) * 0.95,
            max: Math.max(...history) * 1.05,
          },
        },
        layout: { padding: 0 },
      },
    });
  }

  if (startEl)
    animateValue(startEl, getCurrentValue(startEl), history[0], 800, "₹");
  if (endEl)
    animateValue(
      endEl,
      getCurrentValue(endEl),
      history[history.length - 1],
      800,
      "₹",
    );
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
