
var CODERPARSER_SINGLETON = null;

/* unused so far
function _asm(_str) {
  let l = new LineParser("_asm instr", 0, _str, 0);
  l.codeSectionOfs = M68K_VECTORS_ZONE_SIZE;
  if (CODERPARSER_SINGLETON == null) CODERPARSER_SINGLETON = new CodeParser();
  CODERPARSER_SINGLETON.process_oneLineInstr(l);
  let out = { tab: new Uint8Array(16), ofs: 0 };
  asmbl_go(l, out);
  const err = l.call(l);
  if (err) {
    console.error(err);
    debuggger;
  }
}
*/


function checkNumberSize(_n, _size) {
  let res = null;
  if (_n >= 0) {
    switch(_size) {
      case 1 : if (_n > 255) res = "unsigned byte is > 255"; break;
      case 2 : if (_n > 65535) res = "unsigned word is > 65535"; break;
    }
  } else {
    switch(_size) {
      case 1 : if (_n < -128) res = "signed byte is < -128"; break;
      case 2 : if (_n < -32768) res = "signed word is < -32768"; break;
    }
  }
  return res;
}



class CodeParser {

  constructor() {
    let t = this;
    CODERPARSER_SINGLETON = this;
    t.strings = new StringParser();
    t.labels = [];
    t.fastLabels = [];
    t.adrsToLabel = [];
    t.includes = [];
    t.labelByName = [];
    t.constants = [];
    t.fastConst = [];
    t.errors = [];
    t.errorContext = [];
    t.firstPass = true;
    t.lastPass = false;
    t.rsOffset = 0;
    t.set = [];
    t.macros = [];
    t.labelToAddress = [];
    t.lateArgs = [];
    t.lateAsmbl = [];
    t.stopGlobalCompilation = false;
    t.macroCounter = 0;
    t.reptn = -1; // REPTN is -1 outside of any repeat block. See https://github.com/prb28/m68k-instructions-documentation/blob/master/directives/rept.md
    t.showCompilMsg( "starting build process...");
  }
  
  showCompilMsg(_msg) {
    let t = this;
    let e = document.getElementById('liner')
    t.compilMsg = _msg;
    if (_msg)
      e.innerHTML = "Building: " + t.compilMsg;
    else
      e.innerHTML = null;
  }  

  ascii68k_loadfile(_path, _fromStringArray = null) {
    let t = this;
    const max_pass = 3;
    let watchdog = 0;

    let elm = document.getElementById('oneLiner');
    elm.style.display = 'inline-block';
  
    if (_path) {
      t.errorContext.push("root file: " + _path);
      if (!t.strings.insertTextFile(_path, 0)) {
        CODERPARSER_SINGLETON.push_error("failed loading " + _path);
        CODERPARSER_SINGLETON.Error("failed loading " + _path);
        return;
      }
    } else if (_fromStringArray) {
      for (let i = 0; i < _fromStringArray.length; i++) {
        t.strings.lines.push(new LineParser("", i, _fromStringArray[i], t.strings.original.length));
        t.strings.original.push(_fromStringArray[i]);  
      }
    }

    // set default constants from config
    for (let ic = 0; ic < ASSEMBLER_CONFIG.defines.length; ic++) {
      t.constants.push({ name: ASSEMBLER_CONFIG.defines[ic].name, value: ASSEMBLER_CONFIG.defines[ic].value, path: "", line: "" });
    }

    // includes are done first
    watchdog = 0;
    const max_include_files = 100;
    do {
      while (t.strings.waitingOnFile != null) {
        t.showCompilMsg("loading file: " + t.strings.waitingOnFile);
      }
      watchdog++;
      if (!t.startPass()) return false;
    } while (t.process_include() && watchdog < max_include_files)
    if (watchdog >= max_include_files) {
      showHTMLError("Warning: exceeded max includes. Maybe infinite include loop? See max_include_files in CodeParser.js");
    } 
    // include default platform code to allow basic simulation of system functions
    switch (FX_INFO.platform) {
      case "OCS": 
        t.process_oneInclude("./src/amiga/Amiga_Default.asm", null, t.strings.lines.length);
      break;
      case "ST" :
      case "STE" :
        t.process_oneInclude("./src/atari/atariST_Default.asm", null, t.strings.lines.length);
      break;
    }

    if (!t.startPass()) return false;
    t.showCompilMsg("processing labels...");
    t.process_labels(true); // preprocess labels to avoid having label + instruction on the same line


    // try to fix all constants - multiple passes needed as one EQU may depend on the value of another EQU
    t.firstPass = true;
    t.lastPass = false;
    if (!t.startPass()) return false;
    t.showCompilMsg("processing EQU...");
    let processLst = t.list_EQU();
    for (let passIt = 0; passIt < max_pass; passIt++) {
      if (passIt == max_pass - 1)
        t.lastPass = true;
      if (t.process_EQU(processLst)) break;
    }


    // process conditional compilation directives, right after EQU as it may rely on it
    if (!t.startPass()) return false;
    t.showCompilMsg("processing conditional compilation...");
    t.process_conditionalComp();

    // process RS.x
    if (!t.startPass()) return false;
    t.showCompilMsg("processing rs.x...");
    t.process_rs();

    // try to fix all REPT - multiple passes needed
    t.firstPass = true;
    t.lastPass = false;
    watchdog = 0;
    for (let passIt = 0; passIt < max_pass; passIt++) {
      if (passIt == max_pass - 1)
        t.lastPass = true;

      watchdog = 0;
      t.showCompilMsg("processing rept...");
      do {
        if (!t.startPass()) return false;
        watchdog++;
      } while (t.process_REPT() && (watchdog < 50));
    }

    // try to fix all macros - single pass
    if (!t.startPass()) return false;
    t.showCompilMsg("processing macros...");
    t.collect_macro();

    if (!t.startPass()) return false;
    t.process_macro();

    // try to fix all SET : all lines must have been generated before
    if (!t.startPass()) return false;
    t.showCompilMsg("processing sets...");
    t.process_SET();

    // try to fix all labels. Single pass : labels won't infer other labels
    // CODE labels must be processed AFTER nything that impacts line numbers:
    // ==> REPT 
    // ==> include
    // ==> MACRO
    // DATA labels must be processed BEFORE anything that will define their data address (.dcData)
    // ==> dc.x
    // ==> ds.x
    // ==> incbin
    if (!t.startPass()) return false;
    t.showCompilMsg("processing labels (pass2)...");
    t.process_labels(false);

    if (!t.startPass()) return false;
    t.showCompilMsg("processing incbin...");
    t.process_incbin();

    if (!t.startPass()) return false;
    t.showCompilMsg("processing dc.x...");
    t.collectDC();
/*
    t.firstPass = true;
    t.lastPass = false;
    for (let passIt = 0; passIt < max_pass; passIt++) {
      if (passIt == max_pass - 1)
        t.lastPass = true;

      if (!t.startPass()) return false;
      t.process_dx();
    }
*/
    if (!t.startPass()) return false;
    t.showCompilMsg("processing js instructions...");
    t.process_JS();


    t.firstPass = false;

    // Instructions
    if (!t.startPass()) return false;
    t.showCompilMsg("processing instructions...");
    t.process_instr();

    if (!t.startPass()) return false;
    t.showCompilMsg("solving branch labels...");
    t.process_banchLabels();

    if (!t.startPass()) return false;
    t.showCompilMsg("processing branch labels (pass 2)...");
    t.process_banchLabels();

    t.showCompilMsg("processing branch labels (pass 3)...");
    t.process_lateArgs();

    if (!t.startPass()) return false;
    t.showCompilMsg("assembling instructions...");
    const compiledCodeBytes = t.process_assemble();
    if (compiledCodeBytes == -1) {
      main_Alert(t.showParsingErrors());
      return false;
    }

    t.process_lateAsmbl();

    if (!t.startPass()) return false;
    t.showCompilMsg("processing branch labels (pass 4)...");
    t.process_banchLabels(true);

    MACHINE.maxCodeAdrs = compiledCodeBytes;
    
    console.info("assembled " + (compiledCodeBytes-M68K_VECTORS_ZONE_SIZE) + " bytes (" + t.strings.lines.length + " lines)");

    t.showCompilMsg("fill RAM with DC.x values...");
    t.fillDC();

    if (!t.startPass()) return false;
    t.showCompilMsg("bind asm instructions with their js implementation...");
    t.process_executionCallbacks();


    if (!t.startPass()) return false;
    t.showCompilMsg("loading breakpoints...");
    t.process_loadBreakpoints();
    t.showCompilMsg("initializing debugger (generating HTML)...");
    DEBUGGER_initFile();

    t.fastConst = new Array(t.constants.length);
    for (let i = 0; i < t.constants.length; i++) {
      t.fastConst[t.constants[i].name] = i;
    }

    t.fastLabels = new Array(t.labels.length);
    for (let i = 0; i < t.labels.length; i++) {
      t.fastLabels[t.labels[i].label] = i;
    }

    t.adrsToLabel = new Array(t.labels.length);
    for (let i = 0; i < t.labels.length; i++) {
      if (t.labels[i].codeSectionOfs)
      t.adrsToLabel[t.labels[i].codeSectionOfs] = t.labels[i].label;
    }


    t.showParsingErrors();

    t.showCompilMsg(null);
    HideDebugLog();

    //document.getElementById("log").innerHTML = log;
    return true;
  }

  showParsingErrors() {
    let t = this;
    // dump parsing errors
    let errDump = "";
    if (t.errors.length) {
      for (let i = 0; i < t.errors.length; i++) {
        errDump += t.errors[i];
        errDump += '<br>';
      }
    }
    showHTMLError(errDump);
    t.errorContext.pop();
    return errDump;
  }

  getNearestLabelUp(_index) {
    let t = this;
    for (let i = t.labels.length - 1; i >= 0; i--) {
      const l = t.labels[i];
      if (l.index <= _index) {
        return l;
      }
    }
    return null;
  }

  startPass() {
    let t = this;
    // stop if previous step generated an error
    if (t.stopGlobalCompilation) {
      let elm = document.getElementById("errors");
      elm.innerHTML = "";
      let str = "";
      for (let i = 0; i < t.errors.length; i++) {
        elm.innerHTML += '<br>' + t.errors[i];
        str += '\n' + t.errors[i];
      }
      hideModalBox();
      main_Alert("Errors while assembling:" + str);
      return false;
    }
    // rewind line interpretation values
    t.rsOffset = 0;
    const lnCount = t.strings.lines.length;
    for (let i = 0; i < lnCount; i++) {
      t.strings.lines[i].ofs = 0;
      t.strings.lines[i].finalLine = i;
    }
    return true;
  }

