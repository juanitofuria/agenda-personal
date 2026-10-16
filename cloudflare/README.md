# Nexora API en Cloudflare

Cloudflare Workers ofrece la API web de Nexora, notificaciones Web Push y tareas programadas. D1 guarda los perfiles y los datos
de la agenda. La aplicación cliente se sirve desde Firebase Hosting.

| Área | Archivos |
|---|---|
| Handlers HTTP y cron | `src/worker.ts`, `src/app.ts` |
| Validación de Firebase Authentication | `src/firebaseAuth.ts` |
| Persistencia D1 | `src/almacenD1.ts`, `schema.sql` |
| Contenido y lógica de agenda | `../firebase/functions/src/` |
| Archivos de la PWA | `publico/app/` |

## Desarrollo

Requiere Node.js 20 o superior. Para instalar dependencias, ejecutar pruebas y crear el bundle:

```bash
npm ci
npm test
npm run empaquetar
```

El workflow de GitHub valida el código, ejecuta las pruebas del Worker y del dominio compartido, comprueba el JavaScript de la
PWA y despliega Cloudflare. Necesita `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` como secretos de Actions.

## Configuración

`wrangler.toml` define el ID de D1, las tareas programadas, los orígenes web permitidos y la configuración pública de Firebase.
La configuración del Worker debe coincidir con el proyecto y dominio de Firebase Hosting. No hay tokens de proveedor ni secretos
de webhooks: el acceso autenticado requiere un ID token de Firebase válido.

Las suscripciones push y las claves VAPID se guardan en D1. La API elimina las suscripciones caducadas y reintenta los avisos que
no se pudieron entregar.
