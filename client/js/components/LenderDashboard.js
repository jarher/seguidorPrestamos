import { store } from "../services/store.js";
import { formatCurrency } from "../utils/calculations.js";
import { ReportService } from "../services/ReportService.js";
import { sanitize } from "../utils/sanitize.js";

export class LenderDashboard extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = `
            <div class="dashboard-wrapper">
                <header class="view-header">
                    <div class="view-header-content">
                        <h1>Resumen del Portafolio</h1>
                        <p>Rendimiento en tiempo real de tu capital gestionado.</p>
                    </div>
                    <div class="dashboard-actions">
                        <button class="btn btn-primary" id="add-loan-btn">+ Nuevo Préstamo</button>
                        <button class="btn btn-secondary" id="generate-report-btn">Generar Reporte</button>
                    </div>
                </header>
                <div class="stats-grid">
                    <div class="stat-card glass">
                        <div class="stat-header">
                            <span class="icon">💰</span>
                            <span class="trend positive">+12% vs mes pasado</span>
                        </div>
                        <div class="stat-value" id="total-capital">$0</div>
                        <div class="stat-label">Capital Total Prestado</div>
                    </div>
                    <div class="stat-card glass border-green">
                        <div class="stat-header">
                            <span class="icon">📈</span>
                            <span class="trend positive">100% saludable</span>
                        </div>
                        <div class="stat-value" id="total-interest">$0</div>
                        <div class="stat-label">Intereses Ganados (YTD)</div>
                    </div>
                    <div class="stat-card glass border-orange">
                        <div class="stat-header">
                            <span class="icon">⚠️</span>
                            <span class="trend negative">0 Cobros Pendientes</span>
                        </div>
                        <div class="stat-value" id="total-arrears">$0</div>
                        <div class="stat-label">Capital en Mora</div>
                    </div>
                </div>

                <div class="stats-grid">
                  <section class="upcoming-week-section">
                      <div class="section-header">
                          <h2>📆 Próximos 7 Días</h2>
                      </div>
                      <div class="due-today-grid" id="upcoming-week-list">
                          <p class="empty-msg">No hay cobros programados para esta semana.</p>
                      </div>
                  </section>

                  <section class="due-today-section">
                      <div class="section-header">
                          <h2>📅 Cobros para Hoy</h2>
                          <span class="badge priority">PRIORIDAD</span>
                      </div>
                      <div class="due-today-grid" id="due-today-list">
                          <!-- Se llenará dinámicamente -->
                          <p class="empty-msg">No hay cobros programados para hoy.</p>
                      </div>
                  </section>
                </div>
            </div>
        `;
  }

  connectedCallback() {
    this.updateStats();
    this.querySelector("#add-loan-btn").addEventListener("click", () => {
      window.dispatchEvent(
        new CustomEvent("view-change", { detail: "new-loan" }),
      );
    });

    this.querySelector("#generate-report-btn").addEventListener("click", () => {
      const { loans } = store.getState();
      ReportService.generatePortfolioReport(loans);
    });

    store.subscribe(() => this.updateStats());
  }

  updateStats() {
    const { loans } = store.getState();
    const baseCurrency = store.getCurrency();
    const displayCurrency = store.getDisplayCurrency();

    const totalCapital = loans.reduce((acc, loan) => acc + loan.amount, 0);
    const totalInterest = loans.reduce(
      (acc, loan) =>
        acc + (loan.paymentsHistory || []).reduce(
          (pAcc, p) => pAcc + (parseFloat(p.interest) || 0), 0,
        ),
      0,
    );

    this.querySelector("#total-capital").textContent =
      formatCurrency(store.convertForDisplay(totalCapital, baseCurrency), displayCurrency);
    this.querySelector("#total-interest").textContent =
      formatCurrency(store.convertForDisplay(totalInterest, baseCurrency), displayCurrency);

    this.updateDueToday(loans);
    this.updateUpcomingWeek(loans);
  }

  updateUpcomingWeek(loans) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const upcomingList = [];

    loans.forEach((loan) => {
      (loan.schedule || []).forEach((p) => {
        if (p.status === "pendiente") {
          const dueDate = new Date(p.date);
          if (dueDate > today && dueDate <= weekFromNow) {
            const daysUntil = Math.ceil(
              (dueDate - today) / (1000 * 60 * 60 * 24),
            );
            upcomingList.push({
              borrower: loan.borrowerName,
              amount: p.totalPayment,
              date: p.date,
              daysUntil: daysUntil,
              loanId: loan.id,
            });
          }
        }
      });
    });

    const sortedList = upcomingList.sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    const container = this.querySelector("#upcoming-week-list");
    if (sortedList.length === 0) {
      container.innerHTML = `
                <div class="empty-state-container" style="padding: 1.5rem; margin: 0;">
                    <span class="empty-state-icon" style="font-size: 2rem;">📅</span>
                    <h3 class="empty-state-title" style="font-size: 0.9rem;">Sin cobros próximos</h3>
                    <p class="empty-state-msg" style="font-size: 0.8rem;">No hay cobros programados para los próximos 7 días.</p>
                </div>
            `;
      return;
    }

        container.innerHTML = sortedList
      .map((item) => {
        const safeBorrower = sanitize(item.borrower || '');
        const safeLoanId = sanitize(item.loanId || '');
        const dateObj = new Date(item.date);
        const dayName = dateObj.toLocaleDateString("es-ES", {
          weekday: "short",
        });
        const dayNum = dateObj.getDate();

        return `
                <div class="due-card glass" data-loan-id="${safeLoanId}">
                    <div class="due-info">
                        <h3>${safeBorrower}</h3>
                        <p class="due-amount">${formatCurrency(store.convertForDisplay(item.amount, store.getCurrency()), store.getDisplayCurrency())}</p>
                        <p class="due-date">
                            <span class="day-badge">${dayName} ${dayNum}</span>
                            <span class="days-label">${item.daysUntil === 1 ? "Mañana" : `En ${item.daysUntil} días`}</span>
                        </p>
                    </div>
                    <button class="btn btn-secondary btn-sm" data-loan-id="${safeLoanId}">Ver</button>
                </div>
            `;
      })
      .join("");
  }

  updateDueToday(loans) {
    const today = new Date().toISOString().split("T")[0];
    const dueTodayList = [];

    loans.forEach((loan) => {
      const schedule = loan.schedule || [];
      schedule.forEach((payment) => {
        if (payment.date === today && payment.status === "pendiente") {
          dueTodayList.push({
            borrower: loan.borrowerName,
            amount: payment.totalPayment,
            installment: payment.installmentNumber,
            totalInstallments: loan.payments,
          });
        }
      });
    });

    const container = this.querySelector("#due-today-list");
    if (dueTodayList.length === 0) {
      container.innerHTML = `
                <div class="empty-state-container" style="padding: 2rem; margin: 0;">
                    <span class="empty-state-icon" style="font-size: 2.5rem; margin-bottom: 0.5rem;">✅</span>
                    <h3 class="empty-state-title" style="font-size: 1rem;">¡Todo al día!</h3>
                    <p class="empty-state-msg" style="font-size: 0.85rem;">"No tienes cobros pendientes para hoy. Un portafolio ordenado es un portafolio próspero."</p>
                </div>
            `;
      return;
    }

    container.innerHTML = dueTodayList
      .map(
        (item) => {
          const safeBorrower = sanitize(item.borrower || '');
          return `
            <div class="due-card glass border-orange">
                <div class="due-info">
                    <h3>${safeBorrower}</h3>
                    <p class="due-amount">${formatCurrency(store.convertForDisplay(item.amount, store.getCurrency()), store.getDisplayCurrency())}</p>
                    <p class="due-installment">Cuota #${item.installment} de ${item.totalInstallments}</p>
                </div>
                <button class="btn btn-primary btn-sm">Cobrar</button>
            </div>
        `;
        },
      )
      .join("");
  }
}

customElements.define("lender-dashboard", LenderDashboard);