  Error(_str) {
    let t = this;
    if (t.lastPass) {
      t.push_error(_str);
      console.error(_str);
      t.stopGlobalCompilation = true;
    } else {
      console.log("temporary error, will try to fix in another pass: " + _str);
    }
  }


  getSetByName(_name) {
    let t = this;
    for (let i = 0; i < t.set.length; i++) {
      if (t.set[i].name == _name) {
        return t.set[i];
      }
    }
    t.set.push({ name: _name, values: [] });
    return t.set[t.set.length - 1];
  }

  addSet(_name, _line, _value) {
    let t = this;
    let set = t.getSetByName(_name);
    set.values.push({ line: _line, value: _value });
  }
  

  process_SET() {
    let t = this;
    const lnCount = t.strings.lines.length;
    for (let i = 0; i < lnCount; i++) {
      let ln = t.strings.lines[i];
      const keyword = ln.filtered.indexOf('SET');
      if (keyword > 0) {
        const wrd1 = ln.readNextWord();
        if (wrd1.length > 0 && ln.ofs < ln.filtered.length) {
          const wrd2 = ln.readNextWord();
          if (wrd2 == "SET") {
            const value = ln.readNextNumber(PARSE_FAIL_ERROR);
            if (!isNaN(value)) {
              ln.isInstr = false;
              t.addSet(wrd1, i, value);
            }
          }
        }
      }
    }
  }

  process_lateArgs() {
    let t = this;
    for (let i = 0; i < t.lateArgs.length; i++) {
      t.decodeArg(t.lateArgs[i].arg, t.lateArgs[i].line, true);
      if (t.stopGlobalCompilation) return;
    }
  }

  process_loadBreakpoints() {
    let t = this;
    const lnCount = t.strings.lines.length;
    const breakpoints = JSON.parse(localStorage.getItem(LOCALSTORAGE_BREAKPOINTS));
    if (breakpoints) {
      for (let i = 0; i < breakpoints.length; i++) {
        let ln = t.strings.lines[breakpoints[i]];
        if (ln && ln.isInstr) {
          ln.breakpoint = true;
        }
      }
    }
  }

  push_error(_err) {
    let t = this;
    const l = t.errors.length;
    if (l > 0) {
      if (t.errors[l-1] == _err)
        return;
    }
    t.errors.push(_err);
  }

  process_oneInclude(finalPath, ln = null, i = null) {
    let t = this;
    for (let check = 0; check < CODERPARSER_SINGLETON.includes.length; check++) {
      if (CODERPARSER_SINGLETON.includes[check] === finalPath) {
        let str;
        if (ln)
          str = ln.getWarningString("<br>file already included:<br>" + finalPath);
        else
          str = "<br>file already included:<br>" + finalPath;
        console.warn(str);
        showHTMLError(str);
        CODERPARSER_SINGLETON.push_error(str);
        CODERPARSER_SINGLETON.Error(str);
        return false;  
      }
    }
    CODERPARSER_SINGLETON.includes.push(finalPath);
    
    t.errorContext.push("include: " + finalPath);
    if (!t.strings.insertTextFile(finalPath, i + 1)) {
      if (ln) {
        ln.Failed("failed loading " + finalPath);
        return false;
      } else {
        CODERPARSER_SINGLETON.push_error("failed loading " + finalPath);
        CODERPARSER_SINGLETON.Error("failed loading " + finalPath);
        return false;  
      }
    }

    t.errorContext.pop();
    return true;
  }

  process_include() {
    let t = this;
    const lnCount = t.strings.lines.length;
    for (let i = 0; i < lnCount; i++) {
      const ln = t.strings.lines[i];
      const wrd = ln.readNextWord();
      if (wrd == "INCLUDE") {
        ln.isInstr = false;
        let path = ln.readNextWordBetweenQuotes();        
        ln.makeComment();

        let pth = t.get_incxx_path(path, FX_INFO.rootPath);
        if (pth.err) {
          ln.Failed(pth.err);
          return false;
        }
        let finalPath  = pth.final;
        return t.process_oneInclude(finalPath, ln, i);
      }
    }
    return false;
  }

  process_REPT() {
    let t = this;
    t.errorContext.push("process 'REPT' directives");
    const lnCount = t.strings.lines.length;
    for (let i = 0; i < lnCount; i++) {
      let ln = t.strings.lines[i];
      const wrd = ln.readNextWord();
      while (wrd == "REPT") {
        const count = ln.readNextNumber(PARSE_FAIL_ERROR);
        if (isNaN(count)) {
          if (t.lastPass)
            ln.Failed("found 'REPT' but can't find the repetition count. Maybe using an undefined constant.");
          t.errorContext.pop();
          return false;
        }
        else {
          const startIndex = i;
          for (let j = startIndex + 1; j < lnCount; j++) {
            let ln2 = t.strings.lines[j];
            if (ln2.path != ln.path) {
              ln.Failed("could not find ENDR associated to REPT. Make sure REPT and ENDR are in the same file");
              t.stopGlobalCompilation = true;
              return false;
            }
            const wrd2 = ln2.readNextWord();
            if (wrd2 == "REPT") {
              i = j;
              ln = ln2;
              break;
            }
            if (wrd2 == "ENDR") {
              const endIndex = j;
              t.strings.lines.splice(endIndex, 1); // remove ENDR
              t.strings.lines.splice(startIndex, 1); // remove REPT
              let writeIndex = endIndex - 1;
              t.reptn = 1;
              for (let rpt = 0; rpt < count - 1; rpt++) {
                let ns = t.reptn.toString();
                for (let k = startIndex; k < endIndex - 1; k++) {                                    
                  let newstr = t.strings.lines[k].clone();
                  newstr.filtered = newstr.filtered.replaceAll("REPTN",ns);
                  t.strings.lines.splice(writeIndex++, 0, newstr);
                }
                t.reptn++;
              }
              t.reptn = -1;
              // handle REPTN for the cloned line
              for (let k = startIndex; k < endIndex - 1; k++) {                                    
                t.strings.lines[k].filtered = t.strings.lines[k].filtered.replaceAll("REPTN",0);
              }
              t.errorContext.pop();
              return true;
            }
          }
          ln.Failed("could not find ENDR associated to REPT");
          t.stopGlobalCompilation = true;
          return false;
      }
      }
    }
    t.errorContext.pop();
    return false;
  }

  updateLabelStatus_preprocess(ln,lnIt) {
    let t = this;
    let index = ln.updateLabelStatus();
    if (ln.isLabel) {
      const len = ln.filtered.length;
      for (let i = index; i < len; i++) {
        if (!isSpace(ln.filtered[i])) {
          let newLine = ln.clone();
          newLine.filtered = newLine.filtered.slice(i).toUpperCase();
          newLine.isLabel = false;
          t.strings.lines.splice(lnIt+1, 0, newLine);
          ln.filtered = ln.filtered.slice(0,index);
          break;
        }
      }
    }
  }
  
  process_labels(_preprocess_only = false) {
    let t = this;
    if (_preprocess_only) {
      for (let lnIt = 0; lnIt < t.strings.lines.length; lnIt++) {
        let ln = t.strings.lines[lnIt];
        t.updateLabelStatus_preprocess(ln,lnIt);
      }
      return;
    }

    for (let lnIt = 0; lnIt < t.strings.lines.length; lnIt++) {
      let ln = t.strings.lines[lnIt];

      let index = indexOfSingleWord('SECTION', ln.filtered);
      if (index < 0) index = indexOfSingleWord('EVEN', ln.filtered);
      if (index < 0) index = indexOfSingleWord('DATA_C', ln.filtered);
      if (index < 0) index = indexOfSingleWord('DATA_F', ln.filtered);
      if (index < 0) index = indexOfSingleWord('BSS_C', ln.filtered);
      if (index < 0) index = indexOfSingleWord('BSS_F', ln.filtered);
      if (index < 0) index = indexOfSingleWord('CODE_C', ln.filtered);
      if (index < 0) index = indexOfSingleWord('CODE_F', ln.filtered);
      if (index < 0) index = indexOfSingleWord('CODE_ANY', ln.filtered);
      if (index < 0) index = indexOfSingleWord('DATA_ANY', ln.filtered);
      if (index < 0) index = indexOfSingleWord('BSS_ANY', ln.filtered);    
      if (index >= 0) {
        ln.isInstr = false;
        ln.makeDataEven = true;
      } else {
        index = indexOfSingleWord('XDEF', ln.filtered);
        if (index < 0) index = indexOfSingleWord('XREF', ln.filtered);
        if (index >= 0)
          ln.isInstr = false;
      }


      index = ln.updateLabelStatus(); 
      if (ln.isLabel) {
        const len = ln.filtered.length;
        ln.isInstr = false;  
        for (let i = index + 1; i < len; i++) {
          if (!isSpace(ln.filtered[i])) {
            ln.Failed("It sucks, but for the moment the parser does not support anything after ':' on a line. Case 1: if you're defining a label, insert a newline after ':'. Case 2: if you're defining a struct using rs.x, don't use ':' after your label name");
            break;
          }
        }
      }
      if (ln.isLabel && (!_preprocess_only)) {
        ln.skipSpaces();
        let name = ln.filtered.substring(ln.ofs, index);
        if (name[name.length-1] == ':')
          name = name.substring(0, name.length - 1);
        //console.log("adding label: " + name);
        if (name[0] != '.') {
          for (let k = 0; k < t.labels.length; k++) {
            if (t.labels[k].label == name) {
              return ln.Failed("sorry, label " + name + " already exists in file " + t.labels[k].fromFile + " at line " + (t.labels[k].fromLine + 1).toString());
            }
          }
        }
        t.labels.push({ label: name, index: lnIt, fromFile: ln.path, fromLine: ln.line, dcData: null });
      }
    }
  }

  removeSemiColumn(_s) {
    if (_s[_s.length-1] == ':') 
      return _s.substring(0, _s.length - 1);
    return _s;
  }

