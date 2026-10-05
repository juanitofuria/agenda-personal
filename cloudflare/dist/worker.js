var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback4) {
    this._callback = callback4;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback4) {
    callback4 && callback4();
    return false;
  }
  clearScreenDown(callback4) {
    callback4 && callback4();
    return false;
  }
  cursorTo(x, y, callback4) {
    callback4 && typeof callback4 === "function" && callback4();
    return false;
  }
  moveCursor(dx, dy, callback4) {
    callback4 && callback4();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// src/almacenD1.ts
var aFecha = /* @__PURE__ */ __name((v) => typeof v === "string" || typeof v === "number" ? new Date(v) : null, "aFecha");
function usuarioDesdeJson(id, d) {
  return {
    id,
    nombre: d.nombre ?? "",
    nacimiento: d.nacimiento ?? null,
    zona: d.zona ?? "Europe/Madrid",
    ciudad: d.ciudad ?? null,
    secciones: d.secciones ?? {},
    temas: d.temas ?? [],
    estado: d.estado ?? null,
    onboardingHecho: !!d.onboardingHecho,
    activo: d.activo !== false,
    ultimoUpdate: d.ultimoUpdate ?? 0,
    creadoEn: aFecha(d.creadoEn) ?? /* @__PURE__ */ new Date(0)
  };
}
__name(usuarioDesdeJson, "usuarioDesdeJson");
function eventoDesdeJson(uid, id, d) {
  return {
    id,
    uid,
    tipo: d.tipo,
    titulo: d.titulo ?? "",
    lugar: d.lugar ?? "",
    fechaHora: aFecha(d.fechaHora),
    antelacionMin: d.antelacionMin ?? 0,
    repeticion: d.repeticion ?? "ninguna",
    avisado: !!d.avisado,
    hecho: !!d.hecho,
    creadoEn: aFecha(d.creadoEn) ?? /* @__PURE__ */ new Date(0)
  };
}
__name(eventoDesdeJson, "eventoDesdeJson");
function programacionDesdeFila(f) {
  const d = JSON.parse(f.datos);
  return { id: f.id, uid: f.uid, tipo: f.tipo, ref: d.ref, proximo: new Date(f.proximo), posponer: d.posponer, intentos: d.intentos };
}
__name(programacionDesdeFila, "programacionDesdeFila");
var nuevoId = /* @__PURE__ */ __name(() => crypto.randomUUID().replace(/-/g, "").slice(0, 12), "nuevoId");
var AlmacenD1 = class {
  constructor(db) {
    this.db = db;
  }
  db;
  static {
    __name(this, "AlmacenD1");
  }
  async getUsuario(id) {
    const f = await this.db.prepare("SELECT datos FROM usuarios WHERE id = ?").bind(id).first();
    return f ? usuarioDesdeJson(id, JSON.parse(f.datos)) : null;
  }
  async guardarUsuario(u) {
    const { id, ...resto } = u;
    await this.db.prepare("INSERT INTO usuarios (id, datos) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET datos = excluded.datos").bind(id, JSON.stringify(resto)).run();
  }
  async borrarUsuario(id) {
    await this.db.batch([
      this.db.prepare("DELETE FROM eventos WHERE uid = ?").bind(id),
      this.db.prepare("DELETE FROM programaciones WHERE uid = ?").bind(id),
      this.db.prepare("DELETE FROM usuarios WHERE id = ?").bind(id)
    ]);
  }
  async listarEventos(uid) {
    const r = await this.db.prepare("SELECT id, datos FROM eventos WHERE uid = ?").bind(uid).all();
    return r.results.map((f) => eventoDesdeJson(uid, f.id, JSON.parse(f.datos)));
  }
  async getEvento(uid, id) {
    const f = await this.db.prepare("SELECT datos FROM eventos WHERE uid = ? AND id = ?").bind(uid, id).first();
    return f ? eventoDesdeJson(uid, id, JSON.parse(f.datos)) : null;
  }
  async guardarEvento(e) {
    const guardado = { ...e, id: e.id ?? nuevoId() };
    const { id, uid, ...datos2 } = guardado;
    await this.db.prepare("INSERT INTO eventos (uid, id, datos) VALUES (?, ?, ?) ON CONFLICT(uid, id) DO UPDATE SET datos = excluded.datos").bind(uid, id, JSON.stringify(datos2)).run();
    return guardado;
  }
  async borrarEvento(uid, id) {
    await this.db.prepare("DELETE FROM eventos WHERE uid = ? AND id = ?").bind(uid, id).run();
  }
  async guardarProgramacion(p) {
    const datos2 = JSON.stringify({ ref: p.ref, posponer: p.posponer, intentos: p.intentos });
    await this.db.prepare("INSERT INTO programaciones (id, uid, tipo, proximo, datos) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET uid = excluded.uid, tipo = excluded.tipo, proximo = excluded.proximo, datos = excluded.datos").bind(p.id, p.uid, p.tipo, p.proximo.getTime(), datos2).run();
  }
  async borrarProgramacion(id) {
    await this.db.prepare("DELETE FROM programaciones WHERE id = ?").bind(id).run();
  }
  async borrarProgramacionesDe(uid, tipo) {
    if (tipo) await this.db.prepare("DELETE FROM programaciones WHERE uid = ? AND tipo = ?").bind(uid, tipo).run();
    else await this.db.prepare("DELETE FROM programaciones WHERE uid = ?").bind(uid).run();
  }
  async programacionesVencidas(hasta, limite) {
    const r = await this.db.prepare("SELECT id, uid, tipo, proximo, datos FROM programaciones WHERE proximo <= ? ORDER BY proximo LIMIT ?").bind(hasta.getTime(), limite).all();
    return r.results.map(programacionDesdeFila);
  }
  /** Atómico: un único UPDATE condicionado al valor anterior. */
  async reclamarProgramacion(id, esperado, nuevo) {
    const r = await this.db.prepare("UPDATE programaciones SET proximo = ? WHERE id = ? AND proximo = ?").bind(nuevo.getTime(), id, esperado.getTime()).run();
    return (r.meta?.changes ?? 0) === 1;
  }
  async getHoroscopo(signoId) {
    const f = await this.db.prepare("SELECT datos FROM horoscopos WHERE signo = ?").bind(signoId).first();
    return f ? JSON.parse(f.datos) : null;
  }
  async guardarHoroscopo(signoId, doc) {
    await this.db.prepare("INSERT INTO horoscopos (signo, datos) VALUES (?, ?) ON CONFLICT(signo) DO UPDATE SET datos = excluded.datos").bind(signoId, JSON.stringify(doc)).run();
  }
  async cacheGet(clave, ahora) {
    const f = await this.db.prepare("SELECT valor FROM cache WHERE clave = ? AND expira > ?").bind(clave, ahora.getTime()).first();
    return f?.valor ?? null;
  }
  async cacheSet(clave, valor, ttlMs, ahora) {
    await this.db.prepare("INSERT INTO cache (clave, valor, expira) VALUES (?, ?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, expira = excluded.expira").bind(clave, valor, ahora.getTime() + ttlMs).run();
  }
  /** Borra la caché caducada (se llama de vez en cuando para que no crezca). */
  async limpiarCache(ahora) {
    await this.db.prepare("DELETE FROM cache WHERE expira <= ?").bind(ahora.getTime()).run();
  }
};

// src/http.ts
var ErrorHttp = class extends Error {
  constructor(mensaje, response) {
    super(mensaje);
    this.response = response;
  }
  response;
  static {
    __name(this, "ErrorHttp");
  }
};
var HttpFetch = class {
  constructor(maxPeticiones = 45, maxConcurrentes = 5, fetcher = (...a) => fetch(...a)) {
    this.maxPeticiones = maxPeticiones;
    this.maxConcurrentes = maxConcurrentes;
    this.fetcher = fetcher;
  }
  maxPeticiones;
  maxConcurrentes;
  fetcher;
  static {
    __name(this, "HttpFetch");
  }
  usadas = 0;
  activas = 0;
  cola = [];
  get restantes() {
    return this.maxPeticiones - this.usadas;
  }
  async turno() {
    if (this.activas >= this.maxConcurrentes) await new Promise((r) => this.cola.push(r));
    this.activas++;
  }
  liberar() {
    this.activas--;
    this.cola.shift()?.();
  }
  async pedir(url, init, timeout = 2e4) {
    if (this.usadas >= this.maxPeticiones) throw new ErrorHttp("presupuesto de peticiones salientes agotado en esta ejecuci\xF3n");
    this.usadas++;
    await this.turno();
    try {
      let r;
      try {
        r = await this.fetcher(url, { ...init, signal: AbortSignal.timeout(timeout) });
      } catch (e) {
        throw new ErrorHttp(e.message || "error de red");
      }
      const texto4 = await r.text();
      let data = texto4;
      if ((r.headers.get("content-type") ?? "").includes("json") || /^\s*[[{]/.test(texto4)) {
        try {
          data = JSON.parse(texto4);
        } catch {
        }
      }
      if (!r.ok) throw new ErrorHttp(`HTTP ${r.status}`, { status: r.status, data });
      return { data };
    } finally {
      this.liberar();
    }
  }
  get(url, opciones) {
    return this.pedir(url, { method: "GET", headers: opciones?.headers }, opciones?.timeout);
  }
  post(url, cuerpo, opciones) {
    return this.pedir(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo ?? {}) }, opciones?.timeout);
  }
};

// ../firebase/functions/src/modelo.ts
var SECCIONES = {
  tiempo: { emoji: "\u{1F324}", titulo: "Tiempo", horaDefecto: "07:00", descripcion: "Previsi\xF3n por horas, lluvia, sol, viento, UV y luna" },
  noticias: { emoji: "\u{1F4F0}", titulo: "Noticias", horaDefecto: "07:10", descripcion: "Econom\xEDa, pol\xEDtica y noticias de tu zona" },
  agenda: { emoji: "\u{1F5D3}", titulo: "Agenda", horaDefecto: "07:20", descripcion: "Tus citas y tareas de hoy y ma\xF1ana" },
  horoscopo: { emoji: "\u{1F52E}", titulo: "Hor\xF3scopo", horaDefecto: "08:00", descripcion: "El hor\xF3scopo del d\xEDa de tu signo" },
  mercados: { emoji: "\u{1F4C8}", titulo: "Mercados", horaDefecto: "14:00", descripcion: "Premercado de Wall Street y cierre de ayer" }
};
var ORDEN_SECCIONES = ["tiempo", "noticias", "agenda", "horoscopo", "mercados"];
function momentoAviso(e) {
  return e.fechaHora ? new Date(e.fechaHora.getTime() - e.antelacionMin * 6e4) : null;
}
__name(momentoAviso, "momentoAviso");
function usuarioNuevo(id, nombre, ahora) {
  const secciones = {};
  for (const s of ORDEN_SECCIONES) secciones[s] = { activa: false, hora: SECCIONES[s].horaDefecto };
  return {
    id,
    nombre,
    nacimiento: null,
    zona: "Europe/Madrid",
    ciudad: null,
    secciones,
    temas: [],
    estado: null,
    onboardingHecho: false,
    activo: true,
    ultimoUpdate: 0,
    creadoEn: ahora
  };
}
__name(usuarioNuevo, "usuarioNuevo");

// ../firebase/functions/src/almacen.ts
function idProgramacion(uid, tipo, ref2) {
  return `${uid}__${tipo}__${ref2}`.replace(/\//g, "_");
}
__name(idProgramacion, "idProgramacion");

// ../firebase/functions/src/fechas.ts
var FORMATOS = /* @__PURE__ */ new Map();
function formatoPartes(zona) {
  let f = FORMATOS.get(zona);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: zona,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      weekday: "short"
    });
    FORMATOS.set(zona, f);
  }
  return f;
}
__name(formatoPartes, "formatoPartes");
function partesEnZona(fecha, zona) {
  const f = formatoPartes(zona).formatToParts(fecha);
  const g = /* @__PURE__ */ __name((t) => f.find((p) => p.type === t).value, "g");
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday"));
  return { y: +g("year"), m: +g("month"), d: +g("day"), h: +g("hour"), mi: +g("minute"), dow };
}
__name(partesEnZona, "partesEnZona");
function localAUtc(y, m, d, h, mi, zona) {
  const nominal = Date.UTC(y, m - 1, d, h, mi);
  let utc = nominal;
  for (let i = 0; i < 3; i++) {
    const p = partesEnZona(new Date(utc), zona);
    const visto = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi);
    const desfase = visto - utc;
    const siguiente = nominal - desfase;
    if (siguiente === utc) break;
    utc = siguiente;
  }
  return new Date(utc);
}
__name(localAUtc, "localAUtc");
function fechaIso(fecha, zona) {
  const p = partesEnZona(fecha, zona);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}
__name(fechaIso, "fechaIso");
function sumarDias(y, m, d, dias) {
  const t = new Date(Date.UTC(y, m - 1, d + dias));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}
