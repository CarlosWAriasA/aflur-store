# Publicar Aflur Store en Vercel

El proyecto usa Next.js con ejecución Node.js. `npm run build` genera `.next`, incluido `routes-manifest.json`. La configuración anterior de Vinext generaba `dist`, lo que causaba el error de la captura.

## Proyecto

Importa `CarlosWAriasA/aflur-store`, rama `main`. En **Settings > Build and Deployment** selecciona:

- Framework Preset: **Next.js**.
- Root Directory: raíz del repositorio (vacío o `.`). GitHub ya contiene la aplicación en la raíz; no uses `web`.
- Build Command: `npm run build`.
- Output Directory: `.next`.
- Install Command: `npm ci`.
- Node.js: **22.x**.

`vercel.json` contiene los valores de compilación. El push a `main` debe disparar el despliegue si la integración GitHub está habilitada. Para repetir uno manualmente, usa **Redeploy** después de guardar las variables.

## Variables privadas

En **Settings > Environment Variables**, agrega estas variables para Production y los entornos de Preview que vayas a usar:

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | Cadena PostgreSQL del botón Connect de Neon, con SSL |
| `R2_ACCOUNT_ID` | Account ID de Cloudflare |
| `R2_ACCESS_KEY_ID` | Access Key ID de un token S3 de R2 |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key del mismo token |
| `R2_BUCKET_NAME` | Nombre del bucket de fotos |

Nunca uses `NEXT_PUBLIC_` para estas variables. Para desarrollo, copia `.env.example` a `.env.local` y completa los valores allí. No subas ese archivo a Git.

Sin `DATABASE_URL`, el catálogo muestra referencias visuales de Instagram con precio, tallas y disponibilidad por consultar. El administrador necesita la base real: aplica `npm run db:migrate` y luego `npm run db:create-user -- admin admin` desde una terminal que tenga `DATABASE_URL`. La contraseña generada se guarda en `.sites-runtime/neon-admin.txt`. Consulta [NEON.md](NEON.md).

## Imágenes en Cloudflare R2

Crea un bucket privado y un token de API S3 con permiso **Object Read & Write** limitado a ese bucket. Las fotos se envían directamente desde el navegador a R2 con un enlace firmado de cinco minutos. El servidor valida tamaño y formato antes de publicarlas; Neon guarda la referencia, no los archivos. Las imágenes se muestran mediante enlaces temporales de lectura. El bucket no necesita acceso público.

En la configuración **CORS** del bucket, permite el dominio real de la tienda. Ejemplo (sustituye el dominio antes de guardar):

```json
[
  {
    "AllowedOrigins": ["https://TU-DOMINIO.vercel.app", "http://localhost:3000"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

Agrega cada dominio de Preview que necesite subir imágenes. Configura una regla de ciclo de vida para eliminar objetos con prefijo `pending/` después de un día: limpia subidas abandonadas. Las fotos publicadas no usan ese prefijo. El límite sigue siendo ocho fotos por producto y 5 MB por foto. La subida directa evita el límite de 4.5 MB del cuerpo de las funciones de Vercel.

Si las fotos antiguas están en un bucket gestionado por otro alojamiento, estas variables deben apuntar al mismo bucket con credenciales válidas, o tendrás que transferirlas a uno propio. Las fotos locales no se transfieren automáticamente.

## Comprobación después de activar

Abre el catálogo desde un móvil, entra a `/admin`, guarda un producto con varias fotos y recarga la página. Comprueba portada, tallas, precio y enlace de WhatsApp. Una compilación correcta no verifica por sí sola las credenciales de Neon ni los permisos y CORS de R2.

Referencias: [Next.js en Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs), [límites de funciones](https://vercel.com/docs/functions/limitations), [R2 con AWS SDK](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/), [enlaces firmados y CORS](https://developers.cloudflare.com/r2/api/s3/presigned-urls/).
