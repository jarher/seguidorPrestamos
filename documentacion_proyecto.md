# Documentación Técnica - Lender's HQ

## 1. Visión General
Lender's HQ es una aplicación web premium diseñada para prestamistas privados. El objetivo principal es proporcionar una herramienta móvil-primero que permita gestionar créditos, registrar pagos (capital e interés) y monitorear la salud financiera de la cartera sin depender de una infraestructura de servidor compleja.

## 2. Arquitectura del Sistema
Se ha optado por una arquitectura de **Single-Page Application (SPA)** ligera basada en estándares modernos de la web:

-   **Sin Frameworks (Vanilla JS)**: Se decidió no usar React/Vue para garantizar una carga instantánea y evitar dependencias que puedan quedar obsoletas. Todo el código utiliza Módulos ES6.
-   **Web Components (Custom Elements)**: Cada sección de la interfaz (Dashboard, Detalle del Prestatario, Formulario) es un componente autónomo. Esto facilita el mantenimiento y la escalabilidad del código.
-   **Gestión de Estado (Pub/Sub)**: Implementamos un `store.js` centralizado. Los componentes se "suscriben" a los cambios en los préstamos, lo que permite que una actualización en un pago se refleje instantáneamente en el Dashboard y en la lista general sin recargar la página.
-   **Persistencia Local**: Los datos se gestionan mediante `localStorage`, permitiendo que la aplicación funcione offline y no requiera bases de Datos SQL para su versión inicial.

## 3. Decisiones de Diseño y Estética
-   **Interfaz "Vivid Dark"**: Inspirado en diseños modernos de Neo-bancos, se utiliza un fondo Midnight (`#1A1B27`) para reducir el cansancio visual.
-   **Glassmorphism**: El uso de capas translúcidas con desenfoque (`backdrop-filter: blur(20px)`) crea una sensación de profundidad y modernidad "premium".
-   **Paleta de Colores Dinámica**: Cada prestatario recibe un color aleatorio al ser creado. Esto no es solo estético; ayuda al prestador a identificar visualmente a sus clientes de forma más rápida en listas largas.
-   **Mobile-First**: Dado que la cobranza suele ser presencial, la interfaz se adapta para ser operada cómodamente con una sola mano en dispositivos móviles.

## 4. Lógica Financiera y Pagos
Uno de los retos fue la gestión de diferentes esquemas de pago. Hemos implementado:
-   **Esquema Habitual**: Interés decreciente sobre el saldo.
-   **Esquema de Cuota Fija (Flat)**: Interés global sobre el capital inicial.
-   **Esquema Sin Intereses**: Opción "No aplica" para registrar préstamos sin rendimiento monetario esperado.

## 5. Mantenimiento y Evolución
-   **agent.md**: Este archivo actúa como la memoria persistente del proyecto. Contiene los estándares que deben seguirse para que cualquier cambio futuro mantenga la coherencia con el diseño original.
-   **Pruebas (Vitest)**: Las lógicas de cálculo están protegidas por pruebas unitarias para evitar errores matemáticos en las actualizaciones de saldo.

## 6. Optimizaciones Recientes
-   **Tablas Responsivas**: Se ha implementado un patrón de transformación en `BorrowersView.js`. En dispositivos móviles, las filas de la tabla se transforman en tarjetas verticales con etiquetas generadas mediante CSS (`data-label`), optimizando la lectura en pantallas pequeñas sin perder contexto.
-   **Gestión de Perfiles**: Se ha añadido la capacidad de capturar y editar información de contacto (correo y teléfono), utilizando una vista dedicada (`EditBorrowerView.js`) para mantener la coherencia con el flujo de navegación de la aplicación.
-   **Libro de Préstamos (Dashboard Financiero)**: Se implementó `LoansListView.js` que actúa como un libro mayor. Permite filtrar préstamos por estado (Activos, Mora, Pagados) y muestra un resumen en tiempo real de los intereses ganados y el capital en circulación.
-   **Notificaciones Inmersivas**: Se eliminó el uso invasivo de `alert()` en el registro de préstamos. Ahora se despliega un panel flotante animado superior con barra de tiempo que mejora notablemente la experiencia de usuario (UX) respetando la estética Glassmorphism.
-   **Componente de Entrada Inteligente e Inclusión Móvil**: Se introdujo el componente `<lender-input>` para estandarizar la entrada de datos. El sistema de formularios fue refactorizado siguiendo el patrón **Mobile First**, asegurando que todos los campos ocupen el 100% del ancho en dispositivos móviles y se apilen verticalmente para facilitar la interacción táctil. Para mejorar la mantenibilidad y el escalado de temas, se eliminó el uso de Shadow DOM.
-   **Estrategia de SEO y PWA**:
    -   **PWA (Progressive Web App)**: Implementación de `manifest.json` y metadatos para permitir la instalación de la aplicación en dispositivos móviles.
    -   **Open Graph (Social Sharing)**: Configuración de etiquetas para previsualizaciones profesionales en WhatsApp/Telegram.
    -   **Títulos Dinámicos (SPA SEO)**: Sistema en `main.js` que actualiza el título de la página según la sección activa.