__name(sumarDias, "sumarDias");
function parseHoraHHMM(texto4) {
  const m = /^\s*(\d{1,2})[:.hH](\d{2})\s*$/.exec(texto4) ?? /^\s*(\d{1,2})\s*[hH]?\s*$/.exec(texto4);
  if (!m) return null;
  const h = +m[1];
  const mi = m[2] === void 0 ? 0 : +m[2];
  return h >= 0 && h <= 23 && mi >= 0 && mi <= 59 ? [h, mi] : null;
}
__name(parseHoraHHMM, "parseHoraHHMM");
function formatoHHMM(h, mi) {
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}
__name(formatoHHMM, "formatoHHMM");
function proximaOcurrencia(hhmm2, zona, desde) {
  const [h, mi] = parseHoraHHMM(hhmm2) ?? [8, 0];
  const p = partesEnZona(desde, zona);
  const hoy = localAUtc(p.y, p.m, p.d, h, mi, zona);
  if (hoy.getTime() > desde.getTime()) return hoy;
  const n = sumarDias(p.y, p.m, p.d, 1);
  return localAUtc(n.y, n.m, n.d, h, mi, zona);
}
__name(proximaOcurrencia, "proximaOcurrencia");
function siguienteRepeticion(fecha, rep, zona) {
  if (rep === "ninguna") return null;
  const p = partesEnZona(fecha, zona);
  let dias = 1;
  if (rep === "semanal") dias = 7;
  if (rep === "laborables") {
    const sig = (p.dow + 1) % 7;
    dias = sig === 6 ? 3 : sig === 0 ? 2 : 1;
  }
  const n = sumarDias(p.y, p.m, p.d, dias);
  return localAUtc(n.y, n.m, n.d, p.h, p.mi, zona);
}
__name(siguienteRepeticion, "siguienteRepeticion");
var DIAS_SEMANA = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
var MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
var DIAS_CORTOS = ["dom", "lun", "mar", "mi\xE9", "jue", "vie", "s\xE1b"];
function formatearFechaHora(fecha, zona, ahora) {
  const p = partesEnZona(fecha, zona);
  const hora = formatoHHMM(p.h, p.mi);
  if (ahora) {
    const a = partesEnZona(ahora, zona);
    const dif = Math.round((Date.UTC(p.y, p.m - 1, p.d) - Date.UTC(a.y, a.m - 1, a.d)) / 864e5);
    if (dif === 0) return `hoy \xB7 ${hora}`;
    if (dif === 1) return `ma\xF1ana \xB7 ${hora}`;
  }
  return `${DIAS_CORTOS[p.dow]} ${p.d} ${MESES_CORTOS[p.m - 1]} \xB7 ${hora}`;
}
__name(formatearFechaHora, "formatearFechaHora");
var sinTildes = /* @__PURE__ */ __name((s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim(), "sinTildes");
function parseFechaHora(texto4, ahora, zona) {
  let t = sinTildes(texto4).replace(/\s+/g, " ");
  if (!t) return null;
  const rel = /^en (\d{1,3}) ?(min|minuto|minutos|h|hora|horas|d|dia|dias|semana|semanas)$/.exec(t);
  if (rel) {
    const n = +rel[1];
    const u = rel[2];
    const ms = u.startsWith("min") ? n * 6e4 : u.startsWith("h") ? n * 36e5 : u.startsWith("s") ? n * 7 * 864e5 : n * 864e5;
    const utc2 = new Date(ahora.getTime() + ms);
    return { utc: utc2, horaPorDefecto: false, pasada: false };
  }
  let hora = null;
  let m = /\b(\d{1,2})[:.](\d{2})\b ?(am|pm|de la manana|de la tarde|de la noche)?/.exec(t) ?? /\b(\d{1,2}) ?h\b ?(am|pm)?/.exec(t);
  if (!m) {
    m = /\b(?:a las|a la|sobre las) (\d{1,2})\b ?(am|pm|de la manana|de la tarde|de la noche)?/.exec(t) ?? /\b(\d{1,2}) ?(am|pm|de la manana|de la tarde|de la noche)\b/.exec(t);
  }
  if (m) {
    let h2 = +m[1];
    const mi2 = m[2] !== void 0 && /^\d{2}$/.test(m[2]) ? +m[2] : 0;
    const suf = m[m.length - 1] && /am|pm|manana|tarde|noche/.test(m[m.length - 1] ?? "") ? m[m.length - 1] : void 0;
    if (suf && (suf === "pm" || suf.includes("tarde") || suf.includes("noche")) && h2 < 12) h2 += 12;
    if (suf && (suf === "am" || suf.includes("manana")) && h2 === 12) h2 = 0;
    if (h2 > 23 || mi2 > 59) return null;
    hora = [h2, mi2];
    t = t.replace(m[0], " ").replace(/\s+/g, " ").trim();
  }
  const p = partesEnZona(ahora, zona);
  let dia = null;
  const fecha = /(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?/.exec(t);
  const largo = new RegExp(`(\\d{1,2}) (?:de )?(${MESES.join("|")})(?: (?:de )?(\\d{4}))?`).exec(t);
  if (fecha) {
    const d = +fecha[1];
    const mo = +fecha[2];
    let y = fecha[3] ? +fecha[3] : p.y;
    if (y < 100) y += 2e3;
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    dia = { y, m: mo, d };
    if (!fecha[3] && localAUtc(y, mo, d, 23, 59, zona) < ahora) dia = { y: y + 1, m: mo, d };
  } else if (largo) {
    const d = +largo[1];
    const mo = MESES.indexOf(largo[2]) + 1;
    let y = largo[3] ? +largo[3] : p.y;
    dia = { y, m: mo, d };
    if (!largo[3] && localAUtc(y, mo, d, 23, 59, zona) < ahora) dia = { y: y + 1, m: mo, d };
  } else if (/\bayer\b/.test(t)) dia = sumarDias(p.y, p.m, p.d, -1);
  else if (/\bpasado manana\b/.test(t)) dia = sumarDias(p.y, p.m, p.d, 2);
  else if (/\bmanana\b/.test(t)) dia = sumarDias(p.y, p.m, p.d, 1);
  else if (/\bhoy\b/.test(t)) dia = { y: p.y, m: p.m, d: p.d };
  else {
    const wd = DIAS_SEMANA.findIndex((n) => new RegExp(`\\b${n}\\b`).test(t));
    if (wd >= 0) {
      let dias = (wd - p.dow + 7) % 7;
      if (dias === 0 && hora && localAUtc(p.y, p.m, p.d, hora[0], hora[1], zona) <= ahora) dias = 7;
      dia = sumarDias(p.y, p.m, p.d, dias);
    } else if (t.replace(/\b(a las|a la|sobre las|sobre la|de|el|la|del)\b/g, "").trim() !== "" && hora === null) {
      return null;
    } else if (t.replace(/\b(a las|a la|sobre las|sobre la|de|el|la|del)\b/g, "").trim() !== "") {
      return null;
    }
  }
  if (!dia && !hora) return null;
  const horaPorDefecto = hora === null;
  const [h, mi] = hora ?? [9, 0];
  if (!dia) {
    let utc2 = localAUtc(p.y, p.m, p.d, h, mi, zona);
    if (utc2 <= ahora) {
      const n = sumarDias(p.y, p.m, p.d, 1);
      utc2 = localAUtc(n.y, n.m, n.d, h, mi, zona);
    }
    return { utc: utc2, horaPorDefecto, pasada: false };
  }
  const utc = localAUtc(dia.y, dia.m, dia.d, h, mi, zona);
  return { utc, horaPorDefecto, pasada: utc.getTime() <= ahora.getTime() };
}
__name(parseFechaHora, "parseFechaHora");
function parseNacimiento(texto4, hoy = /* @__PURE__ */ new Date()) {
  const m = /^\s*(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\s*$/.exec(texto4);
  if (!m) return null;
  const d = +m[1];
  const mo = +m[2];
  const y = +m[3];
  const f = new Date(Date.UTC(y, mo - 1, d));
  if (f.getUTCFullYear() !== y || f.getUTCMonth() !== mo - 1 || f.getUTCDate() !== d) return null;
  if (f.getTime() > hoy.getTime() || y < 1900) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
__name(parseNacimiento, "parseNacimiento");

// ../firebase/functions/src/programar.ts
async function programarSeccion(almacen, u, ref2, ahora) {
  const id = idProgramacion(u.id, "seccion", ref2);
  const cfg = ref2.startsWith("tema:") ? u.temas.find((t) => `tema:${t.id}` === ref2) : u.secciones[ref2];
  if (!cfg || !cfg.activa || !u.activo) {
    await almacen.borrarProgramacion(id);
    return;
  }
  await almacen.guardarProgramacion({ id, uid: u.id, tipo: "seccion", ref: ref2, proximo: proximaOcurrencia(cfg.hora, u.zona, ahora) });
}
__name(programarSeccion, "programarSeccion");
async function sincronizarSecciones(almacen, u, ahora) {
  await almacen.borrarProgramacionesDe(u.id, "seccion");
  for (const s of ORDEN_SECCIONES) await programarSeccion(almacen, u, s, ahora);
  for (const t of u.temas) await programarSeccion(almacen, u, `tema:${t.id}`, ahora);
}
__name(sincronizarSecciones, "sincronizarSecciones");
function adelantarRepeticion(e, zona, ahora) {
  let f = e.fechaHora;
  if (!f || e.repeticion === "ninguna") return e;
  let guard = 0;
  while (f && momentoAviso({ ...e, fechaHora: f }).getTime() <= ahora.getTime() && guard++ < 800) f = siguienteRepeticion(f, e.repeticion, zona);
  return f ? { ...e, fechaHora: f } : e;
}
__name(adelantarRepeticion, "adelantarRepeticion");
async function programarEvento(almacen, e, zona, ahora) {
  const id = idProgramacion(e.uid, "evento", e.id);
  let ev = adelantarRepeticion(e, zona, ahora);
  const aviso = momentoAviso(ev);
  if (!aviso || ev.hecho || ev.avisado && ev.repeticion === "ninguna" || aviso.getTime() <= ahora.getTime()) {
    await almacen.borrarProgramacion(id);
    return ev;
  }
  if (ev.avisado) ev = { ...ev, avisado: false };
  await almacen.guardarProgramacion({ id, uid: ev.uid, tipo: "evento", ref: ev.id, proximo: aviso });
  return ev;
}
__name(programarEvento, "programarEvento");
var idPosponer = /* @__PURE__ */ __name((uid, eventoId) => idProgramacion(uid, "evento", `posponer_${eventoId}`), "idPosponer");
async function posponerEvento(almacen, uid, eventoId, minutos2, ahora) {
  const proximo = new Date(ahora.getTime() + minutos2 * 6e4);
  await almacen.guardarProgramacion({ id: idPosponer(uid, eventoId), uid, tipo: "evento", ref: eventoId, proximo, posponer: true });
  return proximo;
}
__name(posponerEvento, "posponerEvento");
async function cancelarEvento(almacen, uid, eventoId) {
  await almacen.borrarProgramacion(idProgramacion(uid, "evento", eventoId));
  await almacen.borrarProgramacion(idPosponer(uid, eventoId));
  await almacen.borrarEvento(uid, eventoId);
}
__name(cancelarEvento, "cancelarEvento");

// ../firebase/functions/src/canal.ts
var esc = /* @__PURE__ */ __name((s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), "esc");
var escAttr = /* @__PURE__ */ __name((s) => esc(s).replace(/"/g, "&quot;"), "escAttr");
function trocear(html, max = 3800) {
  if (html.length <= max) return [html];
  const partes = [];
  let actual = "";
  const empujar = /* @__PURE__ */ __name(() => {
    if (actual.trim()) partes.push(actual.trimEnd());
    actual = "";
  }, "empujar");
  for (const bloque2 of html.split(/\n\n/)) {
    const candidato = actual ? `${actual}

${bloque2}` : bloque2;
    if (candidato.length <= max) {
      actual = candidato;
      continue;
    }
    empujar();
    if (bloque2.length <= max) {
      actual = bloque2;
      continue;
    }
    for (const linea of bloque2.split("\n")) {
      const c = actual ? `${actual}
${linea}` : linea;
      if (c.length <= max) {
        actual = c;
        continue;
      }
      empujar();
      let resto = linea;
      while (resto.length > max) {
        const corte = resto.lastIndexOf(" ", max);
        const n = corte > max / 2 ? corte : max;
        partes.push(resto.slice(0, n).trimEnd());
        resto = resto.slice(n).trimStart();
      }
      actual = resto;
    }
  }
  empujar();
  return partes;
}
__name(trocear, "trocear");

// ../firebase/functions/src/util.ts
var NF1 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
var NF0 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
var num1 = /* @__PURE__ */ __name((v) => NF1.format(v), "num1");
var num0 = /* @__PURE__ */ __name((v) => NF0.format(v), "num0");
var grados = /* @__PURE__ */ __name((v) => `${Math.round(v)}\xBA`, "grados");
var NF2 = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
var pct = /* @__PURE__ */ __name((v) => `${v >= 0 ? "+" : "\u2212"}${NF2.format(Math.abs(v))} %`, "pct");
var BARRAS = "\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588";
function sparkline(valores) {
  if (valores.length === 0) return "";
  const min = Math.min(...valores), max = Math.max(...valores);
  if (max === min) return BARRAS[3].repeat(valores.length);
  return valores.map((v) => BARRAS[Math.min(7, Math.floor((v - min) / (max - min) * 8))]).join("");
}
__name(sparkline, "sparkline");
var SEPARADOR = "\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC";
var cabecera = /* @__PURE__ */ __name((emoji, titulo, subtitulo) => `${emoji} <b>${titulo}</b>${subtitulo ? `
<i>${subtitulo}</i>` : ""}
${SEPARADOR}`, "cabecera");
var bloque = /* @__PURE__ */ __name((emoji, titulo, ...lineas) => `${emoji} <b>${titulo}</b>${lineas.length ? `
${lineas.join("\n")}` : ""}`, "bloque");
async function cacheado(almacen, clave, ttlMs, ahora, fn) {
  const previo = await almacen.cacheGet(clave, ahora).catch(() => null);
  if (previo) {
    try {
      return JSON.parse(previo);
    } catch {
    }
  }
  const valor = await fn();
  await almacen.cacheSet(clave, JSON.stringify(valor), ttlMs, ahora).catch(() => void 0);
  return valor;
}
__name(cacheado, "cacheado");
async function conReintentos(fn, intentos = 3, esperaMs = 1e3) {
  let ultimo;
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (e) {
      ultimo = e;
      if (i < intentos - 1 && esperaMs > 0) await new Promise((r) => setTimeout(r, esperaMs * (i + 1)));
    }
  }
  throw ultimo;
}
__name(conReintentos, "conReintentos");

// ../firebase/functions/src/secciones/tipos.ts
var NAV_MENU = [{ texto: "\u{1F3E0} Men\xFA", datos: "m:menu" }];

// ../firebase/functions/src/secciones/agenda.ts
var EMOJI_TIPO = { alarma: "\u23F0", cita: "\u{1FA7A}", tarea: "\u2705" };
var hhmm = /* @__PURE__ */ __name((d, zona) => {
  const p = partesEnZona(d, zona);
  return `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`;
}, "hhmm");
async function contenidoAgenda(ctx) {
  const { usuario: u, ahora } = ctx;
  const todos = await ctx.almacen.listarEventos(u.id);
  const hoy = fechaIso(ahora, u.zona);
  const manana = fechaIso(new Date(ahora.getTime() + 24 * 36e5), u.zona);
  const proximos = todos.filter((e) => e.tipo !== "tarea" && e.fechaHora && [hoy, manana].includes(fechaIso(e.fechaHora, u.zona)) && (e.repeticion !== "ninguna" || e.fechaHora.getTime() >= ahora.getTime() - 36e5)).sort((a, b) => a.fechaHora.getTime() - b.fechaHora.getTime());
  const tareas = todos.filter((e) => e.tipo === "tarea" && !e.hecho);
  const lineasEv = proximos.map((e) => `${EMOJI_TIPO[e.tipo]} ${fechaIso(e.fechaHora, u.zona) === hoy ? "hoy" : "ma\xF1ana"} ${hhmm(e.fechaHora, u.zona)} \xB7 ${esc(e.titulo)}${e.lugar ? ` (${esc(e.lugar)})` : ""}`);
  const lineasTa = tareas.map((e) => `\u2022 ${esc(e.titulo)}${e.fechaHora ? ` <i>(${formatearFechaHora(e.fechaHora, u.zona, ahora)})</i>` : ""}`);
  const html = [
    cabecera("\u{1F5D3}", "Tu agenda"),
    "\u{1F4CC} <b>Hoy y ma\xF1ana</b>\n" + (lineasEv.length ? lineasEv.join("\n") : "<i>Sin citas ni alarmas.</i>"),
    "\u{1F4DD} <b>Tareas pendientes</b>\n" + (lineasTa.length ? lineasTa.join("\n") : "<i>Nada pendiente \u{1F389}</i>")
  ].join("\n\n");
  return { html, teclado: [[{ texto: "\u2795 Nueva", datos: "n:menu" }, { texto: "\u{1F4C5} Mis eventos", datos: "e:lista" }], NAV_MENU] };
}
__name(contenidoAgenda, "contenidoAgenda");

// ../firebase/functions/src/horoscopo.ts
var SIGNOS = [
  { id: "aries", ingles: "aries", nombre: "Aries" },
  { id: "tauro", ingles: "taurus", nombre: "Tauro" },
  { id: "geminis", ingles: "gemini", nombre: "G\xE9minis" },
  { id: "cancer", ingles: "cancer", nombre: "C\xE1ncer" },
  { id: "leo", ingles: "leo", nombre: "Leo" },
  { id: "virgo", ingles: "virgo", nombre: "Virgo" },
  { id: "libra", ingles: "libra", nombre: "Libra" },
  { id: "escorpio", ingles: "scorpio", nombre: "Escorpio" },
  { id: "sagitario", ingles: "sagittarius", nombre: "Sagitario" },
  { id: "capricornio", ingles: "capricorn", nombre: "Capricornio" },
  { id: "acuario", ingles: "aquarius", nombre: "Acuario" },
  { id: "piscis", ingles: "pisces", nombre: "Piscis" }
];
var ErrorApi = class extends Error {
  constructor(mensaje, estado, codigo) {
    super(mensaje);
    this.estado = estado;
    this.codigo = codigo;
  }
  estado;
  codigo;
  static {
    __name(this, "ErrorApi");
  }
  /** Transitorio = merece la pena reintentar (red, timeout, 5xx). VALIDATION y NOT_FOUND son errores nuestros. */
  get transitorio() {
    return this.estado === void 0 || this.estado >= 500;
  }
};
function comoErrorApi(e) {
  if (e instanceof ErrorApi) return e;
  const r = e.response;
  const base = e.message ?? String(e);
  if (!r) return new ErrorApi(base);
  const codigo = r.data?.error;
  return new ErrorApi(`HTTP ${r.status}${codigo ? ` ${codigo}` : ""}: ${r.data?.message ?? base}`, r.status, codigo);
}
__name(comoErrorApi, "comoErrorApi");
var FORMATOS_FECHA = /* @__PURE__ */ new Map();
function fechaEnZona(fecha, zona) {
  let f = FORMATOS_FECHA.get(zona);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" });
    FORMATOS_FECHA.set(zona, f);
  }
  return f.format(fecha);
}
__name(fechaEnZona, "fechaEnZona");
function nombreFuente(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
__name(nombreFuente, "nombreFuente");
function urlSegura(url) {
  if (typeof url !== "string") return "";
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
}
__name(urlSegura, "urlSegura");
async function reintentar(fn, intentos, esperaMs) {
  let ultimo;
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (e) {
      ultimo = comoErrorApi(e);
      if (!ultimo.transitorio) throw ultimo;
      if (i < intentos - 1 && esperaMs > 0) await new Promise((r) => setTimeout(r, esperaMs * (i + 1)));
    }
  }
  throw ultimo ?? new ErrorApi("sin intentos");
}
__name(reintentar, "reintentar");
function urlHoroscopo(cfg, signo, fecha) {
  return `${cfg.baseUrl.replace(/\/+$/, "")}/horoscope/${encodeURIComponent(cfg.idioma)}/${signo.ingles}/${fecha}`;
}
__name(urlHoroscopo, "urlHoroscopo");
async function obtenerSigno(http, cfg, signo, fecha, intentos = 3, esperaMs = 2e3) {
  const r = await reintentar(() => http.get(urlHoroscopo(cfg, signo, fecha), { timeout: 3e4 }), intentos, esperaMs);
  const d = r.data;
  if (typeof d !== "object" || d === null) throw new ErrorApi(`respuesta no v\xE1lida de la API para ${signo.id}`, 502, "PARSE");
  return d;
}
__name(obtenerSigno, "obtenerSigno");
function construirDoc(signo, fechaPedida, d, cfg, ahora = /* @__PURE__ */ new Date()) {
  const texto4 = (d.text ?? "").trim();
  if (!texto4) return null;
  const fuenteUrl = urlSegura(d.source);
  return {
    signo: signo.id,
    fecha: /^\d{4}-\d{2}-\d{2}$/.test(d.date ?? "") ? d.date : fechaPedida,
    prediccion: texto4,
    idioma: d.language || cfg.idioma,
    fuente: fuenteUrl ? nombreFuente(fuenteUrl) : "",
    fuenteUrl,
    actualizadoEn: ahora.toISOString()
  };
}
__name(construirDoc, "construirDoc");
async function actualizarTodos(dep) {
  const log3 = dep.log ?? (() => void 0);
  const hoy = fechaEnZona(dep.ahora, dep.zona);
  const res = { actualizados: [], alDia: [], omitidos: [], fallidos: [] };
  log3(`Actualizando hor\xF3scopo para ${hoy}`);
  let pedidos = 0;
  for (const signo of SIGNOS) {
    try {
      const previa = await dep.fechaGuardada?.(signo.id);
      if (previa === hoy) {
        res.alDia.push(signo.id);
        continue;
      }
      if (dep.maxPedidos !== void 0 && pedidos >= dep.maxPedidos) continue;
      pedidos++;
      const respuesta = await obtenerSigno(dep.http, dep.config, signo, hoy, dep.intentos ?? 3, dep.esperaMs ?? 2e3);
      const doc = construirDoc(signo, hoy, respuesta, dep.config, dep.ahora);
      if (!doc) {
        res.fallidos.push(signo.id);
        log3(`\u2717 ${signo.id}: la API no devolvi\xF3 texto`);
        continue;
      }
      if (previa && previa > doc.fecha) {
        res.omitidos.push(signo.id);
        log3(`= ${signo.id}: ya hay uno m\xE1s reciente (${previa})`);
        continue;
      }
      await dep.guardar(signo.id, doc);
      res.actualizados.push(signo.id);
      log3(`\u2713 ${signo.id} (${doc.fecha}, ${doc.fuente})`);
    } catch (e) {
      res.fallidos.push(signo.id);
      log3(`\u2717 ${signo.id}: ${comoErrorApi(e).message}`);
    }
  }
  return res;
}
__name(actualizarTodos, "actualizarTodos");

// ../firebase/functions/src/signos.ts
var EXTRA = {
  aries: ["\u2648", "fuego"],
  tauro: ["\u2649", "tierra"],
  geminis: ["\u264A", "aire"],
  cancer: ["\u264B", "agua"],
  leo: ["\u264C", "fuego"],
  virgo: ["\u264D", "tierra"],
  libra: ["\u264E", "aire"],
  escorpio: ["\u264F", "agua"],
  sagitario: ["\u2650", "fuego"],
  capricornio: ["\u2651", "tierra"],
  acuario: ["\u2652", "aire"],
  piscis: ["\u2653", "agua"]
};
function signoDe(iso) {
  const m = +iso.slice(5, 7), d = +iso.slice(8, 10);
  const id = m === 3 && d >= 21 || m === 4 && d <= 19 ? "aries" : m === 4 || m === 5 && d <= 20 ? "tauro" : m === 5 || m === 6 && d <= 20 ? "geminis" : m === 6 || m === 7 && d <= 22 ? "cancer" : m === 7 || m === 8 && d <= 22 ? "leo" : m === 8 || m === 9 && d <= 22 ? "virgo" : m === 9 || m === 10 && d <= 22 ? "libra" : m === 10 || m === 11 && d <= 21 ? "escorpio" : m === 11 || m === 12 && d <= 21 ? "sagitario" : m === 12 || m === 1 && d <= 19 ? "capricornio" : m === 1 || m === 2 && d <= 18 ? "acuario" : "piscis";
  const s = SIGNOS.find((x) => x.id === id);
  return { ...s, simbolo: EXTRA[id][0], elemento: EXTRA[id][1] };
}
__name(signoDe, "signoDe");

// ../firebase/functions/src/secciones/horoscopo.ts
async function contenidoHoroscopo(ctx) {
  const nac = ctx.usuario.nacimiento;
  if (!nac) {
    return { html: "\u{1F52E} <b>Hor\xF3scopo</b>\nPara darte tu hor\xF3scopo necesito tu fecha de nacimiento.", teclado: [[{ texto: "\u{1F382} Indicar mi fecha de nacimiento", datos: "p:nacimiento" }], NAV_MENU] };
  }
  const signo = signoDe(nac);
  const doc = await ctx.almacen.getHoroscopo(signo.id);
  if (!doc || !doc.prediccion?.trim()) {
    return { html: `\u{1F52E} <b>Hor\xF3scopo \xB7 ${signo.simbolo} ${signo.nombre}</b>
Todav\xEDa no hay hor\xF3scopo publicado para hoy. Lo intentar\xE9 de nuevo m\xE1s tarde.`, teclado: [[{ texto: "\u{1F504} Reintentar", datos: "sev:horoscopo" }], NAV_MENU] };
  }
  const hoy = fechaIso(ctx.ahora, ctx.usuario.zona);
  const desactualizado = doc.fecha !== hoy;
  const url = doc.fuenteUrl ? urlSegura(doc.fuenteUrl) : "";
  const fuente = url ? `

<i>Fuente:</i> <a href="${escAttr(url)}">${esc(doc.fuente || url)}</a>` : "";
  const html = [
    cabecera("\u{1F52E}", `Hor\xF3scopo \xB7 ${signo.simbolo} ${signo.nombre}`),
    desactualizado ? `\u26A0\uFE0F <i>A\xFAn no se ha publicado el de hoy: este es el del ${doc.fecha}.</i>` : "",
    esc(doc.prediccion.trim())
  ].filter(Boolean).join("\n\n") + fuente + "\n<i>Contenido informativo y de entretenimiento; los derechos pertenecen a su editor.</i>";
  return { html, teclado: [NAV_MENU] };
}
__name(contenidoHoroscopo, "contenidoHoroscopo");

// ../firebase/functions/src/rss.ts
var ENTIDADES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\xA0" };
function decodificar(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try {
        return String.fromCodePoint(n);
      } catch {
        return m;
      }
    }
    return ENTIDADES[e.toLowerCase()] ?? m;
  });
}
__name(decodificar, "decodificar");
function etiqueta(bloque2, nombre) {
  let desde = 0;
  for (; ; ) {
    const ini = bloque2.indexOf(`<${nombre}`, desde);
    if (ini < 0) return "";
    const c = bloque2[ini + nombre.length + 1];
    if (c !== ">" && c !== " " && c !== "/" && c !== "\n" && c !== "	" && c !== "\r") {
      desde = ini + 1;
      continue;
    }
    const finApertura = bloque2.indexOf(">", ini);
    if (finApertura < 0) return "";
    if (bloque2[finApertura - 1] === "/") return "";
    const cierre = bloque2.indexOf(`</${nombre}>`, finApertura);
    if (cierre < 0) return "";
    const crudo = bloque2.slice(finApertura + 1, cierre).trim();
    const cdata = /^<!\[CDATA\[([\s\S]*)\]\]>$/.exec(crudo);
    return (cdata ? cdata[1] : decodificar(crudo)).trim();
  }
}
__name(etiqueta, "etiqueta");
function leerRss(xml) {
  const noticias = [];
  let pos = 0;
  for (; ; ) {
    const ini = xml.indexOf("<item", pos);
    if (ini < 0) break;
    const c = xml[ini + 5];
    if (c !== ">" && c !== " " && c !== "\n") {
      pos = ini + 5;
      continue;
    }
    const fin = xml.indexOf("</item>", ini);
    if (fin < 0) break;
    pos = fin + 7;
    const it = xml.slice(ini, fin);
    let titulo = etiqueta(it, "title");
    if (!titulo) continue;
    let fuente = etiqueta(it, "source");
    const i = titulo.lastIndexOf(" - ");
    if (i > 0 && (!fuente || titulo.endsWith(` - ${fuente}`))) {
      if (!fuente) fuente = titulo.slice(i + 3);
      titulo = titulo.slice(0, i);
    }
    const fecha = Date.parse(etiqueta(it, "pubDate"));
    noticias.push({ titulo, fuente, enlace: etiqueta(it, "link"), fecha: Number.isNaN(fecha) ? 0 : fecha });
  }
  return noticias;
}
__name(leerRss, "leerRss");
var urlGoogleNews = /* @__PURE__ */ __name((consulta, idioma = "es", pais = "ES") => `https://news.google.com/rss/search?q=${encodeURIComponent(consulta)}&hl=${idioma}&gl=${pais}&ceid=${pais}:${idioma}`, "urlGoogleNews");
function enlaceSeguro(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
}
__name(enlaceSeguro, "enlaceSeguro");
function lineaNoticia(n) {
  const url = enlaceSeguro(n.enlace);
  const titulo = url ? `<a href="${escAttr(url)}">${esc(n.titulo)}</a>` : esc(n.titulo);
  return `\u2022 ${titulo}${n.fuente ? ` <i>(${esc(n.fuente)})</i>` : ""}`;
}
__name(lineaNoticia, "lineaNoticia");

// ../firebase/functions/src/secciones/noticias.ts
async function noticiasDe(ctx, consulta) {
  return cacheado(ctx.almacen, `rss:${consulta}`, 30 * 6e4, ctx.ahora, async () => {
    const r = await conReintentos(() => ctx.http.get(urlGoogleNews(consulta), { timeout: 2e4 }));
    return leerRss(String(r.data)).sort((a, b) => b.fecha - a.fecha).slice(0, 12);
  });
}
__name(noticiasDe, "noticiasDe");
async function resumenNoticias(ctx, cabecera2, secciones, porSeccion = 4) {
  const vistas = /* @__PURE__ */ new Set();
  const bloques = [];
  let ok = 0;
  const respuestas = await Promise.allSettled(secciones.map((s) => noticiasDe(ctx, s.consulta)));
  secciones.forEach((s, i) => {
    const r = respuestas[i];
    if (r.status === "rejected") {
      bloques.push(`${s.titulo}
\u26A0\uFE0F <i>No disponible ahora.</i>`);
      return;
    }
    const items = r.value.filter((n) => {
      const k = n.titulo.toLowerCase().slice(0, 60);
      if (vistas.has(k)) return false;
      vistas.add(k);
      return true;
    }).slice(0, porSeccion);
    ok++;
    const t = s.titulo ? `${s.titulo}
` : "";
    bloques.push(items.length ? `${t}${items.map(lineaNoticia).join("\n")}` : `${t}<i>Sin novedades.</i>`);
  });
  if (ok === 0) throw new Error("no se pudo obtener ninguna noticia");
  return [cabecera2, ...bloques].join("\n\n");
}
__name(resumenNoticias, "resumenNoticias");
async function contenidoNoticias(ctx) {
  const secciones = [
    { titulo: "\u{1F4B6} <b>Econom\xEDa</b>", consulta: "econom\xEDa Espa\xF1a when:1d" },
    { titulo: "\u{1F3DB} <b>Pol\xEDtica</b>", consulta: "pol\xEDtica nacional Espa\xF1a when:1d" }
  ];
  const c = ctx.usuario.ciudad;
  if (c) {
    const prov = c.provincia && c.provincia.toLowerCase() !== c.nombre.toLowerCase() ? ` "${c.provincia}"` : "";
    secciones.push(
      { titulo: `\u{1F3DB} <b>Ayuntamiento de ${esc(c.nombre)}</b>`, consulta: `("Ayuntamiento de ${c.nombre}" OR "alcalde de ${c.nombre}" OR "alcaldesa de ${c.nombre}") Espa\xF1a${prov} when:7d` },
      { titulo: `\u{1F4CD} <b>${esc(c.nombre)}</b>`, consulta: `"${c.nombre}" Espa\xF1a${prov} when:7d` }
    );
  }
  return { html: await resumenNoticias(ctx, cabecera("\u{1F4F0}", "Noticias del d\xEDa"), secciones), teclado: [NAV_MENU] };
}
__name(contenidoNoticias, "contenidoNoticias");
async function contenidoTema(ctx, temaId) {
  const t = ctx.usuario.temas.find((x) => x.id === temaId);
  if (!t) return { html: "No encuentro ese tema.", teclado: [NAV_MENU] };
  return { html: await resumenNoticias(ctx, cabecera(esc(t.emoji), esc(t.titulo)), [{ titulo: "", consulta: `${t.consulta} when:2d` }], 7), teclado: [NAV_MENU] };
}
__name(contenidoTema, "contenidoTema");

// ../firebase/functions/src/secciones/mercados.ts
var FUTUROS = [
  ["S&P 500 fut.", "ES=F"],
  ["Nasdaq 100 fut.", "NQ=F"],
  ["Dow Jones fut.", "YM=F"],
  ["VIX", "^VIX"],
  ["Petr\xF3leo WTI", "CL=F"],
  ["Oro", "GC=F"],
  ["EUR/USD", "EURUSD=X"],
  ["Bono EEUU 10a (%)", "^TNX"],
  ["Bitcoin", "BTC-USD"]
];
var INDICES = [
  ["S&P 500", "^GSPC"],
  ["Nasdaq", "^IXIC"],
  ["Dow Jones", "^DJI"],
  ["Russell 2000", "^RUT"],
  ["IBEX 35", "^IBEX"],
  ["Euro Stoxx 50", "^STOXX50E"],
  ["DAX", "^GDAXI"],
  ["Nikkei 225", "^N225"]
];
function parsearGrafico(json) {
  const r = json?.chart?.result?.[0];
  if (!r) throw new Error("respuesta de Yahoo sin datos");
  const meta = r.meta ?? {};
  const desfase = meta.gmtoffset ?? 0;
  const cierres = [];
  const ts = r.timestamp ?? [];
  const cl = r.indicators?.quote?.[0]?.close ?? [];
  ts.forEach((t, i) => {
    const c = cl[i];
    if (c !== null && c !== void 0) cierres.push({ fecha: new Date((t + desfase) * 1e3).toISOString().slice(0, 10), cierre: c });
  });
  return { precio: meta.regularMarketPrice, ultimaCotizacion: meta.regularMarketTime ?? ts[ts.length - 1] ?? 0, desfase, cierres, cierreAnterior: meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice };
}
__name(parsearGrafico, "parsearGrafico");
function cotizacionActual(g) {
  const diaPrecio = new Date((g.ultimaCotizacion + g.desfase) * 1e3).toISOString().slice(0, 10);
  const prev = [...g.cierres].reverse().find((c) => c.fecha < diaPrecio)?.cierre ?? g.cierreAnterior;
  return { precio: g.precio, anterior: prev };
}
__name(cotizacionActual, "cotizacionActual");
function ultimaSesion(g, hoy) {
  const cerradas = g.cierres.filter((c) => c.fecha < hoy);
  if (cerradas.length < 2) return null;
  const ult = cerradas[cerradas.length - 1];
  return { precio: ult.cierre, anterior: cerradas[cerradas.length - 2].cierre, fecha: ult.fecha };
}
__name(ultimaSesion, "ultimaSesion");
var variacion = /* @__PURE__ */ __name((c) => c.anterior === 0 ? 0 : (c.precio - c.anterior) / c.anterior * 100, "variacion");
var flecha = /* @__PURE__ */ __name((p) => p > 0.05 ? "\u{1F7E2}" : p < -0.05 ? "\u{1F534}" : "\u26AA", "flecha");
var cifra = /* @__PURE__ */ __name((v) => Math.abs(v) >= 1e3 ? num0(v) : Math.abs(v) < 10 ? v.toFixed(4).replace(".", ",") : v.toFixed(2).replace(".", ","), "cifra");
function lineaCotizacion(nombre, c) {
  const p = variacion(c);
  return `${flecha(p)} ${nombre} <b>${cifra(c.precio)}</b> (${pct(p)})${c.fecha ? ` <i>\xB7 ${c.fecha}</i>` : ""}`;
}
__name(lineaCotizacion, "lineaCotizacion");
async function pedir(ctx, simbolo) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(simbolo)}?range=10d&interval=1d`;
  const r = await conReintentos(() => ctx.http.get(url, { timeout: 15e3, headers: { "User-Agent": "Mozilla/5.0 AgendaPersonalBot/1.0" } }), 2, 800);
  return parsearGrafico(r.data);
}
__name(pedir, "pedir");
async function contenidoMercados(ctx) {
  const hoy = fechaIso(ctx.ahora, "Europe/Madrid");
  const clave = `mercados:${hoy}:${Math.floor(ctx.ahora.getTime() / (20 * 6e4))}`;
  const bloque2 = await cacheado(ctx.almacen, clave, 20 * 6e4, ctx.ahora, async () => {
    const [fut, ind] = await Promise.all([
      Promise.allSettled(FUTUROS.map(async ([n, s]) => lineaCotizacion(n, cotizacionActual(await pedir(ctx, s))))),
      Promise.allSettled(INDICES.map(async ([n, s]) => {
        const q = ultimaSesion(await pedir(ctx, s), hoy);
        if (!q) throw new Error("sin sesi\xF3n");
        return lineaCotizacion(n, q);
      }))
    ]);
    const ok = /* @__PURE__ */ __name((r) => r.flatMap((x) => x.status === "fulfilled" ? [x.value] : []), "ok");
    return { fut: ok(fut), ind: ok(ind) };
  });
  if (bloque2.fut.length === 0 && bloque2.ind.length === 0) throw new Error("no se pudo obtener ninguna cotizaci\xF3n");
  const partes = [cabecera("\u{1F4C8}", "Mercados")];
  if (bloque2.fut.length) partes.push(`\u{1F1FA}\u{1F1F8} <b>Premercado y activos refugio</b>
