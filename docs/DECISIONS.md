# Decisiones de arquitectura y producto

Registro de decisiones tomadas durante el desarrollo, con su justificación.
El objetivo es que cualquier IA o desarrolladora que llegue al proyecto entienda
el _por qué_ detrás de las decisiones, no solo el _qué_.

---

## Base de datos

### Valores en BD siempre en inglés

**Decisión:** los valores de enums y códigos se almacenan en inglés (`draft`, `issued`,
`paid`, `ca`, `es`). La localización ocurre solo en la capa UI.
**Por qué:** evita dependencias entre el modelo de datos y el idioma de la interfaz.
Cambiar el idioma de la UI no requiere migración de datos.

### RLS en `settings` desactivado

**Decisión:** Row Level Security en la tabla `settings` permanece desactivado.
**Por qué:** activarlo hace que `getSettings()` retorne `null` silenciosamente, sin
lanzar error. El comportamiento es difícil de detectar y depurar. Dado que hay un
único usuario (Roger), RLS no aporta valor y sí introduce riesgo.

### Tabla `contacts` (migrada desde `clients`)

**Decisión:** el modelo de clientes usa la tabla `contacts` con `contact_id`.
**Por qué:** migración realizada para reflejar mejor el dominio (un contacto puede
tener múltiples presupuestos). Lección aprendida: la RPC `create_invoice_from_budget`
quedó referenciando `client_id` después de la migración (bug KAN-20), lo que rompió
la creación de facturas. Tras cualquier migración de esquema, verificar todas las
RPCs activas en Supabase.

### RPCs para operaciones atómicas

**Decisión:** `create_invoice_from_budget` es una RPC que maneja la transacción
completa (copiar líneas, asignar número de factura, actualizar estado del presupuesto
a `invoiced`).
**Por qué:** garantiza atomicidad. Un fallo parcial revierte todo. No se puede crear
una factura a medias.

### Cuando existen múltiples versiones de una RPC

Si en Supabase existen varias versiones (overloads) de una RPC, verificar cuál está
activa y eliminar explícitamente las obsoletas. Las versiones huérfanas pueden
causar comportamiento inesperado.

---

## Arquitectura frontend

### Sin estado global

**Decisión:** no se usa Zustand, Context API ni ninguna librería de estado global.
El estado vive en páginas y hooks locales.
**Por qué:** la app tiene un único usuario y flujos simples. El estado global añade
complejidad sin beneficio real a esta escala. Si la app creciera significativamente,
revisar esta decisión.

### Supabase solo desde server

**Decisión:** las operaciones de Supabase sensibles se ejecutan solo desde server
(route handlers, server actions).
**Por qué:** evita exponer claves de servicio al cliente y centraliza la lógica de
acceso a datos.

### Versiones de dependencias fijadas sin `^`

**Decisión:** las dependencias críticas (especialmente Next.js) están fijadas sin
el prefijo `^` en `package.json`.
**Por qué:** Next.js 15.5.x introdujo un bug crítico (`segment-explorer-node.js`)
que rompía el bundle en producción. pnpm instaló la versión mayor automáticamente
al tener `^`. Lección: en proyectos en producción, fijar versiones explícitas.

---

## Producto y UX

### No hay estado draft en facturas

**Decisión:** las facturas se crean directamente como `issued`, sin paso intermedio
de borrador.
**Por qué:** un paso de borrador no aportaba valor al flujo de Roger. Añadía
complejidad sin beneficio real.

### Estado `invoiced` en presupuestos es irreversible

**Decisión:** una vez un presupuesto está en estado `invoiced`, no se puede
revertir desde la UI.
**Por qué:** garantiza consistencia entre presupuesto y factura. Revertir el estado
implicaría gestionar la factura asociada, lo que añade complejidad no justificada.

### Numeración de facturas con doble serie mensual

**Decisión:** formato `YYYY-MM-NNN` (con IVA) y `YYYY-MM-S-NNN` (sin IVA).
**Por qué:** requisito específico del flujo contable de Roger.

### Texto original de Roger preservado

**Decisión:** la IA almacena `clientDescription` junto a las plantillas generadas.
El texto de Roger se muestra como fallback colapsable con opción de usarlo
directamente.
**Por qué:** Roger es el experto en su trabajo. La plantilla técnica es una
sugerencia, no un reemplazo. (Pendiente de implementar completamente — ver
`progress.md`.)

### No traducir marcas comerciales en PDFs bilingües

**Decisión:** Jotun, Isaval, Titanlux y otras marcas no se traducen al generar
PDFs en CA/ES.
**Por qué:** son nombres propios registrados. Traducirlos sería incorrecto y
potencialmente confuso para el cliente final.

---

## Calidad de logo en PDFs

**Decisión:** el logo se procesa vía canvas antes de embedder en jsPDF
(MAX_WIDTH 600px, calidad JPEG 0.90).
**Por qué:** jsPDF degrada las imágenes si se embeben como JPEG con baja calidad
o con dimensiones excesivas. El PNG fuente (generado por IA) tiene limitaciones
intrínsecas de resolución — la calidad actual es el máximo alcanzable sin un logo
vectorial profesional.

---

_Actualizado a 4 de junio de 2026._
