import './js/components/LenderNav.js';
import './js/components/LenderDashboard.js';
import './js/components/NewLoanView.js';
import './js/components/BorrowersView.js';
import './js/components/BorrowerDetailView.js';
import './js/components/EditBorrowerView.js';
import './js/components/LoansListView.js';
import './js/components/LenderInput.js';
import './js/components/LoginView.js';
import './js/components/RegisterView.js';
import './js/components/LogoutModal.js';
import { initNotifications } from './js/services/notifications.js';
import { AlarmService } from './js/services/AlarmService.js';
import { store } from './js/services/store.js';
import { getSession } from './js/services/authClient.js';

// Theme Initialization
if (localStorage.getItem('lender_theme') === 'light') {
    document.body.classList.add('light-theme');
}

// Helper: Update Page Title for SPA SEO
function updatePageTitle(view) {
    const baseTitle = "Lender's HQ";
    const titles = {
        'login': 'Acceso',
        'register': 'Crear Cuenta',
        'dashboard': 'Panel Principal',
        'new-loan': 'Nuevo Préstamo',
        'borrowers': 'Prestatarios',
        'borrower-detail': 'Detalle de Préstamo',
        'edit-borrower': 'Editar Registro',
        'loans': 'Libro de Préstamos',
        'collector': 'Modo Cobrador'
    };
    
    document.title = titles[view] ? `${titles[view]} | ${baseTitle}` : `${baseTitle} | Gestión de Préstamos`;
}

// Consolidated View Switching & Sidebar Logic
window.addEventListener('view-change', (e) => {
    const main = document.querySelector('#main-content');
    const view = typeof e.detail === 'string' ? e.detail : e.detail.view;
    const data = typeof e.detail === 'object' ? e.detail.data : null;
    
    // Update SEO Title
    updatePageTitle(view);

    const sidebar = document.querySelector('lender-nav');
    const mobileMenuBtn = document.querySelector('#mobile-menu-btn');

    if (!main) return;

    const isAuthed = store.isAuthenticated();

    // 1. Fade-out current content
    main.classList.remove('fade-in');
    
    setTimeout(() => {
        // 2. Update View Content
        main.innerHTML = '';
        switch (view) {
            case 'login':
                main.innerHTML = '<login-view></login-view>';
                break;
            case 'register':
                main.innerHTML = '<register-view></register-view>';
                break;
            case 'dashboard':
                if (!isAuthed) { main.innerHTML = '<login-view></login-view>'; break; }
                main.innerHTML = '<lender-dashboard></lender-dashboard>';
                break;
            case 'new-loan':
                if (!isAuthed) { main.innerHTML = '<login-view></login-view>'; break; }
                main.innerHTML = '<new-loan-view></new-loan-view>';
                break;
            case 'borrowers':
                if (!isAuthed) { main.innerHTML = '<login-view></login-view>'; break; }
                main.innerHTML = '<borrowers-view></borrowers-view>';
                break;
            case 'borrower-detail':
                if (!isAuthed) { main.innerHTML = '<login-view></login-view>'; break; }
                {
                    const safeId = DOMPurify.sanitize(String(data || ''), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
                    main.innerHTML = `<borrower-detail-view borrower-id="${safeId}"></borrower-detail-view>`;
                }
                break;
            case 'edit-borrower':
                if (!isAuthed) { main.innerHTML = '<login-view></login-view>'; break; }
                {
                    const safeId = DOMPurify.sanitize(String(data || ''), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
                    main.innerHTML = `<edit-borrower-view borrower-id="${safeId}"></edit-borrower-view>`;
                }
                break;
            case 'loans':
                if (!isAuthed) { main.innerHTML = '<login-view></login-view>'; break; }
                main.innerHTML = '<loans-list-view></loans-list-view>';
                break;
            case 'collector':
                if (!isAuthed) { main.innerHTML = '<login-view></login-view>'; break; }
                main.innerHTML = '<h1 style="padding:4rem 2rem">Modo Cobrador (Próximamente)</h1>';
                break;
        }

        // 3. Fade-in new content
        requestAnimationFrame(() => {
            main.classList.add('fade-in');
        });
    }, 150); // Small delay to allow fade-out (half of the 300ms transition is usually enough to feel responsive while still fading out)

    // 2. Handle Sidebar Toggle (Mobile)
    if (sidebar && window.innerWidth < 768) {
        const sidebarEl = sidebar.querySelector('.sidebar');
        if (sidebarEl) {
            sidebarEl.classList.remove('active');
            const icon = mobileMenuBtn?.querySelector('.material-icons');
            if (icon) icon.textContent = 'menu';
        }
    }
});

// Modal Handling
window.addEventListener('open-modal', (e) => {
    const modalType = e.detail;
    if (modalType === 'add-loan') {
        const modal = document.createElement('loan-form');
        document.body.appendChild(modal);
    } else if (modalType === 'logout') {
        const modal = document.createElement('logout-modal');
        document.body.appendChild(modal);
    }
});

// Sidebar Toggle Logic (Manual button click)
const mobileMenuBtn = document.querySelector('#mobile-menu-btn');
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        const sidebar = document.querySelector('lender-nav');
        const sidebarEl = sidebar?.querySelector('.sidebar');
        if (sidebarEl) {
            sidebarEl.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('.material-icons');
            if (icon) icon.textContent = sidebarEl.classList.contains('active') ? 'close' : 'menu';
        }
    });
}

// Initialize Services
initNotifications();
AlarmService.init();

// Session bootstrap
const session = getSession();
if (session?.token) {
    store.setSession(session);
    store.loadLoansFromApi()
        .then(() => window.dispatchEvent(new CustomEvent('view-change', { detail: 'dashboard' })))
        .catch(() => window.dispatchEvent(new CustomEvent('view-change', { detail: 'login' })));
} else {
    window.dispatchEvent(new CustomEvent('view-change', { detail: 'login' }));
}