  collect_macro() {
    let t = this;
    const lnCount = t.strings.lines.length;
    for (let lnIt = 0; lnIt < lnCount; lnIt++) {
      let ln = t.strings.lines[lnIt];
      let name = t.removeSemiColumn(ln.readNextWord());
      const wrd = ln.readNextWord();
      if (wrd == "MACRO") {
        ln.isInstr = false;
        ln.isMacroDef = true;
        t.strings.lines[lnIt].isMacroDef = true;
        let m = { name: name, lines: [], labels: [] };
        for (let mIt = lnIt + 1; mIt < lnCount; mIt++) {
          let newLn = t.strings.lines[mIt];
          t.strings.lines[mIt].isMacroDef = true;
          newLn.isMacroDef = true;
          const v = newLn.readNextWord();
          if (v == "ENDM") {
            newLn.isInstr = false;
            break;          
          }
          newLn.endLabelIndex = -100;
          newLn.updateLabelStatus(true);
          if (newLn.isLabel) {
            let fromTxt = t.removeSemiColumn(newLn.filtered);
            m.labels.push({from:fromTxt, to:fromTxt});
          }
          m.lines.push(newLn);
        }
        t.macros[name] = m;
      }
    }
  }

  process_macro() {
    let t = this;
    let lnCount = t.strings.lines.length;
    for (let lnIt = 0; lnIt < lnCount; lnIt++) {
      let ln = t.strings.lines[lnIt];
      if (ln.isMacroDef)
        continue; // no macros in macros for the time being
      //if (ln.text.indexOf("interrupt") >= 0)
      //  debugger;
      const wrd = ln.readNextWord();
      const m = t.macros[wrd];
      if (m) { // macro found
        // collect arguments
        let args = [];
        let a = '';
        while (true) {
          a = ln.readNextWord([',']);
          if (a)
            ln.ofs += 2;
          if (!a || a == 'MACRO')
            break;
          args.push(a);
        }
        if (a == 'MACRO')
          continue;
        // insert macro
        t.macroCounter++;
        for (let i = 0; i < m.lines.length; i++) {
          let l = m.lines[i];
          if (l.isLabel) {
            for (let j = 0; j < m.labels.length; j++) {
              const filt = t.removeSemiColumn(l.filtered);
              if (m.labels[j].from == filt) {
                const lnI = lnIt + i + 1;
                m.labels[j].to = m.labels[j].from.replaceAll('\\@', '_' + lnI + '_' + t.macroCounter);
              }
            }
          }
        }

        for (let i = 0; i < m.lines.length; i++) {
          let l = m.lines[i].clone();
            l.isMacroDef = false;
          for (let j = 0; j < args.length; j++) {
            l.text = l.text.replaceAll('\\' + (j + 1).toString(), args[j]);
            l.filtered = l.filtered.replaceAll('\\' + (j + 1).toString(), args[j]);
          }
          for (let j = 0; j < m.labels.length; j++) {
            l.text = l.text.replaceAll(m.labels[j].from, m.labels[j].to);
            l.filter();
          }
          const lnI = lnIt + i + 1;
          l.line = lnIt;
          t.strings.lines.splice(lnI, 0, l);
          t.updateLabelStatus_preprocess(t.strings.lines[lnI], lnI);
        }
        t.strings.lines[lnIt].makeComment();
        lnCount = t.strings.lines.length;
      }
    }
  }

  rewind_path(path) {
    let idx = path.length-1;
    if (path[idx] == '/') idx--;
    while (idx>0) {
      if (path[idx] == '/') {
        path = path.slice(0,idx+1);
        break;
      }
      idx--;
    }  
    return path;
  }

  get_incxx_path(path, rootPath) {
    let t = this;

    let ret = {final: "", err: null};

    if (rootPath) {
      if (rootPath[rootPath.length-1] != '/')
        rootPath += "/";
    }  

    if (path.length < 2) {
      ret.err = "can't load file : path not found";
      return ret;
    }
    let finalPath  = "";
    if (path.indexOf("SYSROOT/") == 0) {
      path = path.replaceAll("SYSROOT/","./");
    } else {
      if (rootPath) {
        finalPath = rootPath;
      }  
    }
    if (path.startsWith("../")) {
      if (!rootPath) {
        ret.err = "can't use relative path if rootPath is not set in REGISTER_FX in your .js FX file";
        return ret;
      }
      path = path.substr(3);
      finalPath = t.rewind_path(finalPath,2);
    }
    finalPath += path;
    ret.final = finalPath;
    return ret;
  }

  process_incbin() {
    let t = this;
    const lnCount = t.strings.lines.length;
    for (let lnIt = 0; lnIt < lnCount; lnIt++) {
      let ln = t.strings.lines[lnIt];
      const wrd = ln.readNextWord();
      if (wrd == "INCBIN") {
        ln.isInstr = false;
        let path = ln.readNextWordBetweenQuotes();
        ln.attachedLabel = t.getNearestLabelUp(lnIt);
        if (!ln.attachedLabel) {
          ln.Failed("The system needs 1 label before incbin, otherwise, it does not know to which address it should load it.");
          return false;
        }
        let pth = t.get_incxx_path(path, FX_INFO.rootPath);
        if (pth.err) {
          ln.Failed(pth.err);
          return false;
        }
        let finalPath  = pth.final;
        t.showCompilMsg("load binary file: " + finalPath);
        const err = load_binary_resource(finalPath, ln.attachedLabel);
        if (err) {
          let errMsg = "'incbin' failed for file: " + path; 
          if (FX_INFO.rootPath)
            errMsg += ", rootPath was set to: " + FX_INFO.rootPath + ", final path is: " + finalPath;
          ln.Failed(errMsg + ", error is: " + err);
          return false;
        }
      }
    }
    return true;
  }

  collectDC() {
    let t = this;
    CODERPARSER_SINGLETON.DxLines = [];
    // LIST LINES
    const lnCount = t.strings.lines.length;
    for (let lnIt = 0; lnIt < lnCount; lnIt++) {
      const ln = t.strings.lines[lnIt];
      if (ln.isMacroDef)
        continue;
      if (ln.makeDataEven) {
        CODERPARSER_SINGLETON.DxLines.push("MAKEDATAEVEN");
      }
      if (ln.readDx()) {
        ln.collectArgs(false);
        ln.attachedLabel = t.getNearestLabelUp(lnIt);
        if (!ln.attachedLabel) {
          ln.Failed("can't parse dc.x / ds.x as there's no label before");
          return false;
        }
        let bufLen = 0;
        if (ln.isDS) {
          let amount = 0;
          for (let cpy = 0; cpy < ln.DxArgs.length; cpy++) {
            const argVal = ln.DxArgs[cpy].v;
            if (isNaN(argVal))
              ln.Failed("DS: can't calculate size to alloc, unsupported argument #" + (cpy+1));
            else {
              if (argVal < 0) ln.Failed("DS: can't calculate size to alloc, negative argument #" + (cpy+1));
              if ((argVal == 0) && (!ASSEMBLER_CONFIG.allow_ds_0)) ln.Failed("DS: null size for argument #" + (cpy+1) + " (you can allow it in config.js, ASSEMBLER_CONFIG.allow_ds_0)");
              amount += argVal;
            }
          }
          bufLen = amount * ln.instrSize;
        } else {
          bufLen = ln.DxArgs.length * ln.instrSize;
        }
        if (!ln.attachedLabel.dcLen || isNaN(ln.attachedLabel.dcLen))
          ln.attachedLabel.dcLen = bufLen;
        else
          ln.attachedLabel.dcLen += bufLen;
        CODERPARSER_SINGLETON.DxLines.push(ln);
      }
    }
    // ALLOCATE RAM
    const lncount = CODERPARSER_SINGLETON.DxLines.length;
    for (let i = 0; i < lncount; i++) {
      let ln = CODERPARSER_SINGLETON.DxLines[i];
      if (ln == "MAKEDATAEVEN")
        continue;
      if (!ln.attachedLabel.dcData) {
        let lblPrefix = "@DC.@";
        if (ln.isDS)
          lblPrefix = "@DS.@";
        let align = 1;
        if (ln.instrSize > 1)
          align = 2;
        if ( (i > 0) && (CODERPARSER_SINGLETON.DxLines[i-1] == "MAKEDATAEVEN")) {
          MACHINE.makeDataEven();
          align = 2;
        }
          let adrs = MACHINE.allocRAM(ln.attachedLabel.dcLen, 1, lblPrefix+ln.filtered);
      //  console.log("allocating " + ln.attachedLabel.dcLen + " bytes for " + ln.attachedLabel.label + " at " + adrs);
        if (ASSEMBLER_CONFIG.check_dc_align) {
          if ((align > 1) && ((adrs % 2) !== 0)) {
            ln.Failed("needs to be aligned on an even address");
            return;
          }  
        }
        ln.attachedLabel.dcData = adrs;  
      }
    }
  }

  fillDC() {
    let t = this;
    const lncount = CODERPARSER_SINGLETON.DxLines.length;
    for (let i = 0; i < lncount; i++) {
      let ln = CODERPARSER_SINGLETON.DxLines[i];
      if (ln == "MAKEDATAEVEN")
        continue;
      if (!ln.isDS) {
        ln.ofs = ln.DxArgsOfs;
        ln.collectArgs(true);
        let adrs = ln.attachedLabel.dcData;
        if (ln.attachedLabel.writtenDCBytes == null)
          ln.attachedLabel.writtenDCBytes = 0;
        else
          adrs += ln.attachedLabel.writtenDCBytes;
        for (let cpy = 0; cpy < ln.DxArgs.length; cpy++) {
          ln.dcAddress = adrs;
          let val = ln.DxArgs[cpy].v;
          if (val == null || isNaN(val))
            ln.Failed("can't evaluate DC.x arg #" + (cpy+1));
          else {
            if ((!ln.hideDxArgsDbg) && (ln.DxArgs[cpy].dbg != undefined))
              ln.filtered += " ($" + ln.DxArgs[cpy].dbg.toString(16) + ")"
            adrs = MACHINE.setRAMValue(val, adrs, ln.instrSize);
          }
          ln.attachedLabel.writtenDCBytes += ln.instrSize;
        }
      }
    }
  }

