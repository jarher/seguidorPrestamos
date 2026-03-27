import { register, getSession } from "../services/authClient.js";
import { store } from "../services/store.js";
import { NotificationPanel } from "./NotificationPanel.js";

export class RegisterView extends HTMLElement {

  constructor() {
    super();
    this.innerHTML = `
      <div id="register-loader" class="loader-overlay">
        <div class="loader-content">
          <div class="loader-spinner"></div>
          <div class="loader-text">Creando cuenta...</div>
        </div>
      </div>
      <div class="dashboard-wrapper user-auth">
        <div class="dashboard-content">
          <header class="view-header">
            <div class="view-header-content">
              <h1>Crear cuenta</h1>
              <p>Registra un usuario para empezar a gestionar tus préstamos.</p>
            </div>
          </header>

          <div class="form-container glass">
            <form id="register-form">
              <div class="form-section">
                <lender-input
                  id="reg-fullname"
                  label="Nombre completo"
                  placeholder="Ej. Alex Sterling"
                  validator='{"required":true,"minlength":3}'
                  error-messages='{"required":"El nombre es requerido","minlength":"El nombre debe tener al menos 3 caracteres."}'>
                </lender-input>
                <lender-input
                  id="reg-email"
                  type="email"
                  label="Correo electrónico"
                  placeholder="tu@correo.com"
                  validator='{"required":true,"type":"email"}'
                  error-messages='{"required":"El correo es requerido","type":"Ingresa un correo válido."}'>
                </lender-input>
                <div class="form-grid">
                  <lender-input
                    id="reg-password"
                    type="password"
                    label="Contraseña"
                    placeholder="Ej. Password123@"
                    validator='{"required":true,"type":"password","minlength":8}'
                    error-messages='{"required":"La contraseña es requerida.","minlength":"La contraseña debe tener al menos 8 caracteres.","uppercase":"Debe contener al menos una mayúscula.","lowercase":"Debe contener al menos una minúscula.","number":"Debe contener al menos un número.","special":"Debe contener al menos un carácter especial (@#$%^&*!)."}'>
                  </lender-input>
                  <lender-input
                    id="reg-confirm"
                    type="password"
                    label="Confirmar contraseña"
                    placeholder="Repite la contraseña"
                    validator='{"required":true,"match":"reg-password"}'
                    error-messages='{"required":"Confirma tu contraseña.","match":"Las contraseñas no coinciden."}'>
                  </lender-input>
                </div>
              </div>

              <div class="form-actions" style="justify-content: space-between;">
                <button type="button" class="btn btn-secondary" id="go-login">Ya tengo cuenta</button>
                <button type="submit" class="btn btn-primary">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  showLoader() {
    this.querySelector("#register-loader")?.classList.add("active");
  }

  hideLoader() {
    this.querySelector("#register-loader")?.classList.remove("active");
  }

  connectedCallback() {
    this.querySelector("#go-login")?.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("view-change", { detail: "login" }));
    });

    this.querySelector("#register-form")?.addEventListener(
      "submit",
      async (e) => {
        e.preventDefault();
        const fullNameInput = this.querySelector("#reg-fullname");
        const emailInput = this.querySelector("#reg-email");
        const passwordInput = this.querySelector("#reg-password");
        const confirmInput = this.querySelector("#reg-confirm");

        const ok =
          fullNameInput.validate() &
          emailInput.validate() &
          passwordInput.validate() &
          confirmInput.validate();
        if (!ok) return;

        try {
          this.showLoader();
          const data = await register({
            email: emailInput.value,
            password: passwordInput.value,
            fullName: fullNameInput.value,
          });
          store.setSession(getSession());
          await store.migrateLocalLoansToApiIfNeeded().catch(() => { });
          await store.loadLoansFromApi();
          
          this.hideLoader(); // Ocultar ANTES de la notificación

          const safeName = DOMPurify.sanitize(data.user?.fullName || 'usuario', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
          NotificationPanel.show(
            `Cuenta creada. Bienvenido, ${safeName}`,
            () => {
              window.dispatchEvent(
                new CustomEvent("view-change", { detail: "dashboard" }),
              );
            },
          );
        } catch (error) {
          this.hideLoader(); // Ocultar en caso de error
          NotificationPanel.show(error.message || "Error al registrar");
        }
      },
    );
  }
}

customElements.define("register-view", RegisterView);
