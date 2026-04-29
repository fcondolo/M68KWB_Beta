
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
    t.m68kwbBreakpts = [];
  }

  printStatus(_msg) {
    console.log("pluginInterface STATUS msg: " + _msg);
  }

  printCurrent(_msg) {
    console.log("pluginInterface CURRENT msg: " + _msg,);
  }

  printLog(_msg) {
    console.log("pluginInterface LOG msg: " + _msg,);
  }


  normalizePath(p) {
    if (!p) {
      alert("PluginInterface: can't normalize null path");
      debugger;
      return null;
    }
    return p.replace(/\\/g, '/').toLowerCase();
  }

  getLocalPath(_fullPath, _startFolder) {
    if (!_fullPath) {
      alert("PluginInterface: getLocalPath : null _fullPath");
      debugger;
      return null;
    }
    if (!_startFolder) {
      alert("PluginInterface: getLocalPath : null _startFolder");
      debugger;
      return null;
    }

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
    if (!_path) {
      alert("PluginInterface: getFileName : null _path");
      debugger;
      return null;
    }
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
        let src = sameFolder[i].source;
        if (src) {
          let source = t.getFileName(src);
          if (sameFolder[i].fxName == fileName) {
            foundName = sameFolder[i].fxName;
            break;
          }
        }
      }
    }
    if (foundName == null) {
      // if the folder could not be found, launch the one with the same asm source file, no matter the folder
      for (let i = 0; i < user_fx.length; i++) {
        let src = user_fx[i].source;
        if (src) {
          let source = t.getFileName(src);
          if (source == fileName) {
            if (user_fx[i].fxName)
              foundName = user_fx[i].fxName;
            else if (user_fx[i].classname)
              foundName = user_fx[i].classname;
            break;
          }
        }
      }
    }

    if ((foundName != null) && (MYFX.fxName != foundName)) {
      localStorage.setItem(LOCALSTORAGE_FX_NAME, foundName);
      main_startChosenFx(foundName);
      //window.location.reload();
    } else alert("The FX you want to debug must be declared in 'user_fx.js', and have a 'source' property.\n Currently trying to debug '" + programPath + "' but no matching entry could be found in 'user_fx.js'");
  }

  emulatorRunUntilBreakOrEnd() {
    let t = this;
    DEBUGGER_run();
    //t.send({ event: 'terminated' });
  }

  emulatorStepOne() {
    let t = this;
    DEBUGGER_traceOneInstr();
    let curLine = PARSER_lines[ASMBL_ADRSTOLINE[M68K_IP]];
    if (curLine && curLine.path) {
      doModal = false;
      t.currentFile = t.makeFullPath(curLine.path);
      t.currentLine = curLine.line+1;
    } else t.currentLine++;
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
      x: regs.x,
      n: regs.n,
      z: regs.z,
      v: regs.v,
      c: regs.c
    };
  }

  // ─── Bridge plumbing ─────────────────────────────────────────────────────

 makeFullPath(path) {
  let t = this;
  if (!path) {
    alert("PluginInterface: makeFullPath : null path");
    debugger;
    return null;
  }
  path = path.toLowerCase();
  path = t.normalizePath(path);
  if ((t.workingDirectory) && (!path.includes(t.workingDirectory))) {
    path = t.workingDirectory + t.ROOTFOLDER + "/" + path;
  }
  return path;
 }

 getStack() {
    let t = this;
    let stack = [];
    let curLine = PARSER_lines[ASMBL_ADRSTOLINE[M68K_IP]];
    if (curLine && curLine.path) {
      let file = t.makeFullPath(curLine.path);
      let line = curLine.line;
      stack.push({name:curLine.filtered, file:file, line:line+1, pc:curLine.codeSectionOfs});
    }

    let index = M68K_lastBranchIndex - 1;
    let tab = M68K_lastBranches;
    if (M68K_INTERRUPT_STATE != null) {
      index = M68K_lastBranchIndexInterrupt - 1;
      tab = M68K_lastBranchesInterrupt;
    }

    for (let i = 0; i < 32; i++) {
      if (index < 0) index = 1023;
      const adrs = tab[index];
      let count = 1;
      if (adrs > 0) {
        let next = i + 1;
        let nextIndex = index - 1;
        while (next < 1024) {
          if (nextIndex < 0) nextIndex = 1023;
          const nextAdrs = tab[nextIndex];
          if (nextAdrs == adrs) {
            next++;
            nextIndex--;  
            count++;
            i++;
            index--;
            if (index < 0) index = 1023;
          }
          else break;
        }
      let entry = {name:'unknown', file:'unknown', line:1, pc:0};
      entry.pc = adrs;
      const lineIndex = ASMBL_ADRSTOLINE[adrs];
      if (lineIndex !== null) {
        const ln = PARSER_lines[lineIndex];
        entry.name = ln.filtered;
        if (count > 1) {
          entry.name += "\t(x" + count + ")";
        }
        entry.file = t.makeFullPath(ln.path);
        entry.line = ln.line + 1;
      }
      stack.push(entry);
    }
    index--;
    }

  return stack;
}

  reportStopped(file, line, reason, description = null, text = null) {
    /*
    POSSIBLE VALUES FOR 'reason' :
"step" — Paused after a step operation. Yellow arrow on the gutter. Call Stack shows "Paused on step".
"breakpoint" — Paused at a breakpoint. Yellow arrow. Call Stack shows "Paused on breakpoint".
"exception" — A runtime fault. Red arrow on the gutter, floating overlay with description/text. Most attention-grabbing. Use this for divide-by-zero, illegal instruction, etc.
"pause" — User clicked the pause button. Yellow arrow. "Paused on pause".
"entry" — Stopped at program entry (the very first instruction). Yellow arrow. "Paused on entry".
"goto" — Paused after a "Jump to Cursor" / "Set Next Statement" operation. Rare.
"function breakpoint" — Paused at a function-name breakpoint (you'd need setFunctionBreakpoints support). Yellow arrow.
"data breakpoint" — Paused at a memory/data watchpoint (you'd need dataBreakpoints support). Yellow arrow.
"instruction breakpoint" — Paused at an instruction-address breakpoint (disassembly view feature). Yellow arrow.    
    */
    let t = this;
    file = t.makeFullPath(file);
    t.currentFile = file; // full path, normalized
    t.currentLine = line; // 1st line is 1, not 0
    t.printCurrent("file: " + file + ", line: " + line);
    if (!text) text = reason;
    if (!description) description = reason;
    text = text.replaceAll("<br>","\n");
    description = description.replaceAll("<br>","\n");
    
    // get call stack
    let stack = t.getStack();


  let execme = null;
  let vars = null;
  if (BENCHMARKS && BENCHMARKS.entries) {
    execme = "vars = [";
    for (let i = 0; i < BENCHMARKS.entries.length; i++) {
        const e = BENCHMARKS.entries[i];
        execme += '{name:"'+e.name + '",value:';
        if (e.error)
            execme += e.error;
        else
            execme += e.last_measured.toString();
        execme += ",type:'long'},";
    }
  }

  if (WATCHES && WATCHES.entries) {
    if (!execme) execme = "vars = [";
    for (let i = 0; i < WATCHES.entries.length; i++) {
        const e = WATCHES.entries[i];
        const f = WATCHES.format[e.type];
        let val = MACHINE.getRAMValue(e.adrs, f.b, f.s);
        const id = "watchval"+i.toString();
        execme += '{name:"'+e.name + '",value:';
        switch (e.base) {
            case t.WATCH_BIN: execme += '%'; break;
            case t.WATCH_HEX: execme += '$'; break;
        }
        execme += val.toString(e.base);
        switch (f.b) {
            case 1: execme += ",type:'byte'},"; break;
            case 2: execme += ",type:'word'},"; break;
            case 4: execme += ",type:'long'},"; break;
        }
    }
  }
  if (execme) {
    if (execme[execme.length-1] == ',')
      execme = execme.substring(0, execme.length - 1);
    execme += "]"
    eval(execme);
  } 

    t.send({ 
      event: 'stopped',
      reason,
      file,
      line,
      description,
      text,
      registers: t.fakeRegisters(),
      stack:stack,
      symbols: vars
    });
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

  delteBreakpoints() {
    let t = this;
    for (let i = 0; i < t.m68kwbBreakpts.length; i++) {
      t.m68kwbBreakpts[i].breakpoint = false;
    }
    t.m68kwbBreakpts = [];
  }

  addBreakpoints(breakpoints) {
    let t = this;
    let bpt = Array.from(breakpoints);
    for (let i = 0; i < bpt.length; i++) {
      const bp = bpt[i];
      const file = this.getFileName(bp[0]);
      const lines = Array.from(bp[1]);
      let af = ALLLINES_FILES[file];
      if (af) {
        for (let j = 0; j < lines.length; j++) {
          let ln = af[lines[j]-1];
          if (ln) {
            ln.breakpoint = true;
            t.m68kwbBreakpts.push(ln);
          }
        }
      }
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
        t.delteBreakpoints(t.breakpoints);
        t.breakpoints.set(t.normalizePath(msg.file), new Set(msg.lines));
        t.addBreakpoints(t.breakpoints);
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