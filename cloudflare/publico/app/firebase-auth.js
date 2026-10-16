const resolverInicial = window.__bexoraAuthResolve;
const rechazarInicial = window.__bexoraAuthReject;
const evento = (tipo, detalle) => window.dispatchEvent(new CustomEvent(`bexora-${tipo}`, { detail: detalle }));

window.__bexoraAuthReady = (async () => {
  try {
    const respuesta = await fetch(`${window.BEXORA_API_ORIGIN || ""}/api/config`, { cache: "no-store" });
    if (!respuesta.ok) throw new Error(`No se pudo leer la configuración (${respuesta.status})`);
    const { firebase } = await respuesta.json();
    if (!firebase) {
      const auth = { configurado: false, usuario: null };
      window.bexoraAuth = auth;
      resolverInicial(auth);
      return auth;
    }

    const configuracionFirebase = { ...firebase };
    if (location.hostname === `${firebase.projectId}.web.app`) {
      configuracionFirebase.authDomain = location.hostname;
    }
    const version = "11.10.0";
    const [appSdk, authSdk] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`),
    ]);
    const app = appSdk.initializeApp(configuracionFirebase);
    const auth = authSdk.getAuth(app);
    await authSdk.setPersistence(auth, authSdk.browserLocalPersistence);

    let comprobacionActiva = null;
    const usuarioValido = (usuario) => usuario && (!usuario.email || usuario.emailVerified) ? usuario : null;
    const publicarEstado = () => evento("auth-state", { usuario: usuarioValido(auth.currentUser) });
    const comprobarVerificacion = () => {
      const usuario = auth.currentUser;
      if (!usuario?.email || usuario.emailVerified) return Promise.resolve();
      if (comprobacionActiva) return comprobacionActiva;
      comprobacionActiva = (async () => {
        await authSdk.reload(usuario);
        if (usuario.emailVerified) await authSdk.getIdToken(usuario, true);
        publicarEstado();
      })();
      return comprobacionActiva.finally(() => { comprobacionActiva = null; });
    };
    const api = {
      configurado: true,
      auth,
      get usuario() { return usuarioValido(auth.currentUser); },
      comprobarVerificacion,
      async crearCuenta(email, password, origen = "web") {
        const credencial = await authSdk.createUserWithEmailAndPassword(auth, email, password);
        const destino = new URL("./?verificacion=1", window.location.href);
        destino.searchParams.set("origen", origen === "app" ? "app" : "web");
        const continuarEn = destino.href;
        await authSdk.sendEmailVerification(credencial.user, { url: continuarEn });
      },
      async entrar(email, password) {
        const credencial = await authSdk.signInWithEmailAndPassword(auth, email, password);
        if (credencial.user.email && !credencial.user.emailVerified) {
          evento("verificacion-pendiente", { email: credencial.user.email });
        }
      },
      async reenviarVerificacion(email, password) {
        const credencial = await authSdk.signInWithEmailAndPassword(auth, email, password);
        if (credencial.user.emailVerified) return;
        const continuarEn = new URL("./?verificacion=1", window.location.href).href;
        await authSdk.sendEmailVerification(credencial.user, { url: continuarEn });
      },
      async entrarGoogle() {
        await authSdk.signInWithRedirect(auth, new authSdk.GoogleAuthProvider());
      },
      async entrarApple() {
        const proveedor = new authSdk.OAuthProvider("apple.com");
        proveedor.addScope("email");
        proveedor.addScope("name");
        await authSdk.signInWithRedirect(auth, proveedor);
      },
      async recuperar(email) {
        await authSdk.sendPasswordResetEmail(auth, email);
      },
      async salir() {
        await authSdk.signOut(auth);
      },
    };
    window.bexoraAuth = api;
    authSdk.onAuthStateChanged(auth, (usuario) => {
      evento("auth-state", { usuario: usuarioValido(usuario) });
    }, (error) => evento("auth-error", { mensaje: error.message }));
    await authSdk.getRedirectResult(auth);
    if (new URLSearchParams(window.location.search).has("verificacion")) {
      const origen = new URLSearchParams(window.location.search).get("origen") === "app" ? "app" : "web";
      await comprobarVerificacion();
      window.__bexoraVerificationReturn = { origin: origen, returned: true, verified: !!api.usuario };
      const url = new URL(window.location.href);
      url.searchParams.delete("verificacion");
      history.replaceState(history.state, "", url.pathname + (url.search || "") + url.hash);
    }
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) comprobarVerificacion().catch((error) => evento("auth-error", { mensaje: error.message }));
    });
    window.addEventListener("focus", () => {
      comprobarVerificacion().catch((error) => evento("auth-error", { mensaje: error.message }));
    });
    resolverInicial(api);
    return api;
  } catch (error) {
    const fallo = error instanceof Error ? error : new Error(String(error));
    window.bexoraAuth = { configurado: false, error: fallo };
    evento("auth-error", { mensaje: fallo.message });
    rechazarInicial(fallo);
    throw fallo;
  }
})();
