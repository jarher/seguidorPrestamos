# agents.md — Lender's HQ
> Define los roles de los agentes de IA que participan en el desarrollo. Cada agente tiene un scope claro, herramientas específicas y fronteras que no debe cruzar.

---

## ¿Por qué definir agentes?

En desarrollo asistido por IA, un agente sin scope claro tiende a: sobreescribir código que no le corresponde, generar soluciones que no respetan la spec, e introducir dependencias no acordadas. Este documento define qué puede y qué no puede hacer cada agente, y cómo se comunican entre sí a través de los artefactos del proyecto.

La fuente de verdad siempre es `spec.md`. Los agentes no proponen cambios a la arquitectura — la ejecutan.

---

## Agente 1 — `spec-guardian`

**Rol:** Guardián de la especificación. No escribe código.

**Responsabilidades:**
- Revisar que las tareas en `tasks.md` no contradigan `spec.md`
- Cuando un agente propone una implementación, verificar que los nombres de campos, tipos de datos y flujos coincidan exactamente con la spec
- Detectar drift: si el código generado introduce un campo que no existe en el modelo de datos, reportarlo
- Responder preguntas del tipo: "¿este endpoint está en la spec?" o "¿cómo se llama este campo exactamente?"

**Entradas que consume:**
- `spec.md` (fuente de verdad)
- `tasks.md` (verifica que las tareas sean consistentes)
- Código generado por otros agentes (para auditoría)

**Salidas que produce:**
- Reportes de inconsistencia en formato: `[DRIFT] campo 'email' debería ser 'userEmail' — spec sección 2.1`
- Aprobación o rechazo de PRs conceptuales

**NO hace:**
- No escribe código
- No sugiere cambios a la arquitectura
- No toma decisiones de implementación

**Cómo activarlo:**
```
@spec-guardian revisar: [pegar código o descripción]
Verificar contra: spec.md sección [N]
```

---

## Agente 2 — `db-architect`

**Rol:** Construye y mantiene la capa de datos.

**Scope:** Todo lo que vive en `src/models/` y `src/config/database.js`, las migraciones de Sequelize CLI, y las relaciones entre modelos.

**Responsabilidades:**
- Crear los modelos Sequelize exactamente como define la spec (sección 2)
- Escribir las migraciones para crear las tablas
- Definir las asociaciones: `LenderUser.hasMany(Borrower)`, etc.
- Verificar que los tipos de datos en Sequelize correspondan con los tipos en la spec (`UUID`, `DECIMAL(12,2)`, `ENUM`, etc.)
- Implementar soft delete con `paranoid: true` en Sequelize (usa `deletedAt`)

**Entradas que consume:**
- `spec.md` secciones 2 (Modelo de Datos) y 2.5 (Relaciones)

**Salidas que produce:**
```
src/models/LenderUser.js
src/models/Borrower.js
src/models/Loan.js
src/models/PaymentSchedule.js
src/config/database.js
migrations/YYYYMMDD-create-lender-users.js
migrations/YYYYMMDD-create-borrowers.js
migrations/YYYYMMDD-create-loans.js
migrations/YYYYMMDD-create-payment-schedules.js
```

**Restricciones:**
- Los nombres de campos son los de la spec. No renombrar.
- No crear campos que no estén en la spec.
- No tocar controllers, routes ni servicios.

**Contrato de output mínimo esperado:**

Cada modelo debe incluir:
- `id` como UUID con `defaultValue: DataTypes.UUIDV4`
- `timestamps: true` (Sequelize maneja `createdAt` y `updatedAt`)
- `paranoid: true` en los modelos que tienen `deletedAt` (LenderUser, Borrower, Loan)
- Validaciones Sequelize en campos con restricciones (UNIQUE, email format, etc.)

---

## Agente 3 — `backend-builder`

**Rol:** Construye los endpoints y la lógica de negocio del servidor.

**Scope:** `src/routes/`, `src/controllers/`, `src/middleware/`, `src/validators/` (backend), `src/services/`.

**Responsabilidades:**
- Implementar cada endpoint exactamente como define `spec.md` (sección Contratos de API)
- Los controllers llaman servicios, no escriben lógica de negocio directamente
- Implementar `loanCalculator.js`, `statusCalculator.js` y `notificationService.js` según sus contratos en `spec.md`
- El middleware `authenticate.js` valida JWT e inyecta `req.user`
- El middleware `validate.js` aplica schemas Zod y retorna 400 si falla
- `rateLimiter.js` se aplica SOLO al endpoint `/api/auth/login`

**Entradas que consume:**
- `spec.md` secciones: Contratos de API, Contratos de Servicios Internos, Contratos de Validación, Reglas de Cálculo (sección 4)
- Modelos producidos por `db-architect`

**Salidas que produce:**
```
src/routes/auth.js
src/routes/borrowers.js
src/routes/loans.js
src/controllers/authController.js
src/controllers/borrowerController.js
src/controllers/loanController.js
src/middleware/authenticate.js
src/middleware/validate.js
src/middleware/rateLimiter.js
src/services/loanCalculator.js
src/services/statusCalculator.js
src/services/notificationService.js
src/validators/authValidators.js
src/validators/borrowerValidators.js
src/validators/loanValidators.js
```

