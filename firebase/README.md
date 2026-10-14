# Firebase Hosting y Authentication

Firebase se usa para alojar la PWA y autenticar cuentas mediante correo o Google. La API y los datos de la agenda residen en
Cloudflare Workers y D1; ya no se despliegan Firebase Cloud Functions ni se usa Firestore para los datos de la aplicación.

El proyecto y site de producción son `bexora-agenda-personal`. Hosting sirve los archivos de `cloudflare/publico/` en
<https://bexora-agenda-personal.web.app/app/>.

## Publicar Hosting

Desde esta carpeta, ejecuta:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\deploy-hosting.ps1
```

El script publica solo Hosting en `bexora-agenda-personal`. Para el despliegue automático, configura el secreto
`FIREBASE_SERVICE_ACCOUNT_BEXORA_AGENDA_PERSONAL` y la variable `FIREBASE_HOSTING_READY=true` en GitHub Actions.

## Autenticación

Habilita en Firebase Authentication los proveedores de correo/contraseña y Google, y autoriza los dominios de Hosting. La
configuración web pública del cliente está en `cloudflare/wrangler.toml`; no coloques credenciales de servicio en ese archivo.
El Worker valida la firma y los claims de cada ID token antes de atender solicitudes autenticadas.
