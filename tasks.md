# tasks.md — Lender's HQ
> Plan de desarrollo granular. Cada tarea es atómica, verificable y tiene un criterio de "done" explícito.
> Propósito doble: guía de ejecución + material de aprendizaje para revisar decisiones tomadas.

---

## Cómo usar este documento

- Las tareas están ordenadas por dependencia: no se puede hacer T-N sin que T-(N-1) esté done.
- Cada tarea tiene: qué hacer, qué archivos toca, qué aprender de ella, y cómo verificar que está done.
- Al completar una tarea, marcarla con `[x]` y anotar cualquier decisión no obvia tomada.
- Las tareas de aprendizaje `[LEARN]` no producen código — producen comprensión.

---

## FASE 0 — Fundamentos y entorno

### T-001 — Inicializar repositorio
- **Agente:** manual
- **Qué hacer:** Crear estructura de carpetas del proyecto, inicializar git, crear `.gitignore` para Node (incluir `.env`, `node_modules/`, `dist/`)
- **Archivos:** `/`, `/.gitignore`, `/README.md`
- **hacer cuando:** `git status` muestra el repo limpio con `.gitignore` activo
- **Aprender:** Por qué `.env` nunca va al repositorio — las variables de entorno contienen secretos (JWT_SECRET, DB_PASSWORD). Si se suben a git, quedan en el historial para siempre aunque se borren después.

---

### T-002 — Configurar proyecto backend ✅ DONE [2026-04-30]
- **Agente:** `backend-builder`
- **Qué hacer:** `npm init`, instalar dependencias del backend según spec 6.1, crear estructura de carpetas `src/`
- **Archivos:** `/backend/package.json`, `/backend/src/` (carpetas vacías con `.gitkeep`)
- **Comando:**
  ```bash
  npm install express dotenv cors helmet
  npm install pg sequelize sequelize-cli
  npm install jsonwebtoken bcryptjs
  npm install zod express-rate-limit
  ```
- **Done cuando:** `node -e "require('express')"` no da error
- **Aprender:** La diferencia entre `dependencies` y `devDependencies`. Todo lo del stack de producción va en `dependencies`. Linters, formatters, testing van en `devDependencies`.

---

### T-003 — Configurar proyecto frontend
- **Agente:** `frontend-builder`
- **Qué hacer:** Crear proyecto Vite + React, instalar dependencias del frontend según spec 6.1
- **Archivos:** `/frontend/`
- **Comandos:**
  ```bash
  npm create vite@latest frontend -- --template react
  cd frontend
  npm install react-router-dom zustand axios
  npm install react-toastify zod
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```
- **Done cuando:** `npm run dev` levanta en `localhost:5173` sin errores
- **Aprender:** Qué es Vite y por qué reemplazó a Create React App. HMR (Hot Module Replacement): el navegador actualiza solo el módulo que cambió, no recarga la página completa.

---

### T-004 — Variables de entorno backend
- **Agente:** `backend-builder`
- **Qué hacer:** Crear `.env.example` con todas las variables necesarias, crear `src/config/env.js` que valida que todas existan al iniciar
- **Archivos:** `/backend/.env.example`, `/backend/src/config/env.js`
- **Variables:**
  ```
  PORT=3000
  DATABASE_URL=postgresql://user:password@localhost:5432/lendershq
  JWT_SECRET=cambiar_esto_en_produccion
  JWT_EXPIRES_IN=7d
  NODE_ENV=development
  ```
- **Done cuando:** Si falta cualquier variable al iniciar, la app crashea con mensaje claro: `Missing required env var: JWT_SECRET`
- **Aprender:** El patrón de "fail fast": es mejor que la app no inicie a que inicie con configuración incompleta y falle misteriosamente en producción.

---

### T-005 — [LEARN] Entender Sequelize y ORM
- **Agente:** humano
- **Qué hacer:** Leer y entender qué es un ORM, cómo Sequelize mapea clases JS a tablas SQL, qué es una migración y por qué es necesaria
- **Preguntas a responder antes de continuar:**
  - ¿Cuál es la diferencia entre `Model.sync()` y usar migraciones? (Respuesta: sync es para dev rápido, migraciones para producción — permiten rollback y control de versiones del schema)
  - ¿Qué es `paranoid: true` en Sequelize? (Respuesta: activa soft delete automático via `deletedAt`)
  - ¿Qué es un `transaction` y cuándo es necesario? (Respuesta: cuando varias operaciones deben ser atómicas — si una falla, todas se revierten)
