# LENDER'S HQ
*Seguidor de Préstamos y Cobranzas*

**Especificación de Fundamentos de Proyecto**

**Responsable:** Jeffer Andrés Rojas Herrera
**Fecha:** 1 de Abril de 2026

---

## Tabla de Contenidos

1. Visión y Alcance
2. Modelo de Datos
3. Flujos de Negocio
4. Reglas de Cálculo
5. Sistema de Notificaciones
6. Restricciones Arquitectónicas

---

## 1. Visión y Alcance

### 1.1 Descripción

Lender's HQ es una aplicación web y mobile que permite a una persona registrar, administrar y hacer seguimiento a sus préstamos personales. Calcula cuotas automáticamente según el esquema seleccionado, rastrea el estado de cada deuda, y emite recordatorios sobre fechas de cobro próximas o vencidas.

**Contexto de uso:** Personas que prestan dinero a conocidos, amigos o familiares y quieren llevar un registro ordenado.

### 1.2 Actores

- **Prestamista (Usuario):** Registra y administra préstamos, recibe notificaciones.
- **Sistema:** Calcula cuotas, rastrea estados, emite alertas automáticas.

### 1.3 Requisitos Funcionales

**AUTENTICACIÓN**
- RF-001: Registrar usuario con email y contraseña
- RF-002: Iniciar sesión con email y contraseña

**GESTIÓN DE PRESTATARIOS**
- RF-003: Crear prestatario (nombre obligatorio, email/teléfono opcionales)
- RF-004: Editar datos de prestatario
- RF-005: Eliminar prestatario

**GESTIÓN DE PRÉSTAMOS**
- RF-006: Crear préstamo con: monto, tasa mensual, esquema (cuota fija / decreciente / sin interés), número de meses
- RF-007: Sistema calcula automáticamente el schedule de cuotas al crear el préstamo
- RF-008: Ver detalles del préstamo incluyendo el schedule completo
- RF-009: Marcar cuota como pagada

**ESTADOS Y NOTIFICACIONES**
- RF-010: Sistema asigna estado automático: ACTIVO, EN_MORA, PAGADO
- RF-011: Prestamista puede cambiar estado manualmente
- RF-012: Notificar 2 días antes del vencimiento y el día del vencimiento
- RF-013: Si no hay fecha límite definida, notificar 1 mes después de la fecha de inicio

**REPORTES**
- RF-014: Descargar reporte de cartera completa (CSV/Excel)
- RF-015: Descargar reporte de prestatario individual (CSV/Excel)

**CUENTA**
- RF-016: Eliminar cuenta (elimina todos los datos asociados)

### 1.4 Requisitos No Funcionales

- Compatible con: Chrome, Firefox, Safari (Desktop + Mobile)
- Rendimiento: Carga inicial < 3s, interacciones < 500ms
- Seguridad mínima: contraseñas hasheadas, JWT para sesiones, HTTPS obligatorio

---

## 2. Modelo de Datos

> **Regla:** Los nombres de campos listados aquí son canónicos. No usar variantes.

### 2.1 LenderUser (Prestamista)

| Campo | Tipo | Restricción |
|---|---|---|
| id | UUID | Primary Key |
| userEmail | string | UNIQUE, NOT NULL, formato email |
| userPassword | string (hashed) | NOT NULL, mín 8 caracteres |
| userFirstName | string | NOT NULL |
| userLastName | string | NOT NULL |
| createdAt | timestamp | auto-set |
| updatedAt | timestamp | auto-update |
| deletedAt | timestamp | NULL si activo (soft delete) |

### 2.2 Borrower (Prestatario)

| Campo | Tipo | Restricción |
|---|---|---|
| id | UUID | Primary Key |
| lenderId | UUID | FK → LenderUser.id |
| borrowerFirstName | string | NOT NULL |
| borrowerLastName | string | NULLABLE |
| borrowerEmail | string | OPCIONAL, formato email |
| borrowerPhone | string | OPCIONAL, formato E.164 |
| createdAt | timestamp | NOT NULL |
| updatedAt | timestamp | NOT NULL |
| deletedAt | timestamp | NULL si activo (soft delete) |

### 2.3 Loan (Préstamo)

