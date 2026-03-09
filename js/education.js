/* ============================================
   MicroVest — Education Page Logic (education.js)
   Accordion, Quiz, Nav Toggle
   Includes Fixes: E, F
   ============================================ */

// ── Glossary Terms ──
const GLOSSARY = [
  {
    term: "Fractional Share",
    def: "A portion of a full stock share. Instead of buying 1 whole share of BAJFINANCE at ₹7,210, you can buy 0.01 shares for ~₹72.",
  },
  {
    term: "Portfolio",
    def: "A collection of all your investments. Diversifying your portfolio means spreading investments across different stocks and sectors.",
  },
  {
    term: "Ticker Symbol",
    def: "A unique abbreviation used to identify a publicly traded stock. For example, AAPL represents Apple Inc.",
  },
  {
    term: "Market Price",
    def: "The current price at which a stock can be bought or sold. It changes constantly based on supply and demand.",
  },
  {
    term: "Volatility",
    def: "A measure of how much a stock's price fluctuates. Higher volatility means bigger price swings — both up and down.",
  },
  {
    term: "Dividend",
    def: "A portion of a company's profits distributed to shareholders, usually paid quarterly.",
  },
  {
    term: "52-Week Range",
    def: "The lowest and highest prices a stock has traded at during the past 52 weeks (one year).",
  },
  {
    term: "Average Buy Price",
    def: "The weighted average price you've paid per share across all your purchases of a particular stock.",
  },
  {
    term: "Gain/Loss",
    def: "The difference between the current value of your investment and what you originally paid. Positive = gain, negative = loss.",
  },
  {
    term: "Broker Fee",
    def: "A fee charged by the platform for processing your trade. MicroVest charges a flat 0.5% fee on every transaction.",
  },
  {
    term: "Bull Market",
    def: "A period when stock prices are generally rising, typically by 20% or more from recent lows.",
  },
  {
    term: "Bear Market",
    def: "A period when stock prices are generally falling, typically by 20% or more from recent highs.",
  },
  {
    term: "Blue Chip",
    def: "Large, well-established, financially sound companies with a history of stable earnings. Examples: RELIANCE, TCS, HDFCBANK.",
  },
  {
    term: "Diversification",
    def: "Spreading your investments across different stocks, sectors, and risk levels to reduce overall portfolio risk.",
  },
  {
    term: "Geometric Brownian Motion",
    def: "A mathematical model used to simulate realistic stock price movements. MicroVest uses a simplified version for its price simulator.",
  },
];

// ── Quiz Questions ──
const QUIZ_QUESTIONS = [
  {
    question: "What is a fractional share?",
    options: [
      "A share that has lost value",
      "A portion of a full stock share",
      "A share in a startup company",
      "A share that pays dividends",
    ],
    correct: 1,
    explanation:
      "A fractional share lets you own a portion of a stock — so you can invest in expensive stocks like BAJFINANCE without buying a full share.",
  },
  {
    question: "Which risk level has the HIGHEST volatility?",
    options: [
      "Low risk (e.g., RELIANCE)",
      "Medium risk (e.g., INFY)",
      "High risk (e.g., ADANIENT)",
      "All stocks have equal volatility",
    ],
    correct: 2,
    explanation:
      "High-risk stocks like ADANIENT (volatility: 0.024) have much larger price swings than low-risk stocks like RELIANCE (volatility: 0.006).",
  },
  {
    question: "What does the 52-week range show?",
    options: [
      "The stock's price 52 weeks ago",
      "The lowest and highest price in the past year",
      "The average price over 52 weeks",
      "The predicted price for next 52 weeks",
    ],
    correct: 1,
    explanation:
      "The 52-week range shows the lowest and highest prices a stock has traded at during the past year, giving you context for where the current price sits.",
  },
  {
    question: "What happens when you buy the same stock twice on MicroVest?",
    options: [
      "A duplicate entry is created",
      "The second purchase is rejected",
      "Your holdings are merged with an updated average buy price",
      "Only the latest purchase is kept",
    ],
    correct: 2,
    explanation:
      "MicroVest merges holdings — your shares are added together and the average buy price is recalculated using a weighted average.",
  },
  {
    question: "What fee does MicroVest charge per transaction?",
    options: ["0%", "0.5%", "1%", "2.5%"],
    correct: 1,
    explanation:
      "MicroVest charges a flat 0.5% platform fee on every investment, which is deducted from your investment amount before buying shares.",
  },
];

// Fix F: quizState uses currentQuestion consistently — never quizState.current
const quizState = { currentQuestion: 0, score: 0, answered: false };

// ── Init ──
document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  renderGlossary();
  initAccordion();
  renderQuestion(0);
  initNavToggle();
});

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

// ── Glossary Accordion ──
function renderGlossary() {
  const container = document.getElementById("glossary-accordion");
  if (!container) return;

  container.innerHTML = GLOSSARY.map(
    (item, i) => `
    <div class="accordion-item">
      <button
        class="accordion-btn"
        aria-expanded="false"
        aria-controls="glossary-content-${i}"
        id="glossary-btn-${i}"
      >
        <span>${item.term}</span>
        <span class="accordion-icon">+</span>
      </button>
      <div
        class="accordion-content"
        id="glossary-content-${i}"
        role="region"
        aria-labelledby="glossary-btn-${i}"
        aria-hidden="true"
      >
        <div class="accordion-content__inner">${item.def}</div>
      </div>
    </div>
  `,
  ).join("");
}