- **Done cuando:** Puedes explicar estos conceptos con tus palabras

---

## FASE 1 — Base de Datos

### T-006 — Configurar conexión a PostgreSQL
- **Agente:** `db-architect`
- **Qué hacer:** Crear `src/config/database.js` con la conexión Sequelize usando `DATABASE_URL` del `.env`
- **Archivos:** `/backend/src/config/database.js`
- **Done cuando:** `node src/config/database.js` imprime "Conexión establecida con PostgreSQL" (o error claro si falla)
- **Aprender:** Connection pooling — Sequelize no abre una conexión por request, mantiene un pool (por defecto 5 conexiones). Esto es crucial para performance.

---

### T-007 — Modelo LenderUser
- **Agente:** `db-architect`
- **Qué hacer:** Crear modelo Sequelize basado EXACTAMENTE en spec sección 2.1
- **Archivos:** `/backend/src/models/LenderUser.js`
- **Checklist:**
  - [ ] `id` es UUID con `defaultValue: DataTypes.UUIDV4`
  - [ ] `userEmail` tiene `unique: true` y validación de email
  - [ ] `userPassword` no tiene `get()` (no transformar el hash)
  - [ ] `timestamps: true` y `paranoid: true`
  - [ ] Nombre de tabla: `lender_users` (snake_case)
- **Done cuando:** `@spec-guardian` confirma que todos los campos coinciden con spec 2.1

---

### T-008 — Modelo Borrower
- **Agente:** `db-architect`
- **Qué hacer:** Crear modelo Sequelize basado en spec sección 2.2
- **Archivos:** `/backend/src/models/Borrower.js`
- **Checklist:**
  - [ ] `lenderId` como FK con `references: { model: 'lender_users', key: 'id' }`
  - [ ] `borrowerPhone` tiene validación de formato E.164
  - [ ] `timestamps: true` y `paranoid: true`
- **Done cuando:** `@spec-guardian` aprueba

---

### T-009 — Modelo Loan
- **Agente:** `db-architect`
- **Qué hacer:** Crear modelo Sequelize basado en spec sección 2.3
- **Archivos:** `/backend/src/models/Loan.js`
- **Checklist:**
  - [ ] `loanScheme` es `DataTypes.ENUM('FIXED_INSTALLMENT', 'DECREASING_INSTALLMENT', 'NO_INTEREST')`
  - [ ] `status` es `DataTypes.ENUM('ACTIVE', 'DEFAULTED', 'PAID')` con default `'ACTIVE'`
  - [ ] `principalLoan` es `DataTypes.DECIMAL(12, 2)`
  - [ ] `monthlyRate` es `DataTypes.DECIMAL(5, 4)`
  - [ ] Dos FKs: `borrowerId` y `lenderId`
  - [ ] `paranoid: true`
- **Done cuando:** `@spec-guardian` aprueba

---

### T-010 — Modelo PaymentSchedule
- **Agente:** `db-architect`
- **Qué hacer:** Crear modelo Sequelize basado en spec sección 2.4
- **Archivos:** `/backend/src/models/PaymentSchedule.js`
- **Checklist:**
  - [ ] `isPaid` es `DataTypes.BOOLEAN` con `defaultValue: false`
  - [ ] `paidAt` es `DataTypes.DATE` nullable
  - [ ] `totalAmount` es `DataTypes.DECIMAL(12, 2)`
  - [ ] Sin `paranoid` (las cuotas no se eliminan, se marcan pagadas)
- **Done cuando:** `@spec-guardian` aprueba

---

### T-011 — Asociaciones entre modelos
- **Agente:** `db-architect`
- **Qué hacer:** Crear `src/models/index.js` que importa todos los modelos y define las asociaciones
- **Archivos:** `/backend/src/models/index.js`
- **Asociaciones a definir:**
  ```js
  LenderUser.hasMany(Borrower, { foreignKey: 'lenderId' })
  Borrower.belongsTo(LenderUser, { foreignKey: 'lenderId' })
  Borrower.hasMany(Loan, { foreignKey: 'borrowerId' })
  Loan.belongsTo(Borrower, { foreignKey: 'borrowerId' })
  Loan.hasMany(PaymentSchedule, { foreignKey: 'loanId' })
  PaymentSchedule.belongsTo(Loan, { foreignKey: 'loanId' })
  ```
