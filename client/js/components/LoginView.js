import { login, getSession } from "../services/authClient.js";
import { store } from "../services/store.js";
import { NotificationPanel } from "./NotificationPanel.js";

export class LoginView extends HTMLElement {

  constructor() {
    super();
    this.innerHTML = `
      <div id="login-loader" class="loader-overlay">
        <div class="loader-content">
          <div class="loader-spinner"></div>
          <div class="loader-text">Procesando...</div>
        </div>
      </div>
      <div class="dashboard-wrapper user-auth">
        <div class="dashboard-content">
          <header class="view-header">
            <div class="view-header-content">
              <h1>Iniciar sesión</h1>
              <p>Accede para gestionar tu cartera de préstamos.</p>
            </div>
          </header>

          <div class="form-container glass">
            <form id="login-form">
              <div class="form-section">
                <lender-input
                  id="login-email"
                  type="email"
                  label="Correo electrónico"
                  placeholder="tu@correo.com"
                  validator='{"required":true,"type":"email"}'
                  error-messages='{"required":"El correo es requerido","type":"Ingresa un correo válido."}'>
                </lender-input>
                <lender-input
                  id="login-password"
                  type="password"
                  label="Contraseña"
                  placeholder="••••••••"
                  validator='{"required":true}'
                  error-messages='{"required":"La contraseña es requerida."}'>
                </lender-input>
              </div>

              <div class="form-actions" style="justify-content: space-between;">
                <button type="button" class="btn btn-secondary" id="go-register">Crear cuenta</button>
                <button type="submit" class="btn btn-primary">Entrar</button>
              </div>
            </form>
          </div>
        </div>

      </div>
    `;
  }

  showLoader() {
    this.querySelector("#login-loader")?.classList.add("active");
  }

  hideLoader() {
    this.querySelector("#login-loader")?.classList.remove("active");
  }

  connectedCallback() {
    // Trigger CSS transition
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const authContainer = this.querySelector('.user-auth');
            if (authContainer) authContainer.classList.add('fade-in');
        });
    });

    const session = getSession();
    if (session?.token) {
      store.setSession(session);
      store.loadLoansFromApi().catch(() => { });
      window.dispatchEvent(
        new CustomEvent("view-change", { detail: "dashboard" }),
      );
      return;
    }

    this.querySelector("#go-register")?.addEventListener("click", () => {
      window.dispatchEvent(
        new CustomEvent("view-change", { detail: "register" }),
      );
    });

    this.querySelector("#login-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const emailInput = this.querySelector("#login-email");
      const passInput = this.querySelector("#login-password");

      const ok = emailInput.validate() & passInput.validate();
      if (!ok) return;

      try {
        this.showLoader();
        const data = await login({
          email: emailInput.value,
          password: passInput.value,
        });
        store.setSession(getSession());
        await store.migrateLocalLoansToApiIfNeeded().catch(() => { });
        await store.loadLoansFromApi();
        
        this.hideLoader(); // Ocultar ANTES de la notificación

        const safeName = DOMPurify.sanitize(data.user?.fullName || 'usuario', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
        NotificationPanel.show(
          `Bienvenido, ${safeName}`,
          () => {
            window.dispatchEvent(
              new CustomEvent("view-change", { detail: "dashboard" }),
            );
          },
        );
      } catch (error) {
        this.hideLoader(); // Ocultar en caso de error
        NotificationPanel.show(error.message || "Error al iniciar sesión");
      }
    });
  }
}

customElements.define("login-view", LoginView);