${bloque2.fut.join("\n")}`);
  if (bloque2.ind.length) partes.push(`\u{1F514} <b>Cierre de la \xFAltima sesi\xF3n</b>
${bloque2.ind.join("\n")}`);
  let noticias = "";
  try {
    noticias = await resumenNoticias(ctx, "", [
      { titulo: "\u{1F4F0} <b>Noticias de premercado</b>", consulta: "premercado Wall Street futuros when:1d" },
      { titulo: "\u{1F5DE} <b>Cr\xF3nica de mercados</b>", consulta: '"Wall Street" cierre sesi\xF3n Ibex when:2d' }
    ], 3);
  } catch {
  }
  return { html: [...partes, noticias.trim()].filter(Boolean).join("\n\n"), teclado: [NAV_MENU] };
}
__name(contenidoMercados, "contenidoMercados");

// ../firebase/functions/src/luna.ts
var SINODICO = 29.530588861;
var EPOCA_JD = 245155009766e-5;
var DELTA_T_DIAS = 69 / 86400;
var rad = /* @__PURE__ */ __name((d) => d * Math.PI / 180, "rad");
var sin = Math.sin;
function eventoJd(n, llena) {
  const k = n + (llena ? 0.5 : 0);
  const t = k / 1236.85, t2 = t * t, t3 = t2 * t, t4 = t3 * t;
  let jde = EPOCA_JD + SINODICO * k + 15437e-8 * t2 - 15e-8 * t3 + 73e-11 * t4;
  const e = 1 - 2516e-6 * t - 74e-7 * t2;
  const m = rad(2.5534 + 29.1053567 * k - 14e-7 * t2 - 11e-8 * t3);
  const mp = rad(201.5643 + 385.81693528 * k + 0.0107582 * t2 + 1238e-8 * t3 - 58e-9 * t4);
  const f = rad(160.7108 + 390.67050284 * k - 16118e-7 * t2 - 227e-8 * t3 + 11e-9 * t4);
  const om = rad(124.7746 - 1.56375588 * k + 20672e-7 * t2 + 215e-8 * t3);
  const comun = -111e-5 * sin(mp - 2 * f) - 57e-5 * sin(mp + 2 * f) + 56e-5 * e * sin(2 * mp + m) - 42e-5 * sin(3 * mp) + 42e-5 * e * sin(m + 2 * f) + 38e-5 * e * sin(m - 2 * f) - 24e-5 * e * sin(2 * mp - m) - 17e-5 * sin(om) - 7e-5 * sin(mp + 2 * m);
  jde += llena ? -0.40614 * sin(mp) + 0.17302 * e * sin(m) + 0.01614 * sin(2 * mp) + 0.01043 * sin(2 * f) + 734e-5 * e * sin(mp - m) - 515e-5 * e * sin(mp + m) + 209e-5 * e * e * sin(2 * m) + comun : -0.4072 * sin(mp) + 0.17241 * e * sin(m) + 0.01608 * sin(2 * mp) + 0.01039 * sin(2 * f) + 739e-5 * e * sin(mp - m) - 514e-5 * e * sin(mp + m) + 208e-5 * e * e * sin(2 * m) + comun;
  return jde - DELTA_T_DIAS;
}
__name(eventoJd, "eventoJd");
var aJd = /* @__PURE__ */ __name((d) => d.getTime() / 864e5 + 24405875e-1, "aJd");
var deJd = /* @__PURE__ */ __name((jd) => new Date(Math.round((jd - 24405875e-1) * 864e5)), "deJd");
function cicloEn(jd) {
  const n0 = Math.floor((jd - EPOCA_JD) / SINODICO);
  for (let n = n0 - 1; n <= n0 + 2; n++) {
    const ant = eventoJd(n, false), sig = eventoJd(n + 1, false);
    if (ant <= jd && jd < sig) return [ant, eventoJd(n, true), sig];
  }
  throw new Error("sin ciclo lunar");
}
__name(cicloEn, "cicloEn");
function fraccion(y, m, d, zona) {
  const jd = aJd(localAUtc(y, m, d, 12, 0, zona));
  const [ant, llena, sig] = cicloEn(jd);
  return jd < llena ? 0.5 * (jd - ant) / (llena - ant) : 0.5 + 0.5 * (jd - llena) / (sig - llena);
}
__name(fraccion, "fraccion");
var FASES = [
  { emoji: "\u{1F311}", nombre: "Luna nueva" },
  { emoji: "\u{1F312}", nombre: "Luna creciente" },
  { emoji: "\u{1F313}", nombre: "Cuarto creciente" },
  { emoji: "\u{1F314}", nombre: "Gibosa creciente" },
  { emoji: "\u{1F315}", nombre: "Luna llena" },
  { emoji: "\u{1F316}", nombre: "Gibosa menguante" },
  { emoji: "\u{1F317}", nombre: "Cuarto menguante" },
  { emoji: "\u{1F318}", nombre: "Luna menguante" }
];
function faseDelDia(y, m, d, zona) {
  const f = fraccion(y, m, d, zona);
  const medioDia = 0.5 / SINODICO;
  let idx = Math.floor(f * 8 + 0.5) % 8;
  if (idx % 2 === 0) {
    const centro = idx / 8;
    let dist = Math.abs(f - centro);
    if (idx === 0) dist = Math.min(dist, Math.abs(f - 1));
    if (dist > medioDia) {
      const antes = idx === 0 ? f > 0.5 : f < centro;
      idx = (antes ? idx - 1 + 8 : idx + 1) % 8;
    }
  }
  return FASES[idx];
}
__name(faseDelDia, "faseDelDia");
function iluminacion(y, m, d, zona) {
  return (1 - Math.cos(2 * Math.PI * fraccion(y, m, d, zona))) / 2;
}
__name(iluminacion, "iluminacion");
function edadDias(y, m, d, zona) {
  const jd = aJd(localAUtc(y, m, d, 12, 0, zona));
  return jd - cicloEn(jd)[0];
}
__name(edadDias, "edadDias");
function proximoEvento(desde, llena) {
  const jd = aJd(desde);
  const n0 = Math.floor((jd - EPOCA_JD) / SINODICO);
  for (let n = n0 - 1; n <= n0 + 3; n++) {
    const e = eventoJd(n, llena);
    if (e >= jd) return deJd(e);
  }
  throw new Error("sin evento lunar");
}
__name(proximoEvento, "proximoEvento");
function proximoDia(y, m, d, llena, zona) {
  const p = partesEnZona(proximoEvento(localAUtc(y, m, d, 0, 0, zona), llena), zona);
  return { y: p.y, m: p.m, d: p.d };
}
__name(proximoDia, "proximoDia");

// ../firebase/functions/src/secciones/tiempo.ts
var emojiTiempo = /* @__PURE__ */ __name((c) => c === 0 ? "\u2600\uFE0F" : c <= 2 ? "\u{1F324}" : c === 3 ? "\u2601\uFE0F" : c === 45 || c === 48 ? "\u{1F32B}" : c >= 51 && c <= 57 ? "\u{1F326}" : c >= 61 && c <= 67 ? "\u{1F327}" : c >= 71 && c <= 77 ? "\u2744\uFE0F" : c >= 80 && c <= 82 ? "\u{1F327}" : c === 85 || c === 86 ? "\u{1F328}" : c >= 95 ? "\u26C8" : "\u{1F321}", "emojiTiempo");
var descTiempo = /* @__PURE__ */ __name((c) => c === 0 ? "despejado" : c === 1 ? "poco nuboso" : c === 2 ? "parcialmente nuboso" : c === 3 ? "cubierto" : c === 45 || c === 48 ? "niebla" : c >= 51 && c <= 57 ? "llovizna" : c >= 61 && c <= 65 ? "lluvia" : c === 66 || c === 67 ? "lluvia helada" : c >= 71 && c <= 77 ? "nieve" : c >= 80 && c <= 82 ? "chubascos" : c === 85 || c === 86 ? "chubascos de nieve" : c === 95 ? "tormenta" : c >= 96 ? "tormenta con granizo" : "variable", "descTiempo");
var brujula = /* @__PURE__ */ __name((deg) => ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][Math.floor((deg % 360 + 360) % 360 / 45 + 0.5) % 8], "brujula");
function nivelUv(uv) {
  return uv < 3 ? "bajo" : uv < 6 ? "moderado" : uv < 8 ? "alto" : uv < 11 ? "muy alto" : "extremo";
}
__name(nivelUv, "nivelUv");
function tramosLluvia(horas) {
  const tramos = [];
  let ini = -1;
  const cerrar = /* @__PURE__ */ __name((fin) => {
    if (ini < 0) return;
    const t = horas.slice(ini, fin);
    tramos.push({ desde: t[0].hora, hasta: (t[t.length - 1].hora + 1) % 24, mm: t.reduce((a, h) => a + h.mm, 0), probMax: Math.max(...t.map((h) => h.prob)) });
    ini = -1;
  }, "cerrar");
  horas.forEach((h, i) => {
    if (h.mm >= 0.1 || h.prob >= 60) {
      if (ini < 0) ini = i;
    } else cerrar(i);
  });
  cerrar(horas.length);
  return tramos;
}
__name(tramosLluvia, "tramosLluvia");
var hh = /* @__PURE__ */ __name((n) => String(n).padStart(2, "0"), "hh");
var textoTramo = /* @__PURE__ */ __name((t) => `${hh(t.desde)}\u2013${hh(t.hasta)} h \xB7 ${t.mm >= 0.1 ? `~${num1(t.mm)} l/m\xB2` : "sin acumulaci\xF3n notable"} \xB7 prob. ${t.probMax} %`, "textoTramo");
function parsearPrevision(json, ahora, zona) {
  const d = json.daily, h = json.hourly;
  const p = partesEnZona(ahora, zona);
  const ahoraLocal = `${fechaIso(ahora, zona)}T${hh(p.h)}:00`;
  const idx = h.time.map((t, i) => [t, i]).filter(([t]) => t >= ahoraLocal).slice(0, 18).map(([, i]) => i);
  const horas = idx.map((i) => ({
    fecha: h.time[i].slice(0, 10),
    hora: +h.time[i].slice(11, 13),
    temp: h.temperature_2m[i],
    codigo: h.weather_code[i] ?? 0,
    prob: h.precipitation_probability?.[i] ?? 0,
    mm: h.precipitation?.[i] ?? 0,
    viento: h.wind_speed_10m?.[i] ?? 0,
    humedad: h.relative_humidity_2m?.[i] ?? 0,
    uv: h.uv_index?.[i] ?? 0,
    racha: h.wind_gusts_10m?.[i] ?? 0,
    dir: h.wind_direction_10m?.[i] ?? 0
  }));
  const reloj = /* @__PURE__ */ __name((s) => (s ?? "").slice(11, 16), "reloj");
  return {
    tMin: d.temperature_2m_min[0],
    tMax: d.temperature_2m_max[0],
    codigo: d.weather_code[0] ?? 0,
    horas,
    amanece: reloj(d.sunrise?.[0]),
    anochece: reloj(d.sunset?.[0]),
    uvMax: d.uv_index_max?.[0] ?? 0,
    radiacion: d.shortwave_radiation_sum?.[0] ?? 0,
    vientoMax: d.wind_speed_10m_max?.[0] ?? 0,
    rachaMax: d.wind_gusts_10m_max?.[0] ?? 0,
    dir: d.wind_direction_10m_dominant?.[0] ?? 0,
    anio: p.y
  };
}
__name(parsearPrevision, "parsearPrevision");
var minutos = /* @__PURE__ */ __name((hhmm2) => {
  const [h, m] = hhmm2.split(":").map(Number);
  return h * 60 + m;
}, "minutos");
function bloqueSol(d) {
  if (!d.amanece || !d.anochece) return "";
  const luz = minutos(d.anochece) - minutos(d.amanece);
  return `\u{1F305} <b>Sol</b>