- **Done cuando:** `require('./models')` no da error y las asociaciones están definidas
- **Aprender:** La diferencia entre `hasMany` y `belongsTo`. `hasMany` se pone en el "uno", `belongsTo` en el "muchos". Ambos son necesarios para poder hacer queries en las dos direcciones.

---

### T-012 — Migraciones
- **Agente:** `db-architect`
- **Qué hacer:** Crear una migración por tabla, en orden de dependencia: LenderUsers → Borrowers → Loans → PaymentSchedules
- **Archivos:** `/backend/migrations/*.js`
- **Done cuando:** `npx sequelize-cli db:migrate` crea las 4 tablas sin errores
- **Verificar:** `psql -d lendershq -c "\dt"` muestra las 4 tablas + `SequelizeMeta`
- **Aprender:** Qué es `SequelizeMeta` — es la tabla que Sequelize usa para rastrear qué migraciones ya corrieron. Es como un historial de versiones del schema.

---

## FASE 2 — Backend: Autenticación

### T-013 — Schemas Zod de autenticación
- **Agente:** `backend-builder`
- **Qué hacer:** Crear `authValidators.js` con los schemas exactos de spec (sección Contratos de Validación)
- **Archivos:** `/backend/src/validators/authValidators.js`
- **Done cuando:** Los schemas validan correctamente los casos happy path y los casos de error documentados

---

### T-014 — Middleware de validación
- **Agente:** `backend-builder`
- **Qué hacer:** Crear `validate.js` — un middleware factory que recibe un schema Zod y retorna un middleware Express
- **Archivos:** `/backend/src/middleware/validate.js`
- **Patrón:**
  ```js
  const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ errors: result.error.flatten() });
    req.body = result.data; // datos limpios y tipados
    next();
  }
  ```
- **Done cuando:** Usado en una ruta de prueba, rechaza body inválido con 400 y pasa body válido al controller

---

### T-015 — Rate limiter
- **Agente:** `backend-builder`
- **Qué hacer:** Crear `rateLimiter.js` — solo para el endpoint de login. 10 intentos por 15 minutos por IP.
- **Archivos:** `/backend/src/middleware/rateLimiter.js`
- **Done cuando:** El 11vo request en 15 minutos retorna 429

---

### T-016 — Controller de registro
- **Agente:** `backend-builder`
- **Qué hacer:** Implementar `POST /api/auth/register` según contrato en spec
- **Archivos:** `/backend/src/controllers/authController.js`, `/backend/src/routes/auth.js`
- **Lógica:**
  1. Body ya validado por middleware (T-014)
  2. Verificar email único → 409 si existe
  3. Hashear password con `bcryptjs.hash(password, 12)`
  4. Crear usuario en BD
  5. Generar JWT con `{ id, userEmail }` como payload
  6. Retornar token + user (sin password)
- **Done cuando:** `@qa-verifier` pasa criterios RF-001
- **Aprender:** Por qué `bcrypt.hash(password, 12)` y no 10 o 14. El número es el "cost factor" — 12 significa 2^12 = 4096 iteraciones. Más alto = más seguro pero más lento. 12 es el balance estándar para 2024-2026.

---

### T-017 — Controller de login
- **Agente:** `backend-builder`
- **Qué hacer:** Implementar `POST /api/auth/login` con rate limiting
- **Archivos:** `/backend/src/controllers/authController.js`
- **Lógica:**
  1. Buscar usuario por email
  2. Si no existe → 401 con mensaje genérico "Credenciales inválidas"
  3. Comparar password con `bcryptjs.compare`
  4. Si no coincide → 401 con MISMO mensaje genérico
  5. Generar JWT y retornar
- **Done cuando:** `@qa-verifier` pasa criterios RF-002
- **Aprender:** Por qué el mismo mensaje para "usuario no existe" y "contraseña incorrecta". Si se dan mensajes distintos, un atacante puede enumerar qué emails están registrados. Esto se llama "user enumeration attack".

