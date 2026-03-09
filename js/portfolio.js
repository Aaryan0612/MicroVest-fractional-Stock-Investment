/* ============================================
   MicroVest — Portfolio Page Logic (portfolio.js)
   INR currency, Value Trend Chart, Theme Toggle
   Includes all original fixes + Polish Plan changes
   ============================================ */

let sim;
const portfolioValueHistory = []; // portfolio value snapshots
const portfolioInvestedHistory = []; // invested amount snapshots (stepped)
let trendChartInstance = null;
let performanceChartInstance = null;

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
        recordValueSnapshot(totals.totalValue, totals.invested);
        renderPending = false;
      }, 0);
    }
  });

  // Pre-populate staircase chart history from persisted purchase log
  initHistoryFromLog();

  sim.start();
  renderAll(holdings, sim.getCurrentPrices());

  // Record initial value
  const initTotals = calculateTotals(holdings, sim.getCurrentPrices());
  recordValueSnapshot(initTotals.totalValue, initTotals.invested);

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
  renderPerformanceChart(holdings, prices);
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
      "₹",
    );
  if (investedEl)
    animateValue(
      investedEl,
      getCurrentValue(investedEl),
      totals.invested,
      800,
      "₹",
    );

  if (gainLossEl) {
    const sign = totals.gainLoss >= 0 ? "+" : "";
    animateValue(
      gainLossEl,
      getCurrentValue(gainLossEl),
      Math.abs(totals.gainLoss),
      800,
      sign + "₹",
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
    .replace("₹", "")
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

function renderPerformanceChart(holdings, prices) {
  const canvas = document.getElementById("perf-chart");
  const emptyMsg = document.getElementById("empty-perf-chart");
  if (!canvas) return;

  if (holdings.length === 0) {
    if (emptyMsg) emptyMsg.hidden = false;
    if (performanceChartInstance) {
      performanceChartInstance.destroy();
      performanceChartInstance = null;
    }
    return;
  }

  if (emptyMsg) emptyMsg.hidden = true;

  const labels = holdings.map((h) => h.ticker);
  const investedData = holdings.map((h) => parseFloat(h.invested.toFixed(2)));
  const currentData = holdings.map((h) =>
    parseFloat(((prices.get(h.ticker) ?? h.avgBuy) * h.shares).toFixed(2)),
  );

  const gainBg = currentData.map((v, i) =>
    v >= investedData[i] ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)",
  );
  const gainBorder = currentData.map((v, i) =>
    v >= investedData[i] ? "rgba(34,197,94,1)" : "rgba(239,68,68,1)",
  );

  if (performanceChartInstance) {
    performanceChartInstance.data.labels = labels;
    performanceChartInstance.data.datasets[0].data = investedData;
    performanceChartInstance.data.datasets[1].data = currentData;
    performanceChartInstance.data.datasets[1].backgroundColor = gainBg;
    performanceChartInstance.data.datasets[1].borderColor = gainBorder;
    performanceChartInstance.update("none");
    return;
  }

  const ctx = canvas.getContext("2d");
  performanceChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Invested (₹)",
          data: investedData,
          backgroundColor: "rgba(99,102,241,0.55)",
          borderColor: "rgba(99,102,241,0.9)",
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: "Current Value (₹)",
          data: currentData,
          backgroundColor: gainBg,
          borderColor: gainBorder,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500, easing: "easeOutQuart" },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          align: "end",
          labels: {
            color: "rgba(241,245,249,0.85)",
            font: { family: "'Inter',sans-serif", size: 12 },
            boxWidth: 12,
            borderRadius: 4,
            padding: 16,
          },
        },
        tooltip: {
          backgroundColor: "rgba(10,14,26,0.95)",
          borderColor: "rgba(148,163,184,0.2)",
          borderWidth: 1,
          titleColor: "#f1f5f9",
          bodyColor: "#94a3b8",
          padding: 14,
          cornerRadius: 10,
          callbacks: {
            label: (ctx) =>
              ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toFixed(2)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "rgba(148,163,184,0.9)",
            font: {
              family: "'JetBrains Mono',monospace",
              size: 11,
              weight: "500",
            },
          },
          grid: { color: "rgba(255,255,255,0.04)" },
          border: { color: "rgba(255,255,255,0.08)" },
        },
        y: {
          ticks: {
            color: "rgba(148,163,184,0.9)",
            callback: (v) => "₹" + Number(v).toFixed(0),
          },
          grid: { color: "rgba(255,255,255,0.06)" },
          border: { color: "rgba(255,255,255,0.08)" },
          beginAtZero: true,
        },
      },
    },
  });
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

// ── Replay purchase log to pre-build staircase on page load ──
function initHistoryFromLog() {
  const log = JSON.parse(localStorage.getItem("mv-purchase-log") || "[]");
  if (log.length === 0) return;

  // Each entry becomes one stair step.
  // Value history starts neutral (= invested amount at purchase time)
  // and will diverge in real-time once live snapshots start appending.
  log.forEach((entry) => {
    portfolioInvestedHistory.push(entry.invested);
    portfolioValueHistory.push(entry.invested);
  });
}