  /*
  process_dx() {
    let t = this;
    const lnCount = t.strings.lines.length;
    for (let lnIt = 0; lnIt < lnCount; lnIt++) {
      const ln = t.strings.lines[lnIt];
      if (ln.makeDataEven) {
        MACHINE.makeDataEven();
      }
      if (ln.attachedLabel && !t.firstPass)
        continue;
      let finishLine = true;
      // read instruction name
      const instr = ln.readNextWord(['.']);
      const filtLen = ln.filtered.length;
      if ((ln.ofs + 2 < filtLen) && (ln.filtered[ln.ofs + 1] == '.') && ((instr == 'DC') || (instr == 'DS'))) {
        ln.instr = instr;
        switch (ln.filtered[ln.ofs + 2]) {
          case 'B': ln.instrSize = 1; break;
          case 'W': ln.instrSize = 2; break;
          case 'L': ln.instrSize = 4; break;
          default: ln.Failed("expected 'B', 'W' or 'L' after '.'"); break;
        }
        ln.isInstr = false;
        ln.ofs += 3;
        ln.isDS = false;
        ln.isDC = true;
        if (ln.instr == 'DS') 
          ln.isDS = true;
        // STEP 1 : COLLECT DATA
        let nums = [];
        while (ln.ofs < filtLen) {
          let whileIterOfs = ln.ofs;
          let numberAdded = false;
          const found = ln.readNextNumber(PARSE_FAIL_OK);
          if (!isNaN(found)) { // it's a number
            let failMsg = checkNumberSize(Math.floor(found), ln.instrSize);
            if ((instr == 'DC') && (failMsg != null)) {
              ln.Failed("number exceeds instr size: " + Math.floor(found) + ". reason: " + failMsg);
              return false;              
            }
            nums.push(Math.floor(found));
            numberAdded = true;
          } else { // cant read number, maybe it's a string
            if (ln.instrSize == 1) { // strings can only be dc.b
              let strchar = null;
              if (ln.filtered[ln.ofs] == '"') strchar = '"';
              else if (ln.filtered[ln.ofs] == "'") strchar = "'";
              if (strchar) {
                ln.ofs++;
                while ((ln.ofs < filtLen) && (ln.filtered[ln.ofs] != strchar)) {
                  nums.push(ln.filtered.charCodeAt(ln.ofs));
                  numberAdded = true;
                  ln.ofs++;
                }
                if (ln.filtered[ln.ofs] == strchar) ln.ofs++;
              }
            }
          }
          if (!numberAdded) {
            if (t.lastPass)
              ln.Failed("unknown number in dc.x/ds.x statement.");
            else {
              finishLine = false;
              break;
            }
          }
          ln.skipNextComa();
          if (ln.ofs == whileIterOfs) ln.ofs++; // avoid being stuck in an infinite loop
        }
        if (!finishLine)
          continue;
        ln.attachedLabel = t.getNearestLabelUp(lnIt);
        if (!ln.attachedLabel) {
          ln.Failed("can't parse dc.x / ds.x as there's no label before");
          return false;
        }
        // STEP 1 : ALLOC MEMORY & COPY DATA
        let bufLen = 0;
        let lblPrefix = "@DC.@";
        if (ln.isDS) {
          lblPrefix = "@DS.@";
          let amount = 0;
          for (let cpy = 0; cpy < nums.length; cpy++) {
            amount += nums[cpy];
          }
          bufLen = amount * ln.instrSize;
        } else {
          bufLen = nums.length * ln.instrSize;
        }
        let align = 1;
        if (ln.instrSize > 1)
          align = 2;
        let adrs = MACHINE.allocRAM(bufLen, 1, lblPrefix+ln.filtered);
        if (ASSEMBLER_CONFIG.check_dc_align) {
          if ((align > 1) && ((adrs % 2) !== 0)) {
            ln.Failed("needs to be aligned on an even address");
            return;
          }  
        }
        let endBuffer = adrs + bufLen;
        if ((!ln.attachedLabel.dcData) || (adrs < ln.attachedLabel.dcData))
          ln.attachedLabel.dcData = adrs;
        if (!ln.isDS) {
          for (let cpy = 0; cpy < nums.length; cpy++) {
            adrs = MACHINE.setRAMValue(nums[cpy], adrs, ln.instrSize);
          }
        }
        ln.attachedLabel.dcLen = Math.max(ln.attachedLabel.dcLen, bufLen);
      }
    }
  }
*/

  addConstant(_ln, _name, _value) {
    let t = this;
    let c = t.constants;
    const l = c.length;
    const o = _name.length;
    let i = 0;
    // sort by name length otherwise string replace won't work
    for (i = 0; i < l; i++) {
      const n = c[i].name;
      if (n == _name) {
        if (c[i].line == _ln.line && c[i].path == _ln.path) {
          c[i].value = _value;
          continue; // same entry, due to multi-pass EQU solving
        }
        _ln.Failed("constant '" + _name + "' already defined in '" + c[i].path + "' at line " + c[i].line);
        return;
      }
      if (n.length < o)
        break;
    }
    c.splice(i, 0, { name: _name, value: Math.floor(_value), path: _ln.path, line: _ln.line });
  }

  list_EQU() {
    let t = this;
    let lst = [];
    const lnCount = t.strings.lines.length;
    for (let i = 0; i < lnCount; i++) {
      let ln = t.strings.lines[i];
      const wrd1 = ln.readNextWord();
      const wrd2 = ln.readNextWord();
      if (wrd2 == "EQU" || wrd2 == "=") {
        if (ASSEMBLER_CONFIG.no_space_before_EQU) {
          if (ln.isSpace(ln.text[0])) { // ln.text, not ln.filtered because filtered already removed heading spaces
            ln.Failed("found space at the beginning of the line, but 'no_space_before_EQU' option is set in config.js.");
            return lst;
          }
        }
        ln.isInstr = false;
        lst.push({w:wrd1, v:i});
      }
    }
    return lst;
  }

  process_EQU(_equlst) {
    let t = this;
    let allDone = true;
    const lnCount = _equlst.length;
    for (let i = 0; i < lnCount; i++) {
      let ln = t.strings.lines[_equlst[i].v];
      let errBhv = PARSE_FAIL_OK;
      if (t.lastPass) errBhv = PARSE_FAIL_ERROR;
      const value = ln.readNextNumber(errBhv);
      if (!isNaN(value)) {
        t.addConstant(ln, _equlst[i].w, value);
      } else allDone = false;
    }
    return allDone;
  }

  process_rs() {
    let t = this;
    const lnCount = t.strings.lines.length;
    for (let i = 0; i < lnCount; i++) {
      let ln = t.strings.lines[i];

      const wrd = ln.readNextWord();
      if (wrd == "RSRESET") {
        ln.isInstr = false;
        t.rsOffset = 0;
        continue;
      }

      let rsIndex = indexOfSingleWord('RS.B', ln.filtered);
      if (rsIndex < 0) rsIndex = indexOfSingleWord('RS.W', ln.filtered);
      if (rsIndex < 0) rsIndex = indexOfSingleWord('RS.L', ln.filtered);
      if (rsIndex >= 0) {
        ln.isInstr = false;
        let rsSize = 0;
        switch (ln.filtered[rsIndex + 3]) {
          case 'B': rsSize = 1; break;
          case 'W': rsSize = 2; break;
          case 'L': rsSize = 4; break;
            break;
          default:
            ln.Failed("expecting 'b', 'w' or 'l' after 'rs.'");
            return false;
        }

        if (rsSize > 0) {
          ln.ofs = rsIndex + 4;
          ln.skipSpaces();
          const found = ln.readNextNumber(PARSE_FAIL_ERROR);
          if (found != NaN) {
            ln.ofs = 0;
            let name = ln.readNextWord();
            if (name == 'RS.B' || name == 'RS.W' || name == 'RS.L')
              ln.Failed("'rs.x:' bad name. Please wirte rs.x label and value on the same line");
            name = "";
            let ofs = 0;
            while (ln.text[ofs] == ' ' || ln.text[ofs] == '\t') ofs++;
            while (ln.text[ofs] != ' ' && ln.text[ofs] != '\t' && ln.text[ofs] != '\n') name += ln.text[ofs++];
            t.addConstant(ln, name, t.rsOffset);
            t.rsOffset += found * rsSize;
            continue;
          }
        }
      }
    }
  }

