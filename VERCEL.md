# Publicar Aflur Store en Vercel

La aplicación usa Next.js y ejecuta su backend como funciones Node.js en Vercel. No requiere un servidor adicional. Neon conserva los productos, usuarios y sesiones; Cloudinary conserva y entrega las fotos.

## Proyecto

Importa `CarlosWAriasA/aflur-store`, rama `main`.

- Framework Preset: **Next.js**.
- Root Directory: raíz del repositorio (vacío o `.`). No uses `web`.
- Build Command: `npm run build`.
- Output Directory: `.next`.
- Install Command: `npm ci`.
- Node.js: **22.x**.

`vercel.json` incluye la configuración. El push a `main` dispara el despliegue con la integración de GitHub. Después de cambiar variables, vuelve a desplegar con **Redeploy**.

## Variables en Vercel

En **Settings > Environment Variables**, agrega para **Production** y los entornos Preview que necesites:

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | Cadena PostgreSQL de Neon, con SSL |
| `CLOUDINARY_CLOUD_NAME` | Cloud name del entorno de Cloudinary |
| `CLOUDINARY_API_KEY` | API Key del mismo entorno |
| `CLOUDINARY_API_SECRET` | API Secret del mismo entorno |

Encuentra las credenciales en [Cloudinary Console](https://console.cloudinary.com/) > tu entorno de producto > **Settings > API Keys**. No compartas el API Secret ni le pongas el prefijo `NEXT_PUBLIC_`. Para desarrollo, copia `.env.example` a `.env.local` y completa los valores allí. Ese archivo está excluido de Git.

No se necesita bucket, token de R2, política CORS manual ni un preset unsigned. Las variables `R2_*` anteriores ya no se utilizan. Las fotos previamente guardadas en R2 no se transfieren automáticamente: deben subirse a Cloudinary. Las fotos iniciales de Instagram y el banner local siguen funcionando sin estas credenciales.

## Activar el administrador

Con `DATABASE_URL` configurada en `.env.local` o en el entorno de la terminal, ejecuta:

```powershell
npm run db:migrate
node scripts/create-neon-user.mjs admin admin
```

El script crea una contraseña aleatoria en `.sites-runtime/neon-admin.txt`, excluido de Git. No sobrescribe una cuenta existente. Después configura la misma conexión Neon en Vercel, vuelve a desplegar y entra a `/admin`. Consulta [NEON.md](NEON.md).

Crear la base en Neon no aplica automáticamente las migraciones ni crea un administrador.

## Subida y entrega de fotos

1. La administración pide una autorización a `/api/upload`. Vercel comprueba la sesión y el origen, valida el tipo y el tamaño declarado y firma un identificador aleatorio. El API Secret se queda en el servidor.
2. El navegador envía el archivo directamente a la API de Cloudinary con la firma. Solo se admiten JPG, PNG o WebP; se impide sobrescribir el identificador. Cloudinary verifica el formato real.
3. `/api/upload/complete` consulta los metadatos directamente en Cloudinary y verifica el identificador, tipo de recurso, formato, dimensiones y tamaño real. Si excede 5 MB o no corresponde al formato esperado, se elimina y no se añade al producto.
4. Neon guarda referencias estables `/api/images/<clave>`. Esa ruta redirige a la CDN de Cloudinary con formato y calidad automáticos y un ancho máximo de 1600 px. Los archivos no pasan por las funciones de Vercel.

El límite es ocho fotos por producto y 5 MB por foto. Una foto subida pero no guardada en ningún producto permanece en Cloudinary; puede eliminarse desde su Media Library. Borrar un producto retira sus referencias en Neon, pero no borra automáticamente sus archivos de Cloudinary, para no eliminar fotos que otro producto pueda utilizar.

El panel de administración muestra almacenamiento, datos enviados y créditos mediante la [Admin API de Cloudinary](https://cloudinary.com/documentation/admin_api#usage). Esta consulta requiere que la API Key tenga permiso de lectura de uso. Solo administradores autenticados pueden consultarla; las credenciales permanecen en el servidor. Las lecturas del proveedor se conservan durante cinco minutos y Cloudinary actualiza sus cifras periódicamente. El reporte incluye todo el entorno de Cloudinary, incluso archivos ajenos al catálogo. Solo se muestra capacidad restante cuando el proveedor devuelve un límite: los planes de créditos compartidos no tienen una cantidad fija de fotos disponibles. Un error al consultar estadísticas no bloquea la gestión del catálogo.

## Verificar

Ejecuta `npm run build`, `npm run test:storage` y `npm run test:postgres`. Las pruebas de almacenamiento simulan Cloudinary y verifican las firmas, validación y URLs sin credenciales reales. Después de activar las credenciales, prueba con un producto real y varias fotos desde el móvil, recarga el catálogo y comprueba el visor de pantalla completa.

Sin conexión Neon, el catálogo muestra referencias iniciales de Instagram con precio y tallas por consultar. La administración necesita Neon. Una compilación correcta no verifica las credenciales reales de Cloudinary o Neon.

Referencias: [Next.js en Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [subidas Cloudinary](https://cloudinary.com/documentation/upload_images), [firmas](https://cloudinary.com/documentation/signatures), [Upload API](https://cloudinary.com/documentation/image_upload_api_reference).