function initAccordion() {
  const container = document.getElementById("glossary-accordion");
  if (!container) return;

  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".accordion-btn");
    if (btn) toggleAccordion(btn);
  });
}

// Fix E: toggleAccordion sets both aria-expanded AND aria-hidden
function toggleAccordion(btn) {
  const content = btn.nextElementSibling;
  const isOpen = btn.getAttribute("aria-expanded") === "true";

  btn.setAttribute("aria-expanded", String(!isOpen));
  content.setAttribute("aria-hidden", String(isOpen)); // Fix E

  content.style.maxHeight = isOpen ? "0" : content.scrollHeight + "px";
  btn.querySelector(".accordion-icon").textContent = isOpen ? "+" : "×";
}

// ── Quiz ──
function renderQuestion(index) {
  const area = document.getElementById("quiz-question-area");
  const progressText = document.getElementById("quiz-progress-text");
  const progressFill = document.getElementById("quiz-progress-fill");
  const progress = document.getElementById("quiz-progress");

  if (!area) return;

  // Check if quiz is complete
  if (index >= QUIZ_QUESTIONS.length) {
    renderScoreScreen();
    return;
  }

  // Show progress bar
  if (progress) progress.style.display = "";
  if (progressText)
    progressText.textContent = `Question ${index + 1} of ${QUIZ_QUESTIONS.length}`;
  if (progressFill)
    progressFill.style.width = `${((index + 1) / QUIZ_QUESTIONS.length) * 100}%`;

  const q = QUIZ_QUESTIONS[index];
  quizState.answered = false;

  area.innerHTML = `
    <p class="quiz-question">${q.question}</p>
    <div class="quiz-options" id="quiz-options">
      ${q.options
        .map(
          (opt, i) =>
            `<button class="quiz-option" data-index="${i}" id="quiz-opt-${i}">${opt}</button>`,
        )
        .join("")}
    </div>
    <div id="quiz-feedback-area"></div>
  `;

  // Event listeners
  const options = area.querySelectorAll(".quiz-option");
  options.forEach((opt) => {
    opt.addEventListener("click", () =>
      handleAnswer(parseInt(opt.dataset.index)),
    );
  });
}

function handleAnswer(selectedIndex) {
  if (quizState.answered) return;
  quizState.answered = true;

  const q = QUIZ_QUESTIONS[quizState.currentQuestion]; // Fix F: uses currentQuestion
  const isCorrect = selectedIndex === q.correct;

  if (isCorrect) quizState.score++;

  // Mark options
  const options = document.querySelectorAll(".quiz-option");
  options.forEach((opt, i) => {
    opt.disabled = true;
    if (i === q.correct) {
      opt.classList.add("correct");
    } else if (i === selectedIndex && !isCorrect) {
      opt.classList.add("incorrect");
    }
  });

  // Show feedback
  const feedbackArea = document.getElementById("quiz-feedback-area");
  if (feedbackArea) {
    feedbackArea.innerHTML = `
      <div class="quiz-feedback ${isCorrect ? "quiz-feedback--correct" : "quiz-feedback--incorrect"}">
        ${isCorrect ? "✅ Correct!" : "❌ Incorrect."} ${q.explanation}
      </div>
      <button class="btn btn-primary btn-sm quiz-next-btn" id="quiz-next-btn">
        ${quizState.currentQuestion < QUIZ_QUESTIONS.length - 1 ? "Next Question →" : "See Results →"}
      </button>
    `;

    document.getElementById("quiz-next-btn").addEventListener("click", () => {
      quizState.currentQuestion++; // Fix F: uses currentQuestion
      renderQuestion(quizState.currentQuestion);
    });
  }
}

function renderScoreScreen() {
  const area = document.getElementById("quiz-question-area");
  const progress = document.getElementById("quiz-progress");
  if (progress) progress.style.display = "none";

  const pct = Math.round((quizState.score / QUIZ_QUESTIONS.length) * 100);
  let icon = "🎉";
  let message = "Excellent! You're ready to start investing!";

  if (pct < 40) {
    icon = "📖";
    message = "Keep learning! Review the sections above and try again.";
  } else if (pct < 80) {
    icon = "👍";
    message = "Good job! A few more reads and you'll be an expert.";
  }

  area.innerHTML = `
    <div class="quiz-score">
      <div class="quiz-score__icon">${icon}</div>
      <h3 class="quiz-score__title">Quiz Complete!</h3>
      <div class="quiz-score__value">${quizState.score}/${QUIZ_QUESTIONS.length}</div>
      <p class="quiz-score__text">${message}</p>
      <button class="btn btn-primary" id="quiz-retake-btn">🔄 Retake Quiz</button>
    </div>
  `;

  document
    .getElementById("quiz-retake-btn")
    .addEventListener("click", resetQuiz);
}

// Fix F: resetQuiz uses currentQuestion consistently
function resetQuiz() {
  quizState.currentQuestion = 0;
  quizState.score = 0;
  quizState.answered = false;
  renderQuestion(0);
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