  process_JS() {
    let t = this;
    const lnCount = t.strings.lines.length;
    for (let i = 0; i < lnCount; i++) {
      let ln = t.strings.lines[i];
      let jsIn = ln.filtered.indexOf('>JS');
      if (jsIn >= 0) {
        jsIn += 4;
        ln.jsString = '';
        while (jsIn < ln.filtered.length) {
          ln.jsString += ln.filtered[jsIn];
          jsIn++;
        }

        for (let rr = 0; rr <= 7; rr++) {
          ln.jsString = ln.jsString.replaceAll("lock(d"+rr,"lock('d"+rr+"'");
          ln.jsString = ln.jsString.replaceAll("lock(D"+rr,"lock('d"+rr+"'");
          ln.jsString = ln.jsString.replaceAll("lock(a"+rr,"lock('a"+rr+"'");
          ln.jsString = ln.jsString.replaceAll("lock(A"+rr,"lock('a"+rr+"'");

          ln.jsString = ln.jsString.replaceAll("d"+rr+".ub","(regs.d["+rr+"]&0xff)");
          ln.jsString = ln.jsString.replaceAll("d"+rr+".uw","(regs.d["+rr+"]&0xffff)");
          ln.jsString = ln.jsString.replaceAll("d"+rr+".ul","regs.d["+rr+"]");
          ln.jsString = ln.jsString.replaceAll("d"+rr+".uh","((regs.d["+rr+"]>>>16)&0xffff)");

          ln.jsString = ln.jsString.replaceAll("d"+rr+".b","TOOLS.toInt8(regs.d["+rr+"])");
          ln.jsString = ln.jsString.replaceAll("d"+rr+".w","TOOLS.toInt16(regs.d["+rr+"])");
          ln.jsString = ln.jsString.replaceAll("d"+rr+".l","TOOLS.toInt32(regs.d["+rr+"])");
          ln.jsString = ln.jsString.replaceAll("d"+rr+".h","TOOLS.toInt16((regs.d["+rr+"]>>16)&0xffff)");

          ln.jsString = ln.jsString.replaceAll("d"+rr+".ib","TOOLS.toInt8(regs.d["+rr+"])");
          ln.jsString = ln.jsString.replaceAll("d"+rr+".iw","TOOLS.toInt16(regs.d["+rr+"])");
          ln.jsString = ln.jsString.replaceAll("d"+rr+".il","TOOLS.toInt32(regs.d["+rr+"])");
          ln.jsString = ln.jsString.replaceAll("d"+rr+".ih","TOOLS.toInt16((regs.d["+rr+"]>>16)&0xffff)");

          ln.jsString = ln.jsString.replaceAll("a"+rr+".ub","(regs.a["+rr+"]&0xff)");
          ln.jsString = ln.jsString.replaceAll("a"+rr+".uw","(regs.a["+rr+"]&0xffff)");
          ln.jsString = ln.jsString.replaceAll("a"+rr+".ul","regs.a["+rr+"]");
          ln.jsString = ln.jsString.replaceAll("a"+rr+".uh","((regs.a["+rr+"]>>>16)&0xffff)");

          ln.jsString = ln.jsString.replaceAll("a"+rr+".b","TOOLS.toInt8(regs.a["+rr+"])");
          ln.jsString = ln.jsString.replaceAll("a"+rr+".w","TOOLS.toInt16(regs.a["+rr+"])");
          ln.jsString = ln.jsString.replaceAll("a"+rr+".l","TOOLS.toInt32(regs.a["+rr+"])");
          ln.jsString = ln.jsString.replaceAll("a"+rr+".h","TOOLS.toInt16((regs.a["+rr+"]>>16)&0xffff)");

          ln.jsString = ln.jsString.replaceAll("a"+rr+".ib","TOOLS.toInt8(regs.a["+rr+"])");
          ln.jsString = ln.jsString.replaceAll("a"+rr+".iw","TOOLS.toInt16(regs.a["+rr+"])");
          ln.jsString = ln.jsString.replaceAll("a"+rr+".il","TOOLS.toInt32(regs.a["+rr+"])");
          ln.jsString = ln.jsString.replaceAll("a"+rr+".ih","TOOLS.toInt16((regs.a["+rr+"]>>16)&0xffff)");
        }
        ln.jsString = ln.jsString.replaceAll("label(\"","TOOLS.getLabelAdrs(\"");
        ln.jsString = ln.jsString.replaceAll("label('","TOOLS.getLabelAdrs('");
        ln.jsString = ln.jsString.replaceAll("const(\"","TOOLS.getConstValue(\"");
        ln.jsString = ln.jsString.replaceAll("const('","TOOLS.getConstValue('");
        ln.jsString = ln.jsString.replaceAll("variable(","TOOLS.getVariable(");
        ln.jsString = ln.jsString.replaceAll("setram(","MACHINE.setRAMValue(");
        ln.jsString = ln.jsString.replaceAll("getram(","MACHINE.getRAMValue(");
        ln.jsString = ln.jsString.replaceAll("print(","DEBUGGER_LOG(");
        ln.jsString = ln.jsString.replaceAll("struct(","TOOLS.getStructField(");
        
        for (let rr = 0; rr < t.constants.length; rr++) {
          const ind = ln.jsString.indexOf(t.constants[rr].name);
          if (ind >= 0) {
            let replace = true;
            if (ind > 0) {
              switch (ln.jsString[ind-1]) {
                case '"':
                case "'":
                case ".":
                  replace = false;
                break;
                default:
                break;
              }
            }
            if (replace)
              ln.jsString = ln.jsString.replaceAll(t.constants[rr].name, t.constants[rr].value);
          }
        }
        
        ln.filtered = ln.jsString;
        ln.isInstr = false;
      }
    }
  }

  process_conditionalComp() {
    let t = this;
    const lnCount = t.strings.lines.length;
    let contitionCode = 0; // 0 : outside block. 1: inside accepted block, 2: inside discarded block
    const setTrue = ' ==> true';
    const setFalse = ' ==> false';
    for (let i = 0; i < lnCount; i++) {
      let ln = t.strings.lines[i];
      let w = ln.readNextWord();
      let v = null;
      if (contitionCode > 0) {
        if ((contitionCode > 0 ) && (w == 'ELSE')) {
          if (contitionCode == 1) contitionCode = 2;
          else contitionCode = 1;
          ln.isInstr = false;
        }
        if ((w == 'ENDC') || (w == 'ENDIF')) {
          ln.isInstr = false;
          contitionCode = 0;
        }
        else {
          if (contitionCode == 2) {
            ln.text = '; ' + ln.text;
            ln.filtered = '; ' + ln.filtered;
            ln.isInstr = false;
            ln.jsString = null;
            ln.filtered = ln.filtered.replace('>JS', '<--');
          }
        }
        continue;
      }
      switch (w) {
        case 'IFEQ':
        case 'IFNE':
        case 'IFD':
        case 'IFND':
          v = ln.readNextWord();
          ln.isInstr = false;
        break;
        default:
        break;
      }
      if (v) {
        let r = ln.parseJSNumber(v, 0, true);
        switch (w) {
          case 'IFEQ':
            if (r == 0)
              contitionCode = 1;
            else
              contitionCode = 2;
            break;
          case 'IFNE':
            if (r != 0)
              contitionCode = 1;
            else
              contitionCode = 2;
            break;
          case 'IFD':
            if (!isNaN(r))
              contitionCode = 1;
            else
              contitionCode = 2;
            break;
          case 'IFND':
            if (isNaN(r))
              contitionCode = 1;
            else
              contitionCode = 2;
            break;
          default:
            break;
        }
        if (contitionCode == 1)
          ln.text += setTrue;
        else
          ln.text += setFalse;
      }
    }
  }

  decodeArg(_arg, _l, _lastChance = false, _isArg1 = false) {
    _arg.cycles = 0;        // default (register)
    _arg.isLabelIndex = NaN;

    let isMovem = false;
    if (_l && _l.instr && _l.instr == "MOVEM") {
      isMovem = true;
    }

    let parenthesis = _arg.str.indexOf('(');
    let r = 0;
    let processed = false;
    _arg.predecrement = false;
    _arg.postincrement = false;
    _arg.disp = null;

    // determine if number as an expression with parenthesis or indirect addressing
    if (_arg.str[r] == '#') {
      // NOTE: having '#' and '(' in the same argument is possible,
      // it's just that '(' does not refer to indirect adressing. 
      // example: #(320-FONT32_W)/8 contains both.
      parenthesis = -1; // discard indirect adressing
      if (isMovem)
        return _l.Failed("MOVEM argument containing '#', I'm confused");
    }

    // CASE 1: INDIRECT ADSRESSING --> register between parenthesis
    if (parenthesis >= 0) {
      if (_arg.str[parenthesis+1] != 'A') 
        parenthesis = -1;
      else if ((_arg.str[parenthesis+2] < '0') || (_arg.str[parenthesis+2] > '7'))
        parenthesis = -1;
    }
    if (parenthesis >= 0) {
      _arg.type = 'ind';
      if (_l.instrSize == 4)
        _arg.cycles = 8;  // address register indirect
      else
        _arg.cycles = 4;
      // check if displacement before
      let found = _l.readNextNumber(PARSE_FAIL_OK);
      if (!isNaN(found)) {
        _arg.cycles += 4;
        r = _l.lastFoundNumberIndex;
        _arg.disp = Math.floor(found);
        if (_arg.disp > 0)
          _arg.disp = castWord(_arg.disp);
        if (_arg.disp > 32767 || _arg.disp < -32767) {
          return _l.Failed("displacement is limited to signed 16 bits");
        }
        processed = true;
      }
      r = skipSpaces(r, _arg.str);

      // check predecrement
      if (_arg.str[r] == '-') {
        _arg.predecrement = true;
        r++;
        if (_l.instrSize == 4)
          _arg.cycles = 10; // address register indirect with predec
        else
          _arg.cycles = 6;
      }
      if (_arg.str[r] != '(')
        return _l.Failed("can't evaluate expression: " + _arg.str);
      // read inside the parenthesis
      r++;
      let reg = readNextRegister(_arg.str, r, true, isMovem, _l);
      if (reg) {
        _arg.reg = reg.reg;
        r = reg.index;
        _arg.tab = reg.tab;
        _arg.ind = reg.ind;
        processed = true;
      }
      if (_arg.str[r] == ',') {
        r++;
        let reg = readNextRegister(_arg.str, r, true, isMovem, _l);
        if (reg) {
          r = reg.index;
          if ((_l.instr == 'LEA') || ((_arg.str.charAt(r) == '.') && (_arg.str.charAt(r + 1) == 'W'))) {
            _arg.indReg = reg.reg;
            _arg.indTab = reg.tab;
            _arg.indInd = reg.ind;
            r += 2;
            processed = true;
            if (_l.instrSize == 4)
              _arg.cycles = 14; // address register indirect with index
            else
              _arg.cycles = 10;
            }
          else return _l.Failed("expected '.w' after register name");
        } else return _l.Failed("expected register name after ','");
      }
      if (_arg.str[r] == ')') {
        r++;
        if (_arg.str[r] == '+') {
          _arg.postincrement = true;
          r++;
          processed = true;
          if (_l.instrSize == 4)
            _arg.cycles = 8; // address register indirect with postincrement
          else
            _arg.cycles = 4;
        }
      }
      if (!processed)
        return _l.Failed('could not parse indirect adressing');
    }

    parenthesis = _arg.str.indexOf('(');

    while (r < _arg.str.length) {
      let reg = readNextRegister(_arg.str, r, false, isMovem, _l);
      if (reg) {
        _arg.type = 'reg';
        if (isMovem) {
          if (!_arg.movem)
            _arg.movem = [];
          _arg.movem.push({ reg: reg.reg, tab: reg.tab, ind: reg.ind });
          r = reg.index;
          while (r < _arg.str.length) {
            let op = 0;
            switch (_arg.str[r]) {
              case '-': op = 1; r++; break;
              case '/': op = 2; r++; break;
              default: return _l.Failed("could not parse movem arg, expected '-' or '/' after register"); break;
            }
            reg = readNextRegister(_arg.str, r, false, isMovem, _l);
            r = reg.index;
            if (!reg)
              return _l.Failed("could not parse movem arg, expected register after '-' or '/'");
            switch (op) {
              case 1: { // add all registers between _arg.movem[_arg.movem.length-1] and reg
                let prev = _arg.movem[_arg.movem.length - 1];
                let rname = prev.reg[0];
                for (let ri = prev.ind + 1; ri <= reg.ind; ri++) {
                  _arg.movem.push({ reg: rname + ri, tab: prev.tab, ind: ri });
                }
              } break;
              case 2: { // add reg
                _arg.movem.push({ reg: reg.reg, tab: reg.tab, ind: reg.ind });
              } break;
              default: break;
            }
          }
        }
        r = reg.index;
        _arg.reg = reg.reg;
        _arg.tab = reg.tab;
        _arg.ind = reg.ind;
        r = reg.index;
        processed = true;
        return;
      }
      if (_arg.str[r] == '#') {
        _arg.type = 'imm';
        if (_l.instrSize == 4)
          _arg.cycles = 8;  // immediate
       else
          _arg.cycles = 4;
        let found = _l.parseJSNumber(_arg.str, r + 1, true);
        if (!isNaN(found)) {
          _arg.value = Math.floor(found)
          processed = true;
        } else {
          if (_l.instrSize == 4)
            _arg.cycles = 16; // absolute long
         else
            _arg.cycles = 12;
          _arg.isLabelIndex = NaN;
          found = readNextLabel(_arg.str, r + 1);
          if (found) {
            _arg.isLabelIndex = found.num;
            _arg.type = 'labl';
            processed = true;
          } else {
            found = readNextConstant(_arg.str, r + 1);
            if (found) {
              _arg.value = Math.floor(found.num);
              processed = true;
            } else {
              return _l.Failed("can't interpret value after '#'");
            }
          }
        }
        if (found)
          r = found.index;
        return;
      }
      _arg.isLabelIndex = NaN;
      let found = readNextLabel(_arg.str, r);
      if (found) {
        _arg.isLabelIndex = found.num;
        _arg.type = 'labl';
        processed = true;
        if (_l.instrSize == 4)
          _arg.cycles = 16;
       else
          _arg.cycles = 12;    
        return;
      }
      r++;
    }

    if (!processed) {
      PARSEJSNUMBER_ALLOWDCDATA = true;
      let isconst = _l.parseJSNumber(_arg.str, 0, true);
      PARSEJSNUMBER_ALLOWDCDATA = false;
      if (isNaN(isconst)) {
        if (!_lastChance) this.lateArgs.push({arg:_arg, line:_l});
      }
      else {
        isconst = Math.floor(isconst);
        if (_isArg1) {
          _l.updateImmunityflag();
          if ((_l.instr != "LEA") && (_l.arg2) && (!_l.isErrorImmune) && (isconst < M68K_VECTORS_ZONE_SIZE)) {
            this.stopGlobalCompilation = true;
            return _l.Failed("arg1 is an address, missing '#' ?. Add 'M68KWB_NOERROR' in this line's comments to disable this error");
          }
        }
        _arg.type = 'adrs';
        _arg.value = isconst;
        if (_l.instrSize == 4)
          _arg.cycles = 16;
       else
          _arg.cycles = 12;    
        return;
      }
    }
  }