Amanece ${d.amanece} \xB7 Anochece ${d.anochece}
${Math.floor(luz / 60)} h ${luz % 60} min de luz`;
}
__name(bloqueSol, "bloqueSol");
function renderTiempo(d, ciudad, zona, ahora) {
  const p = partesEnZona(ahora, zona);
  const temps = d.horas.map((h) => h.temp);
  const primera = d.horas[0], ultima = d.horas[d.horas.length - 1];
  const bloques = [
    cabecera(emojiTiempo(d.codigo), `Tiempo \xB7 ${esc(ciudad)}`, `${descTiempo(d.codigo).replace(/^./, (c) => c.toUpperCase())} \xB7 m\xEDn ${grados(d.tMin)} / m\xE1x ${grados(d.tMax)}`)
  ];
  if (temps.length >= 2) {
    const iMax = temps.indexOf(Math.max(...temps)), iMin = temps.indexOf(Math.min(...temps));
    bloques.push(`\u{1F321} <b>Temperatura</b> \xB7 ${hh(primera.hora)} \u2192 ${hh(ultima.hora)} h
<code>${sparkline(temps)}</code>
\u{1F53A} M\xE1x ${grados(temps[iMax])} a las ${hh(d.horas[iMax].hora)} h
\u{1F53B} M\xEDn ${grados(temps[iMin])} a las ${hh(d.horas[iMin].hora)} h`);
  }
  const tramos = tramosLluvia(d.horas);
  bloques.push(tramos.length === 0 ? `\u2600\uFE0F <b>Sin lluvia prevista</b>
En las pr\xF3ximas ${d.horas.length} h` : `\u{1F326} <b>Lluvia prevista</b>
${tramos.map((t) => `\u2022 ${textoTramo(t)}`).join("\n")}`);
  const sol = bloqueSol(d);
  if (sol) bloques.push(sol);
  bloques.push([
    `\u{1F4A8} <b>Viento</b> ${num0(primera?.viento ?? d.vientoMax)} km/h del ${brujula(primera?.dir ?? d.dir)}`,
    `     hoy hasta ${num0(d.vientoMax)} \xB7 rachas ${num0(d.rachaMax)} km/h`,
    `\u{1F4A7} <b>Humedad</b> ${primera?.humedad ?? "\u2013"} %`,
    `\u{1F576} <b>UV m\xE1x.</b> ${num1(d.uvMax)} (${nivelUv(d.uvMax)})${d.uvMax >= 3 ? " \u2014 protecci\xF3n solar" : ""}`
  ].join("\n"));
  const f = faseDelDia(p.y, p.m, p.d, zona);
  bloques.push(`${f.emoji} <b>${f.nombre}</b>
${Math.round(iluminacion(p.y, p.m, p.d, zona) * 100)} % iluminada`);
  if (d.lluviaAyer !== void 0 && d.lluviaAnio !== void 0) {
    bloques.push(`\u{1F327} <b>Lluvia ca\xEDda</b>
Ayer ${d.lluviaAyer >= 0.1 ? `llovi\xF3 ${num1(d.lluviaAyer)} l/m\xB2` : "no llovi\xF3"}
Acumulado ${d.anio}: ${num1(d.lluviaAnio)} l/m\xB2`);
  }
  return bloques.join("\n\n");
}
__name(renderTiempo, "renderTiempo");
function renderHoraAHora(d, ciudad) {
  const filas = d.horas.map((h) => `${hh(h.hora)}:00 ${emojiTiempo(h.codigo)} <b>${grados(h.temp)}</b> \xB7 \u{1F4A7}${h.prob} % \xB7 \u{1F4A8}${num0(h.viento)} \xB7 \u{1F32B}${h.humedad} %`);
  return [cabecera("\u{1F550}", `Hora a hora \xB7 ${esc(ciudad)}`, "\u{1F4A7} prob. lluvia \xB7 \u{1F4A8} viento km/h \xB7 \u{1F32B} humedad"), "", ...filas].join("\n");
}
__name(renderHoraAHora, "renderHoraAHora");
function renderLuna(ahora, zona) {
  const p = partesEnZona(ahora, zona);
  const hoy = faseDelDia(p.y, p.m, p.d, zona);
  const fmt = /* @__PURE__ */ __name((x) => formatearFechaHora(localAUtc(x.y, x.m, x.d, 12, 0, zona), zona).split(" \xB7 ")[0], "fmt");
  const llena = proximoDia(p.y, p.m, p.d, true, zona), nueva = proximoDia(p.y, p.m, p.d, false, zona);
  const mes = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: zona }).format(ahora);
  const dias = new Date(Date.UTC(p.y, p.m, 0)).getUTCDate();
  const primerDow = (new Date(Date.UTC(p.y, p.m - 1, 1)).getUTCDay() + 6) % 7;
  const semanas = [];
  for (let ini = 1 - primerDow; ini <= dias; ini += 7) {
    const celdas = [];
    for (let d = Math.max(ini, 1); d <= Math.min(ini + 6, dias); d++) celdas.push(`${d === p.d ? `<b>${d}</b>` : d}${faseDelDia(p.y, p.m, d, zona).emoji}`);
    semanas.push(celdas.join("  "));
  }
  return [
    cabecera("\u{1F319}", `Calendario lunar \xB7 ${mes}`),
    "",
    `Hoy: ${hoy.emoji} ${hoy.nombre} \xB7 ${Math.round(iluminacion(p.y, p.m, p.d, zona) * 100)} % iluminada \xB7 ${Math.round(edadDias(p.y, p.m, p.d, zona))} d\xEDas`,
    `\u{1F315} Pr\xF3xima llena: ${fmt(llena)}`,
    `\u{1F311} Pr\xF3xima nueva: ${fmt(nueva)}`,
    "",
    "<i>Por semanas (lunes a domingo):</i>",
    ...semanas
  ].join("\n");
}
__name(renderLuna, "renderLuna");
async function pedirPrevision(ctx) {
  const { usuario: u, ahora } = ctx;
  const c = u.ciudad;
  const clave = `tiempo:${c.lat.toFixed(2)},${c.lon.toFixed(2)}:${u.zona}:${fechaIso(ahora, u.zona)}T${partesEnZona(ahora, u.zona).h}`;
  return cacheado(ctx.almacen, clave, 45 * 6e4, ahora, async () => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,relative_humidity_2m,uv_index,wind_gusts_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,uv_index_max,shortwave_radiation_sum,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=${encodeURIComponent(u.zona)}&forecast_days=2`;
    const pasada = (async () => {
      const p = partesEnZona(ahora, u.zona);
      const ayer = new Date(Date.UTC(p.y, p.m - 1, p.d - 1));
      if (ayer.getUTCFullYear() !== p.y) return null;
      const iso = ayer.toISOString().slice(0, 10);
      const h = `https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&start_date=${p.y}-01-01&end_date=${iso}&daily=precipitation_sum&timezone=${encodeURIComponent(u.zona)}`;
      const arr = (await conReintentos(() => ctx.http.get(h, { timeout: 2e4 }))).data.daily.precipitation_sum;
      return arr.map((x) => x ?? 0);
    })().catch(() => null);
    const [prev, v] = await Promise.all([conReintentos(() => ctx.http.get(url, { timeout: 2e4 })), pasada]);
    const datos2 = parsearPrevision(prev.data, ahora, u.zona);
    if (v) {
      datos2.lluviaAyer = v[v.length - 1] ?? 0;
      datos2.lluviaAnio = v.reduce((a, b) => a + b, 0);
    }
    return datos2;
  });
}
__name(pedirPrevision, "pedirPrevision");
async function contenidoTiempo(ctx) {
  if (!ctx.usuario.ciudad) {
    return { html: "\u{1F324} <b>Tiempo</b>\nPara darte el tiempo necesito saber d\xF3nde vives.", teclado: [[{ texto: "\u{1F4CD} Indicar mi ciudad", datos: "p:ciudad" }], NAV_MENU] };
  }
  const d = await pedirPrevision(ctx);
  return {
    html: renderTiempo(d, ctx.usuario.ciudad.nombre, ctx.usuario.zona, ctx.ahora),
    teclado: [[{ texto: "\u{1F550} Hora a hora", datos: "sev:tiempo:horas" }, { texto: "\u{1F319} Calendario lunar", datos: "sev:tiempo:luna" }], NAV_MENU]
  };
}
__name(contenidoTiempo, "contenidoTiempo");
async function contenidoHoraAHora(ctx) {
  if (!ctx.usuario.ciudad) return contenidoTiempo(ctx);
  const d = await pedirPrevision(ctx);
  return { html: renderHoraAHora(d, ctx.usuario.ciudad.nombre), teclado: [[{ texto: "\u2B05\uFE0F Resumen", datos: "sev:tiempo" }], NAV_MENU] };
}
__name(contenidoHoraAHora, "contenidoHoraAHora");
async function contenidoLuna(ctx) {
  return { html: renderLuna(ctx.ahora, ctx.usuario.zona), teclado: [[{ texto: "\u2B05\uFE0F Resumen del tiempo", datos: "sev:tiempo" }], NAV_MENU] };
}
__name(contenidoLuna, "contenidoLuna");

// ../firebase/functions/src/secciones/index.ts
async function construirContenido(id, ctx) {
  switch (id) {
    case "tiempo":
      return contenidoTiempo(ctx);
    case "tiempo:horas":
      return contenidoHoraAHora(ctx);
    case "tiempo:luna":
      return contenidoLuna(ctx);
    case "noticias":
      return contenidoNoticias(ctx);
    case "agenda":
      return contenidoAgenda(ctx);
    case "horoscopo":
      return contenidoHoroscopo(ctx);
    case "mercados":
      return contenidoMercados(ctx);
    default:
      if (id.startsWith("tema:")) return contenidoTema(ctx, id.slice(5));
      throw new Error(`secci\xF3n desconocida: ${id}`);
  }
}
__name(construirContenido, "construirContenido");

