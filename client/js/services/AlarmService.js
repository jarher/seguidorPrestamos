import { store } from './store.js';
import { NotificationPanel } from '../components/NotificationPanel.js';

export class AlarmService {
    static init() {
        this.messageQueue = [];
        this.isNotifying = false;
        
        // El navegador bloquea la reproducción de audio si no hay interacción previa. 
        // Esperamos el primer clic en la pantalla para revisar las alarmas y habilitar el audio.
        const onFirstInteraction = () => {
             document.removeEventListener('click', onFirstInteraction);
             this.checkAlarms();
        };
        
        document.addEventListener('click', onFirstInteraction);
    }

    static checkAlarms() {
        const { loans } = store.getState();
        const activeLoans = loans.filter(l => l.status !== 'completed');
        const today = new Date();
        const todayDay = today.getDate();
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();
        
        activeLoans.forEach(loan => {
            const history = loan.paymentsHistory || [];
            
            // 1. Verificación de Mora (Existente)
            const schedule = loan.schedule || [];
            const hasMora = schedule.some(s => s.status === 'mora');
            
            if (hasMora) {
                this.queueNotification(`🚨 ¡MORA! El prestatario ${loan.borrowerName} tiene pagos vencidos.`);
            }

            // 2. Notificación Mensual de Intereses
            // Se activa si hoy es el mismo día del mes en que inició el préstamo
            const startDate = new Date(loan.startDate);
            if (todayDay === startDate.getDate()) {
                const paidThisMonth = history.some(p => {
                    const pDate = new Date(p.date);
                    return pDate.getMonth() === todayMonth && pDate.getFullYear() === todayYear && (parseFloat(p.interest) > 0);
                });

                if (!paidThisMonth) {
                    this.queueNotification(`📅 INTERÉS MENSUAL: Hoy corresponde el cobro de intereses a ${loan.borrowerName}.`);
                }
            }

            // 3. Notificación de Fecha Límite (Final de Deuda)
            if (loan.deadlineDate) {
                const deadline = new Date(loan.deadlineDate);
                // Normalizamos a medianoche para comparar días
                const tDate = new Date(todayYear, todayMonth, todayDay);
                const dDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
                
                const diffTime = dDate - tDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 0) {
                    this.queueNotification(`⚠️ FECHA LÍMITE: Hoy vence el plazo final para ${loan.borrowerName}. Se debe cobrar capital + intereses.`);
                } else if (diffDays > 0 && diffDays <= 3) {
                    this.queueNotification(`⏳ RECORDATORIO: Faltan ${diffDays} días para la fecha límite de ${loan.borrowerName}.`);
                }
            }
        });
    }

    static queueNotification(message) {
        this.messageQueue.push(message);
        this.processQueue();
    }

    static processQueue() {
        // Entrar a procesar solo si no estamos notificando actualmente y hay notas.
        if (this.isNotifying || this.messageQueue.length === 0) return;
        
        this.isNotifying = true;
        const msg = this.messageQueue.shift();
        
        this.playSound();

        NotificationPanel.show(msg, () => {
            this.isNotifying = false;
            // Procesar el siguiente en la cola con un pequeño respiro de animación
            setTimeout(() => this.processQueue(), 500);
        });
    }

    static playSound() {
        try {
            const audio = new Audio('./assets/sounds/doorbell-tone.wav');
            audio.volume = 0.6; // Volumen al 60%
            audio.play();
        } catch(e) {
            console.warn('El audio no pudo reproducirse:', e);
        }
    }
}