  process_oneLineInstr(ln) {
    if (ln.isMacroDef) {
      return;
    }
    let t = this;
    // read instruction
    let instr = ln.readNextWord();
    ln.skipSpaces();
    if (instr.length > 0) {
      if (instr == "EVEN") {
        ln.isInstr = false;
        ln.instr = null;
      } else {
        ln.isInstr = true;
        ln.instr = instr;
      }
      ln.instrSize = 2; // default size is word
      // get instruction size
      let defaultSizeUsed = true;
      if (instr.length > 2) {
        if (instr[instr.length - 2] == '.') {
          const s = instr[instr.length - 1];
          let validMoveQSize = true; // no size is valid
          let validSccSize = true; // no size is valid
          switch (s) {
            case 'S':
            case 'B': ln.instrSize = 1; validSccSize = true; validMoveQSize = false; break;
            case 'W': ln.instrSize = 2; validSccSize = false; validMoveQSize = false; break;
            case 'L': ln.instrSize = 4; validSccSize = false; validMoveQSize = true; break;
            default: ln.Failed("can't parse instruction size, expected '.b', '.w' or '.l'"); return false;
          }
          defaultSizeUsed = false;
          ln.instr = instr.substring(0, instr.length - 2);
          if (ln.instr == "MOVEQ" && !validMoveQSize)
            ln.Failed("moveq is long only, no .w or .b");
          if (!validSccSize) {
            switch (ln.instr) {
              case 'SEQ':
              case 'SNE':
              case 'SPL':
              case 'SMI':
              case 'SVC':
              case 'SVS':
              case 'ST':
              case 'SF':
              case 'SCC':
              case 'SCS':
              case 'SHI':
              case 'SLS':
              case 'SGE':
              case 'SGT':
              case 'SLE':
              case 'SLT':          
                    ln.Failed("Scc (set according to condition cc) is .b only");
                break;
              default: break;
            }
          }
        }
      }
      switch (ln.instr) {
        case "BLO" : ln.instr = "BCS"; ln.filtered.replace("BLO", "BCS"); break; 
        case "BHS" : ln.instr = "BCC"; ln.filtered.replace("BHS", "BCC");  break; 
      }
      // read args
      let ofsBeforeArg1 = ln.ofs;
      let arg1 = ln.readArg();
      if (arg1 == "READARG-ERROR") {
        t.stopGlobalCompilation = true;
        return;
      }
      let ofsAfterArg1 = ln.ofs;
      ln.ofs = ofsAfterArg1;
      ln.skipNextComa();
      let ofsBeforeArg2 = ln.ofs;
      let arg2 = ln.readArg();
      if (arg2 == "READARG-ERROR") {
        t.stopGlobalCompilation = true;
        return;
      }
      let ofsAfterArg2 = ln.ofs;
      if (arg1.length > 0) ln.arg1 = { str: arg1 };
      if (arg2.length > 0) ln.arg2 = { str: arg2 };

      if (arg1.length > 0) {
        ln.ofs = ofsBeforeArg1;
        t.decodeArg(ln.arg1, ln, false, true);
        if (t.stopGlobalCompilation) return;
      }

      if (arg2.length > 0) {
        ln.ofs = ofsBeforeArg2;
        t.decodeArg(ln.arg2, ln);
        if (ln.arg2.reg == "A7") {
            ln.intentionallyWritingToStack = true;  
        }
      }
      ln.ofs = ofsAfterArg2;
      if (defaultSizeUsed) {
        switch (ln.instr) {
          case 'BTST':
          case 'BSET':
          case 'BCLR':
          case 'BCHG':
                if (asmbl_argIsDataReg(ln.arg2)) ln.instrSize = 4;
            else if (asmbl_isEffectiveAddress(ln.arg2)) ln.instrSize = 1;
            else ln.Failed(ln.instr + " : can't guess expected instruction size, destination does not seem to be a data register or an effctive address. Please use .b or .l");
          break;
          default: break;
        }
      }
    }
  }

  process_instr() {
    let t = this;
    const lnCount = t.strings.lines.length;
    for (let lnIt = 0; lnIt < lnCount; lnIt++) {
      let ln = t.strings.lines[lnIt];
      /*
      let index = indexOfSingleWord('ASSEMBLY_ERROR', ln.filtered);
      if (index >=0) {
        let index2 = ln.filtered.indexOf(';');
        if (index2 <0 || index2 > index) {
          ln.isInstr = false;
          ln.Failed(ln.text);
          t.stopGlobalCompilation = true;
          return false;  
        }
      }
      */
      if (!ln.isInstr)
        continue;
      ln.isInstr = false;
      if (ln.jsString)
        continue;
      if (ln.isLabel)
        continue;
      t.process_oneLineInstr(ln);
      if (t.stopGlobalCompilation) return false;
    }
  }

  process_banchLabels(_final = false) {
    let t = this;
    const lnCount = t.strings.lines.length;
    for (let lnIt = 0; lnIt < lnCount; lnIt++) {
      let line = t.strings.lines[lnIt];
      if (!line.isInstr)
        continue;
      if (line.isMacroDef)
        continue;
      let _label = null;
      switch (line.instr) {
        case 'BHI':
        case 'BLS':
        case 'BCS':
        case 'BCC':
        case 'BNE':
        case 'BEQ':
        case 'BVC':
        case 'BVS':
        case 'BPL':
        case 'BMI':
        case 'BGE':
        case 'BLT':
        case 'BGT':
        case 'BLE':
        case 'BSR':
        case 'BRA':
        case 'JSR':
        case 'JMP':
          line.isBranchInstr = true;
          _label = line.arg1.str;
          break;
        case 'DBF':
        case 'DBRA':
        case 'DBHI':
        case 'DBLS':
        case 'DBCS':
        case 'DBCC':
        case 'DBNE':
        case 'DBEQ':
        case 'DBVC':
        case 'DBVS':
        case 'DBPL':
        case 'DBMI':
        case 'DBGE':
        case 'DBLT':
        case 'DBGT':
        case 'DBLE':
          line.isBranchInstr = true;
          _label = line.arg2.str;
        break;
        case 'LEA': 
          if (CPU_CODE_SECTION) {
            const ad = TOOLS.getLabelAdrs(line.arg1.str, true, true);
            if (!isNaN(ad)) {
              CPU_CODE_SECTION[line.codeSectionOfs + 2 ] = (ad>>24)&0xff;
              CPU_CODE_SECTION[line.codeSectionOfs + 3 ] = (ad>>16)&0xff;
              CPU_CODE_SECTION[line.codeSectionOfs + 4 ] = (ad>>8)&0xff;
              CPU_CODE_SECTION[line.codeSectionOfs + 5 ] = ad&0xff;
            }  
          }
        continue;
      }
      line.branchIP = -1;
      if (_label) {
        let nearIndex = NaN;
        let nearDist = 100000;
        for (let j = 0; j < t.labels.length; j++) {
          const l = t.labels[j].label.toUpperCase();
          if (l == _label) {
            let eligible = true;
            if (_label[0] == '.') {
              if (t.labels[j].index < lnIt) { // destination label is before branch
                for (let k = j + 1; k < t.labels.length; k++) {
                  if (t.labels[k].index >= lnIt)
                    break;
                  if (t.labels[k].label[0] != '.') {
                    eligible = false;
                    break;
                  }
                }
              } else {
                for (let k = j - 1; k >= 0; k--) {
                  if (t.labels[k].index <= lnIt)
                    break;
                  if (t.labels[k].label[0] != '.') {
                    eligible = false;
                    break;
                  }
                }
              }
            }
            if (eligible) {
              let delta = Math.abs(t.labels[j].index - lnIt);
              if (delta < nearDist) {
                nearDist = delta;
                nearIndex = j;
              }
            }
          }
        }
        line.branchAx = NaN;
        if (isNaN(nearIndex)) {
          if (_label[0] == '(' && line.isRegisterName(_label, 1) && _label[3] == ')') {
            line.branchAx = parseInt(_label[2]);
          }
          else {
            let allLabels = "\n\nKnown labels:\n";
            for (let j = 0; j < t.labels.length; j++) {
              const l = t.labels[j].label.toUpperCase();
              allLabels += l + '\n';
            }
    
            line.Failed("could not solve branch, label not found: " + _label);// + allLabels);
            return;
          }
        }
        else {
          const labelIP  = t.labels[nearIndex].codeSectionOfs;
          if (!isNaN(labelIP) && typeof labelIP != 'undefined')
            line.branchIP = labelIP;
          line.branchLineIndex = t.labels[nearIndex].index;
          if (ASSEMBLER_CONFIG.check_branch_size) {
            if (line.branchIP != -1 && line.instrSize < 2) {
              const jumpLen = line.branchIP-line.codeSectionOfs;
              if (!isNaN(jumpLen) && (jumpLen < -126 || jumpLen > 128)) {
                line.Failed("Branch destination is too far, don't use short branch");
                return;
              }
            }  
          }
        }
        if (_final && line.branchIP == -1 && isNaN(line.branchAx)) {
          line.Failed("can't find jump destination label");
          return;
        }
      }
    }
  }

  
  getLabelCodeSectionOffset(_name) {
    let t = this;
    _name = _name.toUpperCase();
    const len = t.labels.length;
    for (let k = 0; k < len; k++) {
      const lb = t.labels[k];
      if (lb.label.toUpperCase() == _name) {
        const ln = t.strings.lines[lb.index];
        if (ln)
          return ln.codeSectionOfs;
        else
          debugger;
      }
    }
    debugger;
    return -1;
  }