// ../firebase/functions/src/geocoding.ts
async function buscarLugares(http, consulta) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(consulta.trim())}&count=5&language=es&format=json`;
  const r = await conReintentos(() => http.get(url, { timeout: 15e3 }), 2, 800);
  const res = r.data?.results ?? [];
  return res.filter((x) => typeof x.latitude === "number" && typeof x.longitude === "number").map((x) => {
    const provincia = String(x.admin2 ?? "").replace(/^Provincia de /, "") || String(x.admin1 ?? "");
    return {
      nombre: String(x.name),
      provincia,
      lat: x.latitude,
      lon: x.longitude,
      zona: String(x.timezone ?? "Europe/Madrid"),
      etiqueta: [x.name, x.admin2, x.admin1, x.country].filter(Boolean).join(", ")
    };
  });
}
__name(buscarLugares, "buscarLugares");

// ../firebase/functions/src/bot/catalogo.ts
var TEMAS = [
  { emoji: "\u26BD", titulo: "F\xFAtbol", consulta: "f\xFAtbol" },
  { emoji: "\u{1F3C0}", titulo: "Baloncesto", consulta: "baloncesto OR NBA OR ACB" },
  { emoji: "\u{1F3CD}", titulo: "Motociclismo", consulta: "MotoGP OR motociclismo OR Superbike" },
  { emoji: "\u{1F3CE}", titulo: "F\xF3rmula 1", consulta: "F\xF3rmula 1" },
  { emoji: "\u{1F3BE}", titulo: "Tenis", consulta: "tenis" },
  { emoji: "\u{1F6B4}", titulo: "Ciclismo", consulta: "ciclismo" },
  { emoji: "\u{1F4BB}", titulo: "Tecnolog\xEDa", consulta: "tecnolog\xEDa novedades" },
  { emoji: "\u{1F3AE}", titulo: "Videojuegos", consulta: "videojuegos" },
  { emoji: "\u{1F3AC}", titulo: "Cine y series", consulta: "cine OR series estrenos" },
  { emoji: "\u{1F3B5}", titulo: "M\xFAsica", consulta: "m\xFAsica conciertos" },
  { emoji: "\u{1F373}", titulo: "Cocina", consulta: "recetas cocina" },
  { emoji: "\u2708\uFE0F", titulo: "Viajes", consulta: "viajes turismo" },
  { emoji: "\u{1F9D8}", titulo: "Salud y bienestar", consulta: "salud bienestar" },
  { emoji: "\u{1F52C}", titulo: "Ciencia", consulta: "ciencia descubrimiento" },
  { emoji: "\u{1F33F}", titulo: "Naturaleza", consulta: "naturaleza medio ambiente" },
  { emoji: "\u{1F697}", titulo: "Motor", consulta: "coches motor novedades" },
  { emoji: "\u{1F6E1}", titulo: "Ciberseguridad", consulta: "ciberseguridad" },
  { emoji: "\u20BF", titulo: "Criptomonedas", consulta: "bitcoin criptomonedas" },
  { emoji: "\u{1F4DA}", titulo: "Libros", consulta: "libros literatura" },
  { emoji: "\u{1F3E1}", titulo: "Vivienda", consulta: "vivienda alquiler precios" },
  { emoji: "\u{1F436}", titulo: "Mascotas", consulta: "mascotas" },
  { emoji: "\u{1F3A8}", titulo: "Cultura y arte", consulta: "cultura exposiciones" }
];
var SECCIONES_BASICAS = ["tiempo", "noticias", "mercados", "agenda", "horoscopo"];
function separarIntereses(texto4) {
  return texto4.split(/[,;\n]/).map((t) => t.trim()).filter(Boolean).map((t) => t.slice(0, 40)).map((t) => t.charAt(0).toUpperCase() + t.slice(1)).slice(0, 10);
}
__name(separarIntereses, "separarIntereses");
var slug = /* @__PURE__ */ __name((t) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tema", "slug");

// ../firebase/functions/src/bot/ctx.ts
var Ctx = class {
  constructor(deps, u, entrada) {
    this.deps = deps;
    this.u = u;
    this.entrada = entrada;
  }
  deps;
  u;
  entrada;
  static {
    __name(this, "Ctx");
  }
  get ahora() {
    return this.deps.ahora();
  }
  get almacen() {
    return this.deps.almacen;
  }
  get texto() {
    return (this.entrada.texto ?? "").trim();
  }
  /** Responde editando el mensaje del botón pulsado; si el usuario escribió, envía uno nuevo. */
  async responder(html, teclado) {
    const cb = this.entrada.callback;
    if (cb) await this.deps.canal.editar(this.u.id, cb.mensajeId, html, teclado);
    else await this.deps.canal.enviar(this.u.id, html, teclado);
  }
  /** Envía siempre un mensaje nuevo (para no perder el menú anterior). */
  async nuevo(html, teclado) {
    await this.deps.canal.enviar(this.u.id, html, teclado);
  }
  async guardar() {
    await this.almacen.guardarUsuario(this.u);
  }
  /** Pone al usuario a la espera de un texto en [flujo]/[paso]. */
  async esperar(flujo, paso, datos2 = {}) {
    this.u.estado = { flujo, paso, datos: datos2 };
    await this.guardar();
  }
  async terminarFlujo() {
    this.u.estado = null;
    await this.guardar();
  }
  get estado() {
    return this.u.estado;
  }
};
var BTN_MENU = { texto: "\u{1F3E0} Men\xFA", datos: "m:menu" };
var BTN_CANCELAR = { texto: "\u274C Cancelar", datos: "x:cancelar" };

// ../firebase/functions/src/bot/vistas.ts
function textoMenu(u) {
  const activas = seccionesActivas(u).length;
  return [
    cabecera("\u{1F5D3}", "Agenda Personal", u.nombre ? `Hola, ${esc(u.nombre)} \u{1F44B}` : "\xBFQu\xE9 quieres hacer?"),
    "",
    bloque("\u{1F4CB}", "Resumen de hoy", "Lo que tienes activado, al momento"),
    "",
    bloque("\u23F0", "Alarmas, citas y tareas", "Crearlas, verlas y modificarlas"),
    "",
    bloque("\u2699\uFE0F", "Ajustes", activas ? `${activas} ${activas === 1 ? "secci\xF3n" : "secciones"} activa${activas === 1 ? "" : "s"} \xB7 tu perfil` : "Activa tus secciones y completa tu perfil"),
    "",
    "<i>Elige una opci\xF3n \u{1F447}</i>"
  ].join("\n");
}
__name(textoMenu, "textoMenu");
var tecladoMenu = [
  [{ texto: "\u{1F4CB} Resumen de hoy", datos: "m:hoy" }],
  [{ texto: "\u2795 Nueva alarma, cita o tarea", datos: "n:menu" }, { texto: "\u{1F4C5} Mis eventos", datos: "e:lista" }],
  [{ texto: "\u{1F9E9} Mis secciones", datos: "s:lista" }, { texto: "\u{1F464} Mi perfil", datos: "p:ver" }],
  [{ texto: "\u2753 Ayuda", datos: "m:ayuda" }]
];
var textoAyuda = [
  cabecera("\u2753", "Ayuda", "C\xF3mo funciona tu agenda"),
  "",
  bloque("\u{1F4EC}", "Qu\xE9 recibes", "Cada d\xEDa, a la hora que elijas: el tiempo, las noticias, tu agenda, tu hor\xF3scopo y los temas que sigas.", "Y un aviso de cada alarma, cita o tarea."),
  "",
  bloque(
    "\u2328\uFE0F",
    "Comandos",
    "/menu \xB7 men\xFA principal",
    "/hoy \xB7 resumen de hoy",
    "/nueva \xB7 crear alarma, cita o tarea",
    "/eventos \xB7 ver y modificar lo creado",
    "/secciones \xB7 activar y cambiar horas",
    "/perfil \xB7 tus datos",
    "/cancelar \xB7 cancelar lo que haces",
    "/borrar \xB7 borrar todos tus datos"
  ),
  "",
  bloque("\u{1F552}", "Fechas", "Escr\xEDbelas como quieras:", "\u2022 ma\xF1ana 9:30", "\u2022 15/10 18:00", "\u2022 lunes 10h", "\u2022 en 2 horas")
].join("\n");
function seccionesActivas(u) {
  const base = ORDEN_SECCIONES.filter((s) => u.secciones[s]?.activa).map((s) => ({ ref: s, emoji: SECCIONES[s].emoji, titulo: SECCIONES[s].titulo }));
  const temas = u.temas.filter((t) => t.activa).map((t) => ({ ref: `tema:${t.id}`, emoji: t.emoji, titulo: t.titulo }));
  return [...base, ...temas];
}
__name(seccionesActivas, "seccionesActivas");
function tecladoHoy(u) {
  const filas = [];
  const botones = [
    ...ORDEN_SECCIONES.map((s) => ({ texto: `${SECCIONES[s].emoji} ${SECCIONES[s].titulo}`, datos: `sec:${s}` })),
    ...u.temas.filter((t) => t.activa).map((t) => ({ texto: `${t.emoji} ${t.titulo}`, datos: `sec:tema:${t.id}` }))
  ];
  for (let i = 0; i < botones.length; i += 2) filas.push(botones.slice(i, i + 2));
  filas.push([{ texto: "\u{1F4CB} Todo lo activado", datos: "sec:todo" }], [BTN_MENU]);
  return filas;
}
__name(tecladoHoy, "tecladoHoy");
function textoPerfil(u) {
  const signo = u.nacimiento ? signoDe(u.nacimiento) : null;
  const sin2 = "<i>sin indicar</i>";
  return [
    cabecera("\u{1F464}", "Tu perfil", "Los datos con los que preparo tus res\xFAmenes"),
    "",
    bloque("\u270F\uFE0F", "Nombre", u.nombre ? esc(u.nombre) : sin2),
    "",
    bloque("\u{1F382}", "Nacimiento", u.nacimiento ? `${u.nacimiento.split("-").reverse().join("/")} \xB7 ${signo.simbolo} ${signo.nombre}` : sin2),
    "",
    bloque("\u{1F4CD}", "Ciudad", u.ciudad ? `${esc(u.ciudad.nombre)}${u.ciudad.provincia ? ` (${esc(u.ciudad.provincia)})` : ""}` : sin2),
    "",
    bloque("\u{1F550}", "Zona horaria", esc(u.zona)),
    "",
    "<i>Solo guardo esto para prepararte los res\xFAmenes. Puedes borrarlo cuando quieras con /borrar.</i>"
  ].join("\n");
}
__name(textoPerfil, "textoPerfil");
var tecladoPerfil = [
  [{ texto: "\u270F\uFE0F Nombre", datos: "p:nombre" }, { texto: "\u{1F382} Nacimiento", datos: "p:nacimiento" }],
  [{ texto: "\u{1F4CD} Ciudad", datos: "p:ciudad" }, { texto: "\u{1F5D1} Borrar mis datos", datos: "p:borrar" }],
  [BTN_MENU]
];

// ../firebase/functions/src/bot/ajustes.ts
var esTema = /* @__PURE__ */ __name((ref2) => ref2.startsWith("tema:"), "esTema");
var getCfg = /* @__PURE__ */ __name((c, ref2) => esTema(ref2) ? c.u.temas.find((t) => `tema:${t.id}` === ref2) : c.u.secciones[ref2], "getCfg");
var info3 = /* @__PURE__ */ __name((c, ref2) => {
  if (esTema(ref2)) {
    const t = c.u.temas.find((x) => `tema:${x.id}` === ref2);
    return t ? { emoji: t.emoji, titulo: t.titulo, desc: `Noticias sobre \xAB${t.consulta}\xBB` } : null;
  }
  const s = SECCIONES[ref2];
  return s ? { emoji: s.emoji, titulo: s.titulo, desc: s.descripcion } : null;
}, "info");
async function listaSecciones(c) {
  const fila = /* @__PURE__ */ __name((ref2, emoji, titulo, cfg) => [{ texto: `${cfg.activa ? "\u2705" : "\u25AB\uFE0F"} ${emoji} ${titulo} \xB7 ${cfg.hora}`, datos: `s:ver:${ref2}` }], "fila");
  const filas = [
    ...ORDEN_SECCIONES.map((s) => fila(s, SECCIONES[s].emoji, SECCIONES[s].titulo, c.u.secciones[s])),
    ...c.u.temas.map((t) => fila(`tema:${t.id}`, t.emoji, t.titulo, t)),
    [{ texto: "\u2795 A\xF1adir un tema", datos: "s:tema+" }, BTN_MENU]
  ];
  const todas = [...ORDEN_SECCIONES.map((s) => c.u.secciones[s]), ...c.u.temas];
  const activas = todas.filter((x) => x.activa).length;
  await c.responder([
    cabecera("\u{1F9E9}", "Mis secciones", `${activas} activa${activas === 1 ? "" : "s"} de ${todas.length}`),
    "",
    bloque("\u{1F50E}", "C\xF3mo leerlo", "\u2705 activa \xB7 \u25AB\uFE0F desactivada", "La hora es la del aviso diario"),
    "",
    "<i>Toca una para activarla, desactivarla o cambiar su hora \u{1F447}</i>"
  ].join("\n"), filas);
}
__name(listaSecciones, "listaSecciones");
async function verSeccion(c, ref2) {
  const i = info3(c, ref2), cfg = getCfg(c, ref2);
  if (!i || !cfg) {
    await listaSecciones(c);
    return;
  }
  await c.responder(
    [
      cabecera(i.emoji, esc(i.titulo), esc(i.desc)),
      "",
      bloque("\u{1F514}", "Aviso diario", cfg.activa ? `\u2705 Activada \xB7 cada d\xEDa a las <b>${cfg.hora}</b>` : "\u25AB\uFE0F Desactivada"),
      "",
      "<i>Elige qu\xE9 hacer \u{1F447}</i>"
    ].join("\n"),
    [
      [{ texto: cfg.activa ? "\u{1F515} Desactivar" : "\u{1F514} Activar", datos: `s:tog:${ref2}` }, { texto: "\u{1F552} Cambiar hora", datos: `s:hora:${ref2}` }],
      [{ texto: "\u{1F441} Ver ahora", datos: `sec:${ref2}` }],
      ...esTema(ref2) ? [[{ texto: "\u{1F5D1} Eliminar tema", datos: `s:temadel:${ref2.slice(5)}` }]] : [],
      [{ texto: "\u2B05\uFE0F Mis secciones", datos: "s:lista" }, BTN_MENU]
    ]
  );
}
__name(verSeccion, "verSeccion");
async function pedirDatoFaltante(c, ref2) {
  if (ref2 === "tiempo" && !c.u.ciudad) {
    await c.esperar("perfil", "ciudad", { activar: ref2 });
    await c.responder([cabecera("\u{1F4CD}", "\xBFD\xF3nde vives?", "Para darte el tiempo"), "", "Escribe el nombre de tu municipio.", "", "<i>Por ejemplo: Montoro</i>"].join("\n"), [[BTN_CANCELAR]]);
    return true;
  }
  if (ref2 === "horoscopo" && !c.u.nacimiento) {
    await c.esperar("perfil", "nacimiento", { activar: ref2 });
    await c.responder([cabecera("\u{1F382}", "Tu fecha de nacimiento", "Para tu hor\xF3scopo"), "", "Escr\xEDbela como <i>dd/mm/aaaa</i>.", "", "<i>Por ejemplo: 05/04/1984</i>"].join("\n"), [[BTN_CANCELAR]]);
    return true;
  }
  return false;
}
__name(pedirDatoFaltante, "pedirDatoFaltante");
var horaLibre = /* @__PURE__ */ __name((c) => {
  const n = c.u.temas.length;
  const m = 8 * 60 + 30 + n * 5;
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}, "horaLibre");
async function activarPendiente(c, ref2) {
  if (typeof ref2 === "string" && c.u.secciones[ref2]) {
    c.u.secciones[ref2].activa = true;
    await c.guardar();
    await programarSeccion(c.almacen, c.u, ref2, c.ahora);
  }
}
__name(activarPendiente, "activarPendiente");
async function callback(c, p) {
  const [ns, acc] = p;
  const ref2 = p.slice(2).join(":");
  if (ns === "s") {
    switch (acc) {
      case "lista":
        await listaSecciones(c);
        return true;
      case "ver":
        await verSeccion(c, ref2);
        return true;
      case "tog": {
        const cfg = getCfg(c, ref2);
        if (!cfg) return true;
        if (!cfg.activa && await pedirDatoFaltante(c, ref2)) return true;
        cfg.activa = !cfg.activa;
        await c.guardar();
        await programarSeccion(c.almacen, c.u, ref2, c.ahora);
        await verSeccion(c, ref2);
        return true;
      }
      case "hora":
        await c.esperar("hora", "valor", { ref: ref2 });
        await c.responder([cabecera("\u{1F552}", "Hora del aviso", `${getCfg(c, ref2) ? `Ahora: ${getCfg(c, ref2).hora}` : "Aviso diario"}`), "", "\xBFA qu\xE9 hora lo quieres cada d\xEDa?", "", "<i>Escr\xEDbela como 07:30 o 8h</i>"].join("\n"), [[BTN_CANCELAR]]);
        return true;
      case "tema+":
        await c.esperar("tema", "titulo");
        await c.responder([cabecera("\u2B50", "Nuevo tema", "Paso 1: el tema"), "", "\xBFSobre qu\xE9 quieres noticias?", "", "<i>Por ejemplo: Ajedrez, Real Madrid, Energ\xEDas renovables</i>"].join("\n"), [[BTN_CANCELAR]]);
        return true;
      case "temaskip":
        return crearTema(c, void 0);
      case "temadel": {
        const t = c.u.temas.find((x) => x.id === p[2]);
        if (!t) return true;
        await c.responder([cabecera("\u{1F5D1}", "\xBFEliminar este tema?", esc(t.titulo)), "", "<i>Dejar\xE1s de recibir sus noticias.</i>"].join("\n"), [[{ texto: "\u{1F5D1} S\xED, eliminar", datos: `s:temadelok:${t.id}` }, { texto: "Cancelar", datos: `s:ver:tema:${t.id}` }]]);
        return true;
      }
      case "temadelok": {
        c.u.temas = c.u.temas.filter((x) => x.id !== p[2]);
        await c.guardar();
        await programarSeccion(c.almacen, c.u, `tema:${p[2]}`, c.ahora);
        await listaSecciones(c);
        return true;
      }
      default:
        return true;
    }
  }
  switch (acc) {
    case "ver":
      await c.responder(textoPerfil(c.u), tecladoPerfil);
      return true;
    case "nombre":
      await c.esperar("perfil", "nombre");
      await c.responder([cabecera("\u270F\uFE0F", "Tu nombre"), "", "\xBFC\xF3mo te llamo?"].join("\n"), [[BTN_CANCELAR]]);
      return true;
    case "nacimiento":
      await c.esperar("perfil", "nacimiento");
      await c.responder([cabecera("\u{1F382}", "Tu fecha de nacimiento"), "", "Escr\xEDbela como <i>dd/mm/aaaa</i>.", "", "<i>Por ejemplo: 05/04/1984</i>"].join("\n"), [[BTN_CANCELAR]]);
      return true;
    case "ciudad":
      await c.esperar("perfil", "ciudad");
      await c.responder([cabecera("\u{1F4CD}", "Tu ciudad"), "", "Escribe el nombre de tu municipio.", "", "<i>Por ejemplo: Montoro</i>"].join("\n"), [[BTN_CANCELAR]]);
      return true;
    case "lugar": {
      const l = (c.estado?.datos.resultados ?? [])[+p[2]];
      if (l) {
        const pendiente = c.estado?.datos.activar;
        c.u.ciudad = { nombre: l.nombre, provincia: l.provincia, lat: l.lat, lon: l.lon };
        c.u.zona = l.zona;
        c.u.estado = null;
        await c.guardar();
        await activarPendiente(c, pendiente);
        await sincronizarSecciones(c.almacen, c.u, c.ahora);
        await c.responder([cabecera("\u{1F4CD}", "\xA1Listo!", "Ciudad guardada"), "", bloque("\u{1F4CD}", "Ciudad", esc(l.nombre)), "", bloque("\u{1F550}", "Zona horaria", esc(l.zona))].join("\n"), [[{ texto: "\u{1F464} Mi perfil", datos: "p:ver" }, BTN_MENU]]);
      }
      return true;
    }
    case "borrar":
      await c.responder([cabecera("\u26A0\uFE0F", "\xBFBorrar todos tus datos?", "No se puede deshacer"), "", bloque("\u{1F5D1}", "Se eliminar\xE1", "\u2022 tu perfil", "\u2022 tus secciones y temas", "\u2022 tus alarmas, citas y tareas"), "", "<i>Y dejar\xE9 de enviarte mensajes.</i>"].join("\n"), [[{ texto: "\u{1F5D1} S\xED, borrar todo", datos: "p:borrarok" }, { texto: "Cancelar", datos: "p:ver" }]]);
      return true;
    case "borrarok":
      await c.almacen.borrarUsuario(c.u.id);
      await c.responder([cabecera("\u{1F5D1}", "Datos borrados"), "", "No te enviar\xE9 m\xE1s mensajes.", "", "<i>Si quieres volver, escribe /start.</i>"].join("\n"));
      return true;
    default:
      return true;
  }
}
__name(callback, "callback");
async function crearTema(c, consulta) {
  const titulo = String(c.estado?.datos.titulo ?? "").trim();
  if (!titulo) return true;
  let id = slug(titulo);
  let n = 2;
  while (c.u.temas.some((t) => t.id === id)) id = `${slug(titulo)}-${n++}`;
  const tema = { id, titulo, emoji: "\u2B50", consulta: (consulta ?? titulo).trim() || titulo, hora: horaLibre(c), activa: true };
  c.u.temas.push(tema);
  c.u.estado = null;
  await c.guardar();
  await programarSeccion(c.almacen, c.u, `tema:${id}`, c.ahora);
  await c.responder([cabecera("\u2705", "Tema a\xF1adido", esc(titulo)), "", bloque("\u{1F514}", "Aviso diario", `Cada d\xEDa a las <b>${tema.hora}</b>`)].join("\n"), [[{ texto: "\u{1F441} Verlo ahora", datos: `sec:tema:${id}` }, { texto: "\u{1F9E9} Mis secciones", datos: "s:lista" }]]);
  return true;
}
__name(crearTema, "crearTema");
async function texto(c) {
  const est = c.estado;
  if (!est) return false;
  if (est.flujo === "hora") {
    const ref2 = String(est.datos.ref);
    const hm = parseHoraHHMM(c.texto);
    if (!hm) {
      await c.nuevo("No he entendido la hora. Prueba con <i>07:30</i> o <i>8h</i>.", [[BTN_CANCELAR]]);
      return true;
    }
    const cfg = getCfg(c, ref2);
    if (!cfg) {
      await c.terminarFlujo();
      return true;
    }
    cfg.hora = `${String(hm[0]).padStart(2, "0")}:${String(hm[1]).padStart(2, "0")}`;
    c.u.estado = null;
    await c.guardar();
    await programarSeccion(c.almacen, c.u, ref2, c.ahora);
    await c.nuevo([cabecera("\u{1F552}", "\xA1Hecho!", "Hora cambiada"), "", bloque("\u{1F514}", "Aviso diario", `Cada d\xEDa a las <b>${cfg.hora}</b>`)].join("\n"), [[{ texto: "\u{1F9E9} Mis secciones", datos: "s:lista" }, BTN_MENU]]);
    return true;
  }
  if (est.flujo === "tema") {
    if (est.paso === "titulo") {
      await c.esperar("tema", "consulta", { titulo: c.texto.slice(0, 40) });
      await c.nuevo([cabecera("\u{1F50E}", "\xBFQu\xE9 busco?", "Paso 2: las palabras"), "", "Escribe las palabras que quieres vigilar.", "", "<i>Por ejemplo: ajedrez OR Magnus Carlsen. Si no escribes nada, uso el nombre.</i>"].join("\n"), [[{ texto: "Usar el nombre", datos: "s:temaskip" }], [BTN_CANCELAR]]);
      return true;
    }
    return crearTema(c, c.texto.slice(0, 120));
  }
  if (est.flujo === "perfil") {
    const pendiente = est.datos.activar;
    if (est.paso === "nombre") {
      c.u.nombre = c.texto.slice(0, 40);
      c.u.estado = null;
      await c.guardar();
      await c.nuevo(`\u270F\uFE0F Encantado, ${esc(c.u.nombre)}.`, [[{ texto: "\u{1F464} Mi perfil", datos: "p:ver" }, BTN_MENU]]);
      return true;
    }
    if (est.paso === "nacimiento") {
      const iso = parseNacimiento(c.texto, c.ahora);
      if (!iso) {
        await c.nuevo("No he entendido la fecha. Escr\xEDbela como <i>dd/mm/aaaa</i>, por ejemplo <i>05/04/1984</i>.", [[BTN_CANCELAR]]);
        return true;
      }
      c.u.nacimiento = iso;
      c.u.estado = null;
      await c.guardar();
      await activarPendiente(c, pendiente);
      await c.nuevo("\u{1F382} Fecha guardada.", [[{ texto: "\u{1F464} Mi perfil", datos: "p:ver" }, { texto: "\u{1F52E} Ver mi hor\xF3scopo", datos: "sec:horoscopo" }]]);
      return true;
    }
    if (est.paso === "ciudad") {
      let lugares = [];
      try {
        lugares = await buscarLugares(c.deps.http, c.texto);
      } catch {
        await c.nuevo("No he podido buscar ahora mismo. Int\xE9ntalo de nuevo en un momento.", [[BTN_CANCELAR]]);
        return true;
      }
      if (lugares.length === 0) {
        await c.nuevo("No encuentro ese municipio. Prueba con otro nombre.", [[BTN_CANCELAR]]);
        return true;
      }
      await c.esperar("perfil", "ciudad", { ...est.datos, resultados: lugares });
      await c.nuevo("\u{1F4CD} \xBFCu\xE1l es?", [...lugares.map((l, i) => [{ texto: l.etiqueta.slice(0, 60), datos: `p:lugar:${i}` }]), [BTN_CANCELAR]]);
      return true;
    }
  }
  return false;
}
__name(texto, "texto");

// ../firebase/functions/src/bot/eventos.ts
var NOMBRE_TIPO = { alarma: "Alarma", cita: "Cita", tarea: "Tarea" };
var REP_TEXTO = { ninguna: "solo una vez", diaria: "cada d\xEDa", semanal: "cada semana", laborables: "de lunes a viernes" };
var ANT_TEXTO = /* @__PURE__ */ __name((m) => m === 0 ? "sin aviso previo" : m < 60 ? `${m} min antes` : m < 1440 ? `${m / 60} h antes` : `${m / 1440} d\xEDa${m >= 2880 ? "s" : ""} antes`, "ANT_TEXTO");
var AYUDA_CUANDO = [
  cabecera("\u{1F552}", "\xBFCu\xE1ndo?", "Escr\xEDbelo como quieras"),
  "",
  "\u2022 <i>ma\xF1ana 9:30</i>",
  "\u2022 <i>15/10 18:00</i>",
  "\u2022 <i>lunes 10h</i>",
  "\u2022 <i>en 2 horas</i>",
  "",
  "<i>O elige un atajo \u{1F447}</i>"
].join("\n");
var TECLADO_CUANDO = /* @__PURE__ */ __name((extra = []) => [
  [{ texto: "En 1 hora", datos: "n:t:1h" }, { texto: "Ma\xF1ana 9:00", datos: "n:t:m9" }, { texto: "Ma\xF1ana 18:00", datos: "n:t:m18" }],
  ...extra,
  [BTN_CANCELAR]
], "TECLADO_CUANDO");
function textoEvento(e, zona, ahora) {
  const bloques = [
    cabecera(EMOJI_TIPO[e.tipo], esc(e.titulo), NOMBRE_TIPO[e.tipo]),
    "",
    bloque("\u{1F550}", "Cu\xE1ndo", e.fechaHora ? formatearFechaHora(e.fechaHora, zona, ahora) : "<i>sin fecha</i>")
  ];
  if (e.lugar) bloques.push("", bloque("\u{1F4CD}", "D\xF3nde", esc(e.lugar)));
  if (e.tipo === "cita") bloques.push("", bloque("\u{1F514}", "Aviso", ANT_TEXTO(e.antelacionMin)));
  if (e.tipo === "alarma" || e.repeticion !== "ninguna") bloques.push("", bloque("\u{1F501}", "Se repite", REP_TEXTO[e.repeticion]));
  if (e.tipo === "tarea" && e.hecho) bloques.push("", bloque("\u2705", "Estado", "Hecha"));
  return bloques.join("\n");
}
__name(textoEvento, "textoEvento");
function tecladoEvento(e) {
  const filas = [[{ texto: "\u270F\uFE0F T\xEDtulo", datos: `e:ed:titulo:${e.id}` }, { texto: "\u{1F552} Fecha y hora", datos: `e:ed:cuando:${e.id}` }]];
  if (e.tipo === "cita") filas.push([{ texto: "\u{1F4CD} Lugar", datos: `e:ed:lugar:${e.id}` }, { texto: "\u{1F514} Antelaci\xF3n", datos: `e:ed:ant:${e.id}` }]);
  if (e.tipo !== "tarea") filas.push([{ texto: "\u{1F501} Repetici\xF3n", datos: `e:ed:rep:${e.id}` }]);
  if (e.tipo === "tarea") filas.push([{ texto: e.hecho ? "\u21A9\uFE0F Marcar pendiente" : "\u2705 Marcar hecha", datos: `e:hecho:${e.id}` }]);
  filas.push([{ texto: "\u{1F5D1} Eliminar", datos: `e:del:${e.id}` }], [{ texto: "\u2B05\uFE0F Mis eventos", datos: "e:lista" }, BTN_MENU]);
  return filas;
}
__name(tecladoEvento, "tecladoEvento");
async function verEvento(c, e) {
  await c.responder(textoEvento(e, c.u.zona, c.ahora), tecladoEvento(e));
}
__name(verEvento, "verEvento");
var recortar = /* @__PURE__ */ __name((t, n = 34) => t.length > n ? `${t.slice(0, n - 1)}\u2026` : t, "recortar");
async function lista(c) {
  const ahora = c.ahora;
  const todos = await c.almacen.listarEventos(c.u.id);
  const futuros = todos.filter((e) => e.tipo !== "tarea" && e.fechaHora && (e.repeticion !== "ninguna" || e.fechaHora.getTime() > ahora.getTime())).sort((a, b) => a.fechaHora.getTime() - b.fechaHora.getTime());
  const tareas = todos.filter((e) => e.tipo === "tarea").sort((a, b) => Number(a.hecho) - Number(b.hecho) || (a.fechaHora?.getTime() ?? Infinity) - (b.fechaHora?.getTime() ?? Infinity));
  const pasados = todos.filter((e) => e.tipo !== "tarea" && e.fechaHora && e.repeticion === "ninguna" && e.fechaHora.getTime() <= ahora.getTime()).sort((a, b) => b.fechaHora.getTime() - a.fechaHora.getTime()).slice(0, 4);
  const filas = [
    ...futuros.slice(0, 10).map((e) => [{ texto: `${EMOJI_TIPO[e.tipo]} ${formatearFechaHora(e.fechaHora, c.u.zona, ahora)} \xB7 ${recortar(e.titulo)}`, datos: `e:ver:${e.id}` }]),
    ...tareas.slice(0, 8).map((e) => [{ texto: `${e.hecho ? "\u2611\uFE0F" : "\u2705"} ${recortar(e.titulo)}${e.fechaHora ? ` \xB7 ${formatearFechaHora(e.fechaHora, c.u.zona, ahora)}` : ""}`, datos: `e:ver:${e.id}` }]),
    ...pasados.map((e) => [{ texto: `\u{1F558} ${recortar(e.titulo)}`, datos: `e:ver:${e.id}` }]),
    [{ texto: "\u2795 Nueva", datos: "n:menu" }, BTN_MENU]
  ];
  const vacio = futuros.length + tareas.length + pasados.length === 0;
  const pendientes = tareas.filter((t) => !t.hecho).length;
  await c.responder(vacio ? [cabecera("\u{1F4C5}", "Mis eventos", "A\xFAn no hay nada"), "", "Todav\xEDa no tienes alarmas, citas ni tareas.", "", "<i>\xA1Crea la primera con \xAB\u2795 Nueva\xBB! \u{1F447}</i>"].join("\n") : [
    cabecera("\u{1F4C5}", "Mis eventos", `${futuros.length} pr\xF3ximo${futuros.length === 1 ? "" : "s"} \xB7 ${pendientes} tarea${pendientes === 1 ? "" : "s"} pendiente${pendientes === 1 ? "" : "s"}`),
    "",
    bloque("\u{1F50E}", "C\xF3mo leerlo", "\u23F0 alarma \xB7 \u{1FA7A} cita \xB7 \u2705 tarea \xB7 \u{1F558} pasado"),
    "",
    "<i>Toca uno para verlo, modificarlo o eliminarlo \u{1F447}</i>"
  ].join("\n"), filas);
}
__name(lista, "lista");
async function menuNueva(c) {
  await c.responder([
    cabecera("\u2795", "Crear nuevo", "\xBFQu\xE9 quieres crear?"),
    "",
    bloque("\u23F0", "Alarma", "Te avisa a una hora y puede repetirse"),
    "",
    bloque("\u{1FA7A}", "Cita", "Con lugar y aviso con antelaci\xF3n"),
    "",
    bloque("\u2705", "Tarea", "Algo pendiente, con o sin fecha")
  ].join("\n"), [
    [{ texto: "\u23F0 Alarma", datos: "n:tipo:alarma" }, { texto: "\u{1FA7A} Cita", datos: "n:tipo:cita" }, { texto: "\u2705 Tarea", datos: "n:tipo:tarea" }],
    [BTN_MENU]
  ]);
}
__name(menuNueva, "menuNueva");
async function guardarNuevo(c, d) {
  const ahora = c.ahora;
  const fecha = d.cuando ? new Date(d.cuando) : null;
  let ant = d.tipo === "cita" ? d.ant ?? 60 : 0;
  let aviso = "";
  if (fecha && fecha.getTime() - ant * 6e4 <= ahora.getTime() && ant > 0) {
    ant = 0;
    aviso = "\n<i>El aviso previo ya habr\xEDa pasado, as\xED que te avisar\xE9 a la hora del evento.</i>";
  }
  const base = { uid: c.u.id, tipo: d.tipo, titulo: d.titulo ?? "Sin t\xEDtulo", lugar: d.lugar ?? "", fechaHora: fecha, antelacionMin: ant, repeticion: d.rep ?? "ninguna", avisado: false, hecho: false, creadoEn: ahora };
  let ev = await c.almacen.guardarEvento(base);
  ev = await programarEvento(c.almacen, ev, c.u.zona, ahora);
  await c.almacen.guardarEvento(ev);
  await c.terminarFlujo();
  const extra = ev.fechaHora && momentoAviso(ev).getTime() > ahora.getTime() ? "" : ev.fechaHora ? "" : "\n<i>Sin fecha: no habr\xE1 aviso.</i>";
  await c.responder(`\u2705 <b>\xA1Guardado!</b>