## 7. Autenticación, Base de Datos y API Integrada
Hemos consolidado la capa de datos y la lógica de negocio en una API REST robusta que se ejecuta en el mismo servidor Express que sirve el frontend.

- **Servidor Integrado (Node.js/Express)**: Ubicado en `/api/index.js`, este servidor actúa como el punto de entrada único. Proporciona seguridad mediante **Helmet** (cabeceras seguras), **CORS** y **Rate Limiting** para proteger contra ataques de fuerza bruta en el login.
- **Modelado de Datos (Mongoose)**:
    - **Esquema de Usuario**: Sincronizado con la base de datos existente mediante el campo `passwordHash`. Incluye hooks para el hasheo automático de contraseñas nuevas, métodos de comparación y validaciones en español (formato de correo, longitud mínima de nombre y contraseña).
    - **Esquema de Préstamos**: Implementa una relación con el `userId`, permitiendo que cada prestamista vea únicamente sus propios datos.
- **Sistema de Idempotencia**: Se implementó un middleware que utiliza el encabezado `Idempotency-Key` (obligatorio para `POST` críticos). Esto garantiza que, ante reintentos de red, no se dupliquen registros de préstamos o pagos.
- **Validación de Entrada**: Las rutas de autenticación (`/api/auth`) validan formato de correo, fortaleza de contraseña (8+ caracteres, mayúscula, minúscula, número, carácter especial) y campos requeridos antes de interactuar con la base de datos. Los errores de validación devuelven código 400; registros duplicados devuelven código 409.
- **Mensajes en Español**: Todas las respuestas de error de la API están en español para consistencia con la interfaz del cliente.
- **Gestión de Sesiones (JWT)**: Uso de **JSON Web Tokens** firmados para la autorización. El cliente almacena el token de acceso y lo envía en el encabezado `Authorization`.
- **Estructura de la API**:
    - `/api/auth`: Registro, login y logout.
    - `/api/loans`: CRUD completo de préstamos y migración desde local storage.
    - `/api/lender`: Gestión del perfil del prestatista y configuraciones.
- **Enrutamiento SPA**: El servidor Express está configurado para que cualquier ruta que no sea de la API (`/api/*`) sea redirigida al `index.html`, permitiendo que el cliente maneje la navegación de forma fluida.

## 8. Seguridad contra Inyección de Código

Se han implementado medidas defensivas para mitigar riesgos de **XSS (Cross-Site Scripting)** e **inyección de operadores** en base de datos.

### 8.1 Técnica: Sanitización con DOMPurify
Para mitigar riesgos de **XSS (Cross-Site Scripting)** en el cliente, utilizamos la librería **DOMPurify**. Su función es desinfectar cualquier entrada de texto antes de insertarla en el DOM, asegurando que no se ejecute código malicioso.

**Configuración**: `{ ALLOWED_TAGS: [], ALLOWED_ATTR: [] }` — Esta configuración estricta elimina todo rastro de HTML y atributos, garantizando que los datos se traten únicamente como texto plano.

**Casos de uso**:

| Ubicación | Datos sanitizados | Motivo |
|-----------|-------------------|--------|
| `EditBorrowerView.js` | `borrowerName`, `email`, `phone` | Datos de préstamo insertados en `innerHTML` y atributos `value`; un atacante podría inyectar `<script>` o romper atributos con comillas |
| `LenderNav.js` | `fullName` del usuario | Nombre de sesión mostrado en la barra lateral; XSS almacenado si un usuario se registra con nombre malicioso |
| `main.js` | `data` en `borrower-id` | ID de préstamo usado en atributos HTML al cambiar de vista; la importación podría introducir IDs con comillas para inyección de atributos |
| `LenderInput.js` | `label`, `placeholder`, `value`, `error-msg` | Atributos del componente que pueden provenir del padre; el padre (p. ej. EditBorrowerView) pasa datos de préstamo |
| Resto de vistas | `borrowerName`, `id`, `referenceId`, `email`, `phone` | Cualquier dato de préstamo o usuario que se inserte en el DOM |

### 8.2 Técnica: Autorización y Propiedad de Datos (Data Ownership)

**Archivo**: `api/routes/loans.js`

**Implementación**: Todas las consultas a la base de datos incluyen obligatoriamente el filtro `userId: req.user._id`. Esto garantiza que, incluso si un usuario intenta acceder o modificar un préstamo mediante su ID, el sistema verificará que ese préstamo le pertenezca. Si el ID del préstamo no coincide con el dueño de la sesión, la operación fallará con un error 404, protegiendo la privacidad de los datos.

### 8.3 Resumen de flujo defensivo

```
Entrada usuario → Middleware Auth (JWT) → Middleware Idempotencia
                → Lógica de Negocio (Filtro por userId)
                → Almacenamiento Seguro (Mongoose)
                → Respuesta API
                → Cliente: DOMPurify (Sanitización)
                → Renderizado Seguro
```


---
*Documentación generada el 13 de marzo de 2026. Actualizada el 26 de marzo de 2026.*
