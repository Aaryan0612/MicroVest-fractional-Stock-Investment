/* ============================================
   MicroVest — Landing Page Logic (landing.js)
   Standalone logic for the hero ticker animation
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initNavToggle();
  initNavbarScroll();
  initHeroTicker();
});

// ── Theme Toggle ──
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

// ── Navbar Scroll Effect ──
function initNavbarScroll() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 10) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  // trigger immediately
  if (window.scrollY > 10) navbar.classList.add("scrolled");
}

// ── Hero Ticker Animation ──
// Sub-implementation of the PriceSimulator logic just for the hero presentation
function initHeroTicker() {
  const priceEl = document.getElementById("hero-price");
  const changeEl = document.getElementById("hero-change");
  const sparkEl = document.getElementById("hero-sparkline");
  const cardEl = document.getElementById("hero-ticker");

  if (!priceEl || !changeEl || !sparkEl || !cardEl) return;

  const basePrice = 2850.0;
  let currentPrice = basePrice;
  let history = Array(15).fill(basePrice);

  setInterval(() => {
    // 1. Calculate new price
    const change = 0.006 * (Math.random() - 0.5) * 0.3; // matches simulator dampening
    const newPrice = currentPrice * (1 + change);
    const pct = ((newPrice - currentPrice) / currentPrice) * 100;

    currentPrice = newPrice;
    history.push(currentPrice);
    if (history.length > 15) history.shift();

    // 2. Update text
    priceEl.textContent = `₹${currentPrice.toFixed(2)}`;
    const sign = pct >= 0 ? "+" : "";
    changeEl.textContent = `${sign}${pct.toFixed(2)}%`;

    changeEl.className = `ticker-change mono ${pct >= 0 ? "text-gain" : "text-loss"}`;

    // 3. Update sparkline
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;

    const points = history
      .map((p, i) => {
        const x = (i / (history.length - 1)) * 100;
        const y = 30 - ((p - min) / range) * 26 + 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    sparkEl.setAttribute("points", points);
    sparkEl.setAttribute(
      "stroke",
      pct >= 0 ? "var(--color-gain)" : "var(--color-loss)",
    );

    // 4. Border flash
    cardEl.classList.remove("price-up", "price-down");
    void cardEl.offsetWidth; // force reflow
    cardEl.classList.add(pct >= 0 ? "price-up" : "price-down");
  }, 2000);
}
