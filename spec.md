# spec.md — Lender's HQ
> Spec-Driven Development: la especificación ES la fuente de verdad. El código cumple la spec, nunca al revés.

---

## ¿Qué es Spec-Driven Development?

Spec-Driven Development (SDD) es una práctica donde **cada decisión de código tiene raíz en un documento de especificación acordado**. Antes de escribir una función, un endpoint o un componente, existe una descripción precisa de qué debe hacer, qué recibe, qué retorna y cuándo falla.

En este proyecto significa:
- Los modelos de BD se derivan de la Sección 2 de la especificación. Si un campo no está en la spec, no existe en el código.
- Los endpoints del backend se derivan de los Requisitos Funcionales (RF-001 a RF-016).
- Los componentes del frontend se derivan de los Flujos de Negocio (Sección 3).
- Las reglas de cálculo son contratos, no implementaciones libres.

---

## Contratos de API

Cada endpoint es un contrato: entrada esperada → lógica → salida garantizada. Si la lógica cambia, el contrato cambia primero en este documento.

---

### AUTH

#### `POST /api/auth/register`
**RF-001** — Registrar usuario con email y contraseña.

**Body:**
```json
{
  "userEmail": "string — email válido, UNIQUE",
  "userPassword": "string — mínimo 8 caracteres",
  "userFirstName": "string — NOT NULL",
  "userLastName": "string — NOT NULL"
}
```

**Respuesta 201:**
```json
{
  "token": "JWT string",
  "user": {
    "id": "uuid",
    "userEmail": "string",
    "userFirstName": "string",
    "userLastName": "string"
  }
}
```

**Errores:**
| Código | Causa |
|--------|-------|
| 400 | Validación Zod fallida (campo faltante, email mal formado, contraseña < 8 chars) |
| 409 | Email ya registrado |

---

#### `POST /api/auth/login`
**RF-002** — Iniciar sesión. Rate limit: 10 intentos / 15 minutos por IP.

**Body:**
```json
{
  "userEmail": "string",
  "userPassword": "string"
}
```

**Respuesta 200:**
```json
{
  "token": "JWT string — expira en 7 días",
  "user": {
    "id": "uuid",
    "userEmail": "string",
    "userFirstName": "string",
    "userLastName": "string"
  }
}
```

**Errores:**
| Código | Causa |
|--------|-------|
| 400 | Campos faltantes |
| 401 | Email no encontrado o contraseña incorrecta — mismo mensaje genérico para ambos |
| 429 | Rate limit excedido |

---

#### `DELETE /api/auth/account`
**RF-016** — Eliminar cuenta. Requiere autenticación. Elimina en cascada: LenderUser → Borrowers → Loans → PaymentSchedules.

**Headers:** `Authorization: Bearer <token>`

**Respuesta 200:**
```json
{ "message": "Cuenta eliminada correctamente" }
```

**Errores:**
| Código | Causa |
|--------|-------|
| 401 | Token inválido o expirado |

---

### BORROWERS

> Todos los endpoints requieren `Authorization: Bearer <token>`. El middleware `authenticate.js` inyecta `req.user`. La validación de ownership (el borrower pertenece al lender autenticado) se hace en el controller con `WHERE lenderId = req.user.id`.

#### `GET /api/borrowers`
**RF-003 (listar)** — Retorna todos los prestatarios del lender autenticado, sin los eliminados (soft delete).

**Respuesta 200:**
```json
[
  {
    "id": "uuid",
    "borrowerFirstName": "string",
    "borrowerLastName": "string | null",
    "borrowerEmail": "string | null",
    "borrowerPhone": "string | null",
    "createdAt": "ISO timestamp",
    "activeLoansCount": "integer — calculado en query"
  }
]
```

---

#### `POST /api/borrowers`
**RF-003** — Crear prestatario.

**Body:**
```json
{
  "borrowerFirstName": "string — NOT NULL",
  "borrowerLastName": "string — opcional",
  "borrowerEmail": "string — opcional, formato email",
  "borrowerPhone": "string — opcional, formato E.164"
}
```

**Respuesta 201:**
```json
{
  "id": "uuid",
  "lenderId": "uuid",
  "borrowerFirstName": "string",
  "borrowerLastName": "string | null",
  "borrowerEmail": "string | null",
  "borrowerPhone": "string | null",
  "createdAt": "ISO timestamp"
}
```

