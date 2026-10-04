# PostgreSQL en Neon y fotos en R2

La integración está implementada. La conexión real requiere un proyecto Neon y su `DATABASE_URL` privada. No hay una cuenta ni una conexión Neon incluida en el código.

## Activación

1. Crea un proyecto en [Neon](https://console.neon.tech) y copia la cadena PostgreSQL desde **Connect**. Elige una región cercana al sitio.
2. En `web/.dev.vars`, agrega `DATABASE_URL="<cadena de conexión de Neon>"`. Este archivo está excluido de Git. También puedes proporcionar la variable directamente al proceso.
3. Ejecuta `node scripts/migrate-neon.mjs`. Aplica las migraciones de `postgres/` en transacciones, registra sus checksums y verifica las tablas. Puede repetirse; no modifica migraciones ya aplicadas.
4. Crea una cuenta autorizada con `node scripts/create-neon-user.mjs admin admin`. Genera una contraseña aleatoria y la guarda en `.sites-runtime/neon-admin.txt`, excluido de Git. No sobrescribe usuarios. Alternativamente, para conservar las cuentas de la vista previa, ejecuta `node scripts/import-local-to-neon.mjs --local` después de migrar.
5. Configura **DATABASE_URL como secreto de producción** en Sites y vuelve a publicar. Las claves del servidor no deben tener el prefijo `NEXT_PUBLIC_`.
6. Comprueba el catálogo, el login, un producto real con varias fotos y la recuperación después de recargar. Los usuarios de Neon se comparten entre todas las instancias que utilicen la misma conexión.

Cuando se complete la activación y se verifique que los datos actuales se hayan importado, puede retirarse el binding D1 de `.openai/hosting.json`. Hasta entonces, el sitio conserva D1 únicamente cuando no hay `DATABASE_URL`. Una conexión Neon configurada siempre es la fuente de datos; ante un fallo de Neon, la aplicación muestra un error y nunca cambia a otra base automáticamente.

## Datos y migración

Neon almacena `products` (datos JSONB y fecha), `product_images` (producto, orden y clave R2), `settings`, `users`, `sessions` y `login_attempts`. Las operaciones sobre un producto y sus fotos son transacciones. Los archivos siguen en R2; la foto en posición 0 es la portada. Los hashes existentes de contraseñas son compatibles y no requieren conocer las contraseñas originales.

Las migraciones históricas de D1 en `drizzle/` se conservan sin modificaciones. Las nuevas migraciones PostgreSQL se generan en `postgres/` con `node node_modules/drizzle-kit/bin.cjs generate` y se aplican con el script anterior. No ejecutar esas migraciones en D1.

La importación local no sobrescribe filas existentes en Neon ni copia sesiones o intentos de login. Los archivos R2 locales no son los archivos R2 de producción: las fotos creadas en la vista previa deben volver a subirse para publicarlas. Para migrar inventario real ya publicado, exporta sus productos y ajustes de D1 de producción y conserva sus claves R2 de producción; no uses el inventario local como sustituto.

## Verificación

`node --test tests/postgres.test.mjs` ejecuta el controlador HTTP real de Neon con PostgreSQL local en PGlite. Comprueba el esquema, JSONB, parámetros, cambios de portada, reversión de transacciones, claves externas, desactivación de usuarios, sesiones, intentos concurrentes y que un fallo de Neon no consulte D1. Esta prueba no sustituye una verificación con el proyecto Neon real.

Las cuentas `user` no tienen acceso a administración. Las sesiones duran 12 horas. No hay registro público ni inicio de sesión con GPT.