${textoEvento(ev, c.u.zona, ahora)}${aviso}${extra}`, [[{ texto: "\u{1F4C5} Ver mis eventos", datos: "e:lista" }, { texto: "\u2795 Otra", datos: "n:menu" }], [BTN_MENU]]);
}
__name(guardarNuevo, "guardarNuevo");
async function preguntarTrasFecha(c, d) {
  if (d.tipo === "cita") {
    c.u.estado = { flujo: "nuevo", paso: "lugar", datos: d };
    await c.guardar();
    await c.nuevo([cabecera("\u{1F4CD}", "\xBFD\xF3nde es?", "Paso 3: el lugar"), "", "<i>Por ejemplo: hospital, consulta, centro de salud\u2026</i>"].join("\n"), [[{ texto: "Omitir", datos: "n:skip" }], [BTN_CANCELAR]]);
  } else if (d.tipo === "alarma") {
    c.u.estado = { flujo: "nuevo", paso: "rep", datos: d };
    await c.guardar();
    await c.nuevo([cabecera("\u{1F501}", "\xBFSe repite?", "Paso 3: la repetici\xF3n"), "", "<i>Elige una opci\xF3n \u{1F447}</i>"].join("\n"), [[{ texto: "Solo una vez", datos: "n:rep:ninguna" }, { texto: "Cada d\xEDa", datos: "n:rep:diaria" }], [{ texto: "Lunes a viernes", datos: "n:rep:laborables" }, { texto: "Cada semana", datos: "n:rep:semanal" }], [BTN_CANCELAR]]);
  } else {
    await guardarNuevo(c, d);
  }
}
__name(preguntarTrasFecha, "preguntarTrasFecha");
var TEXTO_ANT = [cabecera("\u{1F514}", "\xBFCu\xE1ndo te aviso?", "Paso 4: la antelaci\xF3n"), "", "<i>\xBFCu\xE1nto tiempo antes quieres el aviso? \u{1F447}</i>"].join("\n");
var TECLADO_ANT = [[{ texto: "30 min", datos: "n:ant:30" }, { texto: "1 h", datos: "n:ant:60" }, { texto: "3 h", datos: "n:ant:180" }, { texto: "1 d\xEDa", datos: "n:ant:1440" }], [{ texto: "Sin aviso previo", datos: "n:ant:0" }], [BTN_CANCELAR]];
async function leerCuando(c, texto4) {
  const r = parseFechaHora(texto4, c.ahora, c.u.zona);
  if (!r) {
    await c.nuevo("No he entendido la fecha \u{1F914}\n" + AYUDA_CUANDO, TECLADO_CUANDO());
    return null;
  }
  if (r.pasada) {
    await c.nuevo("Esa fecha ya ha pasado. Prueba con otra.", TECLADO_CUANDO());
    return null;
  }
  return r.utc;
}
__name(leerCuando, "leerCuando");
var ATAJOS = { "1h": "en 60 min", m9: "ma\xF1ana 9:00", m18: "ma\xF1ana 18:00" };
async function callback2(c, p) {
  const [ns, acc, a1, a2] = p;
  if (ns === "n") {
    if (acc === "menu") {
      await menuNueva(c);
      return true;
    }
    if (acc === "tipo") {
      const tipo = a1;
      await c.esperar("nuevo", "titulo", { tipo });
      await c.responder([cabecera(EMOJI_TIPO[tipo], `Nueva ${NOMBRE_TIPO[tipo].toLowerCase()}`, "Paso 1: el nombre"), "", "\xBFC\xF3mo la llamamos?", "", `<i>Por ejemplo: ${tipo === "cita" ? "Cardiolog\xEDa" : tipo === "alarma" ? "Tomar la pastilla" : "Llamar al fontanero"}</i>`].join("\n"), [[BTN_CANCELAR]]);
      return true;
    }
    if (c.estado?.flujo !== "nuevo") {
      await menuNueva(c);
      return true;
    }
    const d = c.estado.datos;
    if (acc === "t") {
      const f = await leerCuando(c, ATAJOS[a1] ?? "");
      if (!f) return true;
      d.cuando = f.toISOString();
      await preguntarTrasFecha(c, d);
      return true;
    }
    if (acc === "sinfecha") {
      await guardarNuevo(c, d);
      return true;
    }
    if (acc === "skip") {
      d.lugar = "";
      c.u.estado = { flujo: "nuevo", paso: "ant", datos: d };
      await c.guardar();
      await c.responder(TEXTO_ANT, TECLADO_ANT);
      return true;
    }
    if (acc === "ant") {
      d.ant = +a1;
      await guardarNuevo(c, d);
      return true;
    }
    if (acc === "rep") {
      d.rep = a1;
      await guardarNuevo(c, d);
      return true;
    }
    return true;
  }
  if (acc === "lista") {
    await lista(c);
    return true;
  }
  const id = acc === "ed" || acc === "rep" || acc === "ant" ? p[3] : a1;
  const ev = id ? await c.almacen.getEvento(c.u.id, id) : null;
  if (!ev) {
    await c.responder("Ese evento ya no existe.", [[{ texto: "\u{1F4C5} Mis eventos", datos: "e:lista" }, BTN_MENU]]);
    return true;
  }
  const ahora = c.ahora;
  switch (acc) {
    case "ver":
      await verEvento(c, ev);
      return true;
    case "del":
      await c.responder([cabecera("\u{1F5D1}", "\xBFEliminar?", esc(ev.titulo)), "", "<i>No se puede deshacer.</i>"].join("\n"), [[{ texto: "\u{1F5D1} S\xED, eliminar", datos: `e:delok:${ev.id}` }, { texto: "Cancelar", datos: `e:ver:${ev.id}` }]]);
      return true;
    case "delok":
      await cancelarEvento(c.almacen, c.u.id, ev.id);
      await c.responder(`\u{1F5D1} Eliminado: <b>${esc(ev.titulo)}</b>`, [[{ texto: "\u{1F4C5} Mis eventos", datos: "e:lista" }, BTN_MENU]]);
      return true;
    case "keep":
      await c.responder(`\u2705 Conservado: <b>${esc(ev.titulo)}</b>`, [[{ texto: "\u270F\uFE0F Modificar", datos: `e:ver:${ev.id}` }, { texto: "\u{1F4C5} Mis eventos", datos: "e:lista" }]]);
      return true;
    case "snz": {
      const cuando = await posponerEvento(c.almacen, c.u.id, ev.id, 10, ahora);
      await c.responder(`\u{1F4A4} Te lo recuerdo de nuevo a las ${formatearFechaHora(cuando, c.u.zona).split(" \xB7 ")[1]}: <b>${esc(ev.titulo)}</b>`);
      return true;
    }
    case "hecho": {
      const nuevo = { ...ev, hecho: !ev.hecho };
      await c.almacen.guardarEvento(nuevo);
      await programarEvento(c.almacen, nuevo, c.u.zona, ahora);
      await verEvento(c, nuevo);
      return true;
    }
    case "ed": {
      const campo = a1;
      if (campo === "rep") {
        await c.responder([cabecera("\u{1F501}", "\xBFSe repite?", esc(ev.titulo)), "", "<i>Elige una opci\xF3n \u{1F447}</i>"].join("\n"), [[{ texto: "Solo una vez", datos: `e:rep:ninguna:${ev.id}` }, { texto: "Cada d\xEDa", datos: `e:rep:diaria:${ev.id}` }], [{ texto: "Lunes a viernes", datos: `e:rep:laborables:${ev.id}` }, { texto: "Cada semana", datos: `e:rep:semanal:${ev.id}` }], [{ texto: "Cancelar", datos: `e:ver:${ev.id}` }]]);
        return true;
      }
      if (campo === "ant") {
        await c.responder([cabecera("\u{1F514}", "\xBFCu\xE1ndo te aviso?", esc(ev.titulo)), "", "<i>\xBFCu\xE1nto tiempo antes quieres el aviso? \u{1F447}</i>"].join("\n"), [[30, 60, 180, 1440].map((m) => ({ texto: ANT_TEXTO(m).replace(" antes", ""), datos: `e:ant:${m}:${ev.id}` })), [{ texto: "Sin aviso previo", datos: `e:ant:0:${ev.id}` }, { texto: "Cancelar", datos: `e:ver:${ev.id}` }]]);
        return true;
      }
      await c.esperar("editar", campo, { id: ev.id });
      const pregunta = campo === "titulo" ? [cabecera("\u270F\uFE0F", "Nuevo t\xEDtulo", esc(ev.titulo)), "", "<i>Escr\xEDbelo ahora \u{1F447}</i>"].join("\n") : campo === "lugar" ? [cabecera("\u{1F4CD}", "Nuevo lugar", esc(ev.titulo)), "", "<i>Escr\xEDbelo ahora \u{1F447}</i>"].join("\n") : AYUDA_CUANDO;
      await c.responder(pregunta, campo === "cuando" ? TECLADO_CUANDO() : [[BTN_CANCELAR]]);
      return true;
    }
    case "rep": {
      const nuevo = await programarEvento(c.almacen, { ...ev, repeticion: a1 }, c.u.zona, ahora);
      await c.almacen.guardarEvento(nuevo);
      await verEvento(c, nuevo);
      return true;
    }
    case "ant": {
      const nuevo = await programarEvento(c.almacen, { ...ev, antelacionMin: +a1 }, c.u.zona, ahora);
      await c.almacen.guardarEvento(nuevo);
      await verEvento(c, nuevo);
      return true;
    }
    default:
      return true;
  }
}
__name(callback2, "callback");
async function texto2(c) {
  const est = c.estado;
  if (!est) return false;
  if (est.flujo === "nuevo") {
    const d = est.datos;
    if (est.paso === "titulo") {
      d.titulo = c.texto.slice(0, 80);
      c.u.estado = { flujo: "nuevo", paso: "cuando", datos: d };
      await c.guardar();
      await c.nuevo(AYUDA_CUANDO, TECLADO_CUANDO(d.tipo === "tarea" ? [[{ texto: "Sin fecha", datos: "n:sinfecha" }]] : []));
      return true;
    }
    if (est.paso === "cuando") {
      const r = parseFechaHora(c.texto, c.ahora, c.u.zona);
      const f = await leerCuando(c, c.texto);
      if (!f) return true;
      d.cuando = f.toISOString();
      if (r?.horaPorDefecto) await c.nuevo("<i>No indicaste hora: uso las 09:00.</i>");
      await preguntarTrasFecha(c, d);
      return true;
    }
    if (est.paso === "lugar") {
      d.lugar = c.texto.slice(0, 80);
      c.u.estado = { flujo: "nuevo", paso: "ant", datos: d };
      await c.guardar();
      await c.nuevo(TEXTO_ANT, TECLADO_ANT);
      return true;
    }
    return false;
  }
  if (est.flujo === "editar") {
    const id = String(est.datos.id);
    const ev = await c.almacen.getEvento(c.u.id, id);
    if (!ev) {
      await c.terminarFlujo();
      await c.nuevo("Ese evento ya no existe.", [[BTN_MENU]]);
      return true;
    }
    let nuevo = ev;
    if (est.paso === "titulo") nuevo = { ...ev, titulo: c.texto.slice(0, 80) };
    else if (est.paso === "lugar") nuevo = { ...ev, lugar: c.texto.slice(0, 80) };
    else if (est.paso === "cuando") {
      const f = await leerCuando(c, c.texto);
      if (!f) return true;
      nuevo = { ...ev, fechaHora: f, avisado: false };
    } else return false;
    nuevo = await programarEvento(c.almacen, nuevo, c.u.zona, c.ahora);
    await c.almacen.guardarEvento(nuevo);
    await c.terminarFlujo();
    await c.nuevo(`\u2705 Actualizado

