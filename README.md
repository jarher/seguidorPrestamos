# 💰 Lender's HQ - Seguimiento Pro de Préstamos

**Lender's HQ** es una aplicación web premium diseñada para prestamistas privados que buscan profesionalizar su gestión de cartera. Con un enfoque **Mobile-First** y una estética moderna, permite controlar créditos, intereses y pagos de forma eficiente y segura.

---

## 🚀 ¿Por qué Lender's HQ?
La mayoría de los prestamistas privados gestionan sus cuentas en cuadernos u hojas de cálculo propensas a errores. **Lender's HQ** nace para ofrecer:
*   **Orden Financiero**: Cálculo automático de saldos e intereses.
*   **Cobranza Eficiente**: Un dashboard que prioriza quién debe pagar hoy.
*   **Transparencia**: Historial detallado de abonos a capital vs. pagos de interés.
*   **Movilidad**: Diseñado para ser operado desde el celular mientras se realiza la cobranza en campo.

---

## 🛠️ Stack Tecnológico
El proyecto utiliza tecnologías modernas y eficientes para garantizar velocidad y mantenibilidad:

### Frontend
*   **Vanilla JS (ES6+)**: Sin frameworks pesados para una carga instantánea.
*   **Web Components**: Interfaz modular y escalable.
*   **CSS Moderno**: Diseño *Glassmorphism* y *Vivid Dark* para una experiencia premium.
*   **DOMPurify**: Protección avanzada contra ataques XSS.

### Backend
*   **Node.js & Express**: API robusta y escalable.
*   **MongoDB**: Base de datos flexible para el manejo de perfiles y préstamos.
*   **JWT & Bcrypt**: Autenticación segura y cifrado de contraseñas.

---

## ✨ Características Principales
*   **Dashboard de Portafolio**: Resumen en tiempo real de capital prestado, intereses ganados y mora.
*   **Esquemas de Pago Flexibles**:
    *   *Cuota Decreciente*: Interés sobre saldo pendiente.
    *   *Cuota Fija (Flat)*: Interés sobre capital inicial.
    *   *Sin Interés*: Para préstamos personales o amigos.
*   **Gestión de Perfiles**: Captura de datos de contacto (Email, Teléfono) y seguimiento por prestatario.
*   **Notificaciones Inmersivas**: Sistema de alerta visual y auditiva para confirmación de acciones.
*   **Adaptabilidad Total**: Interfaz de tablas dinámicas que se transforman en tarjetaskw móviles.

---

## 🛠️ Configuración Local

1. **Clonar el repositorio**:
   ```bash
   git clone <url-del-repositorio>
   cd seguidor-de-prestamos
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Variables de Entorno**:
   Crea un archivo `.env` en la raíz basado en `.env.example`:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/lenders_hq
   JWT_SECRET=tu_clave_secreta
   ```

4. **Correr la aplicación**:
   ```bash
   npm run dev
   ```

---

## 🌐 Despliegue
Para instrucciones detalladas sobre cómo subir esta app a producción (Render, Vercel, VPS) y habilitar **HTTPS**, consulta nuestra [Guía de Despliegue](.gemini/antigravity/brain/5619701b-403d-4ef3-a2ec-ec6b3081942d/deployment_guide.md).

---
*Idea y desarrollo del proyecto por Jeffer Andrés Rojas Herrera. <a href="https://www.linkedin.com/in/jeffer-andres-rojas-herrera-20a735210/?skipRedirect=true">Perfil en linkedin</a>*
