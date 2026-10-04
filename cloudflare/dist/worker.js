var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
var init_utils = __esm({
  "node_modules/unenv/dist/runtime/_internal/utils.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    __name(createNotImplementedError, "createNotImplementedError");
    __name(notImplemented, "notImplemented");
    __name(notImplementedClass, "notImplementedClass");
  }
});

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin, _performanceNow, nodeTiming, PerformanceEntry, PerformanceMark, PerformanceMeasure, PerformanceResourceTiming, PerformanceObserverEntryList, Performance, PerformanceObserver, performance;
var init_performance = __esm({
  "node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_utils();
    _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
    _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
    nodeTiming = {
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
    PerformanceEntry = class {
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
    PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
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
    PerformanceMeasure = class extends PerformanceEntry {
      static {
        __name(this, "PerformanceMeasure");
      }
      entryType = "measure";
    };
    PerformanceResourceTiming = class extends PerformanceEntry {
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
    PerformanceObserverEntryList = class {
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
    Performance = class {
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
    PerformanceObserver = class {
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
    performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();
  }
});

// node_modules/unenv/dist/runtime/node/perf_hooks.mjs
var init_perf_hooks = __esm({
  "node_modules/unenv/dist/runtime/node/perf_hooks.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_performance();
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
var init_performance2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs"() {
    init_perf_hooks();
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
  }
});

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default;
var init_noop = __esm({
  "node_modules/unenv/dist/runtime/mock/noop.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    noop_default = Object.assign(() => {
    }, { __unenv__: true });
  }
});

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";
var _console, _ignoreErrors, _stderr, _stdout, log, info, trace, debug, table, error, warn, createTask, clear, count, countReset, dir, dirxml, group, groupEnd, groupCollapsed, profile, profileEnd, time, timeEnd, timeLog, timeStamp, Console, _times, _stdoutErrorHandler, _stderrErrorHandler;
var init_console = __esm({
  "node_modules/unenv/dist/runtime/node/console.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_noop();
    init_utils();
    _console = globalThis.console;
    _ignoreErrors = true;
    _stderr = new Writable();
    _stdout = new Writable();
    log = _console?.log ?? noop_default;
    info = _console?.info ?? log;
    trace = _console?.trace ?? info;
    debug = _console?.debug ?? log;
    table = _console?.table ?? log;
    error = _console?.error ?? log;
    warn = _console?.warn ?? error;
    createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
    clear = _console?.clear ?? noop_default;
    count = _console?.count ?? noop_default;
    countReset = _console?.countReset ?? noop_default;
    dir = _console?.dir ?? noop_default;
    dirxml = _console?.dirxml ?? noop_default;
    group = _console?.group ?? noop_default;
    groupEnd = _console?.groupEnd ?? noop_default;
    groupCollapsed = _console?.groupCollapsed ?? noop_default;
    profile = _console?.profile ?? noop_default;
    profileEnd = _console?.profileEnd ?? noop_default;
    time = _console?.time ?? noop_default;
    timeEnd = _console?.timeEnd ?? noop_default;
    timeLog = _console?.timeLog ?? noop_default;
    timeStamp = _console?.timeStamp ?? noop_default;
    Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
    _times = /* @__PURE__ */ new Map();
    _stdoutErrorHandler = noop_default;
    _stderrErrorHandler = noop_default;
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole, assert, clear2, context, count2, countReset2, createTask2, debug2, dir2, dirxml2, error2, group2, groupCollapsed2, groupEnd2, info2, log2, profile2, profileEnd2, table2, time2, timeEnd2, timeLog2, timeStamp2, trace2, warn2, console_default;
var init_console2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_console();
    workerdConsole = globalThis["console"];
    ({
      assert,
      clear: clear2,
      context: (
        // @ts-expect-error undocumented public API
        context
      ),
      count: count2,
      countReset: countReset2,
      createTask: (
        // @ts-expect-error undocumented public API
        createTask2
      ),
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
    } = workerdConsole);
    Object.assign(workerdConsole, {
      Console,
      _ignoreErrors,
      _stderr,
      _stderrErrorHandler,
      _stdout,
      _stdoutErrorHandler,
      _times
    });
    console_default = workerdConsole;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console"() {
    init_console2();
    globalThis.console = console_default;
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime;
var init_hrtime = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
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
  }
});

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream;
var init_read_stream = __esm({
  "node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    ReadStream = class {
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
  }
});

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream;
var init_write_stream = __esm({
  "node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    WriteStream = class {
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
  }
});

