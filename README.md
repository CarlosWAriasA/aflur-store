# Aflur Store

Catálogo público en español, adaptable al móvil, con administración de productos. Los clientes consultan el catálogo sin crear una cuenta y contactan por WhatsApp (+1 829 304 1914).

## Acceso al administrador

`/admin` solicita usuario y contraseña. Las cuentas autorizadas se consultan en la tabla `users`: solo `active = 1` y `role = 'admin'` permiten administrar. No hay registro público ni dependencia de una cuenta de ChatGPT.

Las contraseñas se guardan como hashes scrypt con sal aleatoria (N=16384, r=8, p=5), siguiendo una de las configuraciones documentadas por [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt). Los tokens de sesión se guardan como hashes SHA-256 en `sessions`, expiran a las 12 horas y se entregan en cookies HttpOnly, SameSite=Lax y Secure en HTTPS. La autorización se comprueba en el servidor en cada petición; desactivar una cuenta revoca su acceso inmediatamente. El cambio de contraseña invalida todas sus sesiones. Se limita el número de intentos de acceso y se comprueba el origen en las operaciones de escritura.

Cuenta inicial local: `admin`. La contraseña aleatoria está en `.sites-runtime/initial-admin.txt`, excluido de Git. Puedes cambiarla en Administración > Cambiar contraseña. No existe una contraseña fija en el código.

Para agregar otra cuenta autorizada local:

```powershell
node scripts/create-user.mjs nombre_usuario admin
```

El script genera una contraseña aleatoria y deja sus credenciales en un archivo privado dentro de `.sites-runtime`. Si se proporciona `AFLUR_USER_PASSWORD` en el entorno, usa esa contraseña (entre 12 y 128 caracteres). Nunca modifica cuentas existentes. Para cuentas sin permisos de administración, el segundo argumento puede ser `user`. No se envían credenciales al navegador en las respuestas de la API.

## Desarrollo

Requiere Node 22.13 o superior. Instalar con `npm ci`. Iniciar la vista previa con `node scripts/run-framework.mjs dev`. Compilar con `node scripts/run-framework.mjs build`. Comprobar tipos con `node node_modules/typescript/bin/tsc --noEmit`.

Productos, configuración, usuarios y sesiones usan D1; las fotos usan R2. Las migraciones `0000_oval_phalanx.sql` y `0001_material_prodigy.sql` ya se aplicaron a la base local; no volver a ejecutarlas allí. En otra instalación se aplican antes de crear usuarios. Para migraciones nuevas, generar con `node node_modules/drizzle-kit/bin.cjs generate`.

## Catálogo

Filtros por categoría, audiencia, talla y precio; búsqueda; orden por precio; productos destacados; favoritos guardados en el dispositivo; enlaces individuales; galería de hasta ocho imágenes; elección de portada; productos disponibles, agotados u ocultos.

Las seis prendas y fotos de Unsplash iniciales son ejemplos, no inventario real. Se indican como demostración y no generan consultas individuales de compra. Desaparecen al guardar el primer producto real.

## Publicación pendiente

El proyecto está registrado en `.openai/hosting.json`, pero no está publicado: el componente de publicación dejó de estar disponible durante la sesión anterior. Las cuentas creadas por `scripts/create-user.mjs` son exclusivamente locales. Al publicar, deben aplicarse las migraciones y provisionarse explícitamente las cuentas autorizadas en la base de producción. `ADMIN_EMAILS` ya no se usa; no autoriza a ningún usuario.

## Verificación

Compilación y TypeScript sin errores. Pruebas locales del acceso inicial, cuentas inexistentes, contraseña incorrecta, roles, cuentas desactivadas, bloqueo del antiguo acceso de GPT, CSRF, lectura autorizada, logout, sesiones vencidas, revocación inmediata, cambio de contraseña y límite de intentos. También se verificaron carga de imágenes, persistencia de productos, filtros y galería.