| Campo | Tipo | Restricción |
|---|---|---|
| id | UUID | Primary Key |
| borrowerId | UUID | FK → Borrower.id |
| lenderId | UUID | FK → LenderUser.id (desnormalizado para queries rápidas) |
| principalLoan | decimal(12,2) | NOT NULL, > 0 |
| monthlyRate | decimal(5,4) | Ej: 0.0150 = 1.5%, NOT NULL |
| loanScheme | enum | FIXED_INSTALLMENT, DECREASING_INSTALLMENT, NO_INTEREST |
| totalMonths | integer | NOT NULL, > 0 |
| startDate | date | NOT NULL |
| maturityDate | date | OPCIONAL |
| status | enum | ACTIVE, DEFAULTED, PAID |
| statusUpdatedAt | timestamp | Cuándo cambió el estado |
| createdAt | timestamp | NOT NULL |
| updatedAt | timestamp | NOT NULL |
| deletedAt | timestamp | NULL si activo (soft delete) |

### 2.4 PaymentSchedule (Cuota)

| Campo | Tipo | Restricción |
|---|---|---|
| id | UUID | Primary Key |
| loanId | UUID | FK → Loan.id |
| installmentNumber | integer | 1, 2, 3… sin duplicados por loan |
| dueDate | date | NOT NULL |
| principalAmount | decimal(12,2) | Parte capital |
| interestAmount | decimal(12,2) | Parte interés |
| totalAmount | decimal(12,2) | principalAmount + interestAmount |
| isPaid | boolean | Default false |
| paidAt | timestamp | NULL si no pagado |
| createdAt | timestamp | NOT NULL |
| updatedAt | timestamp | NOT NULL |

> **Convención:** El schedule se calcula UNA SOLA VEZ al crear el préstamo. No se recalcula en cada render. Solo puede modificarse si ninguna cuota ha sido pagada.

### 2.5 Relaciones

- LenderUser 1 — N Borrower
- Borrower 1 — N Loan
- Loan 1 — N PaymentSchedule

---

## 3. Flujos de Negocio

### 3.1 Crear Préstamo

1. Prestamista selecciona prestatario (o crea uno nuevo)
2. Ingresa: monto, tasa mensual, esquema, número de meses
3. Sistema calcula y guarda el schedule de cuotas en BD
4. Sistema programa las notificaciones para cada cuota

### 3.2 Marcar Cuota como Pagada

1. Prestamista abre detalles del préstamo
2. Marca cuota #N como pagada
3. Sistema actualiza `isPaid = true`, `paidAt = now()`
4. Si todas las cuotas están pagadas → `Loan.status = PAID`

### 3.3 Cambiar Estado Manual

1. Prestamista puede cambiar el status a: ACTIVE, DEFAULTED o PAID
2. Sistema actualiza `Loan.status` y `Loan.statusUpdatedAt`

---

## 4. Reglas de Cálculo

### 4.1 Cuota Fija (FIXED_INSTALLMENT)
La cuota total (capital + interés) es la misma cada mes.

```
monthlyPayment = principal × [rate × (1+rate)^months] / [(1+rate)^months - 1]

Por cada mes i:
  interestThisMonth   = remainingBalance × rate
  principalThisMonth  = monthlyPayment - interestThisMonth
  remainingBalance   -= principalThisMonth
```

### 4.2 Cuota Decreciente (DECREASING_INSTALLMENT)
El capital se divide en partes iguales; el interés disminuye cada mes.

```
principalPerMonth = principal / months

Por cada mes i:
  interestThisMonth = remainingBalance × rate
  totalPayment      = principalPerMonth + interestThisMonth
  remainingBalance -= principalPerMonth
```

### 4.3 Sin Interés (NO_INTEREST)
```
principalPerMonth = principal / months
interestThisMonth = 0
```

### 4.4 Dónde se calcula

- ✅ **En el servidor:** al crear el préstamo, calcular TODAS las cuotas y guardarlas en `PaymentSchedule`
- ✅ **En el cliente:** puede mostrarse una preview antes de confirmar
- ❌ **Nunca:** recalcular en cada render

---

## 5. Sistema de Notificaciones

Las notificaciones son **alertas visuales in-app** (no push notifications externas).

### 5.1 Cuándo se generan
Al crear el préstamo se generan las notificaciones para todas las cuotas. No se regeneran.

### 5.2 Timing

- **2 días antes:** `scheduledFor = dueDate - 2 días`
- **Día del vencimiento:** `scheduledFor = dueDate`
- **Sin fecha límite:** notificar 1 mes después de `startDate`

### 5.3 Formato de mensaje

```
[COBRO PRÓXIMO]  Juan Pérez debe $50,000 el 15 de abril
[COBRO HOY]      María García debe $75,500 (70k capital + 5.5k interés)
[COBRO VENCIDO]  Carlos López debe $100,000 desde el 10 de abril
```