**Errores:**
| Código | Causa |
|--------|-------|
| 400 | borrowerFirstName faltante o email con formato inválido |

---

#### `PUT /api/borrowers/:id`
**RF-004** — Editar prestatario. Solo campos enviados se actualizan (PATCH semántico).

**Body:** igual que POST, todos los campos opcionales.

**Respuesta 200:** objeto Borrower actualizado.

**Errores:**
| Código | Causa |
|--------|-------|
| 400 | Validación fallida |
| 403 | El borrower no pertenece al lender autenticado |
| 404 | Borrower no encontrado |

---

#### `DELETE /api/borrowers/:id`
**RF-005** — Soft delete: setea `deletedAt = now()`. No elimina físicamente. Los préstamos asociados también se ocultan.

**Respuesta 200:**
```json
{ "message": "Prestatario eliminado" }
```

**Errores:**
| Código | Causa |
|--------|-------|
| 403 | Ownership violation |
| 404 | No encontrado |

---

### LOANS

#### `GET /api/loans`
Retorna todos los préstamos del lender autenticado.

**Query params opcionales:**
- `borrowerId=uuid` — filtrar por prestatario
- `status=ACTIVE|DEFAULTED|PAID` — filtrar por estado

**Respuesta 200:**
```json
[
  {
    "id": "uuid",
    "borrowerId": "uuid",
    "borrowerFirstName": "string",
    "borrowerLastName": "string | null",
    "principalLoan": "decimal string",
    "monthlyRate": "decimal string",
    "loanScheme": "FIXED_INSTALLMENT | DECREASING_INSTALLMENT | NO_INTEREST",
    "totalMonths": "integer",
    "startDate": "YYYY-MM-DD",
    "maturityDate": "YYYY-MM-DD | null",
    "status": "ACTIVE | DEFAULTED | PAID",
    "paidInstallments": "integer",
    "totalInstallments": "integer",
    "createdAt": "ISO timestamp"
  }
]
```

---

#### `POST /api/loans`
**RF-006 + RF-007** — Crear préstamo y calcular schedule.

**Body:**
```json
{
  "borrowerId": "uuid — debe pertenecer al lender",
  "principalLoan": "number — > 0",
  "monthlyRate": "number — >= 0, ej: 0.015 para 1.5%",
  "loanScheme": "FIXED_INSTALLMENT | DECREASING_INSTALLMENT | NO_INTEREST",
  "totalMonths": "integer — > 0",
  "startDate": "YYYY-MM-DD",
  "maturityDate": "YYYY-MM-DD — opcional"
}
```

**Lógica del servidor (en este orden):**
1. Validar body con Zod
2. Verificar que `borrowerId` pertenece al lender autenticado
3. Calcular schedule completo con `loanCalculator.js`
4. Insertar `Loan` en transacción
5. Insertar todos los `PaymentSchedule` en la misma transacción
6. Generar notificaciones con `notificationService.js`
7. Retornar loan + schedule

**Respuesta 201:**
```json
{
  "loan": { "...campos del Loan..." },
  "schedule": [
    {
      "installmentNumber": 1,
      "dueDate": "YYYY-MM-DD",
      "principalAmount": "decimal string",
      "interestAmount": "decimal string",
      "totalAmount": "decimal string",
      "isPaid": false
    }
  ]
}
```

**Errores:**
| Código | Causa |
|--------|-------|
| 400 | Validación fallida, principalLoan <= 0, totalMonths <= 0 |
| 403 | borrowerId no pertenece al lender |
| 404 | borrowerId no encontrado |

---

#### `GET /api/loans/:id`
**RF-008** — Detalles del préstamo incluyendo schedule completo.

**Respuesta 200:**
```json
{
  "loan": { "...todos los campos del Loan..." },
  "borrower": { "borrowerFirstName": "string", "borrowerLastName": "string | null" },
  "schedule": [ { "...campos de PaymentSchedule..." } ]
}
```

---

#### `PATCH /api/loans/:id/installments/:installmentNumber/pay`
**RF-009** — Marcar cuota como pagada.