// node_modules/unenv/dist/runtime/node/tty.mjs
var init_tty = __esm({
  "node_modules/unenv/dist/runtime/node/tty.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_read_stream();
    init_write_stream();
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION;
var init_node_version = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    NODE_VERSION = "22.14.0";
  }
});

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";
var Process;
var init_process = __esm({
  "node_modules/unenv/dist/runtime/node/internal/process/process.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_tty();
    init_utils();
    init_node_version();
    Process = class _Process extends EventEmitter {
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
  }
});

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess, getBuiltinModule, workerdProcess, unenvProcess, exit, features, platform, _channel, _debugEnd, _debugProcess, _disconnect, _events, _eventsCount, _exiting, _fatalException, _getActiveHandles, _getActiveRequests, _handleQueue, _kill, _linkedBinding, _maxListeners, _pendingMessage, _preload_modules, _rawDebug, _send, _startProfilerIdleNotifier, _stopProfilerIdleNotifier, _tickCallback, abort, addListener, allowedNodeEnvironmentFlags, arch, argv, argv0, assert2, availableMemory, binding, channel, chdir, config, connected, constrainedMemory, cpuUsage, cwd, debugPort, disconnect, dlopen, domain, emit, emitWarning, env, eventNames, execArgv, execPath, exitCode, finalization, getActiveResourcesInfo, getegid, geteuid, getgid, getgroups, getMaxListeners, getuid, hasUncaughtExceptionCaptureCallback, hrtime3, initgroups, kill, listenerCount, listeners, loadEnvFile, mainModule, memoryUsage, moduleLoadList, nextTick, off, on, once, openStdin, permission, pid, ppid, prependListener, prependOnceListener, rawListeners, reallyExit, ref, release, removeAllListeners, removeListener, report, resourceUsage, send, setegid, seteuid, setgid, setgroups, setMaxListeners, setSourceMapsEnabled, setuid, setUncaughtExceptionCaptureCallback, sourceMapsEnabled, stderr, stdin, stdout, throwDeprecation, title, traceDeprecation, umask, unref, uptime, version, versions, _process, process_default;
var init_process2 = __esm({
  "node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs"() {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    init_hrtime();
    init_process();
    globalProcess = globalThis["process"];
    getBuiltinModule = globalProcess.getBuiltinModule;
    workerdProcess = getBuiltinModule("node:process");
    unenvProcess = new Process({
      env: globalProcess.env,
      hrtime,
      // `nextTick` is available from workerd process v1
      nextTick: workerdProcess.nextTick
    });
    ({ exit, features, platform } = workerdProcess);
    ({
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
    } = unenvProcess);
    _process = {
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
    process_default = _process;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
var init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process"() {
    init_process2();
    globalThis.process = process_default;
  }
});

// node_modules/fast-xml-parser/lib/fxp.cjs
var require_fxp = __commonJS({
  "node_modules/fast-xml-parser/lib/fxp.cjs"(exports, module) {
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
    init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
    init_performance2();
    (() => {
      "use strict";
      var t = { d: /* @__PURE__ */ __name((e2, i2) => {
        for (var n2 in i2) t.o(i2, n2) && !t.o(e2, n2) && Object.defineProperty(e2, n2, { enumerable: true, get: i2[n2] });
      }, "d"), o: /* @__PURE__ */ __name((t2, e2) => Object.prototype.hasOwnProperty.call(t2, e2), "o"), r: /* @__PURE__ */ __name((t2) => {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t2, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(t2, "__esModule", { value: true });
      }, "r") }, e = {};
      t.r(e), t.d(e, { XMLBuilder: /* @__PURE__ */ __name(() => $e, "XMLBuilder"), XMLParser: /* @__PURE__ */ __name(() => ie, "XMLParser"), XMLValidator: /* @__PURE__ */ __name(() => Pe, "XMLValidator") });
      const i = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD", n = new RegExp("^[" + i + "][" + i + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), r = /* @__PURE__ */ __name(function(t2) {
        return !(null == n.exec(t2));
      }, "r"), s = ["hasOwnProperty", "toString", "valueOf", "__defineGetter__", "__defineSetter__", "__lookupGetter__", "__lookupSetter__"], o = ["__proto__", "constructor", "prototype"], a = { allowBooleanAttributes: false, unpairedTags: [] };
      function l(t2, e2) {
        e2 = Object.assign({}, a, e2);
        const i2 = [];
        let n2 = false, r2 = false;
        "\uFEFF" === t2[0] && (t2 = t2.substr(1));
        for (let s2 = 0; s2 < t2.length; s2++) if ("<" === t2[s2] && "?" === t2[s2 + 1]) {
          if (s2 += 2, s2 = c(t2, s2), s2.err) return s2;
        } else {
          if ("<" !== t2[s2]) {
            if (p(t2[s2])) continue;
            return x("InvalidChar", "char '" + t2[s2] + "' is not expected.", N(t2, s2));
          }
          {
            let o2 = s2;
            if (s2++, "!" === t2[s2]) {
              s2 = h(t2, s2);
              continue;
            }
            {
              let a2 = false;
              "/" === t2[s2] && (a2 = true, s2++);
              let l2 = "";
              for (; s2 < t2.length && ">" !== t2[s2] && " " !== t2[s2] && "	" !== t2[s2] && "\n" !== t2[s2] && "\r" !== t2[s2]; s2++) l2 += t2[s2];
              if (l2 = l2.trim(), "/" === l2[l2.length - 1] && (l2 = l2.substring(0, l2.length - 1), s2--), !y(l2)) {
                let e3;
                return e3 = 0 === l2.trim().length ? "Invalid space after '<'." : "Tag '" + l2 + "' is an invalid name.", x("InvalidTag", e3, N(t2, s2));
              }
              const d2 = f(t2, s2);
              if (false === d2) return x("InvalidAttr", "Attributes for '" + l2 + "' have open quote.", N(t2, s2));
              let u2 = d2.value;
              if (s2 = d2.index, "/" === u2[u2.length - 1]) {
                const i3 = s2 - u2.length;
                u2 = u2.substring(0, u2.length - 1);
                const r3 = g(u2, e2);
                if (true !== r3) return x(r3.err.code, r3.err.msg, N(t2, i3 + r3.err.line));
                n2 = true;
              } else if (a2) {
                if (!d2.tagClosed) return x("InvalidTag", "Closing tag '" + l2 + "' doesn't have proper closing.", N(t2, s2));
                if (u2.trim().length > 0) return x("InvalidTag", "Closing tag '" + l2 + "' can't have attributes or invalid starting.", N(t2, o2));
                if (0 === i2.length) return x("InvalidTag", "Closing tag '" + l2 + "' has not been opened.", N(t2, o2));
                {
                  const e3 = i2.pop();
                  if (l2 !== e3.tagName) {
                    let i3 = N(t2, e3.tagStartPos);
                    return x("InvalidTag", "Expected closing tag '" + e3.tagName + "' (opened in line " + i3.line + ", col " + i3.col + ") instead of closing tag '" + l2 + "'.", N(t2, o2));
                  }
                  0 == i2.length && (r2 = true);
                }
              } else {
                const a3 = g(u2, e2);
                if (true !== a3) return x(a3.err.code, a3.err.msg, N(t2, s2 - u2.length + a3.err.line));
                if (true === r2) return x("InvalidXml", "Multiple possible root nodes found.", N(t2, s2));
                -1 !== e2.unpairedTags.indexOf(l2) || i2.push({ tagName: l2, tagStartPos: o2 }), n2 = true;
              }
              for (s2++; s2 < t2.length; s2++) if ("<" === t2[s2]) {
                if ("!" === t2[s2 + 1]) {
                  s2++, s2 = h(t2, s2);
                  continue;
                }
                if ("?" !== t2[s2 + 1]) break;
                if (s2 = c(t2, ++s2), s2.err) return s2;
              } else if ("&" === t2[s2]) {
                const e3 = m(t2, s2);
                if (-1 == e3) return x("InvalidChar", "char '&' is not expected.", N(t2, s2));
                s2 = e3;
              } else if (true === r2 && !p(t2[s2])) return x("InvalidXml", "Extra text at the end", N(t2, s2));
              "<" === t2[s2] && s2--;
            }
          }
        }
        return n2 ? 1 == i2.length ? x("InvalidTag", "Unclosed tag '" + i2[0].tagName + "'.", N(t2, i2[0].tagStartPos)) : !(i2.length > 0) || x("InvalidXml", "Invalid '" + JSON.stringify(i2.map((t3) => t3.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 }) : x("InvalidXml", "Start tag expected.", 1);
      }
      __name(l, "l");
      function p(t2) {
        return " " === t2 || "	" === t2 || "\n" === t2 || "\r" === t2;
      }
      __name(p, "p");
      function c(t2, e2) {
        const i2 = e2;
        for (; e2 < t2.length; e2++) if ("?" == t2[e2] || " " == t2[e2]) {
          const n2 = t2.substr(i2, e2 - i2);
          if (e2 > 5 && "xml" === n2) return x("InvalidXml", "XML declaration allowed only at the start of the document.", N(t2, e2));
          if ("?" == t2[e2] && ">" == t2[e2 + 1]) {
            e2++;
            break;
          }
          continue;
        }
        return e2;
      }
      __name(c, "c");
      function h(t2, e2) {
        if (t2.length > e2 + 5 && "-" === t2[e2 + 1] && "-" === t2[e2 + 2]) {
          for (e2 += 3; e2 < t2.length; e2++) if ("-" === t2[e2] && "-" === t2[e2 + 1] && ">" === t2[e2 + 2]) {
            e2 += 2;
            break;
          }
        } else if (t2.length > e2 + 8 && "D" === t2[e2 + 1] && "O" === t2[e2 + 2] && "C" === t2[e2 + 3] && "T" === t2[e2 + 4] && "Y" === t2[e2 + 5] && "P" === t2[e2 + 6] && "E" === t2[e2 + 7]) {
          let i2 = 1;
          for (e2 += 8; e2 < t2.length; e2++) if ("<" === t2[e2]) i2++;
          else if (">" === t2[e2] && (i2--, 0 === i2)) break;
        } else if (t2.length > e2 + 9 && "[" === t2[e2 + 1] && "C" === t2[e2 + 2] && "D" === t2[e2 + 3] && "A" === t2[e2 + 4] && "T" === t2[e2 + 5] && "A" === t2[e2 + 6] && "[" === t2[e2 + 7]) {
          for (e2 += 8; e2 < t2.length; e2++) if ("]" === t2[e2] && "]" === t2[e2 + 1] && ">" === t2[e2 + 2]) {
            e2 += 2;
            break;
          }
        }
        return e2;
      }
      __name(h, "h");
      const d = '"', u = "'";
      function f(t2, e2) {
        let i2 = "", n2 = "", r2 = false;
        for (; e2 < t2.length; e2++) {
          if (t2[e2] === d || t2[e2] === u) "" === n2 ? n2 = t2[e2] : n2 !== t2[e2] || (n2 = "");
          else if (">" === t2[e2] && "" === n2) {
            r2 = true;
            break;
          }
          i2 += t2[e2];
        }
        return "" === n2 && { value: i2, index: e2, tagClosed: r2 };
      }
      __name(f, "f");
      function g(t2, e2) {
        const i2 = (function(t3) {
          const e3 = [], i3 = t3.length;
          let n3 = 0;
          for (; n3 < i3; ) {
            const r2 = n3;
            for (; n3 < i3 && p(t3[n3]); ) n3++;
            if (n3 >= i3) break;
            if ("=" === t3[n3]) {
              n3 = r2 + 1;
              continue;
            }
            const s2 = t3.slice(r2, n3), o2 = n3;
            for (; n3 < i3 && !p(t3[n3]) && "=" !== t3[n3]; ) n3++;
            const a2 = t3.slice(o2, n3);
            let l2, c2, h2, d2 = n3;
            for (; d2 < i3 && p(t3[d2]); ) d2++;
            d2 < i3 && "=" === t3[d2] && (l2 = t3.slice(n3, d2 + 1), n3 = d2 + 1);
            let u2 = n3;
            for (; u2 < i3 && p(t3[u2]); ) u2++;
            if (u2 < i3 && ('"' === t3[u2] || "'" === t3[u2])) {
              const e4 = u2 + 1, i4 = t3.indexOf(t3[u2], e4);
              -1 !== i4 && (c2 = t3[u2], h2 = t3.slice(e4, i4), n3 = i4 + 1);
            }
            const f2 = { startIndex: r2 };
            f2[1] = s2, f2[2] = a2, f2[3] = l2, f2[4] = void 0 !== c2 || void 0, f2[5] = c2, f2[6] = h2, e3.push(f2);
          }
          return e3;
        })(t2), n2 = {};
        for (let t3 = 0; t3 < i2.length; t3++) {
          if (0 === i2[t3][1].length) return x("InvalidAttr", "Attribute '" + i2[t3][2] + "' has no space in starting.", E(i2[t3]));
          if (void 0 !== i2[t3][3] && void 0 === i2[t3][4]) return x("InvalidAttr", "Attribute '" + i2[t3][2] + "' is without value.", E(i2[t3]));
          if (void 0 === i2[t3][3] && !e2.allowBooleanAttributes) return x("InvalidAttr", "boolean attribute '" + i2[t3][2] + "' is not allowed.", E(i2[t3]));
          const r2 = i2[t3][2];
          if (!b(r2)) return x("InvalidAttr", "Attribute '" + r2 + "' is an invalid name.", E(i2[t3]));
          if (Object.prototype.hasOwnProperty.call(n2, r2)) return x("InvalidAttr", "Attribute '" + r2 + "' is repeated.", E(i2[t3]));
          n2[r2] = 1;
        }
        return true;
      }
      __name(g, "g");
      function m(t2, e2) {
        if (";" === t2[++e2]) return -1;
        if ("#" === t2[e2]) return (function(t3, e3) {
          let i3 = /\d/;
          for ("x" === t3[e3] && (e3++, i3 = /[\da-fA-F]/); e3 < t3.length; e3++) {
            if (";" === t3[e3]) return e3;
            if (!t3[e3].match(i3)) break;
          }
          return -1;
        })(t2, ++e2);
        let i2 = 0;
        for (; e2 < t2.length; e2++, i2++) if (!(t2[e2].match(/\w/) && i2 < 20)) {
          if (";" === t2[e2]) break;
          return -1;
        }
        return e2;
      }
      __name(m, "m");
      function x(t2, e2, i2) {
        return { err: { code: t2, msg: e2, line: i2.line || i2, col: i2.col } };
      }
      __name(x, "x");
      function b(t2) {
        return r(t2);
      }
      __name(b, "b");
      function y(t2) {
        return r(t2);
      }
      __name(y, "y");
      function N(t2, e2) {
        const i2 = t2.substring(0, e2).split(/\r?\n/);
        return { line: i2.length, col: i2[i2.length - 1].length + 1 };
      }
      __name(N, "N");
      function E(t2) {
        return t2.startIndex + t2[1].length;
      }
      __name(E, "E");
      const w = /* @__PURE__ */ __name((t2) => s.includes(t2) ? "__" + t2 : t2, "w"), v = { preserveOrder: false, attributeNamePrefix: "@_", attributesGroupName: false, textNodeName: "#text", ignoreAttributes: true, removeNSPrefix: false, allowBooleanAttributes: false, parseTagValue: true, parseAttributeValue: false, trimValues: true, cdataPropName: false, numberParseOptions: { hex: true, leadingZeros: true, eNotation: true, unicode: false }, tagValueProcessor: /* @__PURE__ */ __name(function(t2, e2) {
        return e2;
      }, "tagValueProcessor"), attributeValueProcessor: /* @__PURE__ */ __name(function(t2, e2) {
        return e2;
      }, "attributeValueProcessor"), stopNodes: [], alwaysCreateTextNode: false, isArray: /* @__PURE__ */ __name(() => false, "isArray"), commentPropName: false, unpairedTags: [], processEntities: true, htmlEntities: false, entityDecoder: null, ignoreDeclaration: false, ignorePiTags: false, transformTagName: false, transformAttributeName: false, updateTag: /* @__PURE__ */ __name(function(t2, e2, i2) {
        return t2;
      }, "updateTag"), captureMetaData: false, maxNestedTags: 100, strictReservedNames: true, jPath: true, onDangerousProperty: w };
      function S(t2, e2) {
        if ("string" != typeof t2) return;
        const i2 = t2.toLowerCase();
        if (s.some((t3) => i2 === t3.toLowerCase())) throw new Error(`[SECURITY] Invalid ${e2}: "${t2}" is a reserved JavaScript keyword that could cause prototype pollution`);
        if (o.some((t3) => i2 === t3.toLowerCase())) throw new Error(`[SECURITY] Invalid ${e2}: "${t2}" is a reserved JavaScript keyword that could cause prototype pollution`);
      }
      __name(S, "S");
      function A(t2, e2) {
        return "boolean" == typeof t2 ? { enabled: t2, maxEntitySize: 1e4, maxExpansionDepth: 1e4, maxTotalExpansions: 1 / 0, maxExpandedLength: 1e5, maxEntityCount: 1e3, allowedTags: null, tagFilter: null, appliesTo: "all" } : "object" == typeof t2 && null !== t2 ? { enabled: false !== t2.enabled, maxEntitySize: Math.max(1, t2.maxEntitySize ?? 1e4), maxExpansionDepth: Math.max(1, t2.maxExpansionDepth ?? 1e4), maxTotalExpansions: Math.max(1, t2.maxTotalExpansions ?? 1 / 0), maxExpandedLength: Math.max(1, t2.maxExpandedLength ?? 1e5), maxEntityCount: Math.max(1, t2.maxEntityCount ?? 1e3), allowedTags: t2.allowedTags ?? null, tagFilter: t2.tagFilter ?? null, appliesTo: t2.appliesTo ?? "all" } : A(true);
      }
      __name(A, "A");
      const T = /* @__PURE__ */ __name(function(t2) {
        const e2 = Object.assign({}, v, t2), i2 = [{ value: e2.attributeNamePrefix, name: "attributeNamePrefix" }, { value: e2.attributesGroupName, name: "attributesGroupName" }, { value: e2.textNodeName, name: "textNodeName" }, { value: e2.cdataPropName, name: "cdataPropName" }, { value: e2.commentPropName, name: "commentPropName" }];
        for (const { value: t3, name: e3 } of i2) t3 && S(t3, e3);
        return null === e2.onDangerousProperty && (e2.onDangerousProperty = w), e2.processEntities = A(e2.processEntities, e2.htmlEntities), e2.unpairedTagsSet = new Set(e2.unpairedTags), e2.stopNodes && Array.isArray(e2.stopNodes) && (e2.stopNodes = e2.stopNodes.map((t3) => "string" == typeof t3 && t3.startsWith("*.") ? ".." + t3.substring(2) : t3)), e2;
      }, "T");
      let _;
      _ = "function" != typeof Symbol ? "@@xmlMetadata" : /* @__PURE__ */ Symbol("XML Node Metadata");
      class C {
        static {
          __name(this, "C");
        }
        constructor(t2) {
          this.tagname = t2, this.child = [], this[":@"] = /* @__PURE__ */ Object.create(null);
        }
        add(t2, e2) {
          "__proto__" === t2 && (t2 = "#__proto__"), this.child.push({ [t2]: e2 });
        }
        addChild(t2, e2) {
          "__proto__" === t2.tagname && (t2.tagname = "#__proto__"), t2[":@"] && Object.keys(t2[":@"]).length > 0 ? this.child.push({ [t2.tagname]: t2.child, ":@": t2[":@"] }) : this.child.push({ [t2.tagname]: t2.child }), this.addStartIndex(e2);
        }
        addStartIndex(t2) {
          void 0 !== t2 && (this.child[this.child.length - 1][_] = { startIndex: t2 });
        }
        addEndIndex(t2) {
          const e2 = this.child[this.child.length - 1];
          void 0 !== e2 && void 0 !== e2[_] && void 0 === e2[_].endIndex && (e2[_].endIndex = t2);
        }
        static getMetaDataSymbol() {
          return _;
        }
      }
      const $ = ":A-Za-z_\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u0486\u0488-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD", P = ":A-Za-z_\xC0-\u02FF\u0370-\u037D\u037F-\u0486\u0488-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}", O = P + "\\-\\.\\d\xB7\u0300-\u036F\u0487\u203F-\u2040", I = /* @__PURE__ */ __name((t2, e2, i2 = "") => {
        const n2 = `[${t2.replace(":", "")}][${e2.replace(":", "")}]*`;
        return { name: new RegExp(`^[${t2}][${e2}]*$`, i2), ncName: new RegExp(`^${n2}$`, i2), qName: new RegExp(`^${n2}(?::${n2})?$`, i2), nmToken: new RegExp(`^[${e2}]+$`, i2), nmTokens: new RegExp(`^[${e2}]+(?:\\s+[${e2}]+)*$`, i2) };
      }, "I"), j = I($, $ + "\\-\\.\\d\xB7\u0300-\u036F\u203F-\u2040"), k = I(P, O, "u"), L = ":A-Za-z_", D = I(L, L + "\\-\\.\\d"), M = /* @__PURE__ */ __name((t2, { xmlVersion: e2 = "1.0", asciiOnly: i2 = false } = {}) => (/* @__PURE__ */ ((t3 = "1.0", e3 = false) => e3 ? D : "1.1" === t3 ? k : j)(e2, i2)).qName.test(t2), "M");
      class R {
        static {
          __name(this, "R");
        }
        constructor(t2, e2) {
          this.suppressValidationErr = !t2, this.options = t2, this.xmlVersion = e2 || 1;
        }
        setXmlVersion(t2 = 1) {
          this.xmlVersion = t2;
        }
        readDocType(t2, e2) {
          const i2 = /* @__PURE__ */ Object.create(null);
          let n2 = 0;
          if ("O" !== t2[e2 + 3] || "C" !== t2[e2 + 4] || "T" !== t2[e2 + 5] || "Y" !== t2[e2 + 6] || "P" !== t2[e2 + 7] || "E" !== t2[e2 + 8]) throw new Error("Invalid Tag instead of DOCTYPE");
          {
            e2 += 9;
            let r2 = 1, s2 = false, o2 = false, a2 = null, l2 = "";
            for (; e2 < t2.length; e2++) if (null === a2) if (s2 || o2 || '"' !== t2[e2] && "'" !== t2[e2]) if ("<" !== t2[e2] || o2) if (">" === t2[e2]) {
              if (o2 ? "-" === t2[e2 - 1] && "-" === t2[e2 - 2] && (o2 = false, r2--) : r2--, 0 === r2) break;
            } else "[" === t2[e2] ? s2 = true : l2 += t2[e2];
            else {
              if (s2 && q(t2, "!ENTITY", e2)) {
                let r3, s3;
                if (e2 += 7, [r3, s3, e2] = this.readEntityExp(t2, e2 + 1, this.suppressValidationErr), -1 === s3.indexOf("&")) {
                  if (false !== this.options.enabled && null != this.options.maxEntityCount && n2 >= this.options.maxEntityCount) throw new Error(`Entity count (${n2 + 1}) exceeds maximum allowed (${this.options.maxEntityCount})`);
                  i2[r3] = s3, n2++;
                }
              } else if (s2 && q(t2, "!ELEMENT", e2)) {
                e2 += 8;
                const { index: i3 } = this.readElementExp(t2, e2 + 1);
                e2 = i3;
              } else if (s2 && q(t2, "!ATTLIST", e2)) e2 += 8;
              else if (s2 && q(t2, "!NOTATION", e2)) {
                e2 += 9;
                const { index: i3 } = this.readNotationExp(t2, e2 + 1, this.suppressValidationErr);
                e2 = i3;
              } else {
                if (!q(t2, "!--", e2)) throw new Error("Invalid DOCTYPE");
                o2 = true;
              }
              r2++, l2 = "";
            }
            else a2 = t2[e2], l2 += t2[e2];
            else t2[e2] === a2 && (a2 = null), l2 += t2[e2];
            if (null !== a2 || 0 !== r2) throw new Error("Unclosed DOCTYPE");
          }
          return { entities: i2, i: e2 };
        }
        readEntityExp(t2, e2) {
          const i2 = e2 = V(t2, e2);
          for (; e2 < t2.length && !/\s/.test(t2[e2]) && '"' !== t2[e2] && "'" !== t2[e2]; ) e2++;
          let n2 = t2.substring(i2, e2);
          if (U(n2, { xmlVersion: this.xmlVersion }), e2 = V(t2, e2), !this.suppressValidationErr) {
            if ("SYSTEM" === t2.substring(e2, e2 + 6).toUpperCase()) throw new Error("External entities are not supported");
            if ("%" === t2[e2]) throw new Error("Parameter entities are not supported");
          }
          let r2 = "";
          if ([e2, r2] = this.readIdentifierVal(t2, e2, "entity"), false !== this.options.enabled && null != this.options.maxEntitySize && r2.length > this.options.maxEntitySize) throw new Error(`Entity "${n2}" size (${r2.length}) exceeds maximum allowed size (${this.options.maxEntitySize})`);
          return [n2, r2, --e2];
        }
        readNotationExp(t2, e2) {
          const i2 = e2 = V(t2, e2);
          for (; e2 < t2.length && !/\s/.test(t2[e2]); ) e2++;
          let n2 = t2.substring(i2, e2);
          !this.suppressValidationErr && U(n2, { xmlVersion: this.xmlVersion }), e2 = V(t2, e2);
          const r2 = t2.substring(e2, e2 + 6).toUpperCase();
          if (!this.suppressValidationErr && "SYSTEM" !== r2 && "PUBLIC" !== r2) throw new Error(`Expected SYSTEM or PUBLIC, found "${r2}"`);
          e2 += r2.length, e2 = V(t2, e2);
          let s2 = null, o2 = null;
          if ("PUBLIC" === r2) [e2, s2] = this.readIdentifierVal(t2, e2, "publicIdentifier"), '"' !== t2[e2 = V(t2, e2)] && "'" !== t2[e2] || ([e2, o2] = this.readIdentifierVal(t2, e2, "systemIdentifier"));
          else if ("SYSTEM" === r2 && ([e2, o2] = this.readIdentifierVal(t2, e2, "systemIdentifier"), !this.suppressValidationErr && !o2)) throw new Error("Missing mandatory system identifier for SYSTEM notation");
          return { notationName: n2, publicIdentifier: s2, systemIdentifier: o2, index: --e2 };
        }
        readIdentifierVal(t2, e2, i2) {
          let n2 = "";
          const r2 = t2[e2];
          if ('"' !== r2 && "'" !== r2) throw new Error(`Expected quoted string, found "${r2}"`);
          const s2 = ++e2;
          for (; e2 < t2.length && t2[e2] !== r2; ) e2++;
          if (n2 = t2.substring(s2, e2), t2[e2] !== r2) throw new Error(`Unterminated ${i2} value`);
          return [++e2, n2];
        }
        readElementExp(t2, e2) {
          const i2 = e2 = V(t2, e2);
          for (; e2 < t2.length && !/\s/.test(t2[e2]); ) e2++;
          let n2 = t2.substring(i2, e2);
          if (!this.suppressValidationErr && !M(n2, { xmlVersion: this.xmlVersion })) throw new Error(`Invalid element name: "${n2}"`);
          let r2 = "";
          if ("E" === t2[e2 = V(t2, e2)] && q(t2, "MPTY", e2)) e2 += 4;
          else if ("A" === t2[e2] && q(t2, "NY", e2)) e2 += 2;
          else if ("(" === t2[e2]) {
            const i3 = ++e2;
            for (; e2 < t2.length && ")" !== t2[e2]; ) e2++;
            if (r2 = t2.substring(i3, e2), ")" !== t2[e2]) throw new Error("Unterminated content model");
          } else if (!this.suppressValidationErr) throw new Error(`Invalid Element Expression, found "${t2[e2]}"`);
          return { elementName: n2, contentModel: r2.trim(), index: e2 };
        }
        readAttlistExp(t2, e2) {
          let i2 = e2 = V(t2, e2);
          for (; e2 < t2.length && !/\s/.test(t2[e2]); ) e2++;
          let n2 = t2.substring(i2, e2);
          for (U(n2, { xmlVersion: this.xmlVersion }), i2 = e2 = V(t2, e2); e2 < t2.length && !/\s/.test(t2[e2]); ) e2++;
          let r2 = t2.substring(i2, e2);
          if (!U(r2, { xmlVersion: this.xmlVersion })) throw new Error(`Invalid attribute name: "${r2}"`);
          e2 = V(t2, e2);
          let s2 = "";
          if ("NOTATION" === t2.substring(e2, e2 + 8).toUpperCase()) {
            if (s2 = "NOTATION", "(" !== t2[e2 = V(t2, e2 += 8)]) throw new Error(`Expected '(', found "${t2[e2]}"`);
            e2++;
            let i3 = [];
            for (; e2 < t2.length && ")" !== t2[e2]; ) {
              const n3 = e2;
              for (; e2 < t2.length && "|" !== t2[e2] && ")" !== t2[e2]; ) e2++;
              let r3 = t2.substring(n3, e2);
              if (r3 = r3.trim(), !U(r3, { xmlVersion: this.xmlVersion })) throw new Error(`Invalid notation name: "${r3}"`);
              i3.push(r3), "|" === t2[e2] && (e2++, e2 = V(t2, e2));
            }
            if (")" !== t2[e2]) throw new Error("Unterminated list of notations");
            e2++, s2 += " (" + i3.join("|") + ")";
          } else {
            const i3 = e2;
            for (; e2 < t2.length && !/\s/.test(t2[e2]); ) e2++;
            s2 += t2.substring(i3, e2);
            const n3 = ["CDATA", "ID", "IDREF", "IDREFS", "ENTITY", "ENTITIES", "NMTOKEN", "NMTOKENS"];
            if (!this.suppressValidationErr && !n3.includes(s2.toUpperCase())) throw new Error(`Invalid attribute type: "${s2}"`);
          }
          e2 = V(t2, e2);
          let o2 = "";
          return "#REQUIRED" === t2.substring(e2, e2 + 8).toUpperCase() ? (o2 = "#REQUIRED", e2 += 8) : "#IMPLIED" === t2.substring(e2, e2 + 7).toUpperCase() ? (o2 = "#IMPLIED", e2 += 7) : [e2, o2] = this.readIdentifierVal(t2, e2, "ATTLIST"), { elementName: n2, attributeName: r2, attributeType: s2, defaultValue: o2, index: e2 };
        }
      }
      const V = /* @__PURE__ */ __name((t2, e2) => {
        for (; e2 < t2.length && /\s/.test(t2[e2]); ) e2++;
        return e2;
      }, "V");
      function q(t2, e2, i2) {
        for (let n2 = 0; n2 < e2.length; n2++) if (e2[n2] !== t2[i2 + n2 + 1]) return false;
        return true;
      }
      __name(q, "q");
      function U(t2, e2) {
        if (M(t2, { xmlVersion: e2 })) return t2;
        throw new Error(`Invalid entity name ${t2}`);
      }
      __name(U, "U");
      const B = [48, 1632, 1776, 2406, 2534, 2662, 2790, 2918, 3046, 3174, 3302, 3430, 3558, 3664, 3792, 3872, 4160, 4240, 6112, 6160, 6470, 6608, 6784, 6800, 6992, 7088, 7232, 7248, 65296, 120782, 120792, 120802, 120812, 120822, 66720, 68912, 69734, 69872, 69942, 70096, 70384, 70736, 70864, 71248, 71360, 71472, 71904, 72016, 72688, 72784, 73040, 73120, 73552, 92768, 92864, 93008, 123200, 123632, 124144, 125264, 130032], F = /* @__PURE__ */ new Map(), G = 1632, X = new Uint8Array(63904).fill(255);
      for (const t2 of B) for (let e2 = 0; e2 < 10; e2++) {
        const i2 = t2 + e2;
        i2 <= 65535 ? X[i2 - G] = e2 : F.set(i2, e2);
      }
      const W = /* @__PURE__ */ new Set([8722, 65293, 65123]), z = /^[-+]?0x[a-fA-F0-9]+$/, Y = /^0b[01]+$/, H = /^0o[0-7]+$/, Q = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/, J = { hex: true, binary: false, octal: false, leadingZeros: true, decimalPoint: ".", eNotation: true, infinity: "original", unicode: false };
      function Z(t2, e2 = {}) {
        if (e2 = Object.assign({}, J, e2), !t2 || "string" != typeof t2) return t2;
        let i2 = t2.trim();
        if (0 === i2.length) return t2;
        if (void 0 !== e2.skipLike && e2.skipLike.test(i2)) return t2;
        if ("0" === i2) return 0;
        if (e2.unicode && (i2 = (function(t3) {
          if ("string" != typeof t3) return t3;
          const e3 = t3.length;
          if (0 === e3) return t3;
          let i3 = -1;
          for (let n3 = 0; n3 < e3; n3++) {
            const r2 = t3.charCodeAt(n3);
            if (!(r2 >= 48 && r2 <= 57 || 45 === r2)) {
              if (r2 < G) {
                if (W.has(r2)) {
                  i3 = n3;
                  break;
                }
              } else if (r2 >= 55296 && r2 <= 56319) {
                if (n3 + 1 < e3) {
                  const e4 = t3.charCodeAt(n3 + 1);
                  if (e4 >= 56320 && e4 <= 57343) {
                    const t4 = 65536 + (r2 - 55296 << 10) + (e4 - 56320);
                    if (F.has(t4)) {
                      i3 = n3;
                      break;
                    }
                  }
                }
              } else if (255 !== X[r2 - G] || W.has(r2)) {
                i3 = n3;
                break;
              }
            }
          }
          if (-1 === i3) return t3;
          const n2 = [];
          i3 > 0 && n2.push(t3.slice(0, i3));
          for (let r2 = i3; r2 < e3; r2++) {
            const i4 = t3.charCodeAt(r2);
            if (i4 >= 48 && i4 <= 57 || 45 === i4) {
              n2.push(t3[r2]);
              continue;
            }
            if (i4 < G) {
              n2.push(W.has(i4) ? "-" : t3[r2]);
              continue;
            }
            if (i4 >= 55296 && i4 <= 56319) {
              if (r2 + 1 < e3) {
                const e4 = t3.charCodeAt(r2 + 1);
                if (e4 >= 56320 && e4 <= 57343) {
                  const t4 = 65536 + (i4 - 55296 << 10) + (e4 - 56320), s3 = F.get(t4);
                  if (void 0 !== s3) {
                    n2.push(String.fromCharCode(s3 + 48)), r2++;
                    continue;
                  }
                }
              }
              n2.push(t3[r2]);
              continue;
            }
            if (W.has(i4)) {
              n2.push("-");
              continue;
            }
            const s2 = X[i4 - G];
            n2.push(255 !== s2 ? String.fromCharCode(s2 + 48) : t3[r2]);
          }
          return n2.join("");
        })(i2), "0" === i2)) return 0;
        if (e2.hex && z.test(i2)) return tt(i2, 16);
        if (e2.binary && Y.test(i2)) return tt(i2, 2);
        if (e2.octal && H.test(i2)) return tt(i2, 8);
        if (isFinite(i2)) {
          if (i2.includes("e") || i2.includes("E")) return (function(t3, e3, i3) {
            if (!i3.eNotation) return t3;
            const n2 = e3.match(K);
            if (n2) {
              let r2 = n2[1] || "";
              const s2 = -1 === n2[3].indexOf("e") ? "E" : "e", o2 = n2[2], a2 = r2 ? t3[o2.length + 1] === s2 : t3[o2.length] === s2;
              return o2.length > 1 && a2 ? t3 : (1 !== o2.length || !n2[3].startsWith(`.${s2}`) && n2[3][0] !== s2) && o2.length > 0 ? i3.leadingZeros && !a2 ? (e3 = (n2[1] || "") + n2[3], Number(e3)) : t3 : Number(e3);
            }
            return t3;
          })(t2, i2, e2);
          {
            const n2 = Q.exec(i2);
            if (n2) {
              const r2 = n2[1] || "", s2 = n2[2];
              let o2 = (function(t3) {
                if (t3 && -1 !== t3.indexOf(".")) {
                  let e3 = t3.length;
                  for (; e3 > 0 && 48 === t3.charCodeAt(e3 - 1); ) e3--;
                  return "." === (t3 = t3.slice(0, e3)) ? t3 = "0" : "." === t3[0] ? t3 = "0" + t3 : "." === t3[t3.length - 1] && (t3 = t3.substring(0, t3.length - 1)), t3;
                }
                return t3;
              })(n2[3]);
              const a2 = r2 ? "." === t2[s2.length + 1] : "." === t2[s2.length];
              if (!e2.leadingZeros && (s2.length > 1 || 1 === s2.length && !a2)) return t2;
              {
                const n3 = Number(i2), a3 = String(n3);
                if (0 === n3) return n3;
                if (-1 !== a3.search(/[eE]/)) return e2.eNotation ? n3 : t2;
                if (-1 !== i2.indexOf(".")) return "0" === a3 || a3 === o2 || a3 === `${r2}${o2}` ? n3 : t2;
                let l2 = s2 ? o2 : i2;
                return s2 ? l2 === a3 || r2 + l2 === a3 ? n3 : t2 : l2 === a3 || l2 === r2 + a3 ? n3 : t2;
              }
            }
            return t2;
          }
        }
        return (function(t3, e3, i3) {
          const n2 = e3 === 1 / 0;
          switch (i3.infinity.toLowerCase()) {
            case "null":
              return null;
            case "infinity":
              return e3;
            case "string":
              return n2 ? "Infinity" : "-Infinity";
            default:
              return t3;
          }
        })(t2, Number(i2), e2);
      }
      __name(Z, "Z");
      const K = /^([-+])?(0*)(\d*(\.\d*)?[eE][-\+]?\d+)$/;
      function tt(t2, e2) {
        const i2 = t2.trim();
        if (2 !== e2 && 8 !== e2 || (t2 = i2.substring(2)), parseInt) return parseInt(t2, e2);
        if (Number.parseInt) return Number.parseInt(t2, e2);
        if (window && window.parseInt) return window.parseInt(t2, e2);
        throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
      }
      __name(tt, "tt");
      class et {
        static {
          __name(this, "et");
        }
        constructor(t2) {
          this._matcher = t2;
        }
        get separator() {
          return this._matcher.separator;
        }
        getCurrentTag() {
          const t2 = this._matcher.path;
          return t2.length > 0 ? t2[t2.length - 1].tag : void 0;
        }
        getCurrentNamespace() {
          const t2 = this._matcher.path;
          return t2.length > 0 ? t2[t2.length - 1].namespace : void 0;
        }
        getAttrValue(t2) {
          const e2 = this._matcher.path;
          if (0 !== e2.length) return e2[e2.length - 1].values?.[t2];
        }
        hasAttr(t2) {
          const e2 = this._matcher.path;
          if (0 === e2.length) return false;
          const i2 = e2[e2.length - 1];
          return void 0 !== i2.values && t2 in i2.values;
        }
        getAnyParentAttr(t2) {
          return this._matcher.getAnyParentAttr(t2);
        }
        hasAnyParentAttr(t2) {
          return this._matcher.hasAnyParentAttr(t2);
        }
        getPosition() {
          const t2 = this._matcher.path;
          return 0 === t2.length ? -1 : t2[t2.length - 1].position ?? 0;
        }
        getCounter() {
          const t2 = this._matcher.path;
          return 0 === t2.length ? -1 : t2[t2.length - 1].counter ?? 0;
        }
        getIndex() {
          return this.getPosition();
        }
        getDepth() {
          return this._matcher.path.length;
        }
        toString(t2, e2 = true) {
          return this._matcher.toString(t2, e2);
        }
        toArray() {
          return this._matcher.path.map((t2) => t2.tag);
        }
        matches(t2) {
          return this._matcher.matches(t2);
        }
        matchesAny(t2) {
          return t2.matchesAny(this._matcher);
        }
      }
      class it {
        static {
          __name(this, "it");
        }
        constructor(t2 = {}) {
          this.separator = t2.separator || ".", this.path = [], this.siblingStacks = [], this._pathStringCache = null, this._view = new et(this), this._keptAttrs = [];
        }
        push(t2, e2 = null, i2 = null, n2 = null) {
          this._pathStringCache = null, this.path.length > 0 && (this.path[this.path.length - 1].values = void 0);
          const r2 = this.path.length;
          let s2 = this.siblingStacks[r2];
          s2 || (s2 = { counts: /* @__PURE__ */ new Map(), total: 0 }, this.siblingStacks[r2] = s2);
          const o2 = i2 ? `${i2}:${t2}` : t2, a2 = s2.counts.get(o2) || 0, l2 = s2.total;
          s2.counts.set(o2, a2 + 1), s2.total++;
          const p2 = { tag: t2, position: l2, counter: a2 };
          null != i2 && (p2.namespace = i2), null != e2 && (p2.values = e2), this.path.push(p2);
          const c2 = this.path.length, h2 = null !== n2 ? n2.keep : null;
          if (null != h2 && h2.length > 0 && e2) for (let t3 = 0; t3 < h2.length; t3++) {
            const i3 = h2[t3];
            void 0 !== e2[i3] && this._keptAttrs.push({ depth: c2, name: i3, value: e2[i3] });
          }
        }
        pop() {
          if (0 === this.path.length) return;
          this._pathStringCache = null;
          const t2 = this.path.pop();
          this.siblingStacks.length > this.path.length + 1 && (this.siblingStacks.length = this.path.length + 1);
          const e2 = this.path.length + 1;
          for (; this._keptAttrs.length > 0 && this._keptAttrs[this._keptAttrs.length - 1].depth >= e2; ) this._keptAttrs.pop();
          return t2;
        }
        updateCurrent(t2) {
          if (this.path.length > 0) {
            const e2 = this.path[this.path.length - 1];
            null != t2 && (e2.values = t2);
          }
        }
        getCurrentTag() {
          return this.path.length > 0 ? this.path[this.path.length - 1].tag : void 0;
        }
        getCurrentNamespace() {
          return this.path.length > 0 ? this.path[this.path.length - 1].namespace : void 0;
        }
        getAttrValue(t2) {
          if (0 !== this.path.length) return this.path[this.path.length - 1].values?.[t2];
        }
        hasAttr(t2) {
          if (0 === this.path.length) return false;
          const e2 = this.path[this.path.length - 1];
          return void 0 !== e2.values && t2 in e2.values;
        }
        getAnyParentAttr(t2) {
          const e2 = this._keptAttrs;
          for (let i2 = e2.length - 1; i2 >= 0; i2--) if (e2[i2].name === t2) return e2[i2].value;
        }
        hasAnyParentAttr(t2) {
          const e2 = this._keptAttrs;
          for (let i2 = e2.length - 1; i2 >= 0; i2--) if (e2[i2].name === t2) return true;
          return false;
        }
        getPosition() {
          return 0 === this.path.length ? -1 : this.path[this.path.length - 1].position ?? 0;
        }
        getCounter() {
          return 0 === this.path.length ? -1 : this.path[this.path.length - 1].counter ?? 0;
        }
        getIndex() {
          return this.getPosition();
        }
        getDepth() {
          return this.path.length;
        }
        toString(t2, e2 = true) {
          const i2 = t2 || this.separator;
          if (i2 === this.separator && true === e2) {
            if (null !== this._pathStringCache) return this._pathStringCache;
            const t3 = this.path.map((t4) => t4.namespace ? `${t4.namespace}:${t4.tag}` : t4.tag).join(i2);
            return this._pathStringCache = t3, t3;
          }
          return this.path.map((t3) => e2 && t3.namespace ? `${t3.namespace}:${t3.tag}` : t3.tag).join(i2);
        }
        toArray() {
          return this.path.map((t2) => t2.tag);
        }
        reset() {
          this._pathStringCache = null, this.path = [], this.siblingStacks = [], this._keptAttrs = [];
        }
        matches(t2) {
          const e2 = t2.segments;
          return 0 !== e2.length && (t2.hasDeepWildcard() ? this._matchWithDeepWildcard(e2) : this._matchSimple(e2));
        }
        _matchSimple(t2) {
          if (this.path.length !== t2.length) return false;
          for (let e2 = 0; e2 < t2.length; e2++) if (!this._matchSegment(t2[e2], this.path[e2], e2 === this.path.length - 1)) return false;
          return true;
        }
        _matchWithDeepWildcard(t2) {
          let e2 = this.path.length - 1, i2 = t2.length - 1;
          for (; i2 >= 0 && e2 >= 0; ) {
            const n2 = t2[i2];
            if ("deep-wildcard" === n2.type) {
              if (i2--, i2 < 0) return true;
              const n3 = t2[i2];
              let r2 = false;
              for (let t3 = e2; t3 >= 0; t3--) if (this._matchSegment(n3, this.path[t3], t3 === this.path.length - 1)) {
                e2 = t3 - 1, i2--, r2 = true;
                break;
              }
              if (!r2) return false;
            } else {
              if (!this._matchSegment(n2, this.path[e2], e2 === this.path.length - 1)) return false;
              e2--, i2--;
            }
          }
          return i2 < 0;
        }
        _matchSegment(t2, e2, i2) {
          if ("*" !== t2.tag && t2.tag !== e2.tag) return false;
          if (void 0 !== t2.namespace && "*" !== t2.namespace && t2.namespace !== e2.namespace) return false;
          if (void 0 !== t2.attrName) {
            if (!i2) return false;
            if (!e2.values || !(t2.attrName in e2.values)) return false;
            if (void 0 !== t2.attrValue && String(e2.values[t2.attrName]) !== String(t2.attrValue)) return false;
          }
          if (void 0 !== t2.position) {
            if (!i2) return false;
            const n2 = e2.counter ?? 0;
            if ("first" === t2.position && 0 !== n2) return false;
            if ("odd" === t2.position && n2 % 2 != 1) return false;
            if ("even" === t2.position && n2 % 2 != 0) return false;
            if ("nth" === t2.position && n2 !== t2.positionValue) return false;
          }
          return true;
        }
        matchesAny(t2) {
          return t2.matchesAny(this);
        }
        snapshot() {
          return { path: this.path.map((t2) => ({ ...t2 })), siblingStacks: this.siblingStacks.map((t2) => t2 ? { counts: new Map(t2.counts), total: t2.total } : t2), keptAttrs: this._keptAttrs.map((t2) => ({ ...t2 })) };
        }
        restore(t2) {
          this._pathStringCache = null, this.path = t2.path.map((t3) => ({ ...t3 })), this.siblingStacks = t2.siblingStacks.map((t3) => t3 ? { counts: new Map(t3.counts), total: t3.total } : t3), this._keptAttrs = (t2.keptAttrs || []).map((t3) => ({ ...t3 }));
        }
        readOnly() {
          return this._view;
        }
      }
      class nt {
        static {
          __name(this, "nt");
        }
        constructor(t2, e2 = {}, i2) {
          this.pattern = t2, this.separator = e2.separator || ".", this.segments = this._parse(t2), this.data = i2, this._hasDeepWildcard = this.segments.some((t3) => "deep-wildcard" === t3.type), this._hasAttributeCondition = this.segments.some((t3) => void 0 !== t3.attrName), this._hasPositionSelector = this.segments.some((t3) => void 0 !== t3.position);
        }
        _parse(t2) {
          const e2 = [];
          let i2 = 0, n2 = "";
          for (; i2 < t2.length; ) t2[i2] === this.separator ? i2 + 1 < t2.length && t2[i2 + 1] === this.separator ? (n2.trim() && (e2.push(this._parseSegment(n2.trim())), n2 = ""), e2.push({ type: "deep-wildcard" }), i2 += 2) : (n2.trim() && e2.push(this._parseSegment(n2.trim())), n2 = "", i2++) : (n2 += t2[i2], i2++);
          return n2.trim() && e2.push(this._parseSegment(n2.trim())), e2;
        }
        _parseSegment(t2) {
          const e2 = { type: "tag" };
          let i2 = null, n2 = t2;
          const r2 = t2.match(/^([^\[]+)(\[[^\]]*\])(.*)$/);
          if (r2 && (n2 = r2[1] + r2[3], r2[2])) {
            const t3 = r2[2].slice(1, -1);
            t3 && (i2 = t3);
          }
          let s2, o2, a2 = n2;
          if (n2.includes("::")) {
            const e3 = n2.indexOf("::");
            if (s2 = n2.substring(0, e3).trim(), a2 = n2.substring(e3 + 2).trim(), !s2) throw new Error(`Invalid namespace in pattern: ${t2}`);
          }
          let l2 = null;
          if (a2.includes(":")) {
            const t3 = a2.lastIndexOf(":"), e3 = a2.substring(0, t3).trim(), i3 = a2.substring(t3 + 1).trim();
            ["first", "last", "odd", "even"].includes(i3) || /^nth\(\d+\)$/.test(i3) ? (o2 = e3, l2 = i3) : o2 = a2;
          } else o2 = a2;
          if (!o2) throw new Error(`Invalid segment pattern: ${t2}`);
          if (e2.tag = o2, s2 && (e2.namespace = s2), i2) if (i2.includes("=")) {
            const t3 = i2.indexOf("=");
            e2.attrName = i2.substring(0, t3).trim(), e2.attrValue = i2.substring(t3 + 1).trim();
          } else e2.attrName = i2.trim();
          if (l2) {
            const t3 = l2.match(/^nth\((\d+)\)$/);
            t3 ? (e2.position = "nth", e2.positionValue = parseInt(t3[1], 10)) : e2.position = l2;
          }
          return e2;
        }
        get length() {
          return this.segments.length;
        }
        hasDeepWildcard() {
          return this._hasDeepWildcard;
        }
        hasAttributeCondition() {
          return this._hasAttributeCondition;
        }
        hasPositionSelector() {
          return this._hasPositionSelector;
        }
        toString() {
          return this.pattern;
        }
      }
      class rt {
        static {
          __name(this, "rt");
        }
        constructor() {
          this._byDepthAndTag = /* @__PURE__ */ new Map(), this._wildcardByDepth = /* @__PURE__ */ new Map(), this._deepWildcards = [], this._deepByTerminalTag = /* @__PURE__ */ new Map(), this._patterns = /* @__PURE__ */ new Set(), this._sealed = false;
        }
        add(t2) {
          if (this._sealed) throw new TypeError("ExpressionSet is sealed. Create a new ExpressionSet to add more expressions.");
          if (this._patterns.has(t2.pattern)) return this;
          if (this._patterns.add(t2.pattern), t2.hasDeepWildcard()) {
            const e3 = t2.segments[t2.segments.length - 1];
            if (e3 && "deep-wildcard" !== e3.type && "*" !== e3.tag) {
              const i3 = e3.tag;
              this._deepByTerminalTag.has(i3) || this._deepByTerminalTag.set(i3, []), this._deepByTerminalTag.get(i3).push(t2);
            } else this._deepWildcards.push(t2);
            return this;
          }
          const e2 = t2.length, i2 = t2.segments[t2.segments.length - 1], n2 = i2?.tag;
          if (n2 && "*" !== n2) {
            const i3 = `${e2}:${n2}`;
            this._byDepthAndTag.has(i3) || this._byDepthAndTag.set(i3, []), this._byDepthAndTag.get(i3).push(t2);
          } else this._wildcardByDepth.has(e2) || this._wildcardByDepth.set(e2, []), this._wildcardByDepth.get(e2).push(t2);
          return this;
        }
        addAll(t2) {
          for (const e2 of t2) this.add(e2);
          return this;
        }
        has(t2) {
          return this._patterns.has(t2.pattern);
        }
        get size() {
          return this._patterns.size;
        }
        seal() {
          return this._sealed = true, this;
        }
        get isSealed() {
          return this._sealed;
        }
        matchesAny(t2) {
          return null !== this.findMatch(t2);
        }
        findMatch(t2) {
          const e2 = t2.getDepth(), i2 = t2.getCurrentTag(), n2 = `${e2}:${i2}`, r2 = this._byDepthAndTag.get(n2);
          if (r2) {
            for (let e3 = 0; e3 < r2.length; e3++) if (t2.matches(r2[e3])) return r2[e3];
          }
          const s2 = this._wildcardByDepth.get(e2);
          if (s2) {
            for (let e3 = 0; e3 < s2.length; e3++) if (t2.matches(s2[e3])) return s2[e3];
          }
          const o2 = this._deepByTerminalTag.get(i2);
          if (o2) {
            for (let e3 = 0; e3 < o2.length; e3++) if (t2.matches(o2[e3])) return o2[e3];
          }
          for (let e3 = 0; e3 < this._deepWildcards.length; e3++) if (t2.matches(this._deepWildcards[e3])) return this._deepWildcards[e3];
          return null;
        }
      }
      const st = { cent: "\xA2", pound: "\xA3", curren: "\xA4", yen: "\xA5", euro: "\u20AC", dollar: "$", fnof: "\u0192", inr: "\u20B9", af: "\u060B", birr: "\u1265\u122D", peso: "\u20B1", rub: "\u20BD", won: "\u20A9", yuan: "\xA5", cedil: "\xB8" }, ot = { amp: "&", apos: "'", gt: ">", lt: "<", quot: '"' }, at = { nbsp: "\xA0", copy: "\xA9", reg: "\xAE", trade: "\u2122", mdash: "\u2014", ndash: "\u2013", hellip: "\u2026", laquo: "\xAB", raquo: "\xBB", lsquo: "\u2018", rsquo: "\u2019", ldquo: "\u201C", rdquo: "\u201D", bull: "\u2022", para: "\xB6", sect: "\xA7", deg: "\xB0", frac12: "\xBD", frac14: "\xBC", frac34: "\xBE" }, lt = Object.freeze({ ALLOW: "allow", BLOCK: "block", THROW: "throw" }), pt = new Set("!?\\\\/[]$%{}^&*()<>|+");
      function ct(t2) {
        if ("#" === t2[0]) throw new Error(`[EntityReplacer] Invalid character '#' in entity name: "${t2}"`);
        for (const e2 of t2) if (pt.has(e2)) throw new Error(`[EntityReplacer] Invalid character '${e2}' in entity name: "${t2}"`);
        return t2;
      }
      __name(ct, "ct");
      function ht(...t2) {
        const e2 = /* @__PURE__ */ Object.create(null);
        for (const i2 of t2) if (i2) for (const t3 of Object.keys(i2)) {
          const n2 = i2[t3];
          if ("string" == typeof n2) e2[t3] = n2;
          else if (n2 && "object" == typeof n2 && void 0 !== n2.val) {
            const i3 = n2.val;
            "string" == typeof i3 && (e2[t3] = i3);
          }
        }
        return e2;
      }
      __name(ht, "ht");
      const dt = "external", ut = "base", ft = "all", gt = Object.freeze({ allow: 0, leave: 1, remove: 2, throw: 3 }), mt = /* @__PURE__ */ new Set([9, 10, 13]);
      class xt {
        static {
          __name(this, "xt");
        }
        constructor(t2 = {}) {
          var e2;
          this._limit = t2.limit || {}, this._maxTotalExpansions = this._limit.maxTotalExpansions || 0, this._maxExpandedLength = this._limit.maxExpandedLength || 0, this._postCheck = "function" == typeof t2.postCheck ? t2.postCheck : (t3) => t3, this._limitTiers = (e2 = this._limit.applyLimitsTo ?? dt) && e2 !== dt ? e2 === ft ? /* @__PURE__ */ new Set([ft]) : e2 === ut ? /* @__PURE__ */ new Set([ut]) : Array.isArray(e2) ? new Set(e2) : /* @__PURE__ */ new Set([dt]) : /* @__PURE__ */ new Set([dt]), this._numericAllowed = t2.numericAllowed ?? true, this._baseMap = ht(ot, t2.namedEntities || null), this._externalMap = /* @__PURE__ */ Object.create(null), this._inputMap = /* @__PURE__ */ Object.create(null), this._totalExpansions = 0, this._expandedLength = 0, this._removeSet = new Set(t2.remove && Array.isArray(t2.remove) ? t2.remove : []), this._leaveSet = new Set(t2.leave && Array.isArray(t2.leave) ? t2.leave : []);
          const i2 = (function(t3) {
            if (!t3) return { xmlVersion: 1, onLevel: gt.allow, nullLevel: gt.remove };
            const e3 = 1.1 === t3.xmlVersion ? 1.1 : 1, i3 = gt[t3.onNCR] ?? gt.allow, n2 = gt[t3.nullNCR] ?? gt.remove;
            return { xmlVersion: e3, onLevel: i3, nullLevel: Math.max(n2, gt.remove) };
          })(t2.ncr);
          this._ncrXmlVersion = i2.xmlVersion, this._ncrOnLevel = i2.onLevel, this._ncrNullLevel = i2.nullLevel, this._onExternalEntity = "function" == typeof t2.onExternalEntity ? t2.onExternalEntity : null, this._onInputEntity = "function" == typeof t2.onInputEntity ? t2.onInputEntity : null;
        }
        _applyRegistrationHook(t2, e2, i2, n2) {
          if (!t2) return true;
          const r2 = t2(e2, i2);
          if (r2 === lt.BLOCK) return false;
          if (r2 === lt.THROW) throw new Error(`[EntityDecoder] Registration of ${n2} entity "&${e2};" was rejected by hook`);
          return true;
        }
        setExternalEntities(t2) {
          if (t2) for (const e3 of Object.keys(t2)) ct(e3);
          if (!this._onExternalEntity) return void (this._externalMap = ht(t2));
          const e2 = ht(t2), i2 = /* @__PURE__ */ Object.create(null);
          for (const [t3, n2] of Object.entries(e2)) this._applyRegistrationHook(this._onExternalEntity, t3, n2, "external") && (i2[t3] = n2);
          this._externalMap = i2;
        }
        addExternalEntity(t2, e2) {
          ct(t2), "string" == typeof e2 && -1 === e2.indexOf("&") && this._applyRegistrationHook(this._onExternalEntity, t2, e2, "external") && (this._externalMap[t2] = e2);
        }
        addInputEntities(t2) {
          if (this._totalExpansions = 0, this._expandedLength = 0, !this._onInputEntity) return void (this._inputMap = ht(t2));
          const e2 = ht(t2), i2 = /* @__PURE__ */ Object.create(null);
          for (const [t3, n2] of Object.entries(e2)) this._applyRegistrationHook(this._onInputEntity, t3, n2, "input") && (i2[t3] = n2);
          this._inputMap = i2;
        }
        reset() {
          return this._inputMap = /* @__PURE__ */ Object.create(null), this._totalExpansions = 0, this._expandedLength = 0, this;
        }
        setXmlVersion(t2) {
          this._ncrXmlVersion = 1.1 === t2 ? 1.1 : 1;
        }
        decode(t2) {
          if ("string" != typeof t2 || 0 === t2.length) return t2;
          if (-1 === t2.indexOf("&")) return t2;
          const e2 = t2, i2 = [], n2 = t2.length;
          let r2 = 0, s2 = 0;
          const o2 = this._maxTotalExpansions > 0, a2 = this._maxExpandedLength > 0, l2 = o2 || a2;
          for (; s2 < n2; ) {
            if (38 !== t2.charCodeAt(s2)) {
              s2++;
              continue;
            }
            let e3 = s2 + 1;
            for (; e3 < n2 && 59 !== t2.charCodeAt(e3) && e3 - s2 <= 32; ) e3++;
            if (e3 >= n2 || 59 !== t2.charCodeAt(e3)) {
              s2++;
              continue;
            }
            const p3 = t2.slice(s2 + 1, e3);
            if (0 === p3.length) {
              s2++;
              continue;
            }
            let c2, h2;
            if (this._removeSet.has(p3)) c2 = "", void 0 === h2 && (h2 = dt);
            else {
              if (this._leaveSet.has(p3)) {
                s2++;
                continue;
              }
              if (35 === p3.charCodeAt(0)) {
                const t3 = this._resolveNCR(p3);
                if (void 0 === t3) {
                  s2++;
                  continue;
                }
                c2 = t3, h2 = ut;
              } else {
                const t3 = this._resolveName(p3);
                c2 = t3?.value, h2 = t3?.tier;
              }
            }
            if (void 0 !== c2) {
              if (s2 > r2 && i2.push(t2.slice(r2, s2)), i2.push(c2), r2 = e3 + 1, s2 = r2, l2 && this._tierCounts(h2)) {
                if (o2 && (this._totalExpansions++, this._totalExpansions > this._maxTotalExpansions)) throw new Error(`[EntityReplacer] Entity expansion count limit exceeded: ${this._totalExpansions} > ${this._maxTotalExpansions}`);
                if (a2) {
                  const t3 = c2.length - (p3.length + 2);
                  if (t3 > 0 && (this._expandedLength += t3, this._expandedLength > this._maxExpandedLength)) throw new Error(`[EntityReplacer] Expanded content length limit exceeded: ${this._expandedLength} > ${this._maxExpandedLength}`);
                }
              }
            } else s2++;
          }
          r2 < n2 && i2.push(t2.slice(r2));
          const p2 = 0 === i2.length ? t2 : i2.join("");
          return this._postCheck(p2, e2);
        }
        _tierCounts(t2) {
          return !!this._limitTiers.has(ft) || this._limitTiers.has(t2);
        }
        _resolveName(t2) {
          return t2 in this._inputMap ? { value: this._inputMap[t2], tier: dt } : t2 in this._externalMap ? { value: this._externalMap[t2], tier: dt } : t2 in this._baseMap ? { value: this._baseMap[t2], tier: ut } : void 0;
        }
        _classifyNCR(t2) {
          return 0 === t2 ? this._ncrNullLevel : t2 >= 55296 && t2 <= 57343 || 1 === this._ncrXmlVersion && t2 >= 1 && t2 <= 31 && !mt.has(t2) ? gt.remove : -1;
        }
        _applyNCRAction(t2, e2, i2) {
          switch (t2) {
            case gt.allow:
              return String.fromCodePoint(i2);
            case gt.remove:
              return "";
            case gt.leave:
              return;
            case gt.throw:
              throw new Error(`[EntityDecoder] Prohibited numeric character reference &${e2}; (U+${i2.toString(16).toUpperCase().padStart(4, "0")})`);
            default:
              return String.fromCodePoint(i2);
          }
        }
        _resolveNCR(t2) {
          const e2 = t2.charCodeAt(1);
          let i2;
          if (i2 = 120 === e2 || 88 === e2 ? parseInt(t2.slice(2), 16) : parseInt(t2.slice(1), 10), Number.isNaN(i2) || i2 < 0 || i2 > 1114111) return;
          const n2 = this._classifyNCR(i2);
          if (!this._numericAllowed && n2 < gt.remove) return;
          const r2 = -1 === n2 ? this._ncrOnLevel : Math.max(this._ncrOnLevel, n2);
          return this._applyNCRAction(r2, t2, i2);
        }
      }
      const bt = [{ id: "sql-block-comment-open", description: "SQL block comment open: /* ... */ \u2014 unusual in legitimate user text", pattern: /\/\*/ }, { id: "sql-union-select", description: "UNION SELECT \u2014 most common SQL injection aggregation attack", pattern: /\bUNION\s{1,20}(?:ALL\s{1,20})?SELECT\b/i }, { id: "sql-drop-table", description: "DROP TABLE \u2014 destructive DDL injection", pattern: /\bDROP\s{1,20}TABLE\b/i }, { id: "sql-drop-database", description: "DROP DATABASE \u2014 destructive DDL injection", pattern: /\bDROP\s{1,20}DATABASE\b/i }, { id: "sql-insert-into", description: "INSERT INTO \u2014 data injection", pattern: /\bINSERT\s{1,20}INTO\b/i }, { id: "sql-delete-from", description: "DELETE FROM \u2014 data deletion injection", pattern: /\bDELETE\s{1,20}FROM\b/i }, { id: "sql-update-set", description: "UPDATE ... SET \u2014 data modification injection", pattern: /\bUPDATE\b[\s\S]{1,60}\bSET\b/i }, { id: "sql-exec-xp", description: "EXEC xp_ \u2014 MSSQL extended stored procedure execution", pattern: /\bEXEC(?:UTE)?\s{1,20}xp_/i }, { id: "sql-tautology-string", description: `Classic string tautology: ' OR '1'='1 or " OR "1"="1"`, pattern: /'\s{0,10}OR\s{0,10}'[^']{0,20}'\s*=\s*'[^']{0,20}/i }, { id: "sql-tautology-numeric", description: "Numeric tautology: OR 1=1", pattern: /\bOR\s{1,10}1\s*=\s*1\b/i }, { id: "sql-always-true-zero", description: "Numeric tautology: OR 0=0", pattern: /\bOR\s{1,10}0\s*=\s*0\b/i }, { id: "sql-sleep-benchmark", description: "Time-based blind injection: SLEEP() or BENCHMARK()", pattern: /\b(?:SLEEP|BENCHMARK)\s*\(/i }, { id: "sql-waitfor-delay", description: "MSSQL time-based blind injection: WAITFOR DELAY", pattern: /\bWAITFOR\s{1,20}DELAY\b/i }, { id: "sql-char-function", description: "CHAR() function \u2014 used to obfuscate injected strings", pattern: /\bCHAR\s*\(\s*\d{1,3}/i }, { id: "sql-information-schema", description: "INFORMATION_SCHEMA \u2014 reconnaissance query for table/column enumeration", pattern: /\bINFORMATION_SCHEMA\b/i }], yt = [...bt, { id: "sql-line-comment", description: "SQL line comment: -- followed by whitespace or end of string", pattern: /--(?:\s|$)/ }, { id: "sql-stacked-query", description: "Stacked queries: semicolon immediately followed by a SQL keyword", pattern: /;\s{0,10}(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b/i }, { id: "sql-hex-encoding", description: "Hex-encoded string injection: 0x41414141 style (MySQL)", pattern: /\b0x[0-9a-f]{4,}/i }], Nt = [{ id: "html-script-open", description: "<script opening tag", pattern: /<script[\s>/]/i }, { id: "html-script-close", description: "<\/script closing tag", pattern: /<\/script[\s>]/i }, { id: "html-javascript-protocol", description: "javascript: URI scheme (with optional whitespace/encoding)", pattern: /j[\t\n\r ]*a[\t\n\r ]*v[\t\n\r ]*a[\t\n\r ]*s[\t\n\r ]*c[\t\n\r ]*r[\t\n\r ]*i[\t\n\r ]*p[\t\n\r ]*t[\t\n\r ]*:/i }, { id: "html-vbscript-protocol", description: "vbscript: URI scheme", pattern: /vbscript[\t\n\r ]*:/i }, { id: "html-data-html", description: "data:text/html URI \u2014 can execute scripts in browsers", pattern: /data[\t\n\r ]*:[\t\n\r ]*text\/html/i }, { id: "html-data-xhtml", description: "data:application/xhtml+xml URI", pattern: /data[\t\n\r ]*:[\t\n\r ]*application\/xhtml/i }, { id: "html-data-svg", description: "data:image/svg+xml URI \u2014 can execute scripts", pattern: /data[\t\n\r ]*:[\t\n\r ]*image\/svg\+xml/i }, { id: "html-inline-event-handler", description: "Inline event handler attributes: onclick=, onerror=, onload=, etc.", pattern: /\bon\w{1,30}\s*=/i }, { id: "html-entity-obfuscated-script", description: "HTML-entity-encoded <script (e.g. &#x3C;script or &lt;script)", pattern: /(?:&#x0*3[Cc];?|&#0*60;?|&lt;)\s*script/i }, { id: "html-entity-obfuscated-javascript", description: 'HTML-entity-encoded javascript: (partial \u2014 catches common &#106; or &#x6a; for "j")', pattern: /(?:&#x0*6[Aa];?|&#0*106;?)\s*(?:&#x0*61;?|a)[\s\S]{0,80}script\s*:/i }, { id: "html-style-expression", description: "CSS expression() \u2014 IE-era code execution in style attributes", pattern: /style[\s\S]{0,20}expression\s*\(/i }, { id: "html-object-embed", description: "<object or <embed tags that can load active content", pattern: /<(?:object|embed)[\s>/]/i }, { id: "html-base-tag", description: "<base href= \u2014 can hijack all relative URLs on a page", pattern: /<base[\s>]/i }, { id: "html-meta-refresh", description: '<meta http-equiv="refresh" \u2014 can redirect users', pattern: /<meta[\s\S]{0,40}http-equiv[\s\S]{0,20}refresh/i }, { id: "html-srcdoc", description: "srcdoc= attribute on iframes \u2014 embeds HTML that can run scripts", pattern: /srcdoc\s*=/i }, { id: "html-iframe", description: "<iframe tag", pattern: /<iframe[\s>/]/i }, { id: "html-form", description: "<form tag \u2014 can be used for phishing / credential harvesting injection", pattern: /<form[\s>/]/i }], Et = [{ id: "xml-cdata-injection", description: "CDATA section injection: <![CDATA[ breaks out of text node context", pattern: /<!\[CDATA\[/i }, { id: "xml-cdata-close", description: "CDATA close sequence: ]]> can terminate an enclosing CDATA section", pattern: /\]\]>/ }, { id: "xml-processing-instruction", description: "XML processing instruction: <?xml-stylesheet or <?php etc.", pattern: /<\?(?:xml[\- ]|php|asp)/i }, { id: "xml-doctype-injection", description: "DOCTYPE declaration embedded in content \u2014 can define entities", pattern: /<!DOCTYPE(?:[\s[]|$)/i }, { id: "xml-entity-system", description: "SYSTEM keyword \u2014 used in external entity declarations (XXE)", pattern: /\bSYSTEM\s+["']/i }, { id: "xml-entity-public", description: "PUBLIC keyword \u2014 used in external entity declarations (XXE)", pattern: /\bPUBLIC\s+["']/i }, { id: "xml-entity-declaration", description: "<!ENTITY declaration \u2014 defines entities, potential XXE or entity expansion", pattern: /<!ENTITY[\s%]/i }, { id: "xml-billion-laughs", description: "Entity reference chaining / billion laughs: repeated &eX; style references", pattern: /(?:&\w{1,20};){3,}/ }, { id: "xml-namespace-confusion", description: "xmlns: attribute injection \u2014 can redefine namespaces to confuse parsers", pattern: /\bxmlns\s*(?::\w{1,40})?\s*=/i }, { id: "xml-comment-injection", description: "<!-- comment injection \u2014 can hide content from some parsers", pattern: /<!--/ }, { id: "xml-comment-close", description: "--> closes an enclosing XML comment", pattern: /-->/ }, { id: "xml-pi-close", description: "?> closes an enclosing processing instruction", pattern: /\?>/ }], wt = [{ id: "svg-script-element", description: "<script element inside SVG executes JavaScript", pattern: /<script[\s>/]/i }, { id: "svg-xlink-href-javascript", description: "xlink:href with javascript: \u2014 classic SVG XSS via <a> or <use>", pattern: /xlink\s*:\s*href\s*=\s*["']?\s*javascript\s*:/i }, { id: "svg-href-javascript", description: "href= with javascript: in SVG context (<a>, <animate>, etc.)", pattern: /href\s*=\s*["']?\s*javascript\s*:/i }, { id: "svg-foreignobject", description: "<foreignObject embeds HTML inside SVG \u2014 can execute scripts", pattern: /<foreignObject[\s>/]/i }, { id: "svg-use-external", description: "<use xlink:href or href pointing to external resource (non-fragment URL)", pattern: /<use[\s\S]{0,60}(?:xlink\s*:\s*)?href\s*=\s*(?:["'][^#]|[^"'#\s>])/i }, { id: "svg-animate-href", description: '<animate attributeName="href" \u2014 can dynamically change href to javascript:', pattern: /<animate[\s\S]{0,80}attributeName\s*=\s*["'][\s]*href["']/i }, { id: "svg-animate-xlinkhref", description: '<animate attributeName="xlink:href"', pattern: /<animate[\s\S]{0,80}attributeName\s*=\s*["'][\s]*xlink\s*:\s*href["']/i }, { id: "svg-set-javascript", description: '<set to="javascript:..." \u2014 sets an attribute to a javascript: URI', pattern: /<set[\s\S]{0,80}to\s*=\s*["']?\s*javascript\s*:/i }, { id: "svg-event-handler", description: "SVG-specific event handler attributes: onload=, onerror=, onactivate=, etc.", pattern: /\bon(?:load|error|activate|begin|end|repeat|focus|blur|click|mouse\w{1,20}|key\w{1,20})\s*=/i }, { id: "svg-handler-generic", description: "Generic on* handler catch-all for SVG attributes", pattern: /\bon\w{1,30}\s*=/i }, { id: "svg-filter-feimage", description: "<feImage href= \u2014 filter primitive that can load external resources", pattern: /<feImage[\s\S]{0,80}(?:xlink\s*:\s*)?href\s*=/i }, { id: "svg-image-external", description: "<image xlink:href with http/https or javascript protocol", pattern: /<image[\s\S]{0,80}(?:xlink\s*:\s*)?href\s*=\s*["']?\s*(?:https?|javascript)\s*:/i }, { id: "svg-style-javascript", description: "style= attribute containing javascript: (e.g. background:url(javascript:...))", pattern: /style\s*=[\s\S]{0,60}javascript\s*:/i }], vt = [{ id: "shell-path-traversal-unix", description: "Unix path traversal: ../  \u2014 climbing the directory tree", pattern: /\.\.\// }, { id: "shell-path-traversal-windows", description: "Windows path traversal: ..\\ \u2014 climbing the directory tree", pattern: /\.\.\\/ }, { id: "shell-path-traversal-encoded", description: "URL-encoded path traversal: %2e%2e or %2f variants", pattern: /%2e%2e|%2f\.\.|\.\.%2f/i }, { id: "shell-null-byte", description: "Null byte injection: \\x00 or %00 \u2014 truncates strings in C-backed functions", pattern: /\x00|%00/ }, { id: "shell-semicolon", description: "Semicolon command separator: cmd1; cmd2", pattern: /;/ }, { id: "shell-pipe", description: "Pipe operator: cmd1 | cmd2", pattern: /\|/ }, { id: "shell-and-operator", description: "AND operator: cmd1 && cmd2", pattern: /&&/ }, { id: "shell-or-operator", description: "OR operator: cmd1 || cmd2", pattern: /\|\|/ }, { id: "shell-backtick", description: "Backtick command substitution: `cmd`", pattern: /`/ }, { id: "shell-dollar-paren", description: "Dollar-paren command substitution: $(cmd)", pattern: /\$\(/ }, { id: "shell-dollar-brace", description: "Dollar-brace variable expansion: ${var} \u2014 can be abused for injection", pattern: /\$\{/ }, { id: "shell-redirect-out", description: "Output redirection: cmd > file or cmd >> file", pattern: />{1,2}/ }, { id: "shell-redirect-in", description: "Input redirection: cmd < file", pattern: /</ }, { id: "shell-newline-injection", description: "Newline injection: \\n or \\r \u2014 can inject new shell commands", pattern: /[\n\r]/ }, { id: "shell-glob-star", description: "Glob expansion: * or ? \u2014 can expand to unintended files", pattern: /[/\\][*?]/ }, { id: "shell-absolute-root", description: "Absolute root path injection: string starting with / or \\ (Windows UNC)", pattern: /^(?:\/|\\\\)/ }, { id: "shell-windows-drive", description: "Windows drive letter path injection: C:\\ or D:/", pattern: /^[a-zA-Z]:[/\\]/ }, { id: "shell-curl-wget", description: "curl/wget with URL or flags \u2014 can exfiltrate data or download payloads", pattern: /\b(?:curl|wget)\s+(?:https?:\/\/|ftp:\/\/|-)/i }], St = [{ id: "redos-nested-quantifier-plus", description: "Nested + quantifier inside a group with outer quantifier: (a+)+, (.+b)*, etc.", pattern: /\([^)]*\+[^)]*\)[+*]/ }, { id: "redos-nested-quantifier-star", description: "Nested * quantifier: (a*)* or (a*)+ \u2014 catastrophic backtracking", pattern: /\([^)]*\*[^)]*\)[*+]/ }, { id: "redos-nested-groups", description: "Doubly nested quantified groups: ((a+)+) \u2014 guaranteed catastrophic", pattern: /\(\([^)]{0,40}\)[+*]\)[+*]/ }, { id: "redos-alternation-overlap", description: "Overlapping alternation under quantifier: (a|a)+ \u2014 ambiguous NFA paths", pattern: /\(([^|()]{1,20})\|(?:\1)(?:\|[^|()]{1,20}){0,5}\)[+*?]{1,2}/ }, { id: "redos-star-plus-concat", description: "(x*x)+ pattern \u2014 triggers super-linear backtracking", pattern: /\([^)]{0,10}\*[^)]{0,10}\)[+*]/ }, { id: "redos-dot-star-greedy", description: "(.*){n,} or (.+){n,} \u2014 repeated greedy dot quantifiers", pattern: /\(\.[*+]\)\{?\d/ }, { id: "redos-large-repetition", description: "Very large fixed or range repetition count {1000,} or {1000,n} \u2014 denial of service via backtracking", pattern: /\{\d{4,}(?:,\d*)?\}/ }, { id: "redos-catastrophic-alternation", description: "Long alternation with many similar branches \u2014 polynomial backtracking risk", pattern: /\([^)]{0,200}(?:\|[^|)]{0,50}){9,}\)/ }], At = `["'\\s]*:`, Tt = [{ id: "nosql-where-operator", description: "$where \u2014 executes arbitrary JavaScript server-side in MongoDB", pattern: new RegExp(`\\$where${At}`, "i") }, { id: "nosql-ne-operator", description: '$ne \u2014 "not equal" operator used to bypass equality checks', pattern: new RegExp(`\\$ne${At}`, "i") }, { id: "nosql-gt-operator", description: '$gt \u2014 "greater than" used to bypass password/value checks', pattern: new RegExp(`\\$gte?${At}`, "i") }, { id: "nosql-lt-operator", description: '$lt / $lte \u2014 "less than" bypass variants', pattern: new RegExp(`\\$lte?${At}`, "i") }, { id: "nosql-regex-operator", description: "$regex \u2014 can be used to extract data character by character (blind injection)", pattern: new RegExp(`\\$regex${At}`, "i") }, { id: "nosql-or-operator", description: "$or \u2014 logical OR; used to create always-true conditions", pattern: new RegExp(`\\$or${At}\\s*\\[`, "i") }, { id: "nosql-and-operator", description: "$and \u2014 logical AND operator injection", pattern: new RegExp(`\\$and${At}\\s*\\[`, "i") }, { id: "nosql-nor-operator", description: "$nor \u2014 logical NOR operator injection", pattern: new RegExp(`\\$nor${At}\\s*\\[`, "i") }, { id: "nosql-exists-operator", description: "$exists \u2014 can enumerate fields to determine schema", pattern: new RegExp(`\\$exists${At}`, "i") }, { id: "nosql-in-operator", description: "$in \u2014 matches any value in a list; can enumerate values", pattern: new RegExp(`\\$in${At}\\s*\\[`, "i") }, { id: "nosql-expr-operator", description: "$expr \u2014 allows aggregation expressions in queries (MongoDB 3.6+)", pattern: new RegExp(`\\$expr${At}`, "i") }, { id: "nosql-function-operator", description: "$function \u2014 executes arbitrary JavaScript in MongoDB 4.4+", pattern: new RegExp(`\\$function${At}`, "i") }, { id: "nosql-accumulator-operator", description: "$accumulator \u2014 custom aggregation with arbitrary JS execution", pattern: new RegExp(`\\$accumulator${At}`, "i") }, { id: "nosql-proto-pollution", description: "__proto__ \u2014 prototype pollution via object key injection", pattern: /__proto__/ }, { id: "nosql-constructor-prototype", description: "constructor.prototype \u2014 alternative prototype pollution vector (dot notation or JSON key)", pattern: /constructor[\s"':.,{\[]*prototype/i }, { id: "nosql-proto-bracket", description: '["__proto__"] \u2014 bracket-notation prototype pollution', pattern: /\[["']__proto__["']\]/ }], _t = [{ id: "log-crlf-injection", description: "CRLF injection: literal \\r or \\n embeds fake log lines", pattern: /[\r\n]/ }, { id: "log-url-encoded-crlf", description: "URL-encoded CRLF: %0d, %0a, %0D, %0A \u2014 decoded by some log parsers", pattern: /%0[dDaA]/ }, { id: "log-unicode-newline", description: "Unicode newline variants: U+2028 (line separator), U+2029 (paragraph separator)", pattern: /[\u2028\u2029]/ }, { id: "log-log4shell-jndi", description: "Log4Shell: ${jndi:...} triggers remote code execution in Apache Log4j", pattern: /\$\{jndi\s*:/i }, { id: "log-log4shell-obfuscated", description: "Obfuscated Log4Shell: ${::-j}... lookup-bypass prefix used to evade WAF detection", pattern: /\$\{::-/ }, { id: "log-log4j-lookup", description: "Log4j lookup syntax: ${env:...}, ${sys:...}, ${ctx:...} \u2014 data exfiltration", pattern: /\$\{(?:env|sys|ctx|main|map|sd|web|docker|k8s|spring)\s*:/i }, { id: "log-ssti-double-brace", description: "SSTI double-brace: {{expression}} \u2014 Jinja2, Twig, Handlebars, etc.", pattern: /\{\{[\s\S]{0,80}\}\}/ }, { id: "log-ssti-hash-brace", description: "SSTI hash-brace: #{expression} \u2014 Thymeleaf, Velocity, Ruby ERB", pattern: /#\{[\s\S]{0,80}\}/ }, { id: "log-ssti-dollar-brace", description: "SSTI/EL injection: ${expression with operators or method calls} \u2014 JSP EL, Freemarker, SpEL", pattern: /\$\{[^}]*(?:\.|\(|\*|\+|\bclass\b|\bruntime\b|\bprocess\b|\bexec\b)[^}]{0,80}\}/i }, { id: "log-ssti-percent-tag", description: "SSTI ERB/ASP tag: <%= expression %> \u2014 Ruby ERB, ASP", pattern: /<%=[\s\S]{0,80}%>/ }, { id: "log-null-byte", description: "Null byte: \\x00 or %00 \u2014 can truncate log entries in C-backed loggers", pattern: /\x00|%00/ }, { id: "log-ansi-escape", description: "ANSI escape sequence: ESC[ \u2014 can manipulate terminal output when logs are tailed", pattern: /\x1b\[/ }];
      function Ct(t2, e2) {
        const i2 = e2.label ?? "CUSTOM";
        for (const n2 of e2) if (n2.pattern.test(t2)) return { context: i2, id: n2.id, description: n2.description, pattern: n2.pattern };
        return null;
      }
      __name(Ct, "Ct");
      function $t(t2, e2) {
        (function(t3) {
          if ("string" != typeof t3) throw new TypeError("is-unsafe: first argument must be a string, got " + typeof t3);
        })(t2), (function(t3) {
          if (!(t3 instanceof RegExp)) {
            if (!Array.isArray(t3)) throw new TypeError("is-unsafe: second argument must be a PatternList (e.g. HTML), an array of PatternLists (e.g. [HTML, XML]), or a RegExp. Got: " + typeof t3);
            if (0 === t3.length) throw new TypeError("is-unsafe: context must not be an empty array");
            if (Array.isArray(t3[0])) {
              for (const e3 of t3) if (!Array.isArray(e3) || 0 === e3.length) throw new TypeError("is-unsafe: each context in the array must be a non-empty pattern array (PatternList)");
            }
          }
        })(e2);
        const { lists: i2, regex: n2 } = (function(t3) {
          return t3 instanceof RegExp ? { lists: null, regex: t3 } : Array.isArray(t3[0]) ? { lists: t3, regex: null } : { lists: [t3], regex: null };
        })(e2);
        if (n2) return n2.test(t2);
        for (const e3 of i2) if (null !== Ct(t2, e3)) return true;
        return false;
      }
      __name($t, "$t");
      function Pt(t2, e2) {
        if (!t2) return {};
        const i2 = e2.attributesGroupName ? t2[e2.attributesGroupName] : t2;
        if (!i2) return {};
        const n2 = {};
        for (const t3 in i2) t3.startsWith(e2.attributeNamePrefix) ? n2[t3.substring(e2.attributeNamePrefix.length)] = i2[t3] : n2[t3] = i2[t3];
        return n2;
      }
      __name(Pt, "Pt");
      function Ot(t2) {
        if (!t2 || "string" != typeof t2) return;
        const e2 = t2.indexOf(":");
        if (-1 !== e2 && e2 > 0) {
          const i2 = t2.substring(0, e2);
          if ("xmlns" !== i2) return i2;
        }
      }
      __name(Ot, "Ot");
      Nt.label = "HTML", Et.label = "XML", wt.label = "SVG", bt.label = "SQL", yt.label = "SQL-STRICT", vt.label = "SHELL", St.label = "REDOS", Tt.label = "NOSQL", _t.label = "LOG", Object.freeze({ HTML: Nt, XML: Et, SVG: wt, SQL: bt, "SQL-STRICT": yt, SHELL: vt, REDOS: St, NOSQL: Tt, LOG: _t });
      class It {
        static {
          __name(this, "It");
        }
        constructor(t2, e2) {
          var i2;
          this.options = t2, this.currentNode = null, this.tagsNodeStack = [], this.parseXml = Mt, this.parseTextData = jt, this.resolveNameSpace = kt, this.buildAttributesMap = Dt, this.isItStopNode = Ut, this.replaceEntitiesValue = Vt, this.readStopNodeData = Xt, this.saveTextToParentTag = qt, this.addChild = Rt, this.ignoreAttributesFn = "function" == typeof (i2 = this.options.ignoreAttributes) ? i2 : Array.isArray(i2) ? (t3) => {
            for (const e3 of i2) {
              if ("string" == typeof e3 && t3 === e3) return true;
              if (e3 instanceof RegExp && e3.test(t3)) return true;
            }
          } : () => false, this.entityExpansionCount = 0, this.currentExpandedLength = 0, this.doctypefound = false;
          let n2 = { ...ot };
          this.options.entityDecoder ? this.entityDecoder = this.options.entityDecoder : ("object" == typeof this.options.htmlEntities ? n2 = this.options.htmlEntities : true === this.options.htmlEntities && (n2 = { ...at, ...st }), this.entityDecoder = new xt({ namedEntities: { ...n2, ...e2 }, numericAllowed: this.options.htmlEntities, limit: { maxTotalExpansions: this.options.processEntities.maxTotalExpansions, maxExpandedLength: this.options.processEntities.maxExpandedLength, applyLimitsTo: this.options.processEntities.appliesTo }, onInputEntity: /* @__PURE__ */ __name((t3, e3) => $t(e3, [Nt, Et]) ? lt.BLOCK : lt.ALLOW, "onInputEntity") })), this.matcher = new it(), this.readonlyMatcher = this.matcher.readOnly(), this.isCurrentNodeStopNode = false, this.stopNodeExpressionsSet = new rt();
          const r2 = this.options.stopNodes;
          if (r2 && r2.length > 0) {
            for (let t3 = 0; t3 < r2.length; t3++) {
              const e3 = r2[t3];
              "string" == typeof e3 ? this.stopNodeExpressionsSet.add(new nt(e3)) : e3 instanceof nt && this.stopNodeExpressionsSet.add(e3);
            }
            this.stopNodeExpressionsSet.seal();
          }
        }
      }
      function jt(t2, e2, i2, n2, r2, s2, o2) {
        const a2 = this.options;
        if (void 0 !== t2 && (a2.trimValues && !n2 && (t2 = t2.trim()), t2.length > 0)) {
          o2 || (t2 = this.replaceEntitiesValue(t2, e2, i2));
          const n3 = a2.jPath ? i2.toString() : i2, l2 = a2.tagValueProcessor(e2, t2, n3, r2, s2);
          return null == l2 ? t2 : typeof l2 != typeof t2 || l2 !== t2 ? l2 : a2.trimValues || t2.trim() === t2 ? Wt(t2, a2.parseTagValue, a2.numberParseOptions) : t2;
        }
      }
      __name(jt, "jt");
      function kt(t2) {
        if (this.options.removeNSPrefix) {
          const e2 = t2.split(":"), i2 = "/" === t2.charAt(0) ? "/" : "";
          if ("xmlns" === e2[0]) return "";
          2 === e2.length && (t2 = i2 + e2[1]);
        }
        return t2;
      }
      __name(kt, "kt");
      const Lt = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
      function Dt(t2, e2, i2, n2 = false) {
        const r2 = this.options;
        if (true === n2 || true !== r2.ignoreAttributes && "string" == typeof t2) {
          const n3 = (function(t3, e3) {
            const i3 = [];
            let n4 = e3.exec(t3);
            for (; n4; ) {
              const r3 = [];
              r3.startIndex = e3.lastIndex - n4[0].length;
              const s3 = n4.length;
              for (let t4 = 0; t4 < s3; t4++) r3.push(n4[t4]);
              i3.push(r3), n4 = e3.exec(t3);
            }
            return i3;
          })(t2, Lt), s2 = n3.length, o2 = {}, a2 = new Array(s2);
          let l2 = false;
          const p2 = {};
          for (let t3 = 0; t3 < s2; t3++) {
            const e3 = this.resolveNameSpace(n3[t3][1]), s3 = n3[t3][4];
            if (e3.length && void 0 !== s3) {
              let n4 = s3;
              r2.trimValues && (n4 = n4.trim()), n4 = this.replaceEntitiesValue(n4, i2, this.readonlyMatcher), a2[t3] = n4, p2[e3] = n4, l2 = true;
            }
          }
          l2 && "object" == typeof e2 && e2.updateCurrent && e2.updateCurrent(p2);
          const c2 = r2.jPath ? e2.toString() : this.readonlyMatcher;
          let h2 = false;
          for (let t3 = 0; t3 < s2; t3++) {
            const e3 = this.resolveNameSpace(n3[t3][1]);
            if (this.ignoreAttributesFn(e3, c2)) continue;
            let i3 = r2.attributeNamePrefix + e3;
            if (e3.length) if (r2.transformAttributeName && (i3 = r2.transformAttributeName(i3)), i3 = Yt(i3, r2), void 0 !== n3[t3][4]) {
              const n4 = a2[t3], s3 = r2.attributeValueProcessor(e3, n4, c2);
              o2[i3] = null == s3 ? n4 : typeof s3 != typeof n4 || s3 !== n4 ? s3 : Wt(n4, r2.parseAttributeValue, r2.numberParseOptions), h2 = true;
            } else r2.allowBooleanAttributes && (o2[i3] = true, h2 = true);
          }
          if (!h2) return;
          if (r2.attributesGroupName && !r2.preserveOrder) {
            const t3 = {};
            return t3[r2.attributesGroupName] = o2, t3;
          }
          return o2;
        }
      }
      __name(Dt, "Dt");
      const Mt = /* @__PURE__ */ __name(function(t2) {
        t2 = t2.replace(/\r\n?/g, "\n");
        const e2 = new C("!xml");
        let i2 = e2, n2 = "";
        this.matcher.reset(), this.entityDecoder.reset(), this.entityExpansionCount = 0, this.currentExpandedLength = 0, this.doctypefound = false;
        const r2 = this.options, s2 = new R(r2.processEntities), o2 = t2.length;
        for (let a2 = 0; a2 < o2; a2++) if ("<" === t2[a2]) {
          const l2 = t2.charCodeAt(a2 + 1);
          if (47 === l2) {
            const s3 = Bt(t2, ">", a2, "Closing Tag is not closed.");
            let o3 = t2.substring(a2 + 2, s3).trim();
            if (r2.removeNSPrefix) {
              const t3 = o3.indexOf(":");
              -1 !== t3 && (o3 = o3.substr(t3 + 1));
            }
            o3 = zt(r2.transformTagName, o3, "", r2).tagName, i2 && (n2 = this.saveTextToParentTag(n2, i2, this.readonlyMatcher));
            const l3 = this.matcher.getCurrentTag();
            if (o3 && r2.unpairedTagsSet.has(o3)) throw new Error(`Unpaired tag can not be used as closing tag: </${o3}>`);
            l3 && r2.unpairedTagsSet.has(l3) && (this.matcher.pop(), this.tagsNodeStack.pop()), this.matcher.pop(), this.isCurrentNodeStopNode = false, i2 = this.tagsNodeStack.pop() || e2, r2.captureMetaData && i2 && i2.addEndIndex(s3 + 1), n2 = "", a2 = s3;
          } else if (63 === l2) {
            let e3 = Gt(t2, a2, false, "?>");
            if (!e3) throw new Error("Pi Tag is not closed.");
            n2 = this.saveTextToParentTag(n2, i2, this.readonlyMatcher);
            const o3 = this.buildAttributesMap(e3.tagExp, this.matcher, e3.tagName, true);
            if (o3) {
              const t3 = o3[this.options.attributeNamePrefix + "version"];
              this.entityDecoder.setXmlVersion(Number(t3) || 1), s2.setXmlVersion(Number(t3) || 1);
            }
            if (r2.ignoreDeclaration && "?xml" === e3.tagName || r2.ignorePiTags) ;
            else {
              const t3 = new C(e3.tagName);
              t3.add(r2.textNodeName, ""), e3.tagName !== e3.tagExp && e3.attrExpPresent && true !== r2.ignoreAttributes && (t3[":@"] = o3), this.addChild(i2, t3, this.readonlyMatcher, a2), r2.captureMetaData && i2.addEndIndex(e3.closeIndex + 2);
            }
            a2 = e3.closeIndex + 1;
          } else if (33 === l2 && 45 === t2.charCodeAt(a2 + 2) && 45 === t2.charCodeAt(a2 + 3)) {
            const e3 = Bt(t2, "-->", a2 + 4, "Comment is not closed.");
            if (r2.commentPropName) {
              const s3 = t2.substring(a2 + 4, e3 - 2);
              n2 = this.saveTextToParentTag(n2, i2, this.readonlyMatcher), i2.add(r2.commentPropName, [{ [r2.textNodeName]: s3 }]);
            }
            a2 = e3;
          } else if (33 === l2 && 68 === t2.charCodeAt(a2 + 2)) {
            if (this.doctypefound) throw new Error("Multiple DOCTYPE declarations found.");
            this.doctypefound = true;
            const e3 = s2.readDocType(t2, a2);
            this.entityDecoder.addInputEntities(e3.entities), a2 = e3.i;
          } else if (33 === l2 && 91 === t2.charCodeAt(a2 + 2)) {
            const e3 = Bt(t2, "]]>", a2, "CDATA is not closed.") - 2, s3 = t2.substring(a2 + 9, e3);
            n2 = this.saveTextToParentTag(n2, i2, this.readonlyMatcher);
            let o3 = this.parseTextData(s3, i2.tagname, this.readonlyMatcher, true, false, true, true);
            null == o3 && (o3 = ""), r2.cdataPropName ? i2.add(r2.cdataPropName, [{ [r2.textNodeName]: s3 }]) : i2.add(r2.textNodeName, o3), a2 = e3 + 2;
          } else {
            let s3 = Gt(t2, a2, r2.removeNSPrefix);
            if (!s3) {
              const e3 = t2.substring(Math.max(0, a2 - 50), Math.min(o2, a2 + 50));
              throw new Error(`readTagExp returned undefined at position ${a2}. Context: "${e3}"`);
            }
            let l3 = s3.tagName;
            const p2 = s3.rawTagName;
            let c2 = s3.tagExp, h2 = s3.attrExpPresent, d2 = s3.closeIndex;
            if ({ tagName: l3, tagExp: c2 } = zt(r2.transformTagName, l3, c2, r2), r2.strictReservedNames && (l3 === r2.commentPropName || l3 === r2.cdataPropName || l3 === r2.textNodeName || l3 === r2.attributesGroupName)) throw new Error(`Invalid tag name: ${l3}`);
            i2 && n2 && "!xml" !== i2.tagname && (n2 = this.saveTextToParentTag(n2, i2, this.readonlyMatcher, false));
            const u2 = i2;
            u2 && r2.unpairedTagsSet.has(u2.tagname) && (i2 = this.tagsNodeStack.pop(), this.matcher.pop());
            let f2 = false;
            c2.length > 0 && c2.lastIndexOf("/") === c2.length - 1 && (f2 = true, "/" === l3[l3.length - 1] ? (l3 = l3.substr(0, l3.length - 1), c2 = l3) : c2 = c2.substr(0, c2.length - 1), h2 = l3 !== c2);
            let g2, m2 = null, x2 = {};
            g2 = Ot(p2), l3 !== e2.tagname && this.matcher.push(l3, {}, g2), l3 !== c2 && h2 && (m2 = this.buildAttributesMap(c2, this.matcher, l3), m2 && (x2 = Pt(m2, r2))), l3 !== e2.tagname && (this.isCurrentNodeStopNode = this.isItStopNode());
            const b2 = a2;
            if (this.isCurrentNodeStopNode) {
              let e3 = "";
              if (f2) a2 = s3.closeIndex;
              else if (r2.unpairedTagsSet.has(l3)) a2 = s3.closeIndex;
              else {
                const i3 = this.readStopNodeData(t2, p2, d2 + 1);
                if (!i3) throw new Error(`Unexpected end of ${p2}`);
                a2 = i3.i, e3 = i3.tagContent;
              }
              const n3 = new C(l3);
              m2 && (n3[":@"] = m2), n3.add(r2.textNodeName, e3), this.matcher.pop(), this.isCurrentNodeStopNode = false, this.addChild(i2, n3, this.readonlyMatcher, b2), r2.captureMetaData && i2.addEndIndex(a2 + 1);
            } else {
              if (f2) {
                ({ tagName: l3, tagExp: c2 } = zt(r2.transformTagName, l3, c2, r2));
                const t3 = new C(l3);
                m2 && (t3[":@"] = m2), this.addChild(i2, t3, this.readonlyMatcher, b2), r2.captureMetaData && i2.addEndIndex(d2 + 1), this.matcher.pop(), this.isCurrentNodeStopNode = false;
              } else {
                if (r2.unpairedTagsSet.has(l3)) {
                  const t3 = new C(l3);
                  m2 && (t3[":@"] = m2), this.addChild(i2, t3, this.readonlyMatcher, b2), r2.captureMetaData && i2.addEndIndex(s3.closeIndex + 1), this.matcher.pop(), this.isCurrentNodeStopNode = false, a2 = s3.closeIndex;
                  continue;
                }
                {
                  const t3 = new C(l3);
                  if (this.tagsNodeStack.length > r2.maxNestedTags) throw new Error("Maximum nested tags exceeded");
                  this.tagsNodeStack.push(i2), m2 && (t3[":@"] = m2), this.addChild(i2, t3, this.readonlyMatcher, b2), i2 = t3;
                }
              }
              n2 = "", a2 = d2;
            }
          }
        } else n2 += t2[a2];
        return e2.child;
      }, "Mt");
      function Rt(t2, e2, i2, n2) {
        this.options.captureMetaData || (n2 = void 0);
        const r2 = this.options.jPath ? i2.toString() : i2, s2 = this.options.updateTag(e2.tagname, r2, e2[":@"]);
        false === s2 || ("string" == typeof s2 ? (e2.tagname = s2, t2.addChild(e2, n2)) : t2.addChild(e2, n2));
      }
      __name(Rt, "Rt");
      function Vt(t2, e2, i2) {
        const n2 = this.options.processEntities;
        if (!n2 || !n2.enabled) return t2;
        if (n2.allowedTags) {
          const r2 = this.options.jPath ? i2.toString() : i2;
          if (!(Array.isArray(n2.allowedTags) ? n2.allowedTags.includes(e2) : n2.allowedTags(e2, r2))) return t2;
        }
        if (n2.tagFilter) {
          const r2 = this.options.jPath ? i2.toString() : i2;
          if (!n2.tagFilter(e2, r2)) return t2;
        }
        return this.entityDecoder.decode(t2);
      }
      __name(Vt, "Vt");
      function qt(t2, e2, i2, n2) {
        return t2 && (void 0 === n2 && (n2 = 0 === e2.child.length), void 0 !== (t2 = this.parseTextData(t2, e2.tagname, i2, false, !!e2[":@"] && 0 !== Object.keys(e2[":@"]).length, n2)) && "" !== t2 && e2.add(this.options.textNodeName, t2), t2 = ""), t2;
      }
      __name(qt, "qt");
      function Ut() {
        return 0 !== this.stopNodeExpressionsSet.size && this.matcher.matchesAny(this.stopNodeExpressionsSet);
      }
      __name(Ut, "Ut");
      function Bt(t2, e2, i2, n2) {
        const r2 = t2.indexOf(e2, i2);
        if (-1 === r2) throw new Error(n2);
        return r2 + e2.length - 1;
      }
      __name(Bt, "Bt");
      function Ft(t2, e2, i2, n2) {
        const r2 = t2.indexOf(e2, i2);
        if (-1 === r2) throw new Error(n2);
        return r2;
      }
      __name(Ft, "Ft");
      function Gt(t2, e2, i2, n2 = ">") {
        const r2 = (function(t3, e3, i3 = ">") {
          let n3 = 0;
          const r3 = t3.length, s3 = i3.charCodeAt(0), o3 = i3.length > 1 ? i3.charCodeAt(1) : -1;
          let a3 = "", l3 = e3;
          for (let i4 = e3; i4 < r3; i4++) {
            const e4 = t3.charCodeAt(i4);
            if (n3) e4 === n3 && (n3 = 0);
            else if (34 === e4 || 39 === e4) n3 = e4;
            else if (e4 === s3) {
              if (-1 === o3) return a3 += t3.substring(l3, i4), { data: a3, index: i4 };
              if (t3.charCodeAt(i4 + 1) === o3) return a3 += t3.substring(l3, i4), { data: a3, index: i4 };
            } else 9 !== e4 || n3 || (a3 += t3.substring(l3, i4) + " ", l3 = i4 + 1);
          }
        })(t2, e2 + 1, n2);
        if (!r2) return;
        let s2 = r2.data;
        const o2 = r2.index, a2 = s2.search(/\s/);
        let l2 = s2, p2 = true;
        -1 !== a2 && (l2 = s2.substring(0, a2), s2 = s2.substring(a2 + 1).trimStart());
        const c2 = l2;
        if (i2) {
          const t3 = l2.indexOf(":");
          -1 !== t3 && (l2 = l2.substr(t3 + 1), p2 = l2 !== r2.data.substr(t3 + 1));
        }
        return { tagName: l2, tagExp: s2, closeIndex: o2, attrExpPresent: p2, rawTagName: c2 };
      }
      __name(Gt, "Gt");
      function Xt(t2, e2, i2) {
        const n2 = i2;
        let r2 = 1;
        const s2 = t2.length;
        for (; i2 < s2; i2++) if ("<" === t2[i2]) {
          const s3 = t2.charCodeAt(i2 + 1);
          if (47 === s3) {
            const s4 = Ft(t2, ">", i2, `${e2} is not closed`);
            if (t2.substring(i2 + 2, s4).trim() === e2 && (r2--, 0 === r2)) return { tagContent: t2.substring(n2, i2), i: s4 };
            i2 = s4;
          } else if (63 === s3) i2 = Bt(t2, "?>", i2 + 1, "StopNode is not closed.");
          else if (33 === s3 && 45 === t2.charCodeAt(i2 + 2) && 45 === t2.charCodeAt(i2 + 3)) i2 = Bt(t2, "-->", i2 + 3, "StopNode is not closed.");
          else if (33 === s3 && 91 === t2.charCodeAt(i2 + 2)) i2 = Bt(t2, "]]>", i2, "StopNode is not closed.") - 2;
          else {
            const n3 = Gt(t2, i2, false);
            n3 && ((n3 && n3.tagName) === e2 && "/" !== n3.tagExp[n3.tagExp.length - 1] && r2++, i2 = n3.closeIndex);
          }
        }
      }
      __name(Xt, "Xt");
      function Wt(t2, e2, i2) {
        if (e2 && "string" == typeof t2) {
          const e3 = t2.trim();
          return "true" === e3 || "false" !== e3 && Z(t2, i2);
        }
        return void 0 !== t2 ? t2 : "";
      }
      __name(Wt, "Wt");
      function zt(t2, e2, i2, n2) {
        if (t2) {
          const n3 = t2(e2);
          i2 === e2 && (i2 = n3), e2 = n3;
        }
        return { tagName: e2 = Yt(e2, n2), tagExp: i2 };
      }
      __name(zt, "zt");
      function Yt(t2, e2) {
        if (o.includes(t2)) throw new Error(`[SECURITY] Invalid name: "${t2}" is a reserved JavaScript keyword that could cause prototype pollution`);
        return s.includes(t2) ? e2.onDangerousProperty(t2) : t2;
      }
      __name(Yt, "Yt");
      const Ht = C.getMetaDataSymbol();
      function Qt(t2, e2) {
        if (!t2 || "object" != typeof t2) return {};
        if (!e2) return t2;
        const i2 = {};
        for (const n2 in t2) n2.startsWith(e2) ? i2[n2.substring(e2.length)] = t2[n2] : i2[n2] = t2[n2];
        return i2;
      }
      __name(Qt, "Qt");
      function Jt(t2, e2, i2, n2) {
        return Zt(t2, e2, i2, n2);
      }
      __name(Jt, "Jt");
      function Zt(t2, e2, i2, n2) {
        let r2;
        const s2 = {};
        for (let o2 = 0; o2 < t2.length; o2++) {
          const a2 = t2[o2], l2 = Kt(a2);
          if (void 0 !== l2 && l2 !== e2.textNodeName) {
            const t3 = Qt(a2[":@"] || {}, e2.attributeNamePrefix);
            i2.push(l2, t3);
          }
          if (l2 === e2.textNodeName) void 0 === r2 ? r2 = a2[l2] : r2 += "" + a2[l2];
          else {
            if (void 0 === l2) continue;
            if (a2[l2]) {
              let t3 = Zt(a2[l2], e2, i2, n2);
              const r3 = ee(t3, e2);
              if (0 === Object.keys(t3).length && e2.alwaysCreateTextNode && (t3[e2.textNodeName] = ""), a2[":@"] ? te(t3, a2[":@"], n2, e2) : 1 !== Object.keys(t3).length || void 0 === t3[e2.textNodeName] || e2.alwaysCreateTextNode ? 0 === Object.keys(t3).length && (e2.alwaysCreateTextNode ? t3[e2.textNodeName] = "" : t3 = "") : t3 = t3[e2.textNodeName], void 0 !== a2[Ht] && "object" == typeof t3 && null !== t3 && (t3[Ht] = a2[Ht]), void 0 !== s2[l2] && Object.prototype.hasOwnProperty.call(s2, l2)) Array.isArray(s2[l2]) || (s2[l2] = [s2[l2]]), s2[l2].push(t3);
              else {
                const i3 = e2.jPath ? n2.toString() : n2;
                e2.isArray(l2, i3, r3) ? s2[l2] = [t3] : s2[l2] = t3;
              }
              void 0 !== l2 && l2 !== e2.textNodeName && i2.pop();
            }
          }
        }
        return "string" == typeof r2 ? r2.length > 0 && (s2[e2.textNodeName] = r2) : void 0 !== r2 && (s2[e2.textNodeName] = r2), s2;
      }
      __name(Zt, "Zt");
      function Kt(t2) {
        const e2 = Object.keys(t2);
        for (let t3 = 0; t3 < e2.length; t3++) {
          const i2 = e2[t3];
          if (":@" !== i2) return i2;
        }
      }
      __name(Kt, "Kt");
      function te(t2, e2, i2, n2) {
        if (e2) {
          const r2 = Object.keys(e2), s2 = r2.length;
          for (let o2 = 0; o2 < s2; o2++) {
            const s3 = r2[o2], a2 = s3.startsWith(n2.attributeNamePrefix) ? s3.substring(n2.attributeNamePrefix.length) : s3, l2 = n2.jPath ? i2.toString() + "." + a2 : i2;
            n2.isArray(s3, l2, true, true) ? t2[s3] = [e2[s3]] : t2[s3] = e2[s3];
          }
        }
      }
      __name(te, "te");
      function ee(t2, e2) {
        const { textNodeName: i2 } = e2, n2 = Object.keys(t2).length;
        return 0 === n2 || !(1 !== n2 || !t2[i2] && "boolean" != typeof t2[i2] && 0 !== t2[i2]);
      }
      __name(ee, "ee");
      class ie {
        static {
          __name(this, "ie");
        }
        constructor(t2) {
          this.externalEntities = {}, this.options = T(t2);
        }
        parse(t2, e2) {
          if ("string" != typeof t2 && t2.toString) t2 = t2 instanceof Uint8Array && ("undefined" == typeof Buffer || !Buffer.isBuffer(t2)) ? new TextDecoder("utf-8", { ignoreBOM: true }).decode(t2) : t2.toString();
          else if ("string" != typeof t2) throw new Error("XML data is accepted in String or Bytes[] form.");
          if (e2) {
            true === e2 && (e2 = {});
            const i3 = l(t2, e2);
            if (true !== i3) throw Error(`${i3.err.msg}:${i3.err.line}:${i3.err.col}`);
          }
          const i2 = new It(this.options, this.externalEntities), n2 = i2.parseXml(t2);
          return this.options.preserveOrder || void 0 === n2 ? n2 : Jt(n2, this.options, i2.matcher, i2.readonlyMatcher);
        }
        addEntity(t2, e2) {
          if (-1 !== e2.indexOf("&")) throw new Error("Entity value can't have '&'");
          if (-1 !== t2.indexOf("&") || -1 !== t2.indexOf(";")) throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
          if ("&" === e2) throw new Error("An entity with value '&' is not permitted");
          this.externalEntities[t2] = e2;
        }
        static getMetaDataSymbol() {
          return C.getMetaDataSymbol();
        }
      }
      function ne(t2) {
        return String(t2).replace(/--/g, "- -").replace(/--/g, "- -").replace(/-$/, "- ");
      }
      __name(ne, "ne");
      function re(t2) {
        return String(t2).replace(/\]\]>/g, "]]]]><![CDATA[>");
      }
      __name(re, "re");
      function se(t2) {
        return String(t2).replace(/"/g, "&quot;").replace(/'/g, "&apos;");
      }
      __name(se, "se");
      const oe = ":A-Za-z_\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u0486\u0488-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD", ae = ":A-Za-z_\xC0-\u02FF\u0370-\u037D\u037F-\u0486\u0488-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}", le = ae + "\\-\\.\\d\xB7\u0300-\u036F\u0487\u203F-\u2040", pe = /* @__PURE__ */ __name((t2, e2, i2 = "") => {
        const n2 = `[${t2.replace(":", "")}][${e2.replace(":", "")}]*`;
        return { name: new RegExp(`^[${t2}][${e2}]*$`, i2), ncName: new RegExp(`^${n2}$`, i2), qName: new RegExp(`^${n2}(?::${n2})?$`, i2), nmToken: new RegExp(`^[${e2}]+$`, i2), nmTokens: new RegExp(`^[${e2}]+(?:\\s+[${e2}]+)*$`, i2) };
      }, "pe"), ce = pe(oe, oe + "\\-\\.\\d\xB7\u0300-\u036F\u203F-\u2040"), he = pe(ae, le, "u"), de = /* @__PURE__ */ __name((t2, { xmlVersion: e2 = "1.0" } = {}) => (/* @__PURE__ */ ((t3 = "1.0") => "1.1" === t3 ? he : ce)(e2)).qName.test(t2), "de");
      function ue(t2, e2, i2, n2, r2) {
        return i2.sanitizeName ? de(t2, { xmlVersion: r2 }) ? t2 : i2.sanitizeName(t2, { isAttribute: e2, matcher: n2.readOnly() }) : t2;
      }
      __name(ue, "ue");
      function fe(t2, e2) {
        let i2 = "";
        e2.format && (i2 = "\n");
        const n2 = [];
        if (e2.stopNodes && Array.isArray(e2.stopNodes)) for (let t3 = 0; t3 < e2.stopNodes.length; t3++) {
          const i3 = e2.stopNodes[t3];
          "string" == typeof i3 ? n2.push(new nt(i3)) : i3 instanceof nt && n2.push(i3);
        }
        const r2 = (function(t3, e3) {
          if (!Array.isArray(t3) || 0 === t3.length) return "1.0";
          const i3 = t3[0];
          if ("?xml" === ye(i3)) {
            const t4 = i3[":@"];
            if (t4) {
              const i4 = e3.attributeNamePrefix + "version";
              if (t4[i4]) return t4[i4];
            }
          }
          return "1.0";
        })(t2, e2);
        return ge(t2, e2, i2, new it(), n2, r2);
      }
      __name(fe, "fe");
      function ge(t2, e2, i2, n2, r2, s2) {
        let o2 = "", a2 = false;
        if (e2.maxNestedTags && n2.getDepth() > e2.maxNestedTags) throw new Error("Maximum nested tags exceeded");
        if (!Array.isArray(t2)) {
          if (null != t2) {
            let i3 = t2.toString();
            return i3 = we(i3, e2), i3;
          }
          return "";
        }
        for (let l2 = 0; l2 < t2.length; l2++) {
          const p2 = t2[l2], c2 = ye(p2);
          if (void 0 === c2) continue;
          const h2 = c2 === e2.textNodeName || c2 === e2.cdataPropName || c2 === e2.commentPropName || "?" === c2[0] ? c2 : ue(c2, false, e2, n2, s2), d2 = me(p2[":@"], e2);
          n2.push(h2, d2);
          const u2 = Ee(n2, r2);
          if (h2 === e2.textNodeName) {
            let t3 = p2[c2];
            u2 || (t3 = e2.tagValueProcessor(h2, t3), t3 = we(t3, e2)), a2 && (o2 += i2), o2 += t3, a2 = false, n2.pop();
            continue;
          }
          if (h2 === e2.cdataPropName) {
            a2 && (o2 += i2), o2 += `<![CDATA[${re(p2[c2][0][e2.textNodeName])}]]>`, a2 = false, n2.pop();
            continue;
          }
          if (h2 === e2.commentPropName) {
            o2 += i2 + `<!--${ne(p2[c2][0][e2.textNodeName])}-->`, a2 = true, n2.pop();
            continue;
          }
          if ("?" === h2[0]) {
            o2 += ("?xml" === h2 ? "" : i2) + `<${h2}${Ne(p2[":@"], e2, u2, n2, s2)}?>`, a2 = true, n2.pop();
            continue;
          }
          let f2 = i2;
          "" !== f2 && (f2 += e2.indentBy);
          const g2 = i2 + `<${h2}${Ne(p2[":@"], e2, u2, n2, s2)}`;
          let m2;
          m2 = u2 ? xe(p2[c2], e2) : ge(p2[c2], e2, f2, n2, r2, s2), -1 !== e2.unpairedTags.indexOf(h2) ? e2.suppressUnpairedNode ? o2 += g2 + ">" : o2 += g2 + "/>" : m2 && 0 !== m2.length || !e2.suppressEmptyNode ? m2 && m2.endsWith(">") ? o2 += g2 + `>${m2}${i2}</${h2}>` : (o2 += g2 + ">", m2 && "" !== i2 && (m2.includes("/>") || m2.includes("</")) ? o2 += i2 + e2.indentBy + m2 + i2 : o2 += m2, o2 += `</${h2}>`) : o2 += g2 + "/>", a2 = true, n2.pop();
        }
        return o2;
      }
      __name(ge, "ge");
      function me(t2, e2) {
        if (!t2 || e2.ignoreAttributes) return null;
        const i2 = {};
        let n2 = false;
        for (let r2 in t2) Object.prototype.hasOwnProperty.call(t2, r2) && (i2[r2.startsWith(e2.attributeNamePrefix) ? r2.substr(e2.attributeNamePrefix.length) : r2] = se(t2[r2]), n2 = true);
        return n2 ? i2 : null;
      }
      __name(me, "me");
      function xe(t2, e2) {
        if (!Array.isArray(t2)) return null != t2 ? t2.toString() : "";
        let i2 = "";
        for (let n2 = 0; n2 < t2.length; n2++) {
          const r2 = t2[n2], s2 = ye(r2);
          if (s2 === e2.textNodeName) i2 += r2[s2];
          else if (s2 === e2.cdataPropName) i2 += r2[s2][0][e2.textNodeName];
          else if (s2 === e2.commentPropName) i2 += r2[s2][0][e2.textNodeName];
          else {
            if (s2 && "?" === s2[0]) continue;
            if (s2) {
              const t3 = be(r2[":@"], e2), n3 = xe(r2[s2], e2);
              n3 && 0 !== n3.length ? i2 += `<${s2}${t3}>${n3}</${s2}>` : i2 += `<${s2}${t3}/>`;
            }
          }
        }
        return i2;
      }
      __name(xe, "xe");
      function be(t2, e2) {
        let i2 = "";
        if (t2 && !e2.ignoreAttributes) for (let n2 in t2) {
          if (!Object.prototype.hasOwnProperty.call(t2, n2)) continue;
          let r2 = t2[n2];
          true === r2 && e2.suppressBooleanAttributes ? i2 += ` ${n2.substr(e2.attributeNamePrefix.length)}` : i2 += ` ${n2.substr(e2.attributeNamePrefix.length)}="${se(r2)}"`;
        }
        return i2;
      }
      __name(be, "be");
      function ye(t2) {
        const e2 = Object.keys(t2);
        for (let i2 = 0; i2 < e2.length; i2++) {
          const n2 = e2[i2];
          if (Object.prototype.hasOwnProperty.call(t2, n2) && ":@" !== n2) return n2;
        }
      }
      __name(ye, "ye");
      function Ne(t2, e2, i2, n2, r2) {
        let s2 = "";
        if (t2 && !e2.ignoreAttributes) for (let o2 in t2) {
          if (!Object.prototype.hasOwnProperty.call(t2, o2)) continue;
          const a2 = o2.substr(e2.attributeNamePrefix.length), l2 = i2 ? a2 : ue(a2, true, e2, n2, r2);
          let p2;
          i2 ? p2 = t2[o2] : (p2 = e2.attributeValueProcessor(o2, t2[o2]), p2 = we(p2, e2)), true === p2 && e2.suppressBooleanAttributes ? s2 += ` ${l2}` : s2 += ` ${l2}="${se(p2)}"`;
        }
        return s2;
      }
      __name(Ne, "Ne");
      function Ee(t2, e2) {
        if (!e2 || 0 === e2.length) return false;
        for (let i2 = 0; i2 < e2.length; i2++) if (t2.matches(e2[i2])) return true;
        return false;
      }
      __name(Ee, "Ee");
      function we(t2, e2) {
        if (t2 && t2.length > 0 && e2.processEntities) for (let i2 = 0; i2 < e2.entities.length; i2++) {
          const n2 = e2.entities[i2];
          t2 = t2.replace(n2.regex, n2.val);
        }
        return t2;
      }
      __name(we, "we");
      const ve = { attributeNamePrefix: "@_", attributesGroupName: false, textNodeName: "#text", ignoreAttributes: true, cdataPropName: false, format: false, indentBy: "  ", suppressEmptyNode: false, suppressUnpairedNode: true, suppressBooleanAttributes: true, tagValueProcessor: /* @__PURE__ */ __name(function(t2, e2) {
        return e2;
      }, "tagValueProcessor"), attributeValueProcessor: /* @__PURE__ */ __name(function(t2, e2) {
        return e2;
      }, "attributeValueProcessor"), preserveOrder: false, commentPropName: false, unpairedTags: [], entities: [{ regex: new RegExp("&", "g"), val: "&amp;" }, { regex: new RegExp(">", "g"), val: "&gt;" }, { regex: new RegExp("<", "g"), val: "&lt;" }, { regex: new RegExp("'", "g"), val: "&apos;" }, { regex: new RegExp('"', "g"), val: "&quot;" }], processEntities: true, stopNodes: [], oneListGroup: false, maxNestedTags: 100, jPath: true, sanitizeName: false };
      function Se(t2) {
        if (this.options = Object.assign({}, ve, t2), this.options.stopNodes && Array.isArray(this.options.stopNodes) && (this.options.stopNodes = this.options.stopNodes.map((t3) => "string" == typeof t3 && t3.startsWith("*.") ? ".." + t3.substring(2) : t3)), this.stopNodeExpressions = [], this.options.stopNodes && Array.isArray(this.options.stopNodes)) for (let t3 = 0; t3 < this.options.stopNodes.length; t3++) {
          const e3 = this.options.stopNodes[t3];
          "string" == typeof e3 ? this.stopNodeExpressions.push(new nt(e3)) : e3 instanceof nt && this.stopNodeExpressions.push(e3);
        }
        var e2;
        true === this.options.ignoreAttributes || this.options.attributesGroupName ? this.isAttribute = function() {
          return false;
        } : (this.ignoreAttributesFn = "function" == typeof (e2 = this.options.ignoreAttributes) ? e2 : Array.isArray(e2) ? (t3) => {
          for (const i2 of e2) {
            if ("string" == typeof i2 && t3 === i2) return true;
            if (i2 instanceof RegExp && i2.test(t3)) return true;
          }
        } : () => false, this.attrPrefixLen = this.options.attributeNamePrefix.length, this.isAttribute = Ce), this.processTextOrObjNode = Te, this.options.format ? (this.indentate = _e, this.tagEndChar = ">\n", this.newLine = "\n") : (this.indentate = function() {
          return "";
        }, this.tagEndChar = ">", this.newLine = "");
      }
      __name(Se, "Se");
      function Ae(t2, e2, i2, n2, r2) {
        return i2.sanitizeName ? de(t2, { xmlVersion: r2 }) ? t2 : i2.sanitizeName(t2, { isAttribute: e2, matcher: n2.readOnly() }) : t2;
      }
      __name(Ae, "Ae");
      function Te(t2, e2, i2, n2, r2) {
        const s2 = this.extractAttributes(t2);
        if (n2.push(e2, s2), this.checkStopNode(n2)) {
          const r3 = this.buildRawContent(t2), s3 = this.buildAttributesForStopNode(t2);
          return n2.pop(), this.buildObjectNode(r3, e2, s3, i2);
        }
        const o2 = this.j2x(t2, i2 + 1, n2, r2);
        return n2.pop(), "?" === e2[0] ? this.buildTextValNode("", e2, o2.attrStr, i2, n2) : void 0 !== t2[this.options.textNodeName] && 1 === Object.keys(t2).length ? this.buildTextValNode(t2[this.options.textNodeName], e2, o2.attrStr, i2, n2) : this.buildObjectNode(o2.val, e2, o2.attrStr, i2);
      }
      __name(Te, "Te");
      function _e(t2) {
        return this.options.indentBy.repeat(t2);
      }
      __name(_e, "_e");
      function Ce(t2) {
        return !(!t2.startsWith(this.options.attributeNamePrefix) || t2 === this.options.textNodeName) && t2.substr(this.attrPrefixLen);
      }
      __name(Ce, "Ce");
      Se.prototype.build = function(t2) {
        if (this.options.preserveOrder) return fe(t2, this.options);
        {
          Array.isArray(t2) && this.options.arrayNodeName && this.options.arrayNodeName.length > 1 && (t2 = { [this.options.arrayNodeName]: t2 });
          const e2 = new it(), i2 = (function(t3, e3) {
            const i3 = t3["?xml"];
            if (i3 && "object" == typeof i3) {
              if (e3.attributesGroupName && i3[e3.attributesGroupName]) {
                const t5 = i3[e3.attributesGroupName][e3.attributeNamePrefix + "version"];
                if (t5) return t5;
              }
              const t4 = i3[e3.attributeNamePrefix + "version"];
              if (t4) return t4;
            }
            return "1.0";
          })(t2, this.options);
          return this.j2x(t2, 0, e2, i2).val;
        }
      }, Se.prototype.j2x = function(t2, e2, i2, n2) {
        let r2 = "", s2 = "";
        if (this.options.maxNestedTags && i2.getDepth() >= this.options.maxNestedTags) throw new Error("Maximum nested tags exceeded");
        const o2 = this.options.jPath ? i2.toString() : i2, a2 = this.checkStopNode(i2);
        for (let l2 in t2) {
          if (!Object.prototype.hasOwnProperty.call(t2, l2)) continue;
          const p2 = l2 === this.options.textNodeName || l2 === this.options.cdataPropName || l2 === this.options.commentPropName || this.options.attributesGroupName && l2 === this.options.attributesGroupName || this.isAttribute(l2) || "?" === l2[0] ? l2 : Ae(l2, false, this.options, i2, n2);
          if (void 0 === t2[l2]) this.isAttribute(l2) && (s2 += "");
          else if (null === t2[l2]) this.isAttribute(l2) || p2 === this.options.cdataPropName || p2 === this.options.commentPropName ? s2 += "" : "?" === p2[0] ? s2 += this.indentate(e2) + "<" + p2 + "?" + this.tagEndChar : s2 += this.indentate(e2) + "<" + p2 + "/" + this.tagEndChar;
          else if (t2[l2] instanceof Date) s2 += this.buildTextValNode(t2[l2], p2, "", e2, i2);
          else if ("object" != typeof t2[l2]) {
            const c2 = this.isAttribute(l2);
            if (c2 && !this.ignoreAttributesFn(c2, o2)) {
              const e3 = Ae(c2, true, this.options, i2, n2);
              r2 += this.buildAttrPairStr(e3, "" + t2[l2], a2);
            } else if (!c2) if (l2 === this.options.textNodeName) {
              let e3 = this.options.tagValueProcessor(l2, "" + t2[l2]);
              s2 += this.replaceEntitiesValue(e3);
            } else {
              i2.push(p2);
              const n3 = this.checkStopNode(i2);
              if (i2.pop(), n3) {
                const i3 = "" + t2[l2];
                s2 += "" === i3 ? this.indentate(e2) + "<" + p2 + this.closeTag(p2) + this.tagEndChar : this.indentate(e2) + "<" + p2 + ">" + i3 + "</" + p2 + this.tagEndChar;
              } else s2 += this.buildTextValNode(t2[l2], p2, "", e2, i2);
            }
          } else if (Array.isArray(t2[l2])) {
            const r3 = t2[l2].length;
            let o3 = "", a3 = "";
            for (let c2 = 0; c2 < r3; c2++) {
              const r4 = t2[l2][c2];
              if (void 0 === r4) ;
              else if (null === r4) "?" === p2[0] ? s2 += this.indentate(e2) + "<" + p2 + "?" + this.tagEndChar : s2 += this.indentate(e2) + "<" + p2 + "/" + this.tagEndChar;
              else if ("object" == typeof r4) if (this.options.oneListGroup) {
                i2.push(p2);
                const t3 = this.j2x(r4, e2 + 1, i2, n2);
                i2.pop(), o3 += t3.val, this.options.attributesGroupName && r4.hasOwnProperty(this.options.attributesGroupName) && (a3 += t3.attrStr);
              } else o3 += this.processTextOrObjNode(r4, p2, e2, i2, n2);
              else if (this.options.oneListGroup) {
                let t3 = this.options.tagValueProcessor(p2, r4);
                t3 = this.replaceEntitiesValue(t3), o3 += t3;
              } else {
                i2.push(p2);
                const t3 = this.checkStopNode(i2);
                if (i2.pop(), t3) {
                  const t4 = "" + r4;
                  o3 += "" === t4 ? this.indentate(e2) + "<" + p2 + this.closeTag(p2) + this.tagEndChar : this.indentate(e2) + "<" + p2 + ">" + t4 + "</" + p2 + this.tagEndChar;
                } else o3 += this.buildTextValNode(r4, p2, "", e2, i2);
              }
            }
            this.options.oneListGroup && (o3 = this.buildObjectNode(o3, p2, a3, e2)), s2 += o3;
          } else if (this.options.attributesGroupName && l2 === this.options.attributesGroupName) {
            const e3 = Object.keys(t2[l2]), s3 = e3.length;
            for (let o3 = 0; o3 < s3; o3++) {
              const s4 = Ae(e3[o3], true, this.options, i2, n2);
              r2 += this.buildAttrPairStr(s4, "" + t2[l2][e3[o3]], a2);
            }
          } else s2 += this.processTextOrObjNode(t2[l2], p2, e2, i2, n2);
        }
        return { attrStr: r2, val: s2 };
      }, Se.prototype.buildAttrPairStr = function(t2, e2, i2) {
        return i2 || (e2 = this.options.attributeValueProcessor(t2, "" + e2), e2 = this.replaceEntitiesValue(e2)), this.options.suppressBooleanAttributes && "true" === e2 ? " " + t2 : " " + t2 + '="' + se(e2) + '"';
      }, Se.prototype.extractAttributes = function(t2) {
        if (!t2 || "object" != typeof t2) return null;
        const e2 = {};
        let i2 = false;
        if (this.options.attributesGroupName && t2[this.options.attributesGroupName]) {
          const n2 = t2[this.options.attributesGroupName];
          for (let t3 in n2) Object.prototype.hasOwnProperty.call(n2, t3) && (e2[t3.startsWith(this.options.attributeNamePrefix) ? t3.substring(this.options.attributeNamePrefix.length) : t3] = se(n2[t3]), i2 = true);
        } else for (let n2 in t2) {
          if (!Object.prototype.hasOwnProperty.call(t2, n2)) continue;
          const r2 = this.isAttribute(n2);
          r2 && (e2[r2] = se(t2[n2]), i2 = true);
        }
        return i2 ? e2 : null;
      }, Se.prototype.buildRawContent = function(t2) {
        if ("string" == typeof t2) return t2;
        if ("object" != typeof t2 || null === t2) return String(t2);
        if (void 0 !== t2[this.options.textNodeName]) return t2[this.options.textNodeName];
        let e2 = "";
        for (let i2 in t2) {
          if (!Object.prototype.hasOwnProperty.call(t2, i2)) continue;
          if (this.isAttribute(i2)) continue;
          if (this.options.attributesGroupName && i2 === this.options.attributesGroupName) continue;
          const n2 = t2[i2];
          if (i2 === this.options.textNodeName) e2 += n2;
          else if (Array.isArray(n2)) {
            for (let t3 of n2) if ("string" == typeof t3 || "number" == typeof t3) e2 += `<${i2}>${t3}</${i2}>`;
            else if ("object" == typeof t3 && null !== t3) {
              const n3 = this.buildRawContent(t3), r2 = this.buildAttributesForStopNode(t3);
              e2 += "" === n3 ? `<${i2}${r2}/>` : `<${i2}${r2}>${n3}</${i2}>`;
            }
          } else if ("object" == typeof n2 && null !== n2) {
            const t3 = this.buildRawContent(n2), r2 = this.buildAttributesForStopNode(n2);
            e2 += "" === t3 ? `<${i2}${r2}/>` : `<${i2}${r2}>${t3}</${i2}>`;
          } else e2 += `<${i2}>${n2}</${i2}>`;
        }
        return e2;
      }, Se.prototype.buildAttributesForStopNode = function(t2) {
        if (!t2 || "object" != typeof t2) return "";
        let e2 = "";
        if (this.options.attributesGroupName && t2[this.options.attributesGroupName]) {
          const i2 = t2[this.options.attributesGroupName];
          for (let t3 in i2) {
            if (!Object.prototype.hasOwnProperty.call(i2, t3)) continue;
            const n2 = t3.startsWith(this.options.attributeNamePrefix) ? t3.substring(this.options.attributeNamePrefix.length) : t3, r2 = i2[t3];
            true === r2 && this.options.suppressBooleanAttributes ? e2 += " " + n2 : e2 += " " + n2 + '="' + r2 + '"';
          }
        } else for (let i2 in t2) {
          if (!Object.prototype.hasOwnProperty.call(t2, i2)) continue;
          const n2 = this.isAttribute(i2);
          if (n2) {
            const r2 = t2[i2];
            true === r2 && this.options.suppressBooleanAttributes ? e2 += " " + n2 : e2 += " " + n2 + '="' + r2 + '"';
          }
        }
        return e2;
      }, Se.prototype.buildObjectNode = function(t2, e2, i2, n2) {
        if ("" === t2) return "?" === e2[0] ? this.indentate(n2) + "<" + e2 + i2 + "?" + this.tagEndChar : this.indentate(n2) + "<" + e2 + i2 + this.closeTag(e2) + this.tagEndChar;
        if ("?" === e2[0]) return this.indentate(n2) + "<" + e2 + i2 + "?" + this.tagEndChar;
        {
          let r2 = "</" + e2 + this.tagEndChar, s2 = "";
          return "?" === e2[0] && (s2 = "?", r2 = ""), !i2 && "" !== i2 || -1 !== t2.indexOf("<") ? false !== this.options.commentPropName && e2 === this.options.commentPropName && 0 === s2.length ? this.indentate(n2) + `<!--${t2}-->` + this.newLine : this.indentate(n2) + "<" + e2 + i2 + s2 + this.tagEndChar + t2 + this.indentate(n2) + r2 : this.indentate(n2) + "<" + e2 + i2 + s2 + ">" + t2 + r2;
        }
      }, Se.prototype.closeTag = function(t2) {
        let e2 = "";
        return -1 !== this.options.unpairedTags.indexOf(t2) ? this.options.suppressUnpairedNode || (e2 = "/") : e2 = this.options.suppressEmptyNode ? "/" : `></${t2}`, e2;
      }, Se.prototype.checkStopNode = function(t2) {
        if (!this.stopNodeExpressions || 0 === this.stopNodeExpressions.length) return false;
        for (let e2 = 0; e2 < this.stopNodeExpressions.length; e2++) if (t2.matches(this.stopNodeExpressions[e2])) return true;
        return false;
      }, Se.prototype.buildTextValNode = function(t2, e2, i2, n2, r2) {
        if (false !== this.options.cdataPropName && e2 === this.options.cdataPropName) {
          const e3 = re(t2);
          return this.indentate(n2) + `<![CDATA[${e3}]]>` + this.newLine;
        }
        if (false !== this.options.commentPropName && e2 === this.options.commentPropName) {
          const e3 = ne(t2);
          return this.indentate(n2) + `<!--${e3}-->` + this.newLine;
        }
        if ("?" === e2[0]) return this.indentate(n2) + "<" + e2 + i2 + "?" + this.tagEndChar;
        {
          let r3 = this.options.tagValueProcessor(e2, t2);
          return r3 = this.replaceEntitiesValue(r3), "" === r3 ? this.indentate(n2) + "<" + e2 + i2 + this.closeTag(e2) + this.tagEndChar : this.indentate(n2) + "<" + e2 + i2 + ">" + r3 + "</" + e2 + this.tagEndChar;
        }
      }, Se.prototype.replaceEntitiesValue = function(t2) {
        if (t2 && t2.length > 0 && this.options.processEntities) for (let e2 = 0; e2 < this.options.entities.length; e2++) {
          const i2 = this.options.entities[e2];
          t2 = t2.replace(i2.regex, i2.val);
        }
        return t2;
      };
      const $e = Se, Pe = { validate: l };
      module.exports = e;
    })();
  }
});

// src/worker.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// src/app.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// src/almacenD1.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
      const texto5 = await r.text();
      let data = texto5;
      if ((r.headers.get("content-type") ?? "").includes("json") || /^\s*[[{]/.test(texto5)) {
        try {
          data = JSON.parse(texto5);
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

// ../firebase/functions/src/horoscopo.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
function fechaEnZona(fecha, zona) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).format(fecha);
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
  const texto5 = (d.text ?? "").trim();
  if (!texto5) return null;
  const fuenteUrl = urlSegura(d.source);
  return {
    signo: signo.id,
    fecha: /^\d{4}-\d{2}-\d{2}$/.test(d.date ?? "") ? d.date : fechaPedida,
    prediccion: texto5,
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

// ../firebase/functions/src/scheduler.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../firebase/functions/src/bot/eventos.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../firebase/functions/src/canal.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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

// ../firebase/functions/src/fechas.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function partesEnZona(fecha, zona) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: zona,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    weekday: "short"
  }).formatToParts(fecha);
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
function parseHoraHHMM(texto5) {
  const m = /^\s*(\d{1,2})[:.hH](\d{2})\s*$/.exec(texto5) ?? /^\s*(\d{1,2})\s*[hH]?\s*$/.exec(texto5);
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
function parseFechaHora(texto5, ahora, zona) {
  let t = sinTildes(texto5).replace(/\s+/g, " ");
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
function parseNacimiento(texto5, hoy = /* @__PURE__ */ new Date()) {
  const m = /^\s*(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\s*$/.exec(texto5);
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

// ../firebase/functions/src/modelo.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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

// ../firebase/functions/src/programar.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../firebase/functions/src/almacen.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
function idProgramacion(uid, tipo, ref2) {
  return `${uid}__${tipo}__${ref2}`.replace(/\//g, "_");
}
__name(idProgramacion, "idProgramacion");

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

// ../firebase/functions/src/secciones/agenda.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../firebase/functions/src/util.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var NF1 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
var NF0 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
var num1 = /* @__PURE__ */ __name((v) => NF1.format(v), "num1");
var num0 = /* @__PURE__ */ __name((v) => NF0.format(v), "num0");
var grados = /* @__PURE__ */ __name((v) => `${Math.round(v)}\xBA`, "grados");
var pct = /* @__PURE__ */ __name((v) => `${v >= 0 ? "+" : "\u2212"}${new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v))} %`, "pct");
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
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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

// ../firebase/functions/src/bot/ctx.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
async function leerCuando(c, texto5) {
  const r = parseFechaHora(texto5, c.ahora, c.u.zona);
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
async function callback(c, p) {
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
__name(callback, "callback");
async function texto(c) {
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
__name(texto, "texto");
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

// ../firebase/functions/src/secciones/index.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../firebase/functions/src/secciones/horoscopo.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../firebase/functions/src/signos.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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

// ../firebase/functions/src/secciones/mercados.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../firebase/functions/src/secciones/noticias.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../firebase/functions/src/rss.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var import_fast_xml_parser = __toESM(require_fxp());
var parser = new import_fast_xml_parser.XMLParser({ ignoreAttributes: true, textNodeName: "#text", processEntities: true });
var texto2 = /* @__PURE__ */ __name((v) => {
  if (v === void 0 || v === null) return "";
  if (typeof v === "object") return texto2(v["#text"]);
  return String(v).trim();
}, "texto");
function leerRss(xml) {
  let doc;
  try {
    doc = parser.parse(xml);
  } catch {
    return [];
  }
  const items = doc?.rss?.channel?.item;
  const lista2 = Array.isArray(items) ? items : items ? [items] : [];
  return lista2.flatMap((it) => {
    let titulo = texto2(it.title);
    if (!titulo) return [];
    let fuente = texto2(it.source);
    const i = titulo.lastIndexOf(" - ");
    if (i > 0 && (!fuente || titulo.endsWith(` - ${fuente}`))) {
      if (!fuente) fuente = titulo.slice(i + 3);
      titulo = titulo.slice(0, i);
    }
    const fecha = Date.parse(texto2(it.pubDate));
    return [{ titulo, fuente, enlace: texto2(it.link), fecha: Number.isNaN(fecha) ? 0 : fecha }];
  });
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

// ../firebase/functions/src/secciones/tiempo.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../firebase/functions/src/luna.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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

// ../firebase/functions/src/telegram.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
var ErrorTelegram = class extends Error {
  constructor(mensaje, codigo) {
    super(mensaje);
    this.codigo = codigo;
  }
  codigo;
  static {
    __name(this, "ErrorTelegram");
  }
  get bloqueado() {
    return this.codigo === 403;
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
  async responderCallback(callbackId, texto5) {
    try {
      await this.llamar("answerCallbackQuery", { callback_query_id: callbackId, text: texto5 });
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
  if (!await dep.almacen.reclamarProgramacion(p.id, p.proximo, siguiente)) {
    r.omitidos++;
    return;
  }
  if (ahora.getTime() - p.proximo.getTime() > MAX_SECCION_RETRASO) {
    r.omitidos++;
    return;
  }
  try {
    const cont = await construirContenido(p.ref, { usuario: u, http: dep.http, almacen: dep.almacen, ahora });
    await dep.canal.enviar(u.id, cont.html, cont.teclado);
    if (p.intentos) await dep.almacen.guardarProgramacion({ ...p, proximo: siguiente, intentos: 0 });
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
  let siguiente;
  if (p.posponer || ev.repeticion === "ninguna") {
    siguiente = new Date(ahora.getTime() + 24 * 36e5);
  } else {
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
  if (!await dep.almacen.reclamarProgramacion(p.id, p.proximo, siguiente)) {
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
    return;
  }
  await dep.almacen.borrarProgramacion(p.id);
  if (!p.posponer) await dep.almacen.guardarEvento({ ...ev, avisado: true });
}
__name(enviarEvento, "enviarEvento");
async function tick(dep, limite = 150) {
  const ahora = dep.ahora();
  const r = { enviados: 0, omitidos: 0, fallidos: 0 };
  const vencidas = await dep.almacen.programacionesVencidas(ahora, limite);
  for (const p of vencidas) {
    try {
      const u = await dep.almacen.getUsuario(p.uid);
      if (!u || !u.activo) {
        await dep.almacen.borrarProgramacion(p.id);
        continue;
      }
      if (p.tipo === "seccion") await enviarSeccion(dep, u, p, ahora, r);
      else await enviarEvento(dep, u, p, ahora, r);
    } catch (e) {
      r.fallidos++;
      dep.log?.(`\u2717 programaci\xF3n ${p.id}: ${e.message}`);
    }
  }
  return r;
}
__name(tick, "tick");

// ../firebase/functions/src/webhook.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
import { timingSafeEqual } from "node:crypto";

// ../firebase/functions/src/bot/bot.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../firebase/functions/src/bot/ajustes.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();

// ../firebase/functions/src/geocoding.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
function separarIntereses(texto5) {
  return texto5.split(/[,;\n]/).map((t) => t.trim()).filter(Boolean).map((t) => t.slice(0, 40)).map((t) => t.charAt(0).toUpperCase() + t.slice(1)).slice(0, 10);
}
__name(separarIntereses, "separarIntereses");
var slug = /* @__PURE__ */ __name((t) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tema", "slug");

// ../firebase/functions/src/bot/vistas.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
async function callback2(c, p) {
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
__name(callback2, "callback");
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
async function texto3(c) {
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
__name(texto3, "texto");

// ../firebase/functions/src/bot/onboarding.ts
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_process();
init_virtual_unenv_global_polyfill_cloudflare_unenv_preset_node_console();
init_performance2();
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
async function texto4(c) {
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
__name(texto4, "texto");

// ../firebase/functions/src/bot/bot.ts
async function menu(c) {
  await c.responder(textoMenu(c.u), tecladoMenu);
}
__name(menu, "menu");
async function mostrarSeccion(c, ref2, editar = false) {
  await entregarSeccion(c, ref2, construirSeccion(c, ref2), editar);
}
__name(mostrarSeccion, "mostrarSeccion");
var construirSeccion = /* @__PURE__ */ __name((c, ref2) => construirContenido(ref2, { usuario: c.u, http: c.deps.http, almacen: c.almacen, ahora: c.ahora }), "construirSeccion");
async function entregarSeccion(c, ref2, pendiente, editar = false) {
  try {
    const cont = await pendiente;
    if (editar) await c.responder(cont.html, cont.teclado);
    else await c.nuevo(cont.html, cont.teclado);
  } catch (e) {
    console.error(`secci\xF3n ${ref2}:`, e.message);
    await c.nuevo(`\u26A0\uFE0F No he podido obtener esa informaci\xF3n ahora mismo. Int\xE9ntalo de nuevo en unos minutos.`, [[BTN_MENU]]);
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
async function comando(c, texto5) {
  const cmd = texto5.split(/[\s@]/)[0].toLowerCase();
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
      await callback2(c, ["p", "ver"]);
      return true;
    case "/ayuda":
    case "/help":
      await c.nuevo(textoAyuda, [[BTN_MENU]]);
      return true;
    case "/cancelar":
      await cancelar(c);
      return true;
    case "/borrar":
      await callback2(c, ["p", "borrar"]);
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
      await callback(c, p);
      return;
    case "s":
    case "p":
      await callback2(c, p);
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
  if (c.u.estado && (await texto4(c) || await texto(c) || await texto3(c))) return;
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

// ../firebase/functions/src/webhook.ts
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
var ZONA = "Europe/Madrid";
var CRON_HOROSCOPO = "*/10 4-10 * * *";
var MARGEN_PETICIONES = 22;
var MAX_PROGRAMACIONES = 6;
function dependencias(env2, http) {
  return { almacen: new AlmacenD1(env2.DB), canal: new CanalTelegram(env2.TELEGRAM_BOT_TOKEN, http), http, ahora: /* @__PURE__ */ __name(() => /* @__PURE__ */ new Date(), "ahora") };
}
__name(dependencias, "dependencias");
async function manejarFetch(req, env2) {
  const url = new URL(req.url);
  if (url.pathname !== "/telegram") return new Response(url.pathname === "/" ? "agenda-personal" : "not found", { status: url.pathname === "/" ? 200 : 404 });
  const cuerpo = await req.json().catch(() => null);
  const r = await procesarWebhook(
    dependencias(env2, new HttpFetch()),
    env2.TELEGRAM_WEBHOOK_SECRET,
    { metodo: req.method, cabeceraSecreta: req.headers.get("x-telegram-bot-api-secret-token") ?? void 0, cuerpo },
    (m) => console.error(m)
  );
  return new Response(r.texto, { status: r.estado });
}
__name(manejarFetch, "manejarFetch");
async function manejarTick(env2, ahora = () => /* @__PURE__ */ new Date()) {
  const http = new HttpFetch();
  const dep = { ...dependencias(env2, http), ahora, log: /* @__PURE__ */ __name((m) => console.warn(m), "log") };
  const total = { enviados: 0, omitidos: 0, fallidos: 0 };
  for (let i = 0; i < MAX_PROGRAMACIONES && http.restantes >= MARGEN_PETICIONES; i++) {
    const r = await tick(dep, 1);
    total.enviados += r.enviados;
    total.omitidos += r.omitidos;
    total.fallidos += r.fallidos;
    if (r.enviados + r.omitidos + r.fallidos === 0) break;
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
  fetch: /* @__PURE__ */ __name((req, env2) => manejarFetch(req, env2), "fetch"),
  async scheduled(evento, env2) {
    if (evento.cron === CRON_HOROSCOPO) await manejarHoroscopo(env2);
    else await manejarTick(env2);
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