---

### T-018 — Middleware de autenticación JWT
- **Agente:** `backend-builder`
- **Qué hacer:** Crear `authenticate.js` — verifica JWT del header `Authorization: Bearer <token>`, inyecta `req.user`
- **Archivos:** `/backend/src/middleware/authenticate.js`
- **Done cuando:** Request sin token → 401. Request con token expirado → 401. Request con token válido → `req.user` tiene `{ id, userEmail }`.

---

### T-019 — Endpoint delete account
- **Agente:** `backend-builder`
- **Qué hacer:** Implementar `DELETE /api/auth/account` — elimina en cascada usando soft delete
- **Archivos:** `/backend/src/controllers/authController.js`
- **Done cuando:** `@qa-verifier` pasa criterio RF-016

---

## FASE 3 — Backend: Borrowers

### T-020 — Schemas Zod de borrowers
- **Agente:** `backend-builder`
- **Archivos:** `/backend/src/validators/borrowerValidators.js`
- **Done cuando:** Schema valida E.164 para phone y email opcional correctamente

---

### T-021 — CRUD de borrowers
- **Agente:** `backend-builder`
- **Qué hacer:** Implementar los 4 endpoints de borrowers: GET all, POST, PUT, DELETE
- **Archivos:** `/backend/src/controllers/borrowerController.js`, `/backend/src/routes/borrowers.js`
- **Nota clave:** Todos los queries deben incluir `WHERE lenderId = req.user.id` — un lender nunca ve los borrowers de otro
- **Done cuando:** `@qa-verifier` pasa criterios RF-003, RF-004, RF-005
- **Aprender:** El patrón de ownership check. En lugar de un middleware de autorización complejo, es más claro y seguro incluir `lenderId = req.user.id` en cada query. Si el registro no existe O no pertenece al lender, el query retorna null → 404.

---

## FASE 4 — Backend: Lógica de Préstamos

### T-022 — [LEARN] Entender las fórmulas de cálculo
- **Agente:** humano
- **Qué hacer:** Verificar a mano (con calculadora) un ejemplo de cada esquema
- **Ejercicio concreto:**
  - Préstamo: $1,000,000, tasa 2% mensual, 3 meses
  - Calcular a mano el schedule para FIXED_INSTALLMENT
  - Verificar: ¿la suma de los principalAmount da exactamente $1,000,000?
  - Calcular a mano para DECREASING_INSTALLMENT
- **Done cuando:** Tienes el schedule completo en papel y entiendes de dónde viene cada número
- **Aprender:** El problema del redondeo. Si el capital no es divisible exactamente por los meses, habrá centavos perdidos o sobrantes. La convención es ajustar la ÚLTIMA cuota con la diferencia.

---

### T-023 — Servicio `loanCalculator.js`
- **Agente:** `backend-builder`
- **Qué hacer:** Implementar `calculatePaymentSchedule` según contrato en spec (Contratos de Servicios Internos)
- **Archivos:** `/backend/src/services/loanCalculator.js`
- **Invariantes a garantizar:**
  - `sum(principalAmount)` === `principalLoan` (ajustar última cuota)
  - Todos los valores redondeados a 2 decimales
  - `dueDate[0]` = `startDate + 1 mes`, `dueDate[1]` = `startDate + 2 meses`, etc.
- **Done cuando:** Los 3 invariantes pasan para los 3 esquemas

---

### T-024 — Servicio `statusCalculator.js`
- **Agente:** `backend-builder`
- **Qué hacer:** Implementar `calculateLoanStatus` según contrato en spec
- **Archivos:** `/backend/src/services/statusCalculator.js`
- **Casos a manejar:**
  - Todas pagadas → `PAID`
  - Hay alguna vencida sin pagar → `DEFAULTED`
  - Ninguna vencida y no todas pagadas → retornar `currentStatus` sin cambiar
- **Done cuando:** Los 3 casos retornan el valor correcto

---

### T-025 — Schemas Zod de loans
- **Agente:** `backend-builder`
- **Archivos:** `/backend/src/validators/loanValidators.js`
- **Done cuando:** Rechaza `monthlyRate` > 1 (nadie cobra 100% mensual) y `totalMonths` <= 0