**Lógica:**
1. Verificar ownership del loan
2. Verificar que la cuota existe y `isPaid = false`
3. Actualizar `isPaid = true`, `paidAt = now()`
4. Llamar `statusCalculator.js` — si todas las cuotas están pagadas, actualizar `Loan.status = PAID`

**Respuesta 200:**
```json
{
  "installment": { "...PaymentSchedule actualizado..." },
  "loanStatus": "ACTIVE | PAID"
}
```

**Errores:**
| Código | Causa |
|--------|-------|
| 400 | La cuota ya estaba pagada |
| 403 | Ownership violation |
| 404 | Loan o cuota no encontrados |

---

#### `PATCH /api/loans/:id/status`
**RF-010 + RF-011** — Cambiar estado manualmente.

**Body:**
```json
{ "status": "ACTIVE | DEFAULTED | PAID" }
```

**Respuesta 200:**
```json
{
  "id": "uuid",
  "status": "string",
  "statusUpdatedAt": "ISO timestamp"
}
```

---

#### `DELETE /api/loans/:id`
Soft delete del préstamo. Solo si no tiene cuotas pagadas. Si las tiene, retornar 409.

**Respuesta 200:** `{ "message": "Préstamo eliminado" }`

**Errores:**
| Código | Causa |
|--------|-------|
| 409 | El préstamo tiene cuotas pagadas — no se puede eliminar |

---

### NOTIFICATIONS

#### `GET /api/notifications`
Retorna notificaciones del lender cuyo `scheduledFor <= now()` y no han sido leídas.

**Respuesta 200:**
```json
[
  {
    "id": "uuid",
    "loanId": "uuid",
    "borrowerName": "string",
    "message": "string — formato definido en spec sección 5.3",
    "scheduledFor": "ISO timestamp",
    "isRead": false
  }
]
```

---

#### `PATCH /api/notifications/:id/read`
Marcar notificación como leída.

**Respuesta 200:** `{ "id": "uuid", "isRead": true }`

---

### REPORTS

#### `GET /api/reports/portfolio`
**RF-014** — Reporte de cartera completa en CSV o Excel.

**Query params:**
- `format=csv|xlsx` — default: `csv`

**Respuesta 200:** archivo descargable.

**Columnas:** BorrowerName, LoanId, Principal, Scheme, MonthlyRate, TotalMonths, StartDate, Status, PaidInstallments, TotalInstallments, TotalPaid, Remaining

---

#### `GET /api/reports/borrower/:id`
**RF-015** — Reporte de prestatario individual.

**Query params:** `format=csv|xlsx`

**Columnas:** LoanId, Principal, Scheme, MonthlyRate, InstallmentNumber, DueDate, Principal, Interest, Total, IsPaid, PaidAt

---

## Contratos de Servicios Internos

Estos servicios viven en `src/services/` y son llamados por los controllers. Son funciones puras sin efectos secundarios (excepto `notificationService`).

---

### `loanCalculator.js`

```js
/**
 * Calcula el schedule completo de cuotas para un préstamo.
 * @param {Object} params
 * @param {number}  params.principalLoan  — monto prestado
 * @param {number}  params.monthlyRate    — tasa mensual (0.015 = 1.5%)
 * @param {string}  params.loanScheme     — FIXED_INSTALLMENT | DECREASING_INSTALLMENT | NO_INTEREST
 * @param {number}  params.totalMonths    — número de meses
 * @param {string}  params.startDate      — YYYY-MM-DD, fecha de inicio
 * @returns {Array<Installment>}          — array de totalMonths elementos
 */
calculatePaymentSchedule(params) → Installment[]

/**
 * Cada Installment tiene:
 * {
 *   installmentNumber: integer,     // 1-based
 *   dueDate: string,                // YYYY-MM-DD, startDate + N meses
 *   principalAmount: number,        // redondeado a 2 decimales
 *   interestAmount: number,         // redondeado a 2 decimales
 *   totalAmount: number             // principalAmount + interestAmount
 * }
 */
```

**Invariantes que debe cumplir el resultado:**
- `sum(principalAmount)` === `principalLoan` (ajuste de centavos en última cuota si hay redondeo)
- `interestAmount` === 0 para todos cuando `loanScheme = NO_INTEREST`
- `dueDate[i]` === `startDate + i meses` (usando date-fns `addMonths`)

