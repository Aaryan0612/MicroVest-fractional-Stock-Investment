/* ============================================
   MicroVest — Price Simulator (simulator.js)
   PriceSimulator class with dampened GBM
   Includes Fix #8, Fix D, Pass 2 volatility tuning
   ============================================ */

class PriceSimulator {
  #stocks;
  #history;
  #intervalId;
  #callbacks;

  constructor(stocksData) {
    this.#stocks = stocksData.map((s) => ({ ...s, price: s.basePrice }));
    this.#history = new Map(stocksData.map((s) => [s.ticker, [s.basePrice]]));
    this.#intervalId = null;
    this.#callbacks = [];
  }

  start() {
    this.#intervalId = setInterval(() => this.#tick(), SIM_INTERVAL_MS);
  }

  stop() {
    clearInterval(this.#intervalId);
  }

  subscribe(fn) {
    this.#callbacks.push(fn);
  }

  #tick() {
    this.#stocks.forEach((stock) => {
      const prevPrice = stock.price;
      stock.price = this.#calcNewPrice(stock);
      const changePct = ((stock.price - prevPrice) / prevPrice) * 100;

      const hist = this.#history.get(stock.ticker);
      hist.push(stock.price);
      if (hist.length > 60) hist.shift();

      this.#callbacks.forEach((fn) => fn(stock.ticker, stock.price, changePct));
    });
  }

  // Pass 2: 0.3× dampening + 60-160% drift guard
  #calcNewPrice(stock) {
    const change = stock.volatility * (Math.random() - 0.5) * 0.3;
    const newPrice = stock.price * (1 + change);
    const floor = stock.basePrice * 0.6;
    const ceiling = stock.basePrice * 1.6;
    return Math.min(Math.max(newPrice, floor), ceiling);
  }

  getCurrentPrices() {
    return new Map(this.#stocks.map((s) => [s.ticker, s.price]));
  }

  getStock(ticker) {
    const s = this.#stocks.find((s) => s.ticker === ticker);
    return s ? { ...s } : null;
  }

  getPriceHistory(ticker) {
    return this.#history.get(ticker);
  }
}
