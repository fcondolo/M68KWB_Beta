
  var pluginInterfaceSingleton = null;

  class PluginInterface {
  constructor() {
    if (pluginInterfaceSingleton !== null) {
      return;
    }
    pluginInterfaceSingleton = this;
    let t = this;
    t.ws = null;
    t.breakpoints = new Map();   // file → Set<number>
    t.currentFile = '';
    t.currentLine = 1;
    t.manualDisconnect = false;
  }

  printStatus(_msg) {
    console.log("pluginInterface STATUS msg: " + _msg,);

  }

  printCurrent(_msg) {
    console.log("pluginInterface CURRENT msg: " + _msg,);

  }

  printLog(_msg) {
    console.log("pluginInterface LOG msg: " + _msg,);
  }


  normalizePath(p) {
    return p.replace(/\\/g, '/').toLowerCase();
  }

  getLocalPath(_fullPath, _startFolder) {
    _fullPath = _fullPath.toLowerCase();
    _startFolder = _startFolder.toLowerCase();
    const full = _fullPath.replace(/\\/g, '/');
    const base = _startFolder.replace(/\\/g, '/');

    const index = full.indexOf(base);

    if (index === -1) {
        return full; // Or handle as an error if the folder isn't found
    }

    // 3. Extract the part after the base folder
    let relative = full.substring(index + base.length);

    // 4. Clean up leading slashes so we don't get "/subfolder/file.js"
    if (relative.startsWith('/')) {
        relative = relative.substring(1);
    }

    return relative;
  }

  getFileName(_path) {
    _path = _path.toLowerCase();
    return _path.replace(/\\/g, '/').split('/').pop();
  }

  getDirectoryPath(_path) {
    // Normalize slashes to forward slashes
    const normalizedPath = _path.replace(/\\/g, '/');
    
    // Find the last slash
    const lastSlashIndex = normalizedPath.lastIndexOf('/');

    // If no slash is found, there is no directory part
    if (lastSlashIndex === -1) return '';

    // Return everything up to (but not including) the last slash
    return normalizedPath.substring(0, lastSlashIndex);
  }

  // ─── Your emulator hooks ─────────────────────────────────────────────────
  // Replace these STUBS with real calls into your emulator.

  emulatorLoad(programPath) {
    let t = this;
    t.printLog(`[STUB] load: ${programPath}`);
    // TODO: your emulator: fetch/load the assembled program
    // TODO: load source map (PC → file,line)
    // After loading, report "stopped at entry":
    t.reportStopped(t.normalizePath(programPath), 1, 'entry');
    let localPath = t.getLocalPath(programPath, "m68kwb_beta");    
    let fileName = t.getFileName(localPath);
    let folder = t.getDirectoryPath(localPath);
    if (folder[folder.length-1] !== '/') folder += '/';
    debugger;
    for (let i = 0; i < user_fx.length; i++) {
      let p  = user_fx[i].rootPath;
      if (p) {
        p = p.replace(/\\/g, '/');
        p = p.toLowerCase();
        if (p[p.length-1] !== '/') p += '/';
        if (p == folder) {
          const name = user_fx[i].fxName;
          if (MYFX.fxName != name) {
            localStorage.setItem(LOCALSTORAGE_FX_NAME, name);
            window.location.reload();
          }
          break;
        }
      }
    }
  }

  emulatorRunUntilBreakOrEnd() {
    let t = this;
    t.printLog('[STUB] continue');
    // TODO: real emulator: run instructions in a loop, checking breakpoints.
    // For now, a dumb stub that advances 5 lines then halts.
    const bps = t.breakpoints.get(t.currentFile) ?? new Set();
    for (let i = 0; i < 100; i++) {
      t.currentLine++;
      if (bps.has(t.currentLine)) {
        t.reportStopped(t.currentFile, t.currentLine, 'breakpoint');
        return;
      }
    }
    send({ event: 'terminated' });
  }

  emulatorStepOne() {
    let t = this;
    t.printLog('[STUB] step');
    t.currentLine++;
    t.reportStopped(t.currentFile, t.currentLine, 'step');
  }

  fakeRegisters() {
      let d = [];
      let a = [];
      for (let i = 0; i < 8; i++) {
        d[i] = regs.d[i];
        a[i] = regs.a[i];
      }

    return {
      d: d,
      a: a,
      pc: M68K_IP,
      sr: regs.sr,
    };
  }

  // ─── Bridge plumbing ─────────────────────────────────────────────────────

  reportStopped(file, line, reason) {
    let t = this;
    t.currentFile = file;
    t.currentLine = line;
    t.printCurrent("file: " + file + ", line: " + line);
    t.send({ event: 'stopped', reason, file, line, registers: t.fakeRegisters() });
  }

  send(obj) {
    let t = this;
    if (t.ws && t.ws.readyState === WebSocket.OPEN) {
      t.ws.send(JSON.stringify(obj));
    }
  }

  handleCommand(msg) {
    let t = this;
    t.printLog(`<< ${msg.cmd}`);
    switch (msg.cmd) {
      case 'load':
        t.emulatorLoad(msg.program);
        break;
      case 'setBreakpoints':
        t.breakpoints.set(t.normalizePath(msg.file), new Set(msg.lines));
        t.printLog(`  breakpoints for ${t.normalizePath(msg.file)}: [${msg.lines.join(', ')}]`);
        break;
      case 'continue':
        t.emulatorRunUntilBreakOrEnd();
        break;
      case 'stepOver':
      case 'stepIn':
        t.emulatorStepOne();
        break;
      case 'pause':
        t.reportStopped(t.currentFile, t.currentLine, 'pause');
        break;
    }
  }


  connect() {
    let t =this;
    if (t.ws && (t.ws.readyState === WebSocket.CONNECTING || t.ws.readyState === WebSocket.OPEN)) {
      this.printLog('[already connected or connecting]');
      return;
    }

    t.ws = new WebSocket(VSCODE_CONFIG.URL);
    t.ws.onopen = () => {
      pluginInterfaceSingleton.printStatus('Connected to debug adapter');
    };
    t.ws.onmessage = (ev) => {
      try { pluginInterfaceSingleton.handleCommand(JSON.parse(ev.data)); }
      catch (err) { pluginInterfaceSingleton.printLog('Parse error: ' + err); }
    };
    t.ws.onclose = () => {
      console.log('[ws] closed, retrying in 1s');
      setTimeout(pluginInterfaceSingleton.connect, 1000);
    };
    t.ws.onerror = (e) => {
      console.log('[ws] error', e);
    };
  }


  disconnect() {
    let t = this;
    t.manualDisconnect = true;
    t.ws.close();
  }
}