${textoEvento(nuevo, c.u.zona, c.ahora)}`, tecladoEvento(nuevo));
    return true;
  }
  return false;
}
__name(texto2, "texto");
function mensajeAviso(e, zona, ahora, retrasado = false) {
  const cuando = e.fechaHora ? formatearFechaHora(e.fechaHora, zona, ahora) : "";
  const frase = e.tipo === "cita" ? "Tienes una cita" : e.tipo === "tarea" ? "Tienes una tarea pendiente" : "Es la hora de tu alarma";
  const bloques = [cabecera(EMOJI_TIPO[e.tipo], esc(e.titulo), `${frase}${retrasado ? " \xB7 aviso retrasado" : ""}`)];
  if (e.antelacionMin > 0 && cuando) bloques.push("", bloque("\u23F3", "Es", `${cuando} <i>(${ANT_TEXTO(e.antelacionMin).replace("antes", "de antelaci\xF3n")})</i>`));
  if (e.lugar) bloques.push("", bloque("\u{1F4CD}", "D\xF3nde", esc(e.lugar)));
  bloques.push("", "<i>\xBFQu\xE9 hago con \xE9l? \u{1F447}</i>");
  const html = bloques.join("\n");
  return {
    html,
    teclado: [
      [{ texto: "\u{1F5D1} Eliminar", datos: `e:delok:${e.id}` }, { texto: "\u2705 Conservar", datos: `e:keep:${e.id}` }, { texto: "\u270F\uFE0F Modificar", datos: `e:ver:${e.id}` }],
      [{ texto: "\u{1F4A4} Posponer 10 min", datos: `e:snz:${e.id}` }]
    ]
  };
}
__name(mensajeAviso, "mensajeAviso");

// ../firebase/functions/src/bot/onboarding.ts
var FLUJO = "onb";
var datos = /* @__PURE__ */ __name((c) => c.estado?.flujo === FLUJO ? c.estado.datos : {}, "datos");
var OMITIR_TODO = { texto: "\u23ED Omitir configuraci\xF3n", datos: "o:omitir" };
var SIGUIENTE = /* @__PURE__ */ __name((txt = "Siguiente \u27A1\uFE0F", d = "o:sig") => ({ texto: txt, datos: d }), "SIGUIENTE");
async function iniciar(c) {
  await c.esperar(FLUJO, "inicio", { secciones: ["noticias", "agenda", "mercados", "tiempo"], temas: [], extra: [] });
  await c.nuevo(
    [
      cabecera("\u{1F44B}", "\xA1Hola! Soy tu agenda personal", "Te ayudo a no olvidar nada"),
      "",
      bloque("\u{1F4EC}", "Cada d\xEDa, a tu hora", "\u26C5 el tiempo \xB7 \u{1F4F0} noticias \xB7 \u{1F52E} hor\xF3scopo \xB7 \u{1F4C8} bolsa"),
      "",
      bloque("\u23F0", "Y te aviso de", "tus alarmas, citas y tareas"),
      "",
      "<i>Te har\xE9 unas preguntas r\xE1pidas para personalizarlo. Todo es opcional \u{1F447}</i>"
    ].join("\n"),
    [[{ texto: "\u{1F680} Empezar", datos: "o:sig" }], [OMITIR_TODO]]
  );
}
__name(iniciar, "iniciar");
function tecladoIntereses(d) {
  const marca = /* @__PURE__ */ __name((on2, t) => `${on2 ? "\u2705" : "\u25AB\uFE0F"} ${t}`, "marca");
  const filas = [];
  const basicas = SECCIONES_BASICAS.map((s) => ({ texto: marca((d.secciones ?? []).includes(s), `${SECCIONES[s].emoji} ${SECCIONES[s].titulo}`), datos: `o:s:${s}` }));
  for (let i = 0; i < basicas.length; i += 2) filas.push(basicas.slice(i, i + 2));
  return [...filas, [SIGUIENTE("Siguiente: aficiones \u27A1\uFE0F", "o:sig")], [OMITIR_TODO]];
}
__name(tecladoIntereses, "tecladoIntereses");
function tecladoTemas(d) {
  const filas = [];
  const btns = TEMAS.map((t, i) => ({ texto: `${(d.temas ?? []).includes(t.titulo) ? "\u2705" : "\u25AB\uFE0F"} ${t.emoji} ${t.titulo}`, datos: `o:t:${i}` }));
  for (let i = 0; i < btns.length; i += 2) filas.push(btns.slice(i, i + 2));
  return [...filas, [SIGUIENTE("Siguiente \u27A1\uFE0F", "o:sig")], [OMITIR_TODO]];
}
__name(tecladoTemas, "tecladoTemas");
var TEXTO_SECCIONES = [cabecera("\u{1F4CB}", "\xBFQu\xE9 quieres recibir?", "Paso 1 de 6"), "", "Un resumen cada d\xEDa, a la hora que elijas.", "", "<i>Pulsa para marcar o desmarcar \u{1F447}</i>"].join("\n");
var TEXTO_TEMAS = [cabecera("\u2B50", "\xBFQu\xE9 te interesa?", "Paso 2 de 6"), "", "Crear\xE9 una secci\xF3n de noticias para cada tema que marques.", "", "<i>Pulsa para marcar o desmarcar \u{1F447}</i>"].join("\n");
var PASOS = ["inicio", "secciones", "temas", "extra", "nombre", "nacimiento", "ciudad", "fin"];
async function mostrarPaso(c, paso) {
  const d = datos(c);
  c.u.estado = { flujo: FLUJO, paso, datos: d };
  await c.guardar();
  switch (paso) {
    case "secciones":
      d.tocoIntereses = true;
      await c.responder(TEXTO_SECCIONES, tecladoIntereses(d));
      break;
    case "temas":
      await c.responder(TEXTO_TEMAS, tecladoTemas(d));
      break;
    case "extra":
      await c.responder([cabecera("\u270D\uFE0F", "\xBFAlg\xFAn otro inter\xE9s?", "Paso 3 de 6"), "", "Escr\xEDbelos separados por comas.", "", "<i>Por ejemplo: ajedrez, pesca, Real Madrid</i>"].join("\n"), [[SIGUIENTE("Omitir este paso", "o:sig")], [OMITIR_TODO]]);
      break;
    case "nombre":
      await c.responder([cabecera("\u{1F464}", "\xBFC\xF3mo te llamo?", "Paso 4 de 6"), "", "<i>Escribe tu nombre \u{1F447}</i>"].join("\n"), [[SIGUIENTE("Omitir este paso", "o:sig")], [OMITIR_TODO]]);
      break;
    case "nacimiento":
      await c.responder([cabecera("\u{1F382}", "Tu fecha de nacimiento", "Paso 5 de 6"), "", bloque("\u{1F52E}", "Para qu\xE9", "Tu signo y tu hor\xF3scopo diario"), "", "Escr\xEDbela como <i>dd/mm/aaaa</i>.", "", "<i>Solo se guarda aqu\xED y puedes borrarla cuando quieras.</i>"].join("\n"), [[SIGUIENTE("Omitir este paso", "o:sig")], [OMITIR_TODO]]);
      break;
    case "ciudad":
      await c.responder([cabecera("\u{1F4CD}", "\xBFD\xF3nde vives?", "Paso 6 de 6"), "", bloque("\u26C5", "Para qu\xE9", "El tiempo y las noticias de tu zona"), "", "Escribe el nombre de tu municipio y lo busco.", "", "<i>Por ejemplo: Montoro</i>"].join("\n"), [[SIGUIENTE("Omitir este paso", "o:sig")], [OMITIR_TODO]]);
      break;
    case "fin":
      await resumenFinal(c);
      break;
    default:
      break;
  }
}
__name(mostrarPaso, "mostrarPaso");
async function resumenFinal(c) {
  const d = datos(c);
  const lineas = [];
  if (c.u.nombre) lineas.push(`\u{1F44B} Hola, ${esc(c.u.nombre)}`);
  if (c.u.nacimiento) {
    const s = signoDe(c.u.nacimiento);
    lineas.push(`\u{1F52E} Hor\xF3scopo de ${s.simbolo} ${s.nombre}`);
  }
  if (c.u.ciudad) lineas.push(`\u{1F4CD} Tiempo y noticias de ${esc(c.u.ciudad.nombre)}`);
  const activas = ORDEN_SECCIONES.filter((s) => (d.secciones ?? []).includes(s) && !(s === "tiempo" && !c.u.ciudad) && !(s === "horoscopo" && !c.u.nacimiento));
  if (activas.length) lineas.push("\u{1F4CB} " + activas.map((s) => `${SECCIONES[s].emoji} ${SECCIONES[s].titulo}`).join(", "));
  const temas = [...d.temas ?? [], ...d.extra ?? []];
  if (temas.length) lineas.push("\u2B50 " + temas.map(esc).join(", "));
  if ((d.secciones ?? []).includes("tiempo") && !c.u.ciudad) lineas.push("<i>Para activar el tiempo, indica tu ciudad en \u2018Mi perfil\u2019.</i>");
  if ((d.secciones ?? []).includes("horoscopo") && !c.u.nacimiento) lineas.push("<i>Para activar el hor\xF3scopo, indica tu fecha de nacimiento en \u2018Mi perfil\u2019.</i>");
  const cuerpo = lineas.length ? lineas.flatMap((l) => [l, ""]).slice(0, -1) : ["\u{1F4CB} Lo b\xE1sico: noticias, agenda y mercados"];
  await c.responder(
    [cabecera("\u{1F389}", "\xA1Todo listo!", "Esto es lo que voy a prepararte"), "", ...cuerpo, "", "<i>Podr\xE1s cambiarlo cuando quieras desde el men\xFA \u{1F447}</i>"].join("\n"),
    [[{ texto: "\u2705 Terminar", datos: "o:fin" }]]
  );
}
__name(resumenFinal, "resumenFinal");
async function terminar(c, omitido) {
  const d = datos(c);
  const ahora = c.ahora;
  const elegidas = omitido && !d.tocoIntereses ? ["noticias", "agenda", "mercados"] : d.secciones ?? [];
  for (const s of ORDEN_SECCIONES) c.u.secciones[s].activa = elegidas.includes(s);
  if (!c.u.ciudad) c.u.secciones.tiempo.activa = false;
  if (!c.u.nacimiento) c.u.secciones.horoscopo.activa = false;
  const hora0 = 8 * 60 + 30;
  const nuevos = [
    ...TEMAS.filter((t) => (d.temas ?? []).includes(t.titulo)).map((t) => ({ id: slug(t.titulo), titulo: t.titulo, emoji: t.emoji, consulta: t.consulta })),
    ...(d.extra ?? []).map((t) => ({ id: slug(t), titulo: t, emoji: "\u2B50", consulta: t }))
  ].filter((t, i, a) => a.findIndex((x) => x.id === t.id) === i && !c.u.temas.some((x) => x.id === t.id));
  nuevos.forEach((t, i) => c.u.temas.push({ ...t, hora: `${String(Math.floor((hora0 + i * 5) / 60)).padStart(2, "0")}:${String((hora0 + i * 5) % 60).padStart(2, "0")}`, activa: true }));
  c.u.onboardingHecho = true;
  c.u.estado = null;
  await c.guardar();
  await sincronizarSecciones(c.almacen, c.u, ahora);
  await c.responder(textoMenu(c.u), tecladoMenu);
}
__name(terminar, "terminar");
async function callback3(c, p) {
  if (p[0] !== "o") return false;
  if (p[1] === "omitir") {
    await terminar(c, true);
    return true;
  }
  if (p[1] === "fin") {
    await terminar(c, false);
    return true;
  }
  if (c.estado?.flujo !== FLUJO) {
    await iniciar(c);
    return true;
  }
  const d = datos(c);
  if (p[1] === "s") {
    const id = p[2];
    d.secciones = (d.secciones ?? []).includes(id) ? (d.secciones ?? []).filter((x) => x !== id) : [...d.secciones ?? [], id];
    c.u.estado = { flujo: FLUJO, paso: "secciones", datos: d };
    await c.guardar();
    await c.responder(TEXTO_SECCIONES, tecladoIntereses(d));
    return true;
  }
  if (p[1] === "t") {
    const t = TEMAS[+p[2]];
    if (!t) return true;
    d.temas = (d.temas ?? []).includes(t.titulo) ? (d.temas ?? []).filter((x) => x !== t.titulo) : [...d.temas ?? [], t.titulo];
    c.u.estado = { flujo: FLUJO, paso: "temas", datos: d };
    await c.guardar();
    await c.responder(TEXTO_TEMAS, tecladoTemas(d));
    return true;
  }
  if (p[1] === "lugar") {
    const l = (d.resultados ?? [])[+p[2]];
    if (l) {
      c.u.ciudad = { nombre: l.nombre, provincia: l.provincia, lat: l.lat, lon: l.lon };
      c.u.zona = l.zona;
      await c.guardar();
    }
    await mostrarPaso(c, "fin");
    return true;
  }
  if (p[1] === "sig") {
    const i = PASOS.indexOf(c.estado.paso);
    await mostrarPaso(c, PASOS[Math.min(i + 1, PASOS.length - 1)]);
    return true;
  }
  return true;
}
__name(callback3, "callback");
async function texto3(c) {
  if (c.estado?.flujo !== FLUJO) return false;
  const d = datos(c);
  switch (c.estado.paso) {
    case "extra":
      d.extra = separarIntereses(c.texto);
      await mostrarPaso(c, "nombre");
      return true;
    case "nombre":
      c.u.nombre = c.texto.slice(0, 40);
      await mostrarPaso(c, "nacimiento");
      return true;
    case "nacimiento": {
      const iso = parseNacimiento(c.texto, c.ahora);
      if (!iso) {
        await c.nuevo("No he entendido la fecha. Escr\xEDbela como <i>dd/mm/aaaa</i>, por ejemplo <i>05/04/1984</i>.", [[SIGUIENTE("Omitir este paso", "o:sig")]]);
        return true;
      }
      c.u.nacimiento = iso;
      await mostrarPaso(c, "ciudad");
      return true;
    }
    case "ciudad": {
      let lugares = [];
      try {
        lugares = await buscarLugares(c.deps.http, c.texto);
      } catch {
        await c.nuevo("No he podido buscar ahora mismo. Int\xE9ntalo de nuevo o s\xE1ltate este paso.", [[SIGUIENTE("Omitir este paso", "o:sig")]]);
        return true;
      }
      if (lugares.length === 0) {
        await c.nuevo("No encuentro ese municipio. Prueba con otro nombre.", [[SIGUIENTE("Omitir este paso", "o:sig")]]);
        return true;
      }
      d.resultados = lugares;
      c.u.estado = { flujo: FLUJO, paso: "ciudad", datos: d };
      await c.guardar();
      await c.nuevo("\u{1F4CD} \xBFCu\xE1l es?", [...lugares.map((l, i) => [{ texto: l.etiqueta.slice(0, 60), datos: `o:lugar:${i}` }]), [SIGUIENTE("Ninguna / omitir", "o:sig")]]);
      return true;
    }
    default:
      return false;
  }
}
__name(texto3, "texto");

// ../firebase/functions/src/bot/bot.ts
async function menu(c) {
  await c.responder(textoMenu(c.u), tecladoMenu);
}
__name(menu, "menu");
async function mostrarSeccion(c, ref2, editar = false) {
  if (await delegar(c, ref2, editar)) return;
  await entregarSeccion(c, ref2, construirSeccion(c, ref2), editar);
}
__name(mostrarSeccion, "mostrarSeccion");
async function delegar(c, ref2, editar) {
  if (!c.deps.delegarSeccion) return false;
  try {
    return await c.deps.delegarSeccion({ uid: c.u.id, ref: ref2, editar: editar ? c.entrada.callback?.mensajeId : void 0 });
  } catch {
    return false;
  }
}
__name(delegar, "delegar");
async function enviarSeccionDirecta(deps, u, ref2, editar) {
  const entrada = { chatId: u.id, nombre: u.nombre, updateId: 0, ...editar ? { callback: { id: "0", datos: "", mensajeId: editar } } : {} };
  const c = new Ctx({ ...deps, delegarSeccion: void 0 }, u, entrada);
  await entregarSeccion(c, ref2, construirSeccion(c, ref2), !!editar);
}
__name(enviarSeccionDirecta, "enviarSeccionDirecta");
var construirSeccion = /* @__PURE__ */ __name((c, ref2) => construirContenido(ref2, { usuario: c.u, http: c.deps.http, almacen: c.almacen, ahora: c.ahora }), "construirSeccion");
async function entregarSeccion(c, ref2, pendiente, editar = false) {
  try {
    const cont = await pendiente;
    if (editar) await c.responder(cont.html, cont.teclado);
    else await c.nuevo(cont.html, cont.teclado);
  } catch (e) {
    console.error(`secci\xF3n ${ref2}:`, e.message);
    await c.nuevo(`\u26A0\uFE0F No he podido obtener esa informaci\xF3n ahora mismo.
