# Nexora · agenda personal web

Nexora es una aplicación web progresiva (PWA) para agenda, recordatorios, compras, salud y economía. La web se publica en
Firebase Hosting y sus datos y notificaciones se gestionan mediante una API en Cloudflare Workers con D1. Firebase Authentication
gestiona las cuentas y el inicio de sesión. No hay una aplicación Android nativa.

## Entornos

- Sitio de producción: <https://bexora-agenda-personal.web.app/app/>
- Firebase project/site: `bexora-agenda-personal`
- API: `https://agenda-personal.cresofin.workers.dev`
- El cliente Firebase se configura en `cloudflare/wrangler.toml`; la API acepta CORS desde los orígenes listados en `APP_ORIGINS`.
- `juanitofuria/agenda-personal` es el repositorio autoritativo. El workflow de espejo actualiza `cresofin/agenda-personal`
  con una copia exacta; requiere `CRESOFIN_MIRROR_TOKEN` con `Contents: Read and write` en el repositorio espejo.

## Desarrollo y pruebas

Requisitos: Node.js 20 o superior.

```bash
cd cloudflare
npm ci
npm test
npm run empaquetar
```

Las pruebas del dominio compartido:

```bash
cd firebase/functions
npm ci
npm test
```

El flujo de publicación de Cloudflare ejecuta ambas suites, valida el JavaScript de la PWA, empaqueta el Worker y lo publica.
Necesita los secretos `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` de GitHub Actions.

## Publicación de Firebase Hosting

Desde `firebase/`, ejecutar `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\deploy-hosting.ps1`.
El script publica únicamente Hosting en el proyecto `bexora-agenda-personal`; no despliega funciones de Firebase.

Para automatizar Hosting, configura el secreto `FIREBASE_SERVICE_ACCOUNT_BEXORA_AGENDA_PERSONAL` y la variable
`FIREBASE_HOSTING_READY=true` según `.github/workflows/deploy-firebase-hosting.yml`.

## Funciones de la aplicación

La PWA incluye autenticación y verificación por correo, sincronización de datos entre dispositivos, Web Push, instalación desde el
navegador, biometría WebAuthn cuando el dispositivo la ofrece y modo de prueba con datos de ejemplo. La instalación es una función
web; no requiere código ni proyecto Android nativo.

La API valida criptográficamente los ID tokens de Firebase antes de leer o crear perfiles. Los resúmenes, eventos y preferencias
se guardan en D1. Las listas de compra compartidas usan enlaces con token y acceso limitado a esa lista.