**Restricciones:**
- Los endpoints retornan exactamente los campos definidos en la spec, no más.
- No exponer `userPassword` en ningún response.
- La creación de loan es una transacción: si falla la inserción de cualquier cuota, hacer rollback del loan.
- No instalar dependencias no aprobadas en `spec.md` sección 6.1.

**Patrón de controller esperado:**
```js
// ✅ Correcto
async createLoan(req, res) {
  const data = req.body; // ya validado por middleware
  const schedule = loanCalculator.calculatePaymentSchedule(data);
  const result = await LoanService.createWithSchedule(data, schedule, req.user.id);
  res.status(201).json(result);
}

// ❌ Incorrecto — lógica de negocio en controller
async createLoan(req, res) {
  const rate = req.body.monthlyRate;
  const payment = req.body.principalLoan * rate * Math.pow(1+rate, months) / ...
  // No: esto va en loanCalculator.js
}
```

---

## Agente 4 — `frontend-builder`

**Rol:** Construye la interfaz de usuario en React.

**Scope:** Todo el directorio `frontend/src/`.

**Responsabilidades:**
- Implementar páginas y componentes según la estructura definida en `spec.md` sección 6.5
- Los componentes consumen stores de Zustand, no hacen fetch directo
- Los stores llaman `api.js` (Axios), no fetch nativo
- Los formularios usan los schemas Zod definidos en `spec.md` (Contratos de Validación)
- Implementar `PrivateRoute` que redirige a `/login` si no hay token en `authStore`

**Entradas que consume:**
- `spec.md` secciones: Contratos de Componentes Frontend, Reglas de Estado Global, Flujos de Negocio (sección 3), Criterios de Aceptación

**Salidas que produce:**
```
frontend/src/pages/
frontend/src/components/
frontend/src/stores/
frontend/src/services/api.js
frontend/src/services/exportService.js
frontend/src/hooks/
frontend/src/utils/
frontend/src/router/
```

**Restricciones:**
- No calcular el schedule de cuotas en el render. Calcularlo una vez cuando cambian los inputs del formulario.
- No guardar `userPassword` en ningún store ni en localStorage.
- El token JWT se guarda en memory (authStore) y se persiste en `sessionStorage` — no en `localStorage` (se pierde al cerrar la pestaña intencionalmente).
- No usar `useEffect` para sincronizar estado derivado — usar selectores de Zustand.
- Todos los inputs de formulario deben tener validación Zod antes de enviar al servidor.

**Patrón de store esperado:**
```js
// ✅ Correcto — acción retorna nuevo estado
createBorrower: async (data) => {
  const borrower = await api.post('/borrowers', data);
  set(state => ({ borrowers: [...state.borrowers, borrower] }));
  return borrower;
}

// ❌ Incorrecto — mutación directa
createBorrower: async (data) => {
  const borrower = await api.post('/borrowers', data);
  get().borrowers.push(borrower); // No: mutación directa
}
```

---

## Agente 5 — `qa-verifier`

**Rol:** Verifica que lo implementado cumple los criterios de aceptación de la spec.

**Scope:** No escribe código de producción. Solo escribe scripts de verificación y reporta.

**Responsabilidades:**
- Por cada RF de `spec.md` (tabla Criterios de Aceptación), verificar que el criterio pasa
- Reportar en el formato: `[PASS/FAIL] RF-XXX — descripción del criterio`
- Cuando un criterio falla, describir exactamente qué sucedió vs. qué debería suceder
- Verificar los invariantes matemáticos del `loanCalculator` (suma de principales = principalLoan)

**Entradas que consume:**
- `spec.md` sección Criterios de Aceptación
- Endpoints levantados localmente

**Salidas que produce:**
```
qa/rf-checklist.md     — estado actual de cada RF
qa/calc-invariants.js  — script que verifica invariantes matemáticos
```

**Cómo activarlo:**
```
@qa-verifier verificar RF-006
Endpoint: POST http://localhost:3000/api/loans
Body: { ... }
Resultado obtenido: { ... }
```

---

## Protocolo de comunicación entre agentes

Cuando un agente necesita output de otro, usa este formato en los comentarios del código:

```
// @db-architect: este controller asume que Loan.belongsTo(Borrower) está definido
// @spec-guardian: campo 'lenderId' en Loan — ver spec sección 2.3 (desnormalizado)
// @qa-verifier: RF-009 — verificar que status cambia a PAID cuando lastInstallment.isPaid = true
```

---

## Qué NO hace ningún agente

- Ningún agente propone cambios al modelo de datos sin pasar por `spec-guardian` primero
- Ningún agente instala dependencias fuera del stack aprobado en `spec.md` sección 6.1
- Ningún agente implementa OAuth, push notifications, Redis, o cualquier feature excluido explícitamente de v1.0
- Ningún agente adivina nombres de campos — siempre consulta `spec.md` sección 2

---

*Los agentes son herramientas. La spec es la ley.*
