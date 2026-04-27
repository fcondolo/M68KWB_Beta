
  var pluginInterfaceSingleton = null;

  class PluginInterface {
  constructor() {
    if (pluginInterfaceSingleton !== null) {
      return;
    }
    pluginInterfaceSingleton = this;
    let t = this;
    t.ROOTFOLDER = "m68kwb_beta";
    t.ws = null;
    t.breakpoints = new Map();   // file → Set<number>
    t.currentFile = '';
    t.currentLine = 1;
    t.manualDisconnect = false;
  }

  printStatus(_msg) {
    console.log("pluginInterface STATUS msg: " + _msg);
    ShowDebugLog(_msg);

  }

  printCurrent(_msg) {
    console.log("pluginInterface CURRENT msg: " + _msg,);
    ShowDebugLog(_msg);
  }

  printLog(_msg) {
    console.log("pluginInterface LOG msg: " + _msg,);
    ShowDebugLog(_msg);
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
        alert("can't debug a file that is not a child of '" + t.ROOTFOLDER + "' folder");
        return full;
    }

    // 3. Extract the part after the base folder
    let relative = full.substring(index + base.length);

    // 4. Clean up leading slashes so we don't get "/subfolder/file.js"
    if (relative.startsWith('/')) {
        relative = relative.substring(1);
    }

    this.workingDirectory = full.slice(0,index);

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

  findAllFXInThisFolder(folder) {
    let ret = [];
    for (let i = 0; i < user_fx.length; i++) {
      let p  = user_fx[i].rootPath;
      if (p) {
        p = p.replace(/\\/g, '/');
        p = p.toLowerCase();
        if (p[p.length-1] !== '/') p += '/';
        if (p == folder) {
          ret.push(user_fx[i]);
        }
      }
    }
    return ret;
  }


  // ─── Your emulator hooks ─────────────────────────────────────────────────
  // Replace these STUBS with real calls into your emulator.

  emulatorLoad(programPath) {
    let t = this;
    t.printLog(`[STUB] load: ${programPath}`);
    // TODO: your emulator: fetch/load the assembled program
    // TODO: load source map (PC → file,line)
    // After loading, report "stopped at entry":
    try {
      console.log('[emulator] onLoad called, program=', programPath);
      console.log('[emulator] about to call reportStopped');
      t.reportStopped(t.normalizePath(programPath), 1, 'entry');
      console.log('[emulator] reportStopped returned');
    } catch (err) {
      console.error('[emulator] onLoad threw:', err);
    }    
    let localPath = t.getLocalPath(programPath, t.ROOTFOLDER);    
    let fileName = t.getFileName(localPath);
    let folder = t.getDirectoryPath(localPath);
    if (folder[folder.length-1] !== '/') folder += '/';
    let sameFolder = t.findAllFXInThisFolder(folder);
    let foundName = null;
    // if there's only 1 fx in the same folder, launch the fx
    if (sameFolder.length == 1) {
      foundName = sameFolder[0].fxName;
    }
    if (foundName == null) {
      // if there's several fx in the same folder, launch the one with the same asm source file
      for (let i = 0; i < sameFolder.length; i++) {
        let source = t.getFileName(sameFolder[i].source);
        if (sameFolder[i].fxName == fileName) {
          foundName = sameFolder[i].fxName;
          break;
        }
      }
    }
    if (foundName == null) {
      // if the folder could not be found, launch the one with the same asm source file, no matter the folder
      for (let i = 0; i < user_fx.length; i++) {
        let source = t.getFileName(user_fx[i].source);
        if (source == fileName) {
          if (user_fx[i].fxName)
            foundName = user_fx[i].fxName;
          else if (user_fx[i].classname)
            foundName = user_fx[i].classname;
          break;
        }
      }
    }

    if ((foundName != null) && (MYFX.fxName != foundName)) {
      localStorage.setItem(LOCALSTORAGE_FX_NAME, foundName);
      main_startChosenFx(foundName);
      //window.location.reload();
    } else alert("fx not found");
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
    if ((t.workingDirectory) && (!file.includes(t.workingDirectory))) {
      file = t.workingDirectory + t.ROOTFOLDER + "/" + file;
    }
    t.currentFile = file; // full path, normalized
    t.currentLine = line+1; // 1st line is 1, not 0
    t.printCurrent("file: " + file + ", line: " + line);
    t.send({ event: 'stopped', reason, file, line, registers: t.fakeRegisters() });
  }

  send(obj) {
    console.log('[PluginInterface] readyState:', this.ws?.readyState,
    '(0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)');    
    let t = this;

    const payload = JSON.stringify(obj);
    console.log('[PluginInterface] sending:', payload);

    if (t.ws && t.ws.readyState === WebSocket.OPEN) {
      t.ws.send(payload);
    } else {
      console.warn('[PluginInterface] cannot send, ws not open');
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
      console.log('[bridge] connect() called but already connecting/open, skipping');
      return;
    }

    console.log('[bridge] creating new WebSocket');
    this.ws = new WebSocket(VSCODE_CONFIG.URL);

    t.ws.onopen = () => {
      console.log('[bridge] open');
      pluginInterfaceSingleton.printStatus('VSCode Plugin connected to debug adapter<br>Start debugging a .s or .asm file.');
    };
    t.ws.onmessage = (ev) => {
      try { pluginInterfaceSingleton.handleCommand(JSON.parse(ev.data)); }
      catch (err) { pluginInterfaceSingleton.printLog('Parse error: ' + err); }
    };
    t.ws.onclose = () => {
      console.log('[bridge] closed, retrying in 1s');
      setTimeout(() => this.connect(), 1000);
    };
    t.ws.onerror = (e) => {
      console.log('[ws] error', e);
    };

  }
/*
  connect() {
    let t =this;
    if (t.ws && (t.ws.readyState === WebSocket.CONNECTING || t.ws.readyState === WebSocket.OPEN)) {
      this.printLog('[already connected or connecting]');
      return;
    }

    console.log('[bridge] connect() called, current ws state:', this.ws?.readyState);
    t.ws = new WebSocket(VSCODE_CONFIG.URL);
    t.ws.onopen = () => {
      pluginInterfaceSingleton.printStatus('VSCode Plugin connected to debug adapter<br>Start debugging a .s or .asm file.');
    };
    t.ws.onmessage = (ev) => {
      try { pluginInterfaceSingleton.handleCommand(JSON.parse(ev.data)); }
      catch (err) { pluginInterfaceSingleton.printLog('Parse error: ' + err); }
    };
    t.ws.onclose = () => {
      console.log('[bridge] ws closed:', ev.code, ev.reason, '(was open?)');
      console.log('[ws] closed, retrying in 1s');
      setTimeout(pluginInterfaceSingleton.connect, 1000);
    };
    t.ws.onerror = (e) => {
      console.log('[ws] error', e);
    };
  }*/


  disconnect() {
    let t = this;
    t.manualDisconnect = true;
    t.ws.close();
  }
}