  assertEven(n) {
    if (n % 2 == 0) return;
    debugger;
  }

  process_lateAsmbl() {
    let t = this;
    for (let i = 0; i < t.lateAsmbl.length; i++) {
      let out = { tab: new Uint8Array(16), ofs: 0 };
      let ln = t.lateAsmbl[i];
      if (ln.arg1) t.decodeArg(ln.arg1, ln, true, true);
      if (this.stopGlobalCompilation) return;
      if (ln.arg2) t.decodeArg(ln.arg2, ln, true);
      let ret = asmbl_go(ln, out);
      if (ret.solveError != null) {
        ln.Failed(ret.solveError);
        return;
      }
      else if (out.ofs > 0) {
        let csofs = t.lateAsmbl[i].codeSectionOfs;
        ASMBL_ADRSTOLINE[csofs] = ln.finalLine; // index in CODERPARSER_SINGLETON.strings.lines[]
        let len = out.ofs;
        ln.instrBytes = len;
        let bytes = out.tab;
        if (len & 1) main_Alert("assembly process should output words only");
        for (let c = 0; c < len; c++) {
          CPU_CODE_SECTION[csofs++] = bytes[c];
        }
      }
    }
  }

  process_assemble() {
    let t = this;
    const lnCount = t.strings.lines.length;

    // compile instructions
    let codeSectionOfs = M68K_VECTORS_ZONE_SIZE;
    if (!ASMBL_ADRSTOLINE) ASMBL_ADRSTOLINE = new Uint32Array(ASSEMBLER_CONFIG.CPU_CODE_SECTION_BYTES);
    for (let lnIt = 0; lnIt < lnCount; lnIt++) {
      let line = t.strings.lines[lnIt];
      if (codeSectionOfs >= ASSEMBLER_CONFIG.CPU_CODE_SECTION_BYTES) {
        line.Failed("Can't assemble instruction: Code section is too small. Please increase CPU_CODE_SECTION_BYTES in struct ASSEMBLER_CONFIG found in config.js");
        return -1;
      }
        line.codeSectionOfs = codeSectionOfs; // write address even for labels
      if (line.jsString) {
        line.filtered = line.jsString;
        ASMBL_ADRSTOLINE[codeSectionOfs] = line.finalLine;
        CPU_CODE_SECTION[codeSectionOfs++] = 0b01001010; // ILLEGAL OPCODE
        CPU_CODE_SECTION[codeSectionOfs++] = 0b11111100;
        line.filtered = 'ILLEGAL';
        line.isInstr = true;
        line.instrBytes = 2;
        line.call = ILLEGAL;
        line.cycles = 0;
        continue;
      }
      if (!line.isInstr)
        continue;
      if (line.instr && (!line.isMacroDef)) {
        let out = { tab: new Uint8Array(16), ofs: 0 };
        //if (lnIt == 59) debugger;
        asmbl_go(line, out);
        if (out.ofs > 0) {
          ASMBL_ADRSTOLINE[codeSectionOfs] = line.finalLine; // index in CODERPARSER_SINGLETON.strings.lines[]
          let len = out.ofs;
          line.instrBytes = len;
          let bytes = out.tab;
          if (len & 1) main_Alert("assembly process should output words only");
          for (let c = 0; c < len; c++) {
            CPU_CODE_SECTION[codeSectionOfs++] = bytes[c];
          }
        }
      }
    }

    // build labels table
    for (let i = 0; i < t.labels.length; i++) {
      let lab = t.labels[i];
      t.labelByName[lab.label] = lab;
    }


    // solve labels addresses
    const tab = t.labelToAddress;
    const tablen = tab.length;
    for (let i = 0; i < tablen; i++) {
      const e = tab[i];
      let l = e.l;
      //console.log(l.instr);
      let wofs = l.codeSectionOfs + 2; // skip opcode (always 2 bytes)      
      wofs += e.dataStart;
      let arg = e.arg;
      let targetOffset = NaN;
      if (!isNaN(arg.isLabelIndex)) {
        const l_label = t.labels[arg.isLabelIndex];
        const l_line = t.strings.lines[l_label.index];
        if (l_label.dcData)
          targetOffset = l_label.dcData;
        else
          targetOffset = l_line.codeSectionOfs;
      }
      else
        targetOffset = t.getLabelCodeSectionOffset(arg.str);
      arg.type = 'adrs';
      arg.value = targetOffset;
      let   offset = targetOffset 
      if (l.isBranchInstr)
        offset -= l.codeSectionOfs; // branches are relative
      else {
        if (targetOffset < ASSEMBLER_CONFIG.CPU_CODE_SECTION_BYTES) {
          // if code label address
          arg.isFetchingCodeLabel = true;
        }
      }
      const b1 = (offset >> 24) & 0xff;
      const b2 = (offset >> 16) & 0xff;
      const b3 = (offset >> 8) & 0xff;
      const b4 = offset & 0xff;
      if (l.isBranchInstr && e.dataLen == 1) {
        wofs--;  // by te branch : offset is stored in opcide
        CPU_CODE_SECTION[wofs++] = b4;
      } else {
        if (e.dataLen > 2) {
          t.assertEven(wofs);
          CPU_CODE_SECTION[wofs++] = b1;
          CPU_CODE_SECTION[wofs++] = b2;
        }
        t.assertEven(wofs);
        CPU_CODE_SECTION[wofs++] = b3;
        CPU_CODE_SECTION[wofs++] = b4;
      }
    }

    // solve labels addresses
    for (let i = 0; i < t.labels.length; i++) {
      let lab = t.labels[i];
      const l = t.strings.lines[lab.index];
      lab.codeSectionOfs = l.codeSectionOfs;
    }

    // solve branches addreses
    for (let lnIt = 0; lnIt < lnCount; lnIt++) {
      let line = t.strings.lines[lnIt];
      if (line.isBranchInstr) {
        if ((line.branchLineIndex == null) && (line.branchAx == null)) {
          line.Failed("can't solve branch label");
          return -1;
        }
        else if (line.branchLineIndex)
          line.branchIP = t.strings.lines[line.branchLineIndex].codeSectionOfs;
      }
    }

    return codeSectionOfs;
  }


  pickCycle(ln, bw,l) {
    if (ln.instrSize < 4) ln.cycles = bw;
    else ln.cycles = l;
  }

  shiftCycle(line) {
    let t = this;
    if (line.arg2 && line.arg2.tab == regs.d) {
      const v = 2*line.arg1.value;
      t.pickCycle(line,6+v, 8+v);
      return true;
    }
    return false;
  }

  multiprecCycle(line) {
    let t = this;
    if (line.arg2.tab == regs.d) {
      t.pickCycle(line,4,8);
    } else {
      t.pickCycle(line,18,30);
    }
  }