// ── Value Trend Chart (Groww-style: value + stepped invested) ──
function recordValueSnapshot(totalValue, totalInvested) {
  portfolioValueHistory.push(totalValue);
  portfolioInvestedHistory.push(totalInvested);
  // Keep up to 80 snapshots (~160 seconds of history)
  if (portfolioValueHistory.length > 80) {
    portfolioValueHistory.shift();
    portfolioInvestedHistory.shift();
  }
  updateTrendChart();
}

function updateTrendChart() {
  const canvas = document.getElementById("portfolio-trend-chart");
  if (!canvas || portfolioValueHistory.length < 2) return;

  const valueHist = portfolioValueHistory;
  const investedHist = portfolioInvestedHistory;
  const latestValue = valueHist[valueHist.length - 1];
  const latestInvested = investedHist[investedHist.length - 1];

  // Update Groww-style header live values
  const liveValueEl = document.getElementById("trend-value-live");
  const liveInvestedEl = document.getElementById("trend-invested-live");
  if (liveValueEl)
    animateValue(
      liveValueEl,
      getCurrentValue(liveValueEl),
      latestValue,
      600,
      "₹",
    );
  if (liveInvestedEl)
    animateValue(
      liveInvestedEl,
      getCurrentValue(liveInvestedEl),
      latestInvested,
      600,
      "₹",
    );

  // Compute y-axis bounds across both datasets
  const allVals = [...valueHist, ...investedHist].filter((v) => v > 0);
  const yMin = allVals.length ? Math.min(...allVals) * 0.97 : 0;
  const yMax = allVals.length ? Math.max(...allVals) * 1.03 : 1;

  if (trendChartInstance) {
    // Live update — no animation for smoothness
    trendChartInstance.data.labels = valueHist.map((_, i) => i);
    trendChartInstance.data.datasets[0].data = valueHist;
    trendChartInstance.data.datasets[1].data = investedHist;
    trendChartInstance.options.scales.y.min = yMin;
    trendChartInstance.options.scales.y.max = yMax;
    trendChartInstance.update("none");
    return;
  }

  // First render — build the chart
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, "rgba(99, 102, 241, 0.28)");
  gradient.addColorStop(0.6, "rgba(99, 102, 241, 0.08)");
  gradient.addColorStop(1, "rgba(99, 102, 241, 0)");

  trendChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: valueHist.map((_, i) => i),
      datasets: [
        {
          // Dataset 0: Portfolio value — solid, filled
          label: "Portfolio Value",
          data: valueHist,
          borderColor: "#6366f1",
          backgroundColor: gradient,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: "#6366f1",
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 2,
          fill: true,
          tension: 0.35,
          order: 1,
        },
        {
          // Dataset 1: Invested — stepped dashed line, no fill
          // stepped:'before' = stays flat then jumps → staircase effect
          label: "Invested",
          data: investedHist,
          borderColor: "rgba(148, 163, 184, 0.7)",
          backgroundColor: "transparent",
          borderWidth: 2,
          borderDash: [7, 5],
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "rgba(148,163,184,0.9)",
          fill: false,
          stepped: "before",
          order: 2,
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
          backgroundColor: "rgba(10, 14, 26, 0.92)",
          borderColor: "rgba(148, 163, 184, 0.2)",
          borderWidth: 1,
          titleColor: "#f1f5f9",
          bodyColor: "#94a3b8",
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: () => "",
            label: (ctx) =>
              ` ${ctx.dataset.label}: ₹${ctx.parsed.y.toFixed(2)}`,
          },
        },
      },
      scales: {
        x: { display: false },
        y: {
          display: false,
          min: yMin,
          max: yMax,
        },
      },
      layout: { padding: { left: 4, right: 4, top: 8, bottom: 0 } },
    },
  });
}

function removeHolding(ticker) {
  const portfolio = JSON.parse(localStorage.getItem("portfolio") || "[]");
  const updated = portfolio.filter((h) => h.ticker !== ticker);
  localStorage.setItem("portfolio", JSON.stringify(updated));

  // Log the step-down so the staircase reflects the removal
  const totalInvested = updated.reduce((sum, h) => sum + h.invested, 0);
  const pLog = JSON.parse(localStorage.getItem("mv-purchase-log") || "[]");
  pLog.push({ invested: parseFloat(totalInvested.toFixed(2)) });
  if (pLog.length > 60) pLog.shift();
  localStorage.setItem("mv-purchase-log", JSON.stringify(pLog));

  // Reset in-memory history and rebuild from updated log so chart is clean
  portfolioValueHistory.length = 0;
  portfolioInvestedHistory.length = 0;
  if (trendChartInstance) {
    trendChartInstance.destroy();
    trendChartInstance = null;
  }
  initHistoryFromLog();

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
