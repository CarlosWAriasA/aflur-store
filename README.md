# Aflur Store

Catálogo público en español, adaptable al móvil, con administración de productos. Los clientes consultan el catálogo sin crear una cuenta y contactan por WhatsApp (+1 829 304 1914).

## Acceso al administrador

`/admin` solicita usuario y contraseña. Las cuentas autorizadas se consultan en la tabla `users`: solo `active = true` y `role = 'admin'` permiten administrar. No hay registro público ni dependencia de una cuenta de ChatGPT.

Las contraseñas se guardan como hashes scrypt con sal aleatoria (N=16384, r=8, p=5), siguiendo una de las configuraciones documentadas por [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt). Los tokens de sesión se guardan como hashes SHA-256 en `sessions`, expiran a las 12 horas y se entregan en cookies HttpOnly, SameSite=Lax y Secure en HTTPS. La autorización se comprueba en el servidor en cada petición; desactivar una cuenta revoca su acceso inmediatamente. El cambio de contraseña invalida todas sus sesiones. Se limita el número de intentos de acceso y se comprueba el origen en las operaciones de escritura.

No existe una contraseña fija en el código. Crea la cuenta de Neon después de aplicar las migraciones. Puedes cambiarla en Administración > Cambiar contraseña.

Para agregar una cuenta autorizada en Neon:

```powershell
node scripts/create-neon-user.mjs nombre_usuario admin
```

El script genera una contraseña aleatoria y deja sus credenciales en un archivo privado dentro de `.sites-runtime`. Si se proporciona `AFLUR_USER_PASSWORD` en el entorno, usa esa contraseña (entre 12 y 128 caracteres). Nunca modifica cuentas existentes. Para cuentas sin permisos de administración, el segundo argumento puede ser `user`. No se envían credenciales al navegador en las respuestas de la API.

## Desarrollo

Requiere Node 22.x (22.13 o superior). Instalar con `npm ci`. Copia `.env.example` a `.env.local` y completa las variables privadas. Inicia con `npm run dev`, compila con `npm run build` y ejecuta la compilación con `npm start`. Comprobar tipos con `node node_modules/typescript/bin/tsc --noEmit`.

La aplicación usa Next.js, React y TypeScript. Productos, configuración, usuarios y sesiones se almacenan en PostgreSQL en Neon; las fotos usan Cloudinary con subidas firmadas y entrega optimizada. Configura `DATABASE_URL` y aplica las migraciones antes de activar la administración. Consulta [NEON.md](NEON.md) para la activación y creación del administrador. Las migraciones históricas D1 se conservan en `drizzle/`; las PostgreSQL están en `postgres/`.

La administración admite productos de hombre, mujer y unisex, categorías como vestidos, blusas, faldas y conjuntos, y ofertas con un precio menor al normal. El precio de oferta se utiliza también en filtros, ordenación y consultas por WhatsApp. `salePrice` es opcional y se guarda en el JSONB existente: no requiere otra migración. Las fotos se pueden ordenar con arrastre o flechas, y la primera es la portada. La vista previa muestra el borrador sin publicarlo; los cambios se publican al guardar el producto. El acceso Mujer y el texto general del banner se adaptan cuando aparece inventario femenino.

El catálogo y la administración consultan 12 productos por página mediante `LIMIT/OFFSET` en Neon. Búsqueda, categoría, público, talla, favoritos y precio se filtran antes de paginar; las ofertas cuentan como precio vigente. Los totales y opciones de filtros abarcan todo el inventario. La búsqueda espera 200 ms y cancela consultas anteriores para evitar resultados fuera de orden. Los enlaces compartidos consultan el producto por ID sin depender de su página. Las tarjetas solicitan fotos de hasta 800 px y las miniaturas de hasta 160 px, con calidad alta y sin ampliar originales pequeños; pantalla completa mantiene el original.

## Catálogo

Filtros por categoría, audiencia, talla y precio; búsqueda; orden por precio; productos destacados; favoritos guardados en el dispositivo; enlaces individuales; galería de hasta ocho imágenes; elección de portada; productos disponibles, agotados u ocultos.

El catálogo inicial contiene seis referencias visuales del Instagram público de Aflur Store, con fotos locales y enlace a cada publicación. No se atribuyen marcas, precios, tallas ni disponibilidad sin confirmación. Se muestra «Consultar precio» y se permite consultar por WhatsApp. Estas referencias se sustituyen por el inventario gestionado en Neon cuando se guarda el primer producto. Consulta `INSTAGRAM-PRODUCTS.md` para las fuentes.

## Publicación

El destino actual es Vercel: consulta [VERCEL.md](VERCEL.md) para importar el repositorio, configurar Neon y Cloudinary, y corregir los ajustes de compilación. Sin credenciales de Neon, el catálogo muestra ejemplos y la administración permanece sin activar. La publicación anterior en Sites y sus cuentas locales son independientes del nuevo despliegue. `ADMIN_EMAILS` no autoriza a ningún usuario.

## Verificación

Pruebas PostgreSQL: `npm run test:postgres`. Pruebas de subida y lectura de imágenes Cloudinary: `npm run test:storage`. Compilación y TypeScript: `npm run build`. Las pruebas de PostgreSQL usan PGlite; las de Cloudinary comprueban peticiones y firmas sin requerir credenciales reales. Diseño revisado previamente en 320 y 390 px para catálogo, ficha, login y administración, y en tablet de 768 px. Los formularios tienen campos de 16 px y los controles táctiles principales miden al menos 44 px.