<i>Pulsa \xABReintentar\xBB o int\xE9ntalo en unos minutos.</i>`, [[{ texto: "\u{1F504} Reintentar", datos: `sec:${ref2}` }, BTN_MENU]]);
  }
}
__name(entregarSeccion, "entregarSeccion");
async function resumenHoy(c) {
  const activas = seccionesActivas(c.u);
  await c.responder([cabecera("\u{1F4CB}", "Resumen de hoy", activas.length ? `${activas.length} ${activas.length === 1 ? "secci\xF3n" : "secciones"} activa${activas.length === 1 ? "" : "s"}` : "A\xFAn no tienes secciones activas"), "", "<i>Elige una secci\xF3n, o pulsa \xABTodo lo activado\xBB para recibirlas todas \u{1F447}</i>"].join("\n"), tecladoHoy(c.u));
}
__name(resumenHoy, "resumenHoy");
async function todo(c) {
  const activas = seccionesActivas(c.u);
  if (activas.length === 0) {
    await c.nuevo("No tienes ninguna secci\xF3n activada. Act\xEDvalas en \u{1F9E9} Mis secciones.", [[{ texto: "\u{1F9E9} Mis secciones", datos: "s:lista" }]]);
    return;
  }
  const fecha = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: c.u.zona }).format(c.ahora);
  await c.nuevo([cabecera("\u{1F4CB}", "Tu resumen de hoy", fecha.replace(/^./, (x) => x.toUpperCase())), "", ...activas.map((s) => `${s.emoji} ${s.titulo}`), "", "<i>Te lo env\xEDo ahora, uno por uno \u{1F447}</i>"].join("\n"));
  if (c.deps.delegarSeccion) {
    for (const s of activas) await mostrarSeccion(c, s.ref);
    return;
  }
  const pendientes = activas.map((s) => {
    const p = construirSeccion(c, s.ref);
    p.catch(() => void 0);
    return p;
  });
  for (let i = 0; i < activas.length; i++) await entregarSeccion(c, activas[i].ref, pendientes[i]);
}
__name(todo, "todo");
async function cancelar(c) {
  const habia = !!c.u.estado;
  await c.terminarFlujo();
  if (habia && !c.u.onboardingHecho) {
    await terminar(c, true);
    return;
  }
  await c.nuevo(habia ? "Cancelado." : "No hab\xEDa nada que cancelar.", tecladoMenu);
}
__name(cancelar, "cancelar");
async function comando(c, texto4) {
  const cmd = texto4.split(/[\s@]/)[0].toLowerCase();
  switch (cmd) {
    case "/start":
      if (c.u.onboardingHecho) {
        await c.terminarFlujo();
        await c.nuevo(textoMenu(c.u), tecladoMenu);
      } else await iniciar(c);
      return true;
    case "/menu":
      await c.terminarFlujo();
      await c.nuevo(textoMenu(c.u), tecladoMenu);
      return true;
    case "/hoy":
      await c.terminarFlujo();
      await c.nuevo("\u{1F4CB} <b>Resumen de hoy</b>\n\xBFQu\xE9 quieres ver?", tecladoHoy(c.u));
      return true;
    case "/nueva":
      await c.terminarFlujo();
      await menuNueva(c);
      return true;
    case "/eventos":
      await c.terminarFlujo();
      await lista(c);
      return true;
    case "/secciones":
      await c.terminarFlujo();
      await listaSecciones(c);
      return true;
    case "/perfil":
      await c.terminarFlujo();
      await callback(c, ["p", "ver"]);
      return true;
    case "/ayuda":
    case "/help":
      await c.nuevo(textoAyuda, [[BTN_MENU]]);
      return true;
    case "/cancelar":
      await cancelar(c);
      return true;
    case "/borrar":
      await callback(c, ["p", "borrar"]);
      return true;
    default:
      return false;
  }
}
__name(comando, "comando");
async function despachar(c) {
  const cb = c.entrada.callback;
  if (cb) {
    const p = cb.datos.split(":");
    const confirmado = c.deps.canal.responderCallback(cb.id, p[0] === "sec" || p[0] === "sev" ? "\u23F3 Preparando\u2026" : void 0);
    try {
      await atenderBoton(c, p);
    } finally {
      await confirmado;
    }
    return;
  }
  await atenderTexto(c);
}
__name(despachar, "despachar");
async function atenderBoton(c, p) {
  if (!c.u.onboardingHecho && p[0] !== "o" && p[0] !== "x") {
    await iniciar(c);
    return;
  }
  switch (p[0]) {
    case "o":
      await callback3(c, p);
      return;
    case "m":
      if (p[1] === "hoy") await resumenHoy(c);
      else if (p[1] === "ayuda") await c.responder(textoAyuda, [[BTN_MENU]]);
      else {
        await c.terminarFlujo();
        await menu(c);
      }
      return;
    case "sec":
      if (p[1] === "todo") await todo(c);
      else await mostrarSeccion(c, p.slice(1).join(":"));
      return;
    case "sev":
      await mostrarSeccion(c, p.slice(1).join(":"), true);
      return;
    case "n":
    case "e":
      await callback2(c, p);
      return;
    case "s":
    case "p":
      await callback(c, p);
      return;
    case "x":
      await cancelar(c);
      return;
    default:
      return;
  }
}
__name(atenderBoton, "atenderBoton");
async function atenderTexto(c) {
  const t = c.texto;
  if (!t) return;
  if (t.startsWith("/") && await comando(c, t)) return;
  if (!c.u.onboardingHecho && !c.u.estado) {
    await iniciar(c);
    return;
  }
  if (c.u.estado && (await texto3(c) || await texto2(c) || await texto(c))) return;
  await c.nuevo("Usa el men\xFA para moverte por la agenda \u{1F447}", tecladoMenu);
}
__name(atenderTexto, "atenderTexto");
async function manejarEntrada(deps, entrada) {
  const { almacen, canal } = deps;
  const ahora = deps.ahora();
  let u = await almacen.getUsuario(entrada.chatId);
  if (entrada.bloqueado) {
    if (u) {
      u.activo = false;
      await almacen.guardarUsuario(u);
      await almacen.borrarProgramacionesDe(u.id);
    }
    return;
  }
  let reactivado = false;
  if (!u) u = usuarioNuevo(entrada.chatId, "", ahora);
  else if (entrada.updateId && entrada.updateId <= u.ultimoUpdate) return;
  if (!u.activo) {
    u.activo = true;
    reactivado = true;
  }
  u.ultimoUpdate = Math.max(u.ultimoUpdate, entrada.updateId);
  await almacen.guardarUsuario(u);
  if (reactivado && u.onboardingHecho) await sincronizarSecciones(almacen, u, ahora);
  const c = new Ctx(deps, u, entrada);
  try {
    await despachar(c);
  } catch (e) {
    console.error("error en el bot:", e.message);
    try {
      await canal.enviar(u.id, "\u26A0\uFE0F Ha ocurrido un error. Int\xE9ntalo de nuevo o escribe /menu.", [[BTN_MENU]]);
    } catch {
    }
  }
}
__name(manejarEntrada, "manejarEntrada");

// ../firebase/functions/src/telegram.ts
var ErrorTelegram = class extends Error {
  constructor(mensaje, codigo) {
    super(mensaje);
    this.codigo = codigo;
  }
  codigo;
  static {
    __name(this, "ErrorTelegram");
  }
  /**
   * El usuario ha bloqueado el bot, ha borrado su cuenta o lo ha expulsado. Telegram lo dice en la descripción del 403
   * («Forbidden: bot was blocked by the user», «user is deactivated»…); un 403 sin eso (un proxy, un cortafuegos) no cuenta.
   */
  get bloqueado() {
    return this.codigo === 403 && /blocked|deactivated|kicked|initiate|not a member|chat not found/i.test(this.message);
  }
};
function aMarkup(teclado) {
  if (!teclado || teclado.length === 0) return void 0;
  return {
    inline_keyboard: teclado.map((fila) => fila.map((b) => b.url ? { text: b.texto, url: b.url } : { text: b.texto, callback_data: b.datos ?? "noop" }))
  };
}
__name(aMarkup, "aMarkup");
var CanalTelegram = class {
  constructor(token, http) {
    this.token = token;
    this.http = http;
  }
  token;
  http;
  static {
    __name(this, "CanalTelegram");
  }
  async llamar(metodo, cuerpo) {
    try {
      const r = await this.http.post(`https://api.telegram.org/bot${this.token}/${metodo}`, cuerpo, { timeout: 2e4 });
      return r.data;
    } catch (e) {
      const resp = e.response;
      throw new ErrorTelegram(resp?.data?.description ?? e.message, resp?.status);
    }
  }
  async enviar(chatId, html, teclado) {
    const partes = trocear(html);
    for (let i = 0; i < partes.length; i++) {
      await this.llamar("sendMessage", {
        chat_id: chatId,
        text: partes[i],
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: i === partes.length - 1 ? aMarkup(teclado) : void 0
      });
    }
  }
  async editar(chatId, mensajeId, html, teclado) {
    if (html.length > 3900) return this.enviar(chatId, html, teclado);
    try {
      await this.llamar("editMessageText", {
        chat_id: chatId,
        message_id: mensajeId,
        text: html,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: aMarkup(teclado) ?? { inline_keyboard: [] }
      });
    } catch (e) {
      if (e instanceof ErrorTelegram && /not modified/i.test(e.message)) return;
      if (e instanceof ErrorTelegram && e.bloqueado) throw e;
      await this.enviar(chatId, html, teclado);
    }
  }
  async responderCallback(callbackId, texto4) {
    try {
      await this.llamar("answerCallbackQuery", { callback_query_id: callbackId, text: texto4 });
    } catch {
    }
  }
};
function leerActualizacion(u) {
  if (!u || typeof u.update_id !== "number") return null;
  const bloqueo = u.my_chat_member;
  if (bloqueo && bloqueo.chat?.type === "private" && ["kicked", "left"].includes(bloqueo.new_chat_member?.status)) {
    return { chatId: String(bloqueo.chat.id), nombre: "", updateId: u.update_id, bloqueado: true };
  }
  if (u.callback_query) {
    const c = u.callback_query;
    const chat = c.message?.chat;
    if (!chat || chat.type !== "private" || typeof c.data !== "string") return null;
    return {
      chatId: String(chat.id),
      nombre: c.from?.first_name ?? "",
      updateId: u.update_id,
      callback: { id: String(c.id), datos: c.data, mensajeId: c.message.message_id }
    };
  }
  const m = u.message;
  if (m && m.chat?.type === "private" && typeof m.text === "string") {
    return { chatId: String(m.chat.id), nombre: m.from?.first_name ?? "", updateId: u.update_id, texto: m.text };
  }
  return null;
}
__name(leerActualizacion, "leerActualizacion");

// ../firebase/functions/src/scheduler.ts
var MAX_SECCION_RETRASO = 3 * 36e5;
var MAX_EVENTO_RETRASO = 24 * 36e5;
var CONCESION_MS = 10 * 6e4;
var REINTENTO_SECCION_MS = 10 * 6e4;
var MAX_INTENTOS_SECCION = 3;
var REINTENTO_EVENTO_MS = 2 * 6e4;
var MAX_INTENTOS_EVENTO = 5;
function configSeccion(u, ref2) {
  return ref2.startsWith("tema:") ? u.temas.find((t) => `tema:${t.id}` === ref2) : u.secciones[ref2];
}
__name(configSeccion, "configSeccion");
async function bloquear(dep, u) {
  u.activo = false;
  await dep.almacen.guardarUsuario(u);
  await dep.almacen.borrarProgramacionesDe(u.id);
}
__name(bloquear, "bloquear");
async function enviarSeccion(dep, u, p, ahora, r) {
  const cfg = configSeccion(u, p.ref);
  if (!cfg || !cfg.activa) {
    await dep.almacen.borrarProgramacion(p.id);
    return;
  }
  const siguiente = proximaOcurrencia(cfg.hora, u.zona, ahora);
  const tarde = ahora.getTime() - p.proximo.getTime() > MAX_SECCION_RETRASO;
  if (!await dep.almacen.reclamarProgramacion(p.id, p.proximo, tarde ? siguiente : new Date(ahora.getTime() + CONCESION_MS))) {
    r.omitidos++;
    return;
  }
  if (tarde) {
    r.omitidos++;
    return;
  }
  try {
    const cont = await construirContenido(p.ref, { usuario: u, http: dep.http, almacen: dep.almacen, ahora });
    await dep.canal.enviar(u.id, cont.html, cont.teclado);
    await dep.almacen.guardarProgramacion({ ...p, proximo: siguiente, intentos: 0 });
    r.enviados++;
  } catch (e) {
    if (e instanceof ErrorTelegram && e.bloqueado) {
      await bloquear(dep, u);
      r.fallidos++;
      return;
    }
    r.fallidos++;
    dep.log?.(`\u2717 ${u.id} ${p.ref}: ${e.message}`);
    const n = (p.intentos ?? 0) + 1;
    if (n <= MAX_INTENTOS_SECCION) await dep.almacen.guardarProgramacion({ ...p, proximo: new Date(ahora.getTime() + REINTENTO_SECCION_MS), intentos: n });
    else await dep.almacen.guardarProgramacion({ ...p, proximo: siguiente, intentos: 0 });
  }
}
__name(enviarSeccion, "enviarSeccion");
async function enviarEvento(dep, u, p, ahora, r) {
  const ev = await dep.almacen.getEvento(u.id, p.ref);
  if (!ev || ev.hecho) {
    await dep.almacen.borrarProgramacion(p.id);
    return;
  }
  const retraso = ahora.getTime() - p.proximo.getTime();
  let nuevoEvento = null;
  let siguiente = new Date(ahora.getTime() + 24 * 36e5);
  if (!p.posponer && ev.repeticion !== "ninguna") {
    let f = ev.fechaHora;
    let guarda = 0;
    do {
      f = f ? siguienteRepeticion(f, ev.repeticion, u.zona) : null;
    } while (f && momentoAviso({ ...ev, fechaHora: f }).getTime() <= ahora.getTime() && guarda++ < 800);
    if (!f) {
      await dep.almacen.borrarProgramacion(p.id);
      return;
    }
    nuevoEvento = { ...ev, fechaHora: f, avisado: false };
    siguiente = momentoAviso(nuevoEvento);
  }
  if (!await dep.almacen.reclamarProgramacion(p.id, p.proximo, retraso > MAX_EVENTO_RETRASO ? siguiente : new Date(ahora.getTime() + CONCESION_MS))) {
    r.omitidos++;
    return;
  }
  if (retraso > MAX_EVENTO_RETRASO) {
    r.omitidos++;
  } else {
    try {
      const { html, teclado } = mensajeAviso(ev, u.zona, ahora, retraso > 10 * 6e4);
      await dep.canal.enviar(u.id, html, teclado);
      r.enviados++;
    } catch (e) {
      if (e instanceof ErrorTelegram && e.bloqueado) {
        await bloquear(dep, u);
        r.fallidos++;
        return;
      }
      r.fallidos++;
      dep.log?.(`\u2717 ${u.id} evento ${ev.id}: ${e.message}`);
      const n = (p.intentos ?? 0) + 1;
      if (n <= MAX_INTENTOS_EVENTO) {
        await dep.almacen.guardarProgramacion({ ...p, proximo: new Date(ahora.getTime() + REINTENTO_EVENTO_MS), intentos: n });
        return;
      }
    }
  }
  if (nuevoEvento) {
    await dep.almacen.guardarEvento(nuevoEvento);
    await dep.almacen.guardarProgramacion({ ...p, proximo: siguiente, intentos: 0 });
    return;
  }
  await dep.almacen.borrarProgramacion(p.id);
  if (!p.posponer) await dep.almacen.guardarEvento({ ...ev, avisado: true });
}
__name(enviarEvento, "enviarEvento");
async function procesarProgramacion(dep, p) {
  const ahora = dep.ahora();
  const r = { enviados: 0, omitidos: 0, fallidos: 0 };
  try {
    const u = await dep.almacen.getUsuario(p.uid);
    if (!u || !u.activo) {
      await dep.almacen.borrarProgramacion(p.id);
      return r;
    }
    if (p.tipo === "seccion") await enviarSeccion(dep, u, p, ahora, r);
    else await enviarEvento(dep, u, p, ahora, r);
  } catch (e) {
    r.fallidos++;
    dep.log?.(`\u2717 programaci\xF3n ${p.id}: ${e.message}`);
  }
  return r;
}
__name(procesarProgramacion, "procesarProgramacion");
var sumar = /* @__PURE__ */ __name((a, b) => ({ enviados: a.enviados + b.enviados, omitidos: a.omitidos + b.omitidos, fallidos: a.fallidos + b.fallidos }), "sumar");

// ../firebase/functions/src/webhook.ts
import { timingSafeEqual } from "node:crypto";
function iguales(a, b) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}
__name(iguales, "iguales");
async function procesarWebhook(deps, secreto, p, log3 = () => void 0) {
  if (p.metodo !== "POST") return { estado: 405, texto: "method not allowed" };
  if (!iguales(p.cabeceraSecreta ?? "", secreto)) return { estado: 403, texto: "forbidden" };
  try {
    const entrada = leerActualizacion(p.cuerpo);
    if (entrada) await manejarEntrada(deps, entrada);
  } catch (e) {
    log3(`webhook: ${e.message}`);
  }
  return { estado: 200, texto: "ok" };
}
__name(procesarWebhook, "procesarWebhook");

// src/app.ts
var fabricaReal = /* @__PURE__ */ __name((env2) => {
  const http = new HttpFetch();
  return { canal: new CanalTelegram(env2.TELEGRAM_BOT_TOKEN, http), http, restantes: /* @__PURE__ */ __name(() => http.restantes, "restantes") };
}, "fabricaReal");
var ZONA = "Europe/Madrid";
var CRON_HOROSCOPO = "*/10 4-10 * * *";
var MAX_PROGRAMACIONES = 20;
var SIMULTANEAS = 5;
var MARGEN_PETICIONES = 22;
var RUTA_SECCION = "/interno/seccion";
var RUTA_PROGRAMACION = "/interno/programacion";
async function llamarInterno(env2, ruta, cuerpo) {
  if (!env2.SELF) return null;
  try {
    const r = await env2.SELF.fetch(new Request(`https://interno${ruta}`, {
      method: "POST",
      headers: { "x-interno": env2.TELEGRAM_WEBHOOK_SECRET, "content-type": "application/json" },
      body: JSON.stringify(cuerpo)
    }));
    return r.ok ? await r.json().catch(() => ({})) : null;
  } catch {
    return null;
  }
}
__name(llamarInterno, "llamarInterno");
function dependencias(env2, s, delegar2) {
  return {
    almacen: new AlmacenD1(env2.DB),
    canal: s.canal,
    http: s.http,
    ahora: /* @__PURE__ */ __name(() => /* @__PURE__ */ new Date(), "ahora"),
    delegarSeccion: delegar2 && env2.SELF ? async (p) => await llamarInterno(env2, RUTA_SECCION, p) !== null : void 0
  };
}
__name(dependencias, "dependencias");
var aJson = /* @__PURE__ */ __name((p, ahora) => ({ ...p, proximo: p.proximo.getTime(), ahora: ahora.getTime() }), "aJson");
var deJson = /* @__PURE__ */ __name((j) => ({ ...j, proximo: new Date(j.proximo) }), "deJson");
async function manejarInterno(req, env2, ruta, fabrica) {
  if (req.method !== "POST" || !iguales(req.headers.get("x-interno") ?? "", env2.TELEGRAM_WEBHOOK_SECRET)) return new Response("forbidden", { status: 403 });
  const cuerpo = await req.json().catch(() => null);
  if (!cuerpo) return new Response("bad request", { status: 400 });
  const s = fabrica(env2);
  const dep = dependencias(env2, s, false);
  if (ruta === RUTA_SECCION) {
    const u = await dep.almacen.getUsuario(String(cuerpo.uid));
    if (u && u.activo) await enviarSeccionDirecta(dep, u, String(cuerpo.ref), typeof cuerpo.editar === "number" ? cuerpo.editar : void 0);
    return Response.json({ ok: true });
  }
  if (ruta === RUTA_PROGRAMACION) {
    const instante = typeof cuerpo.ahora === "number" ? cuerpo.ahora : Date.now();
    const r = await procesarProgramacion({ ...dep, ahora: /* @__PURE__ */ __name(() => new Date(instante), "ahora"), log: /* @__PURE__ */ __name((m) => console.warn(m), "log") }, deJson(cuerpo));
    return Response.json(r);
  }
  return new Response("not found", { status: 404 });
}
__name(manejarInterno, "manejarInterno");
async function manejarFetch(req, env2, ctx, fabrica = fabricaReal) {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/interno/")) return manejarInterno(req, env2, url.pathname, fabrica);
  if (url.pathname !== "/telegram") return new Response(url.pathname === "/" ? "agenda-personal" : "not found", { status: url.pathname === "/" ? 200 : 404 });
  const cuerpo = await req.json().catch(() => null);
  const cabeceraSecreta = req.headers.get("x-telegram-bot-api-secret-token") ?? void 0;
  const valido = req.method === "POST" && iguales(cabeceraSecreta ?? "", env2.TELEGRAM_WEBHOOK_SECRET);
  const trabajo = procesarWebhook(dependencias(env2, fabrica(env2), true), env2.TELEGRAM_WEBHOOK_SECRET, { metodo: req.method, cabeceraSecreta, cuerpo }, (m) => console.error(m));
  if (valido && ctx) {
    ctx.waitUntil(trabajo.catch((e) => console.error(`webhook: ${e.message}`)));
    return new Response("ok", { status: 200 });
  }
  const r = await trabajo;
  return new Response(r.texto, { status: r.estado });
}
__name(manejarFetch, "manejarFetch");
async function enParalelo(tareas, n) {
  const res = new Array(tareas.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, tareas.length) }, async () => {
    while (i < tareas.length) {
      const k = i++;
      res[k] = await tareas[k]();
    }
  }));
  return res;
}
__name(enParalelo, "enParalelo");
async function manejarTick(env2, ahora = () => /* @__PURE__ */ new Date(), fabrica = fabricaReal) {
  const s = fabrica(env2);
  const dep = { ...dependencias(env2, s, false), ahora, log: /* @__PURE__ */ __name((m) => console.warn(m), "log") };
  let total = { enviados: 0, omitidos: 0, fallidos: 0 };
  const vencidas = await dep.almacen.programacionesVencidas(ahora(), MAX_PROGRAMACIONES);
  if (env2.SELF) {
    const respuestas = await enParalelo(vencidas.map((p) => () => llamarInterno(env2, RUTA_PROGRAMACION, aJson(p, ahora()))), SIMULTANEAS);
    for (const r of respuestas) total = sumar(total, r ?? { enviados: 0, omitidos: 0, fallidos: 1 });
  } else {
    for (const p of vencidas) {
      if ((s.restantes?.() ?? Infinity) < MARGEN_PETICIONES) break;
      total = sumar(total, await procesarProgramacion(dep, p));
    }
  }
  const t = ahora();
  if (t.getUTCHours() === 3 && t.getUTCMinutes() === 0) await dep.almacen.limpiarCache(t);
  if (total.enviados || total.fallidos) console.info("tick", total);
  return total;
}
__name(manejarTick, "manejarTick");
async function manejarHoroscopo(env2, ahora = /* @__PURE__ */ new Date()) {
  const http = new HttpFetch();
  const almacen = new AlmacenD1(env2.DB);
  const r = await actualizarTodos({
    http,
    config: { baseUrl: env2.HOROSCOPO_BASE_URL ?? "https://horoscopefree.fly.dev", idioma: env2.HOROSCOPO_IDIOMA ?? "es" },
    zona: ZONA,
    ahora,
    guardar: /* @__PURE__ */ __name((id, doc) => almacen.guardarHoroscopo(id, doc), "guardar"),
    fechaGuardada: /* @__PURE__ */ __name(async (id) => (await almacen.getHoroscopo(id))?.fecha, "fechaGuardada"),
    log: /* @__PURE__ */ __name((m) => console.info(m), "log"),
    intentos: 2,
    esperaMs: 500,
    maxPedidos: 4
    // 4 signos por ejecución: así no se pasa del límite de peticiones; el cron se repite cada 10 min
  });
  if (r.actualizados.length || r.fallidos.length) console.info("hor\xF3scopo", r);
  return r;
}
__name(manejarHoroscopo, "manejarHoroscopo");

// src/worker.ts
var worker_default = {
  fetch: /* @__PURE__ */ __name((req, env2, ctx) => manejarFetch(req, env2, ctx), "fetch"),
  async scheduled(evento, env2) {
    if (evento.cron === CRON_HOROSCOPO) await manejarHoroscopo(env2);
    else await manejarTick(env2);
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