---

### `statusCalculator.js`

```js
/**
 * Determina el status de un loan basado en sus cuotas.
 * Llamar después de marcar una cuota como pagada.
 *
 * @param {Array<{isPaid: boolean, dueDate: string}>} schedule
 * @param {string} currentStatus — status actual del loan
 * @returns {'ACTIVE' | 'DEFAULTED' | 'PAID'}
 *
 * Reglas:
 * - Si todas las cuotas tienen isPaid = true → 'PAID'
 * - Si hay cuotas con dueDate < today e isPaid = false → 'DEFAULTED'
 * - En cualquier otro caso → mantener currentStatus (no sobreescribir manual)
 */
calculateLoanStatus(schedule, currentStatus) → string
```

---

### `notificationService.js`

```js
/**
 * Genera y persiste las notificaciones para un préstamo recién creado.
 * Se llama UNA SOLA VEZ desde el controller de creación de loan.
 *
 * @param {string} loanId
 * @param {string} lenderId
 * @param {string} borrowerName — firstName + lastName
 * @param {Array<Installment>} schedule
 * @returns {Promise<void>}
 *
 * Por cada cuota, genera DOS notificaciones:
 *   1. scheduledFor = dueDate - 2 días, type = 'UPCOMING'
 *   2. scheduledFor = dueDate,          type = 'DUE_TODAY'
 *
 * Si maturityDate es null, agregar notificación extra:
 *   scheduledFor = startDate + 1 mes, type = 'NO_DUE_DATE_REMINDER'
 */
generateLoanNotifications(loanId, lenderId, borrowerName, schedule) → Promise<void>
```

---

## Contratos de Validación (Zod Schemas)

Los mismos schemas se usan en frontend (validación de formularios) y backend (validación de body). Viven en `validators/` en ambos lados.

### `authValidators.js`
```js
registerSchema = z.object({
  userEmail:     z.string().email(),
  userPassword:  z.string().min(8),
  userFirstName: z.string().min(1),
  userLastName:  z.string().min(1),
})

loginSchema = z.object({
  userEmail:    z.string().email(),
  userPassword: z.string().min(1),
})
```

### `borrowerValidators.js`
```js
createBorrowerSchema = z.object({
  borrowerFirstName: z.string().min(1),
  borrowerLastName:  z.string().optional(),
  borrowerEmail:     z.string().email().optional(),
  borrowerPhone:     z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
})

updateBorrowerSchema = createBorrowerSchema.partial()
```

### `loanValidators.js`
```js
createLoanSchema = z.object({
  borrowerId:    z.string().uuid(),
  principalLoan: z.number().positive(),
  monthlyRate:   z.number().min(0).max(1),
  loanScheme:    z.enum(['FIXED_INSTALLMENT', 'DECREASING_INSTALLMENT', 'NO_INTEREST']),
  totalMonths:   z.number().int().positive(),
  startDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  maturityDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'DEFAULTED', 'PAID']),
})
```

---

## Contratos de Componentes Frontend

Cada componente tiene una responsabilidad única. No hace fetch directo — consume stores de Zustand.

### `CreateLoanModal`
**Responsabilidad:** formulario de creación de préstamo + preview del schedule antes de confirmar.

**Props:** `{ borrowerId: string, onClose: () => void, onCreated: (loan) => void }`

**Comportamiento:**
1. Renderiza formulario con campos de la spec RF-006
2. Cuando todos los campos son válidos, muestra preview del schedule calculado localmente (loanCalculator del cliente)
3. Al confirmar, llama `POST /api/loans`
4. En éxito, llama `onCreated(loan)` y cierra

**No debe:** hacer cálculos de schedule en cada render. Calcular solo cuando cambian los inputs del formulario (debounce de 300ms).

---

### `PaymentHistoryTable`
**Responsabilidad:** mostrar el schedule de cuotas con la acción de marcar como pagada.

**Props:** `{ loanId: string, schedule: Installment[], loanStatus: string }`