  process_executionCallback_oneLine(line) {
    let t = this;
    if (!line.isInstr)
      return;
    if (line.instr) {
      if (line.instrSize < 1 || line.instrSize > 4) line.instrSize = 2;
      line.cycles = 0;
      switch (line.instr) {
        case 'ADD':
        case 'ADDI':
          if (line.arg2.tab == regs.d) t.pickCycle(line,4,6);
          else if (line.arg2.tab == regs.a) t.pickCycle(line,8,6);
          else t.pickCycle(line,8,12);
          line.call = ADD; 
        break;
        case 'ADDA': 
          if (line.arg2.tab == regs.a) t.pickCycle(line,8,6);
          else line.Failed("should not be ADDA if arg2 is not an address register");
          line.call = ADDA; 
        break;
        case 'ADDQ': 
          if (line.arg2.tab == regs.d) t.pickCycle(line,4,8);
          else if (line.arg2.tab == regs.a) t.pickCycle(line,8,8);
          else t.pickCycle(line,12,12);
          if (line.arg1.value > 8) line.Failed("ADDQ arg1 cannot be greater than 8");
          if (line.arg1.value < 1) line.Failed("ADDQ arg1 cannot be lower than 1");
          line.call = ADD; 
          break;
        case 'ADDX': 
          t.multiprecCycle(line);
          line.call = ADDX; 
        return;
        case 'AND':
        case 'ANDI':
          if (line.arg2.type == 'reg' && line.arg2.tab == regs.a) return line.Failed("can't AND an address register");
          if (line.arg2.tab == regs.d) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,12);
          line.call = AND; 
        break;
        case 'ASL': 
          line.call = ASL; 
          if (t.shiftCycle(line)) return;
        break;
        case 'ASR': 
          line.call = ASR; 
          if (t.shiftCycle(line)) return;
        break;
        case 'BHI': line.cycles = 10; line.call = BHI; return;
        case 'BLS': line.cycles = 10; line.call = BLS; return;
        case 'BCS': line.cycles = 10; line.call = BCS; return;
        case 'BCC': line.cycles = 10; line.call = BCC; return;
        case 'BNE': line.cycles = 10; line.call = BNE; return;
        case 'BEQ': line.cycles = 10; line.call = BEQ; return;
        case 'BVC': line.cycles = 10; line.call = BVC; return;
        case 'BVS': line.cycles = 10; line.call = BVS; return;
        case 'BPL': line.cycles = 10; line.call = BPL; return;
        case 'BMI': line.cycles = 10; line.call = BMI; return;
        case 'BGE': line.cycles = 10; line.call = BGE; return;
        case 'BLT': line.cycles = 10; line.call = BLT; return;
        case 'BGT': line.cycles = 10; line.call = BGT; return;
        case 'BLE': line.cycles = 10; line.call = BLE; return;
        case 'BCHG':
          if (line.arg1.type == 'reg' && line.arg1.tab == regs.a) return line.Failed("can't BCHG an address register");
          line.call = BCHG; 
        break;
        case 'BCLR':
          if (line.arg1.type == 'reg' && line.arg1.tab == regs.a) return line.Failed("can't BCLR an address register");
          line.call = BCLR; 
        break;
        case 'BSET': 
          if (line.arg1.type == 'reg' && line.arg1.tab == regs.a) return line.Failed("can't BSET an address register");
          line.call = BSET; 
        break;
        case 'BSR': line.call = BSR; break;
        case 'BTST':
          if (line.arg1.type == 'reg' && line.arg1.tab == regs.a) return line.Failed("can't BTST an address register");
          line.call = BTST;
        break;
        case 'BRA': 
          line.cycles = 10; 
          line.call = BRA; 
        return;
        case 'CHK': line.call = NOT_IMPLEMENTED; break;
        case 'CLR': 
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,12);
          line.call = CLR; 
        break;
        case 'CMP': 
        case 'CMPI': 
        case 'CMPA':
          if (line.arg2.tab == regs.d) t.pickCycle(line,4,6);
          else if (line.arg2.tab == regs.a) t.pickCycle(line,6,6);
          else t.pickCycle(line,8,12);
          line.call = CMP; 
        break;
        case 'CMPM': line.call = NOT_IMPLEMENTED; break;
        case 'DBF': line.cycles = 12; line.call = DBF; return; // DBCC default cycles is 10 as we expect a loop to be taken at least once
        case 'DBRA': line.cycles = 12; line.call = DBF; return;
        case 'DBHI': line.cycles = 12; line.call = DBHI; return;
        case 'DBLS': line.cycles = 12; line.call = DBLS; return;
        case 'DBCS': line.cycles = 12; line.call = DBCS; return;
        case 'DBCC': line.cycles = 12; line.call = DBCC; return;
        case 'DBNE': line.cycles = 12; line.call = DBNE; return;
        case 'DBEQ': line.cycles = 12; line.call = DBEQ; return;
        case 'DBVC': line.cycles = 12; line.call = DBVC; return;
        case 'DBVS': line.cycles = 12; line.call = DBVS; return;
        case 'DBPL': line.cycles = 12; line.call = DBPL; return;
        case 'DBMI': line.cycles = 12; line.call = DBMI; return;
        case 'DBGE': line.cycles = 12; line.call = DBGE; return;
        case 'DBLT': line.cycles = 12; line.call = DBLT; return;
        case 'DBGT': line.cycles = 12; line.call = DBGT; return;
        case 'DBLE': line.cycles = 12; line.call = DBLE; return;
        case 'DIVS': line.cycles = 158; line.call = DIVS; return;
        case 'DIVU': line.cycles = 140; line.call = DIVU; return;
        case 'EOR': 
        case 'EORI': 
          if (line.arg2.tab == regs.d) t.pickCycle(line,4,8);
          else t.pickCycle(line,8,12);
          line.call = EOR; 
        break;
        case 'EXG': 
          line.cycles = 6;
          line.call = EXG;
        return;
        case 'EXT': 
          line.cycles = 4; 
          line.call = EXT;
        return;
        case 'EVEN': line.call = EVEN; break;
        case 'ILLEGAL': line.cycles = 0; line.call = ILLEGAL; break; // ILLEGAL = JS CALL = 0 cycles
        case 'JMP': line.call = BRA; break;
        case 'JSR': line.call = BSR; break;
        case 'LEA': line.call = LEA; break;
        case 'LINK': line.call = NOT_IMPLEMENTED; break;
        case 'LSL': 
          line.call = LSL; 
          if (t.shiftCycle(line)) return;
        break;
        case 'LSR': 
          line.call = LSR; 
          if (t.shiftCycle(line)) return;
        break;
        case 'MOVE': 
          line.cycles = 4; 
          if (line.arg2.predecrement) line.arg2.cycles -=2; // no predecrement penalty when arg2 for MOVE
          line.call = MOVE; 
        break;
        case 'MOVEA': line.cycles = 4; line.call = MOVEA_X; break;
        case 'MOVEM':
          let base = 4;
          if (line.instrSize == 4) base = 8;
          if (line.arg1.movem) line.cycles = line.arg2.cycles + line.arg1.movem.length * base;
          else line.cycles = base + line.arg1.cycles + line.arg2.movem.length * base;
          line.call = MOVEM; 
        return;
        case 'MOVEP': 
          t.pickCycle(line,16,24);
          line.call = MOVEP; 
        return;
        case 'MOVEQ': 
          if (line.arg2.tab == regs.d) line.cycles = 4;
          else line.Failed("arg2 of MOVEQ must be a data register");
          if (line.arg1.value > 127) line.Failed("MOVEQ arg1 cannot be greater than 127");
          if (line.arg1.value < -128) line.Failed("MOVE arg1 cannot be lower than -128");
          line.call = MOVE_L; 
        return;
        case 'MULS': line.cycles = 70; line.call = I_MULS; break;
        case 'MULU': line.cycles = 70; line.call = I_MULU; break;
        case 'NBCD': line.call = NOT_IMPLEMENTED; break;
        case 'NEG': 
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,12);
          line.call = NEG; 
        break;
        case 'NEGX': 
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,12);
          line.call = NEGX; 
        break;
        case 'NOP': line.call = NOP; break;
        case 'NOT':
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,12);
          line.call = NOT;
        break;
        case 'OR': 
        case 'ORI': 
          if (line.arg2.type == 'reg' && line.arg2.tab == regs.a) return line.Failed("can't OR an address register");
          if (line.arg2.tab == regs.d) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,12);
          line.call = OR; 
        break;
        case 'PEA': 
          line.cycles = 4;
          line.call = PEA; 
        break;
        case 'RESET': line.call = NOT_IMPLEMENTED; break;
        case 'ROL': 
          line.call = ROL; 
          if (t.shiftCycle(line)) return;
        break;
        case 'ROR': 
          line.call = ROR;
          if (t.shiftCycle(line)) return;
        break;
        case 'ROXL': 
          line.call = ROXL; 
          if (t.shiftCycle(line)) return;
        break;
        case 'ROXR': 
          line.call = ROXR;
          if (t.shiftCycle(line)) return;
        break;
        case 'RTR': line.call = NOT_IMPLEMENTED; break;
        case 'RTS': 
          line.cycles = 16;
          line.call = RTS;
        return;
          case 'RTE': 
          line.cycles = 16;
          line.call = RTE; 
        return;
        case 'SBCD': line.call = NOT_IMPLEMENTED; break;
        case 'SEQ':
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,8);
          line.call = SEQ;
        break;
        case 'SNE':
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,8);
          line.call = SNE;
        break;
        case 'SPL':
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,8);
          line.call = SPL;
        break;
        case 'SCC':
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,8);
          line.call = SCC;
        break;
        case 'SCS':
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,8);
          line.call = SCS;
        break;
        case 'SMI':
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,8);
          line.call = SMI;
        break;
        case 'SVC':
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,8);
          line.call = SVC;
        break;
        case 'SVS':
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,8);
          line.call = SVS;
        break;
        case 'SHI':
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,8);
          line.call = SHI;
        break;
        case 'SLS':
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,8);
          line.call = SLS;
        break;
        case 'SGE':
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,8);
          line.call = SGE;
        break;
        case 'SGT':
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,8);
          line.call = SGT;
        break;
        case 'SLE':
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,8);
          line.call = SLE;
        break;
        case 'SLT':
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,8);
          line.call = SLT;
        break;
        case 'ST':
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,8);
          line.call = ST;
        break;
        case 'SF':
          if ((line.arg1.tab == regs.d) || (line.arg1.tab == regs.a)) t.pickCycle(line,4,6);
          else t.pickCycle(line,8,8);
          line.call = SF;
        break;
        case 'STOP': line.call = NOT_IMPLEMENTED; break;
        case 'SUB': 
        case 'SUBI':
          if (line.arg2.tab == regs.d) t.pickCycle(line,4,6);
          else if (line.arg2.tab == regs.a) t.pickCycle(line,8,6);
          else t.pickCycle(line,8,12);
          line.call = SUB; 
        break;
        case 'SUBA': 
          if (line.arg2.tab == regs.a) t.pickCycle(line,8,6);
          else line.Failed("should not be SUBA if arg2 is not an address register");
          line.call = SUB; 
        break;
        case 'SUBQ': 
          if (line.arg2.tab == regs.d) t.pickCycle(line,4,8);
          else if (line.arg2.tab == regs.a) t.pickCycle(line,8,8);
          else t.pickCycle(line,8,12);
          if (line.arg1.value > 8) line.Failed("SUBQ arg1 cannot be greater than 8");
          if (line.arg1.value < 1) line.Failed("SUBQ arg1 cannot be lower than 1");
          line.call = SUB; 
        break;
        case 'SUBX': 
          t.multiprecCycle(line);
          line.call = SUBX;
        return;
        case 'SWAP':
          line.cycles = 4;
          line.call = I_SWAP; 
        return;
        case 'TAS': line.call = NOT_IMPLEMENTED; break;
        case 'TRAP': line.call = TRAP; break;
        case 'TRAPV': line.call = NOT_IMPLEMENTED; break;
        case 'TST':
          if (line.arg1.type == 'reg' && line.arg1.tab == regs.a) return line.Failed("can't TST an address register");
          line.cycles = 4;
          line.call = TST; 
        return;
        case 'UNLK': line.call = NOT_IMPLEMENTED; break;
        default: line.Failed('instruction not recognized: ' + line.instr); break;
      }
      if (line.cycles == 0)
        line.cycles = 8;  // some default average shit for not yet covered instructions, useful for interrupts
      if (line.arg1) line.cycles += line.arg1.cycles;
      if (line.arg2) line.cycles += line.arg2.cycles;
      line.SetInstrCycles(); // more precise wip
    }
  }

  process_executionCallbacks() {
    let t = this;
    const lnCount = t.strings.lines.length;
    for (let lnIt = 0; lnIt < lnCount; lnIt++) {
      t.process_executionCallback_oneLine(t.strings.lines[lnIt]);
    }
  }
}