---

### T-026 — Controller: crear préstamo (transacción)
- **Agente:** `backend-builder`
- **Qué hacer:** Implementar `POST /api/loans` — el más complejo del sistema
- **Archivos:** `/backend/src/controllers/loanController.js`
- **Lógica en orden:**
  1. Validar body (middleware)
  2. Verificar que `borrowerId` existe y pertenece al lender
  3. Calcular schedule con `loanCalculator.calculatePaymentSchedule`
  4. Abrir transacción Sequelize
  5. Insertar `Loan`
  6. Insertar todos los `PaymentSchedule` en bulk
  7. Commit transacción
  8. Llamar `notificationService.generateLoanNotifications`
  9. Retornar `{ loan, schedule }`
- **Done cuando:** `@qa-verifier` pasa criterios RF-006 y RF-007
- **Aprender:** `sequelize.transaction()` — si el step 6 falla (ej: un installmentNumber duplicado), el loan insertado en step 5 se revierte automáticamente. Sin transacción, quedaría un loan sin schedule, que es un estado inválido en la BD.

---

### T-027 — Controller: obtener préstamo con schedule
- **Agente:** `backend-builder`
- **Qué hacer:** Implementar `GET /api/loans/:id` con el schedule completo
- **Done cuando:** `@qa-verifier` pasa RF-008

---

### T-028 — Controller: marcar cuota como pagada
- **Agente:** `backend-builder`
- **Qué hacer:** Implementar `PATCH /api/loans/:id/installments/:n/pay`
- **Lógica:**
  1. Buscar el loan (ownership check incluido)
  2. Buscar el PaymentSchedule por `loanId` e `installmentNumber`
  3. Si ya está pagado → 400
  4. Actualizar `isPaid = true`, `paidAt = now()`
  5. Cargar todo el schedule y llamar `statusCalculator.calculateLoanStatus`
  6. Si el status cambió, actualizar `Loan.status` y `Loan.statusUpdatedAt`
  7. Retornar `{ installment, loanStatus }`
- **Done cuando:** `@qa-verifier` pasa criterios RF-009

---

### T-029 — Controller: cambiar estado manual
- **Agente:** `backend-builder`
- **Qué hacer:** Implementar `PATCH /api/loans/:id/status`
- **Done cuando:** `@qa-verifier` pasa RF-010 y RF-011

---

### T-030 — Servicio `notificationService.js`
- **Agente:** `backend-builder`
- **Qué hacer:** Implementar `generateLoanNotifications` según contrato en spec
- **Archivos:** `/backend/src/services/notificationService.js`
- **Nota:** Necesita una tabla `Notifications` en la BD. Crear modelo y migración.
- **Campos del modelo Notification:** `id`, `lenderId`, `loanId`, `message`, `scheduledFor`, `isRead`, `type`, `createdAt`
- **Done cuando:** `@qa-verifier` pasa criterios RF-012 y RF-013

---

### T-031 — Endpoints de notificaciones
- **Agente:** `backend-builder`
- **Qué hacer:** Implementar `GET /api/notifications` y `PATCH /api/notifications/:id/read`
- **Lógica del GET:** `WHERE lenderId = req.user.id AND scheduledFor <= NOW() AND isRead = false`
- **Done cuando:** El bell del frontend puede consumir este endpoint

---

### T-032 — Endpoints de reportes
- **Agente:** `backend-builder`
- **Qué hacer:** Implementar `GET /api/reports/portfolio` y `GET /api/reports/borrower/:id`
- **Archivos:** `/backend/src/controllers/reportController.js`
- **Para CSV:** usar `json2csv` o construir el string manualmente
- **Para XLSX:** usar `exceljs` (`npm install exceljs`)
- **Headers de respuesta:**
  ```js
  res.setHeader('Content-Disposition', 'attachment; filename="portfolio.csv"');
  res.setHeader('Content-Type', 'text/csv');
  ```
- **Done cuando:** `@qa-verifier` pasa RF-014 y RF-015

---

## FASE 5 — Frontend: Base

