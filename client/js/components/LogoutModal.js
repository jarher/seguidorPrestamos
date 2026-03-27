import { store } from '../services/store.js';
import { logout } from '../services/authClient.js';
import { NotificationPanel } from './NotificationPanel.js';

export class LogoutModal extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        // Trigger CSS transition
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.querySelector('.modal-backdrop').classList.add('fade-in');
                this.querySelector('.modal-content').classList.add('fade-in');
            });
        });
    }

    render() {
        this.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal-content glass">
                    <div class="modal-header">
                        <h2 class="view-header" style="margin-bottom: 0;">¿Deseas cerrar sesión?</h2>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="form-actions" style="margin-top: 1.5rem;">
                        <button id="cancel-logout" class="btn btn-secondary">Rechazar</button>
                        <button id="confirm-logout" class="btn btn-primary">Confirmar</button>
                    </div>
                </div>
            </div>
        `;

        this.querySelector('.close-btn').addEventListener('click', () => this.close());
        this.querySelector('#cancel-logout').addEventListener('click', () => this.close());
        this.querySelector('#confirm-logout').addEventListener('click', () => this.handleConfirm());

        // Close on backdrop click
        this.querySelector('.modal-backdrop').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.close();
            }
        });
    }

    close() {
        store.setLogoutModal(false);
        this.remove();
    }

    async handleConfirm() {
        try {
            NotificationPanel.show("haz cerrado sesión satisfactoriamente");

            // Wait a few seconds as requested
            setTimeout(async () => {
                await logout();
                store.clearSession();
                store.setLogoutModal(false);
                window.dispatchEvent(new CustomEvent('view-change', { detail: 'login' }));
                this.remove();
            }, 3000);

        } catch (error) {
            console.error('Error during logout:', error);
            this.close();
        }
    }
}

customElements.define('logout-modal', LogoutModal);
