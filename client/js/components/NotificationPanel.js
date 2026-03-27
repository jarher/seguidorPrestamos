export class NotificationPanel {
    static show(message, onClose = null) {
        // Eliminar notificación existente si la hay
        const existing = document.querySelector('.notification-panel');
        if (existing) {
            existing.remove();
        }

        const panel = document.createElement('div');
        panel.className = 'notification-panel';

        const sanitizedMessage = DOMPurify.sanitize(message, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

        panel.innerHTML = `
            <div class="notification-content">
                <div class="notification-text">${sanitizedMessage}</div>
            </div>
            <div class="notification-progress"></div>
        `;
        document.body.appendChild(panel);

        // Forzar reflow para que la animación de transición se ejecute
        void panel.offsetWidth;

        panel.classList.add('show');

        // Remover después de que acabe la animación (3 segundos)
        setTimeout(() => {
            panel.classList.remove('show');
            setTimeout(() => {
                panel.remove();
                if (onClose) onClose();
            }, 400); // Tiempo de espera para la animación de salida
        }, 3000);
    }
}