### T-033 — Configurar Tailwind CSS
- **Agente:** `frontend-builder`
- **Qué hacer:** Configurar `tailwind.config.js` para que escanee `./src/**/*.{js,jsx}`, agregar directivas a `index.css`
- **Done cuando:** Una clase como `bg-blue-500` en un componente aplica el estilo

---

### T-034 — Configurar Axios + interceptors
- **Agente:** `frontend-builder`
- **Qué hacer:** Crear `src/services/api.js` — instancia de Axios con baseURL del env, interceptor de request que agrega JWT header, interceptor de response que maneja 401 (logout automático)
- **Archivos:** `/frontend/src/services/api.js`
- **Done cuando:** Todos los requests incluyen `Authorization: Bearer <token>` automáticamente
- **Aprender:** El patrón de interceptors. En lugar de agregar el header en cada llamada, se agrega una vez en el interceptor. Si el token expira y el servidor responde 401, el interceptor puede redirigir al login automáticamente.

---

### T-035 — Router y rutas protegidas
- **Agente:** `frontend-builder`
- **Qué hacer:** Crear `AppRouter.jsx` con todas las rutas de la spec 6.5, implementar `PrivateRoute` que verifica `authStore.isAuthenticated`
- **Rutas públicas:** `/login`, `/register`
- **Rutas protegidas:** todo lo demás
- **Done cuando:** Navegar a `/dashboard` sin estar autenticado redirige a `/login`

---

### T-036 — authStore (Zustand)
- **Agente:** `frontend-builder`
- **Qué hacer:** Implementar store según contrato en spec (Reglas de Estado Global)
- **Archivos:** `/frontend/src/stores/authStore.js`
- **Nota:** El token se persiste en `sessionStorage` para sobrevivir refreshes pero no quedarse abierto en otras pestañas
- **Done cuando:** Login guarda el token, logout lo limpia, y el interceptor de Axios lo lee del store

---

### T-037 — Páginas de Login y Register
- **Agente:** `frontend-builder`
- **Qué hacer:** Implementar formularios con validación Zod, mostrar errores inline, llamar al authStore
- **Done cuando:** Un usuario puede registrarse, es redirigido al dashboard, puede cerrar sesión y volver al login

---

## FASE 6 — Frontend: Borrowers

### T-038 — borrowerStore
- **Agente:** `frontend-builder`
- **Archivos:** `/frontend/src/stores/borrowerStore.js`
- **Done cuando:** `fetchBorrowers`, `createBorrower`, `updateBorrower`, `deleteBorrower` funcionan sin errores

---

### T-039 — Página BorrowersList
- **Agente:** `frontend-builder`
- **Qué hacer:** Tabla de prestatarios con búsqueda simple, botón de crear, acciones de editar/eliminar
- **Done cuando:** RF-003, RF-004, RF-005 verificables desde la UI

---

### T-040 — Modal BorrowerForm
- **Agente:** `frontend-builder`
- **Qué hacer:** Formulario reutilizable para crear y editar prestatario, con validación Zod
- **Done cuando:** Los errores de validación aparecen debajo del campo correspondiente antes de enviar

---

## FASE 7 — Frontend: Préstamos

### T-041 — loanStore
- **Agente:** `frontend-builder`
- **Archivos:** `/frontend/src/stores/loanStore.js`
- **Done cuando:** Todas las acciones del contrato en spec funcionan

---

### T-042 — loanCalculator (cliente)
- **Agente:** `frontend-builder`
- **Qué hacer:** Copiar la lógica de cálculo del servidor al cliente (mismo algoritmo). Usado SOLO para preview antes de confirmar el préstamo.
- **Archivos:** `/frontend/src/utils/loanCalculator.js`
- **Aprender:** DRY vs. pragmatismo. Lo ideal sería un solo lugar con esta lógica. Lo práctico para v1.0 es duplicarla en cliente y servidor. En una versión futura, esto podría extraerse a un paquete compartido.

---

### T-043 — Modal CreateLoan
- **Agente:** `frontend-builder`
- **Qué hacer:** Formulario de creación de préstamo con preview del schedule
- **Comportamiento clave:** El preview se recalcula con debounce de 300ms cuando cambian los inputs — NO en cada render
- **Done cuando:** El usuario ve el schedule antes de confirmar, y al confirmar el schedule del servidor coincide con el preview