**Comportamiento:**
- Cada fila muestra: #, dueDate, principal, interés, total, estado (pagado/pendiente/vencido)
- Botón "Marcar pagada" solo visible en cuotas `isPaid = false`
- Al hacer click, llama `PATCH /api/loans/:id/installments/:n/pay`
- Deshabilita el botón durante la petición (loading state)
- Si `loanStatus = PAID`, no muestra botones de acción

---

### `NotificationBell`
**Responsabilidad:** icono con badge de notificaciones no leídas.

**Comportamiento:**
- Carga notificaciones al montar (`GET /api/notifications`)
- Badge muestra cantidad de no leídas
- Al hacer click, abre `NotificationPanel`
- Al abrir el panel, marca como leídas las visibles

---

## Reglas de Estado Global (Zustand)

```js
// loanStore.js — estructura esperada del store
{
  loans: Loan[],
  currentLoan: Loan | null,
  currentSchedule: Installment[],

  // Acciones — siempre retornan nuevo estado, nunca mutan
  fetchLoans: () => Promise<void>,
  fetchLoanById: (id) => Promise<void>,
  createLoan: (data) => Promise<Loan>,
  markInstallmentPaid: (loanId, installmentNumber) => Promise<void>,
  updateLoanStatus: (loanId, status) => Promise<void>,
}

// borrowerStore.js
{
  borrowers: Borrower[],
  fetchBorrowers: () => Promise<void>,
  createBorrower: (data) => Promise<Borrower>,
  updateBorrower: (id, data) => Promise<Borrower>,
  deleteBorrower: (id) => Promise<void>,
}

// authStore.js
{
  user: User | null,
  token: string | null,
  isAuthenticated: boolean,
  login: (email, password) => Promise<void>,
  register: (data) => Promise<void>,
  logout: () => void,
  deleteAccount: () => Promise<void>,
}

// notificationStore.js
{
  notifications: Notification[],
  unreadCount: number,
  fetchNotifications: () => Promise<void>,
  markRead: (id) => Promise<void>,
}
```

---

## Criterios de Aceptación por RF

Cada RF tiene criterios de aceptación verificables. Un RF está "done" cuando todos sus criterios pasan.

| RF | Criterio de Aceptación |
|----|------------------------|
| RF-001 | Usuario se registra con datos válidos → recibe JWT → puede hacer requests autenticados |
| RF-001 | Intentar registrar con email duplicado → error 409 |
| RF-001 | Contraseña < 8 chars → error 400 |
| RF-002 | Login con credenciales correctas → JWT válido |
| RF-002 | Login incorrecto 10 veces en 15min → error 429 |
| RF-003 | Crear borrower solo con firstName → éxito |
| RF-003 | Crear borrower con email inválido → error 400 |
| RF-004 | Editar phone de borrower existente → solo phone cambia, resto intacto |
| RF-005 | Eliminar borrower → no aparece en GET /borrowers → sus loans tampoco |
| RF-006 | Crear loan con scheme FIXED → schedule generado, todas las cuotas con mismo totalAmount |
| RF-006 | Crear loan con scheme DECREASING → cada cuota con menor interestAmount que la anterior |
| RF-006 | Crear loan con scheme NO_INTEREST → todas las cuotas con interestAmount = 0 |
| RF-007 | sum(principalAmount del schedule) === principalLoan |
| RF-008 | GET /loans/:id retorna schedule completo con todos los campos |
| RF-009 | Marcar última cuota pagada → loan.status cambia a PAID automáticamente |
| RF-009 | Marcar cuota ya pagada → error 400 |
| RF-010 | Cuota vencida sin pagar → loan.status = DEFAULTED en el response |
| RF-011 | PATCH /loans/:id/status con DEFAULTED → status actualizado, statusUpdatedAt != null |
| RF-012 | Crear loan → notificaciones con scheduledFor = dueDate - 2 days existen en BD |
| RF-013 | Crear loan sin maturityDate → existe notificación scheduledFor = startDate + 1 mes |
| RF-014 | GET /reports/portfolio?format=csv → archivo CSV con todas las columnas definidas |
| RF-015 | GET /reports/borrower/:id?format=xlsx → Excel con schedule de todos sus loans |
| RF-016 | DELETE /auth/account → 401 en requests subsecuentes con mismo token |

---

*Este documento es el contrato del proyecto. Toda discrepancia entre código y spec se resuelve actualizando este documento primero.*