---

## 6. Restricciones Arquitectónicas

### 6.1 Stack Técnico

**Frontend**

| Capa | Tecnología |
|---|---|
| Framework | React 18+ |
| Routing | React Router 6+ |
| Estado | Zustand 4+ |
| HTTP | Axios |
| Estilos | Tailwind CSS 3+ |
| Notificaciones UI | React Toastify |
| Validación | Zod 3+ |
| Bundler | Vite 4+ |

**Backend**

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.18+ |
| Headers de seguridad | Helmet |
| CORS | cors |
| Autenticación | JWT (jsonwebtoken) |
| Hashing contraseñas | bcryptjs |
| Validación | Zod 3+ |
| Rate limiting login | express-rate-limit |
| ORM | Sequelize 6+ |

**Base de Datos**

| Capa | Tecnología |
|---|---|
| Motor | PostgreSQL 14+ |
| Cliente | pg |
| Migraciones | Sequelize CLI |

**Variables de entorno:** dotenv

### 6.2 Seguridad (lo necesario y suficiente)

```
Contraseñas : bcryptjs (hashed + salted)
Sesiones    : JWT con expiración configurable
Validación  : Zod en frontend y backend
SQL Injection: Sequelize queries parametrizadas
Rate Limiting: express-rate-limit en endpoint /login
Headers HTTP : Helmet
HTTPS        : Obligatorio en producción
```

### 6.3 Instalación de dependencias

```bash
# Backend
npm install express dotenv cors helmet
npm install pg sequelize
npm install jsonwebtoken bcryptjs
npm install zod express-rate-limit

# Frontend
npm install react react-router-dom
npm install zustand axios
npm install tailwindcss postcss autoprefixer
npm install react-toastify zod
```

### 6.4 Estructura Backend

```
src/
├── routes/
│   ├── auth.js
│   ├── borrowers.js
│   └── loans.js
├── middleware/
│   ├── authenticate.js   # Valida JWT
│   ├── validate.js       # Zod validation
│   └── rateLimiter.js    # Solo para /login
├── controllers/
│   ├── authController.js
│   ├── borrowerController.js
│   └── loanController.js
├── services/
│   ├── loanCalculator.js
│   ├── statusCalculator.js
│   └── notificationService.js
├── models/
│   ├── LenderUser.js
│   ├── Borrower.js
│   ├── Loan.js
│   └── PaymentSchedule.js
├── validators/
│   ├── authValidators.js
│   ├── loanValidators.js
│   └── borrowerValidators.js
└── config/
    └── database.js
```

### 6.5 Estructura Frontend

```
src/
├── components/
│   ├── ui/               # Primitivos: Button, Card, Modal, Table, etc.
│   ├── layout/           # Sidebar, TopBar, MobileBottomNav, Layout
│   ├── dashboard/        # KPISection, BorrowersTable, DueTodaySection
│   ├── loan/             # LoanHeader, PaymentHistoryTable, CreateLoanModal
│   ├── borrower/         # BorrowerHeader, ActiveLoanSection, BorrowerFormModal
│   ├── notifications/    # NotificationBell, NotificationPanel
│   └── reports/          # ExportButton, ReportFilters
├── pages/
│   ├── Dashboard.jsx
│   ├── LoanDetails.jsx
│   ├── BorrowerProfile.jsx
│   ├── BorrowersList.jsx
│   ├── Reports.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   └── NotFound.jsx
├── stores/               # Zustand
│   ├── authStore.js
│   ├── loanStore.js
│   ├── borrowerStore.js
│   └── notificationStore.js
├── services/
│   ├── api.js            # Axios + interceptors JWT
│   └── exportService.js  # Genera CSV/Excel
├── hooks/
│   ├── useAuth.js
│   └── useNotifications.js
├── utils/
│   ├── formatters.js     # formatCurrency, formatDate
│   ├── constants.js      # Enums: LoanScheme, Status
│   └── validators.js     # Re-exporta schemas Zod
└── router/
    ├── AppRouter.jsx
    ├── PrivateRoute.jsx
    └── routes.js
```

### 6.6 Convenciones de código

- Usar EXACTAMENTE los nombres de campos definidos en la Sección 2
- Funciones: verbo + sustantivo — `calculatePaymentSchedule`, `getBorrowerLoans`
- Sin mutaciones directas en los stores de Zustand
- No calcular cuotas en el render — calcular al crear, guardar resultado

---

*Documento reducido a lo esencial para v1.0 — app personal de seguimiento de préstamos.*