---

### T-044 — Página LoanDetails
- **Agente:** `frontend-builder`
- **Qué hacer:** Header del préstamo + `PaymentHistoryTable` con acción de marcar cuotas
- **Done cuando:** RF-008 y RF-009 verificables desde la UI

---

### T-045 — Cambio de estado manual
- **Agente:** `frontend-builder`
- **Qué hacer:** Selector de estado en la página de detalles del préstamo
- **Done cuando:** RF-010 y RF-011 verificables desde la UI

---

## FASE 8 — Frontend: Notificaciones y Reportes

### T-046 — notificationStore + NotificationBell
- **Agente:** `frontend-builder`
- **Qué hacer:** Store + componente bell con badge + panel desplegable
- **Done cuando:** RF-012 y RF-013 visibles como notificaciones en el panel

---

### T-047 — exportService + página Reports
- **Agente:** `frontend-builder`
- **Qué hacer:** Botones de descarga que llaman a los endpoints de reporte del backend
- **Done cuando:** RF-014 y RF-015 funcionan — se descarga el archivo

---

## FASE 9 — Dashboard e integración

### T-048 — Dashboard
- **Agente:** `frontend-builder`
- **Qué hacer:** KPIs (total prestado, total en mora, total cobrado), tabla de prestatarios activos, sección "cobros de hoy"
- **KPIs se calculan en el frontend** a partir de los datos ya cargados en los stores — no hay endpoints especiales para ellos

---

### T-049 — BorrowerProfile
- **Agente:** `frontend-builder`
- **Qué hacer:** Página con información del prestatario + lista de sus préstamos con estado
- **Done cuando:** Navegando desde la lista de prestatarios se llega al perfil correctamente

---

## FASE 10 — QA Final

### T-050 — Checklist completo de RF
- **Agente:** `qa-verifier`
- **Qué hacer:** Recorrer la tabla de Criterios de Aceptación en `spec.md` y verificar cada uno
- **Artefacto:** `/qa/rf-checklist.md` con `[PASS]` o `[FAIL]` por cada criterio
- **Done cuando:** Los 16 RF tienen al menos un `[PASS]` por criterio

---

### T-051 — Verificar invariantes matemáticos
- **Agente:** `qa-verifier`
- **Qué hacer:** Para cada esquema, crear un préstamo y verificar:
  - `sum(principalAmount)` === `principalLoan`
  - `sum(interestAmount)` === 0 para NO_INTEREST
  - Cada `dueDate` es exactamente un mes después del anterior
- **Done cuando:** Los 3 invariantes pasan para los 3 esquemas con al menos 2 valores de input distintos

---

### T-052 — Prueba de flujo completo
- **Agente:** humano
- **Qué hacer:** Sin ningún dato previo, completar el flujo end-to-end:
  1. Registrarse
  2. Crear un prestatario
  3. Crear un préstamo con cuota fija a 3 meses
  4. Ver el schedule
  5. Marcar la primera cuota como pagada
  6. Verificar que el estado del loan sigue en ACTIVE
  7. Marcar las 2 cuotas restantes
  8. Verificar que el estado cambia a PAID automáticamente
  9. Descargar el reporte de cartera
  10. Eliminar la cuenta
- **Done cuando:** El flujo completo pasa sin errores

---

## Resumen de fases

| Fase | Descripción | Tareas |
|------|-------------|--------|
| 0 | Entorno y fundamentos | T-001 a T-005 |
| 1 | Base de datos | T-006 a T-012 |
| 2 | Auth backend | T-013 a T-019 |
| 3 | Borrowers backend | T-020 a T-021 |
| 4 | Loans backend | T-022 a T-032 |
| 5 | Frontend base | T-033 a T-037 |
| 6 | Frontend borrowers | T-038 a T-040 |
| 7 | Frontend préstamos | T-041 a T-045 |
| 8 | Notificaciones y reportes | T-046 a T-047 |
| 9 | Dashboard e integración | T-048 a T-049 |
| 10 | QA final | T-050 a T-052 |

**Total: 52 tareas atómicas**

---

*Cada tarea completada es un checkpoint de aprendizaje. No avanzar a la siguiente sin entender por qué se hizo lo que se hizo.*
