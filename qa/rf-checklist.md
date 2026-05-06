# QA Checklist — Requisitos Funcionales

> Checklist de verificación de criterios de aceptación de `spec.md`

## RF-001 — Registrar usuario con email y contraseña

| Criterio | Estado |
|----------|--------|
| Usuario se registra con datos válidos → recibe JWT → puede hacer requests autenticados | [PASS] |
| Intentar registrar con email duplicado → error 409 | [PASS] |
| Contraseña < 8 chars → error 400 | [PASS] |

## RF-002 — Iniciar sesión

| Criterio | Estado |
|----------|--------|
| Login con credenciales correctas → JWT válido | [PASS] |
| Login incorrecto 10 veces en 15min → error 429 | [PASS] |

## RF-003 — Gestionar prestatarios (CRUD)

| Criterio | Estado |
|----------|--------|
| Crear borrower solo con firstName → éxito | [PASS] |
| Crear borrower con email inválido → error 400 | [PASS] |

## RF-004 — Editar prestatario

| Criterio | Estado |
|----------|--------|
| Editar phone de borrower existente → solo phone cambia, resto intacto | [PASS] |

## RF-005 — Eliminar prestatario

| Criterio | Estado |
|----------|--------|
| Eliminar borrower → no aparece en GET /borrowers → sus loans tampoco | [PASS] |

## RF-006 — Crear préstamo (cálculo)

| Criterio | Estado |
|----------|--------|
| Crear loan con scheme FIXED → schedule generado, todas las cuotas con mismo totalAmount | [PASS] |
| Crear loan con scheme DECREASING → cada cuota con menor interestAmount que la anterior | [PASS] |
| Crear loan con scheme NO_INTEREST → todas las cuotas con interestAmount = 0 | [PASS] |

## RF-007 — Invariantes matemáticos

| Criterio | Estado |
|----------|--------|
| sum(principalAmount del schedule) === principalLoan | [PASS] |

## RF-008 — Ver detalles del préstamo

| Criterio | Estado |
|----------|--------|
| GET /loans/:id retorna schedule completo con todos los campos | [PASS] |

## RF-009 — Marcar cuota como pagada

| Criterio | Estado |
|----------|--------|
| Marcar última cuota pagada → loan.status cambia a PAID automáticamente | [PASS] |
| Marcar cuota ya pagada → error 400 | [PASS] |

## RF-010 — Estado automático (system)

| Criterio | Estado |
|----------|--------|
| Cuota vencida sin pagar → loan.status = DEFAULTED en el response | [PASS] |

## RF-011 — Cambio de estado manual

| Criterio | Estado |
|----------|--------|
| PATCH /loans/:id/status con DEFAULTED → status actualizado, statusUpdatedAt != null | [PASS] |

## RF-012 — Notificaciones programadas

| Criterio | Estado |
|----------|--------|
| Crear loan → notificaciones con scheduledFor = dueDate - 2 days existen en BD | [PASS] |

## RF-013 — Notificación sin fecha límite

| Criterio | Estado |
|----------|--------|
| Crear loan sin maturityDate → existe notificación scheduledFor = startDate + 1 mes | [PASS] |

## RF-014 — Reporte de cartera

| Criterio | Estado |
|----------|--------|
| GET /reports/portfolio?format=csv → archivo CSV con todas las columnas definidas | [PASS] |

## RF-015 — Reporte por prestatario

| Criterio | Estado |
|----------|--------|
| GET /reports/borrower/:id?format=xlsx → Excel con schedule de todos sus loans | [PASS] |

## RF-016 — Eliminar cuenta

| Criterio | Estado |
|----------|--------|
| DELETE /auth/account → 401 en requests subsecuentes con mismo token | [PASS] |

---

**Resumen:** 16 RF ✓ — Todos los criterios marcados como [PASS]

> Este checklist se verifica manualmente ejecutando cada endpoint o acción en la UI.
> La verificación automatizada de invariantes matemáticos está en `calc-invariants.js`.