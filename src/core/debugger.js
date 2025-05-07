var DEBUGGER_SHOWCPUCYCLES = false;
var DEBUGGER_paranoid = true;
var DEBUGGER_tracing = false;
var DEBUGGER_canStep = false;
var DEBUGGER_Base = 16;
var DEBUGGER_signed = false;
var DEBUGGER_insideInvoke = null;
var DEBUGGER_dumpReg = 'a0';
var DEBUGGER_saveReg = new Uint32Array(24);
var DEBUGGER_startRow = 0;
var DEBUGGER_endRow = 40;
var DEBUGGER_activeRow = DEBUGGER_startRow + 8;
var DEBUGGER_rowToIP = [];
var DEBUGGER_traceTillRTS = false;
var DEBUGGER_runTillIP = null;
var DEBUGGER_lastWrittenAdrs = 0;
var DEBUGGER_lastReadAdrs = 0;
var DBGVAR = {};
var DBGCTX = [];
var DBGCTX_INDENT = 0;
var DEBUGGER_SHIFT_PRESSED = false;
var DEBUGGER_CTRL_PRESSED = false;
var DEBUGGER_ALT_PRESSED = false;
var DEBUGGER_HWBpts = new Int32Array(DEBUGGER_CONFIG.MAX_HW_BPT * 2);
var DEBUGGER_VBpt = new Int32Array(3);
var DEBUGGER_customWatch = NaN;
var DEBUGGER_lastBreakPointProcessed = -1;
var DEBUGGER_skipNextBP = -1;
var DEBUGGER_PrevFocus = null;
var DEBUGGER_lastBeforeInstr = -1;
var DEBUGGER_lastAfterInstr = -1;
var DEBUGGER_labels = [];
var DEBUGGER_origlines = []; // string for the source code
var DEBUGGER_disamlines = []; // string for the source code
var DEBUGGER_AllowJS = true;
var DEBUGGER_AllocsList = [];
var DEBUGGER_ALLOWONELINER = true;
var DEBUGGER_lastJSExecLog = null;
var DEBUGGER_timeM_prevRow = null;
var DEBUGGER_hitBP_prevRow = null;
var DEBUGGER_ForceFocus = null;
var DEBUGGER_QueryDisplayRefresh = false;

DEBUGGER_DumpCopperList = null;
DEBUGGER_copperListDump = "";
const INVALID_BRKPT_ADRS = 0xffffffff;
var DEBUGGER_PRECLASSLEFT = "col_8";
var DEBUGGER_PRECLASSRIGHT = "col_4";
var DEBUGGER_PAUSEUPDATE = false;
var DEBUGGER_PAUSEVBL = false;
var DEBUGGER_AdditionalDbgMsg = "";
var DEBUGGER_NeedReload = false;
var DEBUGGER_justHitRun = false;
var PARSER_lines = [];

function DebugCtx_reset(_defaultMsg = null) {
  DBGCTX = [];
  DBGCTX_INDENT = 0;
  if (_defaultMsg)
    DBGCTX.push(_defaultMsg);
}

function DebugCtx_log(_s) {
  for (let i = 0; i < DBGCTX_INDENT*4; i++) {
    _s = "-" + _s;
  }
  DBGCTX.push(_s);
}

function DebugCtx_enter(_s) {
  for (let i = 0; i < DBGCTX_INDENT*4; i++) {
    _s = "-" + _s;
  }
  DBGCTX_INDENT++;
  DBGCTX.push(" " + _s);
}

function DebugCtx_exit(_count = 1) {
  if (DBGCTX_INDENT >= _count)
    DBGCTX_INDENT -= _count;
  else
    DBGCTX_INDENT = 0;
}

function showHTMLError(_err) {
  if (!_err) return;
  if (_err.indexOf("TypeError: Cannot read properties of undefined") >= 0)
    debugger;
  if (PARSER_lines) {
    const curLine = PARSER_lines[ASMBL_ADRSTOLINE[M68K_IP]];
    if (curLine) {
      _err += "<br> in file: " + curLine.path + "<br>at line: " + curLine.line;
    }    
  }
  const l = DBGCTX.length;
  if (l > 0) {
    _err += "<br>Context:<br>";
    for (let i = 0; i < l; i++) {
      _err += DBGCTX[i]+"<br>";
    }
  }
  _err.replaceAll("\n", "<br>");
  document.getElementById("errors").innerHTML += _err + "<br>";
}

function DEBUGGER_LOG(_s) {
  DEBUGGER_lastJSExecLog = ">JS print(): ";
  if (typeof _s === 'string' || _s instanceof String)
      DEBUGGER_lastJSExecLog += _s.slice(0);
  else {
    DEBUGGER_lastJSExecLog += "$"+_s.toString(16);
  }
  console.log(DEBUGGER_lastJSExecLog);
}

function onLayout() {
  let e = document.getElementById("layout");
  let l = document.getElementById("debugger-left");
  let r = document.getElementById("rightPane");
  
  l.classList.remove(DEBUGGER_PRECLASSLEFT);
  r.classList.remove(DEBUGGER_PRECLASSRIGHT);

  let n1 = parseInt(e.value);
  let n2 = 12-n1;

  DEBUGGER_PRECLASSLEFT = "col_"+n1.toString();
  DEBUGGER_PRECLASSRIGHT = "col_"+n2.toString();

  l.classList.add(DEBUGGER_PRECLASSLEFT);
  r.classList.add(DEBUGGER_PRECLASSRIGHT);
}


function isSpace(_t) {
  if (!_t) return true;
  if (_t.length < 1) return true;
  if (_t.length > 1) { parserError(-1, "fuck"); return true; }
  if (_t == ' ') return true;
  if (_t == '\t') return true;
  if (_t == '\n') return true;
  if (_t == '\r') return true;
  return false;
}

function readNextWord(_str, _ofs, _stopAt = null) {
  let ret = { word: '', index: _ofs };
  _ofs = skipSpaces(_ofs, _str);
  let exit = false;
  while (_ofs < _str.length) {
    let c = _str[_ofs++];
    if (isSpace(c)) break;
    if (_stopAt) {
      for (let i = 0; i < _stopAt.length; i++) {
        if (c == _stopAt[i]) {
          exit = true;
          break;
        }
      }
      if (exit) {
        _ofs--;
        break;
      }
    }
    ret.word += c;
  }
  _ofs = skipSpaces(_ofs, _str);
  ret.index = _ofs;
  return ret;
}

function setTraceMode(_mode) {
  if (DEBUGGER_tracing != _mode) {
    DEBUGGER_tracing = _mode;
    if (_mode == true) {
      if (DEBUGGER_NeedReload == true) {
        DEBUGGER_NeedReload = false;
        DEBUGGER_initFile();
      }
    }
  }
  if (_mode == false) {
    DEBUGGER_ForceFocus = null;
    if (DEBUGGER_hitBP_prevRow) {
      DEBUGGER_hitBP_prevRow.classList.remove('breakPoint_row');          
      DEBUGGER_hitBP_prevRow = null;
    }
  }
}



function DEBUGGER_RESTART() {
  DEBUGGER_tracing = false;
  DEBUGGER_canStep = false;
  DEBUGGER_Base = 16;
  DEBUGGER_signed = false;
  DEBUGGER_insideInvoke = null;
  DEBUGGER_dumpReg = 'a0';
  DEBUGGER_saveReg = new Uint32Array(24);
  DEBUGGER_startRow = 0;
  DEBUGGER_endRow = 40;
  DEBUGGER_activeRow = DEBUGGER_startRow + 8;
  DEBUGGER_rowToIP = [];
  DEBUGGER_traceTillRTS = false;
  DEBUGGER_runTillIP = null;
  DEBUGGER_lastWrittenAdrs = 0;
  DEBUGGER_lastReadAdrs = 0;
  DBGVAR = {};
  DEBUGGER_SHIFT_PRESSED = false;
  DEBUGGER_CTRL_PRESSED = false;
  DEBUGGER_lastBreakPointProcessed = -1;
  DEBUGGER_skipNextBP = -1
  DEBUGGER_ForceFocus = null;
}

$(document).ready(function () {
  $("tr[tabindex=0]").focus();
  document.onkeydown = checkKeyDOWN;
  document.onkeyup = checkKeyUP;
});


function onLoseFocus() {
  DEBUGGER_SHIFT_PRESSED = false;
  DEBUGGER_CTRL_PRESSED = false;
  DEBUGGER_ALT_PRESSED = false;
  PREV_KEYDOWN = 0;
}

function filterStack(_s) {
  let ofs = 0;
  let ret = "";
  const l = _s.length;
  while (ofs < l) {
    let cur = "";
    while (_s[ofs] != '\n' && ofs < l) {
      cur += _s[ofs++];
    }
    while (_s[ofs] == '\n') ofs++;
    if (cur.includes(FX_INFO.classname)) {
      let i1 = cur.indexOf("http");
      let i2 = cur.indexOf(".js");
      if (i1 >= 0 && i2 >= 0) {
        while (i2 > i1 && cur[i2] != '/') i2--;
        cur = cur.substring(0,i1) + cur.substring(i2);
      }
      ret += cur + '\n';    
    }
  }
  return ret;
}

function checkKeyUP(e) { // https://css-tricks.com/snippets/javascript/javascript-keycodes/
  var event = window.event ? window.event : e;
  if (event.keyCode == 16) { // shift
    DEBUGGER_SHIFT_PRESSED = false;
  }
  else if (event.keyCode == 17) { // ctrl
    DEBUGGER_CTRL_PRESSED = false;
  }
  else if (event.keyCode == 18) { // alt
    DEBUGGER_ALT_PRESSED = false;
  }
  PREV_KEYDOWN = 0;
}

var PREV_KEYDOWN = 0;
function checkKeyDOWN(e) { // https://css-tricks.com/snippets/javascript/javascript-keycodes/ 
  var event = window.event ? window.event : e;
  if (event.keyCode == 27) { // esc
    DEBUGGER_SHIFT_PRESSED = false;
    DEBUGGER_CTRL_PRESSED = false;
    DEBUGGER_ALT_PRESSED = false;
    PREV_KEYDOWN = 0;
    document.getElementById("myModal").style.display = "none";
  }

  if (event.keyCode == 16) // shift
    DEBUGGER_SHIFT_PRESSED = true;
  else if (event.keyCode == 17) // ctrl
    DEBUGGER_CTRL_PRESSED = true;
  else if (event.keyCode == 18) // alt
    DEBUGGER_ALT_PRESSED = true;

    DEBUGGER_CTRL_PRESSED = event.ctrlKey;
    DEBUGGER_ALT_PRESSED = event.altKey;
    DEBUGGER_SHIFT_PRESSED = event.shiftKey;


  // Avoid triggering commands while typing in a text field
  switch (document.activeElement) {
    case document.getElementById('command'): 
    case document.getElementById('filterLabel'): 
    return;
    default:
    break;
  }

  if (PREV_KEYDOWN == event.keyCode) return;
  PREV_KEYDOWN = event.keyCode;

  if (DEBUGGER_CTRL_PRESSED)
    return;

  if (!CODERPARSER_SINGLETON || !MYFX)
    return; // in case keys are pressed beore the fx is loaded

  if ((!DEBUGGER_insideInvoke) && (!DEBUGGER_tracing)) {
    if (MYFX && MYFX.FX_OnKey) {
      let stopEvent = false;
      stopEvent = MYFX.FX_OnKey(event.keyCode);
      if (stopEvent) {
        event.stopPropagation();
        return;
      }
    }  
  }

  var idx;
  switch (event.keyCode) {
    case 32: // space
      focusOnCodeLine(M68K_IP);
      event.stopPropagation();
    break;

    case 38: // up
      idx = $("tr:focus").attr("tabindex");
      idx--;
      if (idx < 0) {
        idx = 6;
      }
      $("tr[tabindex=" + idx + "]").focus();
    break;
    case 40: // down
      idx = $("tr:focus").attr("tabindex");
      idx++;
      if (idx >= PARSER_lines.length) {
        idx = 0;
      }
      $("tr[tabindex=" + idx + "]").focus();
    break;
    case 66: // b
    /*
      if (DEBUGGER_SHIFT_PRESSED) {
        if (DEBUGGER_Base == 2)
          DEBUGGER_Base = 16;
        else
          DEBUGGER_Base = 2;
        DEBUGGER_update(true);
        DEBUGGER_dumpRegistersValues();
      }
      else */if (DEBUGGER_ALT_PRESSED) {
          SET_PAUSEUPDATE(!DEBUGGER_PAUSEUPDATE);
          if (!DEBUGGER_PAUSEUPDATE) setTraceMode(false);
        } else {
          DEBUGGER_BitplanesVisibility();
        }
    break;
    case 67: // c
      if (DEBUGGER_SHIFT_PRESSED) {
        DEBUGGER_DumpCopperList = 1;
        MACHINE.customUpdate();
      }
      else {
        if (DEBUGGER_SHOWCPUCYCLES) {
          DEBUGGER_SHOWCPUCYCLES = false;
          HideDebugLog();
        } 
         else DEBUGGER_SHOWCPUCYCLES = true;
      }
    break;
    case 68: // d
      if (DEBUGGER_SHIFT_PRESSED) {
        if (DEBUGGER_Base == 10)
          DEBUGGER_Base = 16;
        else
          DEBUGGER_Base = 10;
        DEBUGGER_update(true);
        DEBUGGER_dumpRegistersValues();
      }
    break;
    case 69: // e
      if (DEBUGGER_tracing) {
        DEBUGGER_skipNextBP = M68K_IP;
        DEBUGGER_traceTillRTS = true;
        DEBUGGER_canStep = true;
        setTraceMode(false);
      }
    break;
    case 70: // f
    focusOnCodeLine(M68K_IP);
    break;
  /*  case 71: // g
      {
        if (DEBUGGER_ALLOWONELINER) {
          DEBUGGER_ALLOWONELINER = false;
          document.getElementById('liner').innerHTML = '';
        } else DEBUGGER_ALLOWONELINER = true;
      }
    break;
    */
    case 72: // h
    if (DEBUGGER_SHIFT_PRESSED) {
      DEBUGGER_Base = 16;
      DEBUGGER_update(true);
      DEBUGGER_dumpRegistersValues();
    } else {
      DEBUGGER_help();
    }
    break;
    case 74: // j
      if (DEBUGGER_AllowJS) 
        {DEBUGGER_AllowJS = false; alert("Inline Javascript: OFF");} 
      else
        {DEBUGGER_AllowJS = true; alert("Inline Javascript: ON");}
    break;
    case 77: // m
      DEBUGGER_memoryStats();
    break;
    case 79: // o
      if (DEBUGGER_tracing) {
        let curLine = PARSER_lines[ASMBL_ADRSTOLINE[M68K_IP]];
        if (curLine.isBranchInstr) {
          DEBUGGER_skipNextBP = M68K_IP;
          DEBUGGER_runTillIP = M68K_IP+curLine.instrBytes;
          DEBUGGER_canStep = true;
          setTraceMode(false);  
        } else DEBUGGER_traceOneInstr();
      }
    break;
    case 80: // p
      if (DEBUGGER_SHIFT_PRESSED) {
        DEBUGGER_setParanoid(!DEBUGGER_paranoid);
        alert("debugger paranoid mode: " + DEBUGGER_paranoid);
      }
      else SET_PAUSE(!PAUSED);
    break;
    case 82: // r
      if (DEBUGGER_SHIFT_PRESSED) { // restart
        localStorage.setItem(LOCALSTORAGE_FX_PAUSED,PAUSED);
        localStorage.setItem(LOCALSTORAGE_FX_ZOOM,document.getElementById("outpuResolution").value);
        console.log("RELOADING PAGE...");
        window.location.reload();
      }
      if (!TIME_MACHINE.isPresent()) {
        alert("restaure present");
        TIME_MACHINE.restorePresent();
      }
      DEBUGGER_justHitRun = true;
      DEBUGGER_traceOneInstr();
    break;
    case 83: // s
    break;
    case 84: // t
      DEBUGGER_traceOneInstr();
    break;
    case 86: // v
      if (DEBUGGER_ALT_PRESSED) {
        SET_PAUSEVBL(!DEBUGGER_PAUSEVBL);
      }
    break;
    case 87: // w
      DEBUGGER_showContext();
    break;
    case 88: // x
      if (TIME_MACHINE)
        TIME_MACHINE.traceForwards();
      else
        alert("Time Machine is not available. Make sure 'time_machine' is set in ASSEMBLER_CONFIG (config.js)");
    break;
    case 89: // y
      if (TIME_MACHINE)
        TIME_MACHINE.traceBackwards();
      else
        alert("Time Machine is not available. Make sure 'time_machine' is set in ASSEMBLER_CONFIG (config.js)");
    break;
    case 90: // z
    if (DEBUGGER_SHIFT_PRESSED) { // zap
      console.log("ZAPPING...");
      let curFx = localStorage.getItem(LOCALSTORAGE_FX_NAME);
      localStorage.clear();
      localStorage.setItem(LOCALSTORAGE_FX_PREV, curFx);
      window.location.reload();
    }
    break;
    default:
      stop = false;
    break;
  }
 // if (stop) event.stopPropagation();

}

function SET_PAUSEUPDATE(p) {
  DEBUGGER_PAUSEUPDATE = p;
}

function SET_PAUSEVBL(p) {
  DEBUGGER_PAUSEVBL = p;
}


function DEBUGGER_setParanoid(_s) {
  DEBUGGER_paranoid = _s;
}

function changeBitplaneVisibility() {
  let bplCount = bitpane_bplCount;
  if (FX_INFO.platform == "ST" || FX_INFO.platform == "STE")
    bplCount = 4;
  for (let i = 0; i < bplCount; i++) {
    let v = document.getElementById("bplvis"+i);
    if (v.checked) bitplaneWeight[i] = 1; 
    else bitplaneWeight[i] = 0;  
  }
}

function DEBUGGER_BitplanesVisibility() {
  hideModalBox();
  let msg = "<center><b style='color:white'>Bitplanes Visibility</b></center><br>";
  msg += "<table><tr><th>index</th><th>visible</th></tr>";
  let bplCount = bitpane_bplCount;
  if (FX_INFO.platform == "ST" || FX_INFO.platform == "STE")
    bplCount = 4;
  for (let i = 0; i < bplCount; i++) {
    msg += "<tr><td>"+i+"</td><td><input type='checkbox' id=bplvis"+i;
    msg += " onClick=changeBitplaneVisibility()";
    if (bitplaneWeight[i] == 1)  msg += " checked/>";
    msg += "</td></tr>";
  }
  msg += "</table>";

  showModalBox(msg, changeBitplaneVisibility);  
}

function DEBUGGER_memoryStats() {
  hideModalBox();
  let msg = "<center><b style='color:white'>Memory Stats</b></center><br>";
  msg += "<table><tr><th>adrs</th><th>size</th><th>label</th></tr>";
  let dcSize = 0;
  let dsSize = 0;
  let unknownSize = 0;
  for (let i = 0; i < DEBUGGER_AllocsList.length; i++) {
    let showMsg = true;
    const d = DEBUGGER_AllocsList[i];
    if (d.size < 4096) {
      if (d.label) {
        if (d.label.startsWith("@DC.@")) { dcSize += d.size; showMsg = false; }
        else if (d.label.startsWith("@DS.@")) { dsSize += d.size; showMsg = false; }
        else { unknownSize += d.size; showMsg = false; }
      } else {
        unknownSize += d.size; showMsg = false;
      }
    }
    if (showMsg) {
      let lab = d.label;
      if (lab) {
        if (lab.startsWith("@DC.@") || lab.startsWith("@DS.@")) lab = d.label.slice(5);
      } else {
        lab = "no label";
      }
      if (lab != "Total RAM size") {
        msg += "<tr><td>$" + d.adrs.toString(16) + "</td><td>$" + d.size.toString(16) + "</td><td>" + lab + "</td></tr>";
      }
    }
  }
  if (dcSize > 0) msg += "<tr><td>misc</td><td>$" + dcSize.toString(16) + "</td><td>less than 4096 bytes dc.b/w/l</td></tr>";
  if (dsSize > 0) msg += "<tr><td>misc</td><td>$" + dsSize.toString(16) + "</td><td>less than 4096 bytes ds.b/w/l</td></tr>";
  if (unknownSize > 0) msg += "<tr><td>misc</td><td>$" + unknownSize.toString(16) + "</td><td>less than 4096 bytes other allocs</td></tr>";
  msg += "</table>";

  showModalBox(msg, null);
}

function DEBUGGER_help() {
  let msg = "<center><b style='color:white'>M68KWorkbench Help</b></center><br>";
  msg += "<table><tr><th>KEY(s)</th><th>COMMAND</th><th>DESCRIPTION</th></tr>";
  
  msg += "<tr><td>b</td><td>Bitplanes visibility</td><td>Switch bitplanes on/off</td></tr>";
  msg += "<tr><td>alt + b</td><td>break update</td><td>trigger breakpoint at the beginning of update (on/off)</td></tr>";
  msg += "<tr><td>c</td><td>cycles</td><td>toggle show CPU cycles per frame on/off</td></tr>";
  if (FX_INFO.platform == 'OCS')
    msg += "<tr><td>shift + c</td><td>copperlist</td><td>shows current copperlist (OCS only)</td></tr>";
  msg += "<tr><td>shift + d</td><td>decimal</td><td>dump registers values in decimal (on/off)</td></tr>";
  msg += "<tr><td>e</td><td>exit</td><td>executes code util RTS is reached</td></tr>";
  msg += "<tr><td>f</td><td>focus</td><td>set focus on current executed instruction</td></tr>";
  msg += "<tr><td>h</td><td>help</td><td>show this help</td></tr>";
  msg += "<tr><td>shift + h</td><td>hexadecimal</td><td>dump registers values in hexadecimal</td></tr>";
  msg += "<tr><td>j</td><td>js</td><td>toggle javascript calls from asm on/off</td></tr>";
  msg += "<tr><td>m</td><td>mem</td><td>show memory stats</td></tr>";
  msg += "<tr><td>o</td><td>step over</td><td>step over instruction while tracing</td></tr>";
  msg += "<tr><td>p</td><td>pause</td><td>toggle pause on/off</td></tr>";
  msg += "<tr><td>shift + p</td><td>paranoid mode</td><td>toggle paranoid mode on/off</td></tr>";
  msg += "<tr><td>r</td><td>run</td><td>exit trace mode</td></tr>";
  msg += "<tr><td>shift + r</td><td>restart</td><td>reloads the page and restarts the same FX, and restores breakpoints, pause and zoom</td></tr>";
  msg += "<tr><td>t</td><td>trace</td><td>step into (while tracing)</td></tr>";
  msg += "<tr><td>alt + v</td><td>break vbl update</td><td>trigger breakpoint at the beginning of vbl update (on/off)</td></tr>";
  msg += "<tr><td>w</td><td>Where am I?</td><td>shows current instruction info + callstack and latest branches</td></tr>";
  msg += "<tr><td>y</td><td>Backwards</td><td>Time Machine go to prev instruction</td></tr>";
  msg += "<tr><td>x</td><td>Forward</td><td>Time Machine go to next instruction</td></tr>";
  msg += "<tr><td>shift + z</td><td>zap</td><td>clears default FX and breakpoint data and relods page</td></tr>";

  msg += "</table>";
  msg += "<br><center><img src='images/SNDYICON_TRANSP.png' width=20%></center><br>";
  //msg += "<br><center><i>As usual, all bugs by Soundy</i><center><br>";
  showModalBox(msg, null);
}

function DEBUGGER_showContext() {
  let msg = "<center><b style='color:white'>Where am I?</b></center><br>";

  if (!DEBUGGER_tracing) {
    msg += "Program was running, invoking 'where am I' triggered a breakpoint.<br><br>"; 
    DEBUGGER_traceTillRTS = false;
    DEBUGGER_runTillIP = null;
    setTraceMode(true);
    DEBUGGER_canStep = false;
  }
  
  const lnIndex = ASMBL_ADRSTOLINE[M68K_PREVIP];
  if (lnIndex == null || typeof lnIndex == 'undefined') {
    msg += "Can't find code linked to current IP. Look like you jumoed to some unknown place.<br>"; 
  } else {
    focusOnCodeLine(M68K_PREVIP);
    const ln = PARSER_lines[lnIndex];
    let str = ln.filtered;
    if (ln.jsString) str = ln.jsString;
    msg += "Just executed: " + str + "<br>" + ln.getFileLineStr() + "<br><hr>"; 
  }

  msg += "<center><b style='color:white'>Values on Stack</b></center><br>";
  if (M68K_INTERRUPT_STATE != null) {
    msg += "NOTE: CURRENTLY IN " + M68K_INTERRUPT_STATE + " INTERRUPT.<br>"; 
  }

  
  msg += "<table><tr><th>instr</th><th>file/line</th></tr>";
  let a7 = regs.a[7];
  while(!MACHINE.isStackOver(true)) {
    let adrs = STACK_POP(4);
    if (adrs > 0) {      
      msg += "<tr>";
      const lineIndex = ASMBL_ADRSTOLINE[adrs];
      if (lineIndex !== null) {
        line = PARSER_lines[lineIndex-1];
        if (line && (M68K_INTERRUPT_STATE!= null) && (adrs == M68K_INTERRUPT_FROM)) {
          msg += "<td>" + line.filtered + " a " + M68K_INTERRUPT_STATE + " interrupt was triggered here</td><td>" + line.getFileLineStr() + "</td>";
        }
        else {
          if ((!line) || (!line.isBranchInstr)) {
            if (lineIndex > 1) line = PARSER_lines[lineIndex-2];
          }
          if (line && line.isBranchInstr)
            msg += "<td>" + line.filtered + "</td><td>" + line.getFileLineStr() + "</td>";
          else if (line) msg += "<td>address of: " + line.filtered + "</td><td>" + line.getFileLineStr() + " found on the stack, but it's not a branch instruction</td>";
          else msg += "<td>Value $"+ adrs.toString(16) + " found on stack, but it's not code.</td>";  
        }
      } else msg += "<td>" + "not found" + "</td><td>" + " " + "</td>";
      msg += "</tr>";
    }
  }
  if (DEBUGGER_insideInvoke) {
    msg += "<tr><td>" + DEBUGGER_insideInvoke + "</td><td>" + "Invoked from JS" + "</td></tr>";
  }
  msg += "</table>";

  regs.a[7] = a7;

  msg += "<br><center><b style='color:white'>Last taken branches</b></center><br>";
  if (M68K_INTERRUPT_STATE != null) {
    msg += "NOTE: CURRENTLY IN " + M68K_INTERRUPT_STATE + " INTERRUPT.<br>"; 
  }
  msg += "<table><tr><th>ofs</th><th>instr</th><th>file/line</th></tr>";
  let index = M68K_lastBranchIndex - 1;
  for (let i = 0; i < 1024; i++) {
    if (index < 0) index = 1023;
    const adrs = M68K_lastBranches[index];
    let count = 1;
    if (adrs > 0) {
      let next = i + 1;
      let nextIndex = index - 1;
      while (next < 1024) {
        if (nextIndex < 0) nextIndex = 1023;
        const nextAdrs = M68K_lastBranches[nextIndex];
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
      msg += "<tr>";
      if (adrs == M68K_VBL_INTERRUPT)
        msg += "<td>VBL interrupt</td>"; 
      else
        msg += "<td>" + adrs.toString(16) + "</td>"; 
      const lineIndex = ASMBL_ADRSTOLINE[adrs];
      if (lineIndex !== null) {
        line = PARSER_lines[lineIndex];
        msg += "<td>" + line.filtered;
        if (count > 1) msg += "\t(x" + count + ")";
        msg += "</td><td>" + line.getFileLineStr() + "</td>";
      }  
      msg += "</tr>";
    }
    index--;
  }
  msg += "</table>";

  showModalBox(msg,focusOnCodeLine(M68K_PREVIP));
}

function  DEBUGGER_traceOneInstr() {
  if (DEBUGGER_tracing) {
    DEBUGGER_canStep = true;
  } else {
    DEBUGGER_traceTillRTS = false;
    DEBUGGER_runTillIP = null;
    setTraceMode(true);
    DEBUGGER_canStep = false;
  }
}

function DEBUGGER_makeInstrString(_line) {
  return _line.filtered;
}

function DEBUGGER_BeforeInstr() {
  if (DEBUGGER_justHitRun) {
    DEBUGGER_justHitRun = false;
    DEBUGGER_lastBreakPointProcessed = -1;
    DEBUGGER_traceTillRTS = false;
    DEBUGGER_runTillIP = null;      
    setTraceMode(false);
    DEBUGGER_update(true);
    if (DEBUGGER_PrevFocus)
      DEBUGGER_PrevFocus.classList.remove('highlight_row');
    DEBUGGER_PrevFocus = null;
    document.getElementById('mycvs').focus();
    onNewOutputResolution();
    DEBUGGER_QueryDisplayRefresh = true;
    MACHINE.customUpdate();
    return;
  }

  if (M68K_IP == DEBUGGER_lastBeforeInstr)
    return;
  DEBUGGER_lastBeforeInstr = M68K_IP;
  let lnIndex = ASMBL_ADRSTOLINE[M68K_IP];
  if (lnIndex == null || typeof lineIndex == 'undefined') {
    const l = ASMBL_ADRSTOLINE_GEN.length;
    for (let i = 0; i < l; i++) {
      if (ASMBL_ADRSTOLINE_GEN[i].ip == M68K_IP) {
        lnIndex = ASMBL_ADRSTOLINE_GEN[i].ln;
        break;
      }
    }
  }

  let curLine = PARSER_lines[lnIndex];
  if (curLine) {
    if (curLine.breakpoint) {
      if (DEBUGGER_skipNextBP == M68K_IP) {
        DEBUGGER_skipNextBP = -1;
      } else {
        DEBUGGER_traceTillRTS = false;
        DEBUGGER_runTillIP = null;
        setTraceMode(true);
        if (DEBUGGER_lastBreakPointProcessed == M68K_IP)
          DEBUGGER_update(false); // don't set _force to true or no combo box is selectable while tracing because ofconstant refresh
        else {
          DEBUGGER_lastBreakPointProcessed = M68K_IP;
          DEBUGGER_update(true);
          let bptCtx = "breakpoint reached at ofs: $" + curLine.codeSectionOfs.toString(16) + ":\n" + curLine.filtered;
          if (curLine.arg1) {
            bptCtx += "\narg1: '"+ curLine.arg1.str + "' = $" + getArg(curLine.arg1, curLine.instrSize, false).value.toString(16);
          }
          if (curLine.arg2) {
            bptCtx += "\narg2: '"+ curLine.arg2.str + "' = $" + getArg(curLine.arg2, curLine.instrSize, false).value.toString(16);
          }
          focusOnCodeLine(M68K_IP);
          //DEBUGGER_AdditionalDbgMsg = bptCtx;
        }
      }
      DEBUGGER_dumpRegistersValues();
    }
    else if (DEBUGGER_tracing) {
      DEBUGGER_update();
    }  
  } else debugger;

  if (DEBUGGER_traceTillRTS) {
    if (curLine.instr == 'RTS' || curLine.instr == 'RTE') {
      DEBUGGER_traceTillRTS = false;
      setTraceMode(true);
      DEBUGGER_update(true);
      DEBUGGER_canStep = false;
      DEBUGGER_dumpRegistersValues();
    }
  }
  if (DEBUGGER_runTillIP) {
    if (M68K_IP == DEBUGGER_runTillIP) {
      DEBUGGER_runTillIP = null;
      setTraceMode(true);
      DEBUGGER_update();
      document.getElementById('DBGlines').focus();
      DEBUGGER_canStep = false;
      DEBUGGER_dumpRegistersValues();
    }
  }
  if (DEBUGGER_ForceFocus) {
    focusOnCodeLine(DEBUGGER_ForceFocus);
    DEBUGGER_ForceFocus = null;
  }
}


function DEBUGGER_AfterInstr() {
  if (DEBUGGER_tracing && (DEBUGGER_lastAfterInstr != M68K_IP)) {
    DEBUGGER_lastAfterInstr = M68K_IP;
    DEBUGGER_update(true);
    DEBUGGER_dumpRegistersValues();
    for (let i = 0; i < 8; i++) {
      DEBUGGER_saveReg[i] = regs.d[i];
      DEBUGGER_saveReg[i + 8] = regs.a[i];
    }
    DEBUGGER_saveReg[16] = regs.x;
    DEBUGGER_saveReg[17] = regs.n;
    DEBUGGER_saveReg[18] = regs.z;
    DEBUGGER_saveReg[19] = regs.v;
    DEBUGGER_saveReg[20] = regs.c;
    }
}

function DEBUGGER_strToByte(_b) {
  let ret = _b.toString(16);
  let start = 0;
  let end = ret.length;
  while (ret.charAt(start) == '0' && (end - start > 2)) {
    start++;
  }
  ret = ret.substring(start, end);
  while (ret.length < 2)
    ret = '0' + ret;
  return ret;
}

function getComboValue(selectObject) {
  return selectObject.value;
}

function getCodeLineID(_IP) {
  return 'codeln' + _IP.toString(16);
}

function getPrevLineID(_IP, _maxOffset) {
  for (let i = _maxOffset; i >= 0; i-=2) {
    const IP = _IP - i;
    const ID = getCodeLineID(IP);
    const item = document.getElementById(ID);
    if (item) return {item:item, ID:ID};
  }
  return null;
}


function focusOnCodeLine(_IP) {

  if (DEBUGGER_PrevFocus)
    DEBUGGER_PrevFocus.classList.remove('highlight_row');
  
  document.getElementById('content').focus();
  document.getElementById('debugger-left').focus();  
  document.getElementById('DBGlines').click();
  document.getElementById('DBGlines').focus();

  let cursorLineName = getCodeLineID(_IP);
  let cursorItem = document.getElementById(cursorLineName);
  if (!cursorItem) return;
  cursorItem.classList.add('highlight_row');

  const prevItem = getPrevLineID(_IP,20);
  if (prevItem) {
  //  location.href = "#";
  //  location.href = "#"+prevItem.ID;
    prevItem.item.scrollIntoView();
    prevItem.item.scrollTo();
  } else {
    cursorItem.scrollIntoView();
    cursorItem.scrollTo();
  }

  cursorItem.focus();
  DEBUGGER_PrevFocus = cursorItem;

//  document.getElementById('DBGlines').scrollTop = (cursorItem.offsetTop - 0);  
}

function focusOnLabel(_name) {
  if (_name[_name.length-1] != ':') _name += ':';
  if (DEBUGGER_PrevFocus)
    DEBUGGER_PrevFocus.classList.remove('highlight_row');
  let cursorItem = document.getElementById(_name);
  cursorItem.scrollTo();
  cursorItem.focus();
  cursorItem.classList.add('highlight_row');
  DEBUGGER_PrevFocus = cursorItem;
  document.getElementById('DBGlines').scrollTop = (cursorItem.offsetTop - 0);  
}

function DEBUGGER_onHWBreakpointReached(_index) {
//  alert("Hit HW Breakpiont #" + _index);
  DEBUGGER_lastJSExecLog = "hardware breakpoint reached";
  DEBUGGER_AdditionalDbgMsg = "hardware Breakpoint reached";
  showHTMLError("hardware Breakpoint reached");
  DEBUGGER_traceTillRTS = false;
  DEBUGGER_runTillIP = null;
  setTraceMode(true);
  DEBUGGER_update(false); // don't set _force to true or no combo boxy is selectable while tracing because ofconstant refresh
  DEBUGGER_dumpRegistersValues();
}

function DEBUGGER_onValueBreakpointReached() {
  DEBUGGER_lastJSExecLog = "value Breakpoint reached";
  DEBUGGER_AdditionalDbgMsg = "value Breakpoint reached";
  showHTMLError("value Breakpoint reached");
  DEBUGGER_traceTillRTS = false;
  DEBUGGER_runTillIP = null;
  setTraceMode(true);
  DEBUGGER_update(false); // don't set _force to true or no combo boxy is selectable while tracing because ofconstant refresh
  DEBUGGER_dumpRegistersValues();
}


function DEBUGGER_ValueBreakpoint(args) {
  if (args.length !== 3) { alert("v command expects 3 params"); return; }
  let adrs = parseInt(args[0], 16);
  if (isNaN(adrs)) { alert("arg 1 : should be a hexadecimal number (address, without '$'). found: " + args[0]); return; }
  let val = parseInt(args[1], 16);
  if (isNaN(val)) { alert("arg 2 : should be a hexadecimal number (value, without '$'). found: " + args[1]); return; }
  let size = parseInt(args[2], 16);
  if (isNaN(size)) { alert("arg 3 : should be a hexadecimal number (size, without '$'). found: " + args[2]); return; }
  if (size < 1 || size > 4) { alert("arg 3 : size should be 1,2 or 4. found: " + args[2]); return; }
  DEBUGGER_VBpt[0] = adrs;
  DEBUGGER_VBpt[1] = val;
  DEBUGGER_VBpt[2] = size;
  alert("set hardware breakpoint if address $" + adrs.toString(16) + " reaches value $" + val.toString(16) + " size: " + size.toString() + " bytes.");
}

function DEBUGGER_SetMemBrkPt(adrs, size) {
  DEBUGGER_HWBpts[0] = adrs;
  DEBUGGER_HWBpts[1] = size;
}

function DEBUGGER_ClrMemBrkPt() {
  DEBUGGER_HWBpts[0] = INVALID_BRKPT_ADRS;
  DEBUGGER_HWBpts[1] = 0;
}



function DEBUGGER_JSCommand(cmd, args) {
  let str = cmd.word;
  for (let i = 0; i < args.length; i++)
    str += " " + args[i].toUpperCase();

  str = str.replace('$', '0x');
  str = str.replace('%', '0b');

  for (let i = 0; i <= 7; i++) {
    str = str.replace('D'+i+'.B', '(regs.d['+i+']&0xff)');
    str = str.replace('D'+i+'.W', '(regs.d['+i+']&0xffff)');
    str = str.replace('D'+i+'.L', '(regs.d['+i+'])');
    str = str.replace('D'+i+'.H', '(regs.d['+i+']>>16)');
    str = str.replace('D'+i, 'regs.d['+i+']');
    str = str.replace('A'+i, 'regs.a['+i+']');
    str = str.replace('A'+i+'.B', '(regs.a['+i+']&0xff)');
    str = str.replace('A'+i+'.W', '(regs.a['+i+']&0xffff)');
    str = str.replace('A'+i+'.L', '(regs.a['+i+'])');
    str = str.replace('A'+i+'.H', '(regs.a['+i+']>>16)');
  }
  debugger;

  try {
    eval(str);
    DEBUGGER_update(true);
    DEBUGGER_dumpRegistersValues();
  } catch (error) {
    document.getElementById('command').value = error.toString();
  }
}



function DEBUGGER_jump(args) {
  if (args.length !== 1) { alert("j command expects 1 param"); return; }
  let index = parseInt(args[0],16);
  if (isNaN(index)) {
    alert(args[0] + " is not an hexadecimal number to me");
    return;
  }
  if (index < 0) {
    alert(index + ": negative numbers are not allowed");
    return;
  }
  const oldIP = M68K_IP;
  M68K_IP = index;
  if (M68K_IP < 0 || M68K_IP >= MACHINE.ram.length) {
    alert("jump failed");
    M68K_IP = oldIP;
    return;
  }
  DEBUGGER_update(true);
  focusOnCodeLine(M68K_IP);
}

function DEBUGGER_HWBreakpoint(args) {
  if (args.length !== 3) { alert("w command expects 3 params"); return; }
  let index = parseInt(args[0], 16);
  if (isNaN(index) || (index < 0) || (index >= DEBUGGER_CONFIG.MAX_HW_BPT)) { alert("arg 1 : should be a number between 0 and " + (DEBUGGER_CONFIG.MAX_HW_BPT-1) + ". found: " + args[0]); return; }
  let adrs = parseInt(args[1], 16);
  if (isNaN(adrs)) { alert("arg 2 : should be a number (address). found: " + args[1]); return; }
  let size = parseInt(args[2], 16);
  if (isNaN(size)) { alert("arg 3 : should be a number (size). found: " + args[2]); return; }
  DEBUGGER_HWBpts[index * 2] = adrs;
  DEBUGGER_HWBpts[index * 2 + 1] = size;
  alert("set hardware breakpoint #" + index + " at address $" + adrs.toString(16) + " and $" + size.toString(16) + " bytes.");
}


function DEBUGGER_viewMem(args) {
  if (args.length !== 1) { alert("m command expects 1 param"); return; }
  let adrs = parseInt(args[0], 16);
  if (isNaN(adrs)) { alert("arg 1 : should be a number (address). found: " + args[0]); return; }
  DEBUGGER_customWatch = adrs;
  DEBUGGER_update(true);
}

function DEBUGGER_onNewLabel(_IP) {
  let elm = document.getElementById('filterLabel');
  let v = elm.value;
  let ofs = 0;
  let cmd = readNextWord(v, ofs);
  const w = cmd.word.toUpperCase();
  focusOnLabel(w);
}

function DEBUGGER_onNewCommand() {
  let v = document.getElementById('command').value;
  let ofs = 0;
  let cmd = readNextWord(v, ofs);
  let args = [];
  ofs = cmd.index;
  while (ofs < v.length) {
    let r = readNextWord(v, ofs);
    if (r.word.length > 0) {
      args.push(r.word);
      ofs = r.index;
    } else break;
  }

  cmd.word = cmd.word.toUpperCase();
  switch (cmd.word) {
    case "W": DEBUGGER_HWBreakpoint(args); break;
    case "V": DEBUGGER_ValueBreakpoint(args); break;
    case "M": DEBUGGER_viewMem(args); break;
    case "J": DEBUGGER_jump(args); break;
    default: DEBUGGER_JSCommand(cmd, args); break;
  }
}


function syntaxColour_label(r) {
  const labl = CODERPARSER_SINGLETON.labelByName[r];
  if (labl) r = '<span style="color:'+ DEBUGGER_CONFIG.sytax_coloring.LabelCol+'">'+r+'</span>';
  return r;
}

function syntaxColour_constant(r) {
  const l = CODERPARSER_SINGLETON.constants.length;
  for (let i = 0; i < l; i++) {
    if (CODERPARSER_SINGLETON.constants[i].name == r)
      r = '<span style="color:'+ ConstantCol+'">'+r+'</span>';
    else if ('#'+CODERPARSER_SINGLETON.constants[i].name == r)
      r = '<span style="color:'+ ConstantCol+'">'+r+'</span>';
  }
  return r;
}

function syntaxColour_notInstr(_s,r) {
  // colour comments
  const comment = _s.indexOf(';');
  if (comment<0)
    return _s;
  r +=  _s.substring(0,comment);
  r += '<span style="color: ' + DEBUGGER_CONFIG.sytax_coloring.CommentCol + '">';
  r +=  _s.substring(comment, _s.length);
  r += '</span>';
  return r;
}

function syntaxColour_arg(_arg, _lnArg) {
  if (!_arg) return "";
  if (!_lnArg) return "";
  if (!isNaN(_lnArg.isLabelIndex))
    return '<span style="color:'+ DEBUGGER_CONFIG.sytax_coloring.LabelCol+'">'+ _lnArg.str +'</span>';

  if (_lnArg.type == 'labl') {
    return '<span style="color:'+ DEBUGGER_CONFIG.sytax_coloring.LabelCol+'">'+ _lnArg.str +'</span>';
  }

  switch(_arg.type) {
    case OperandType.IMM8:
    case OperandType.IMM16:
    case OperandType.IMM32:
    return '<span style="color: ' + DEBUGGER_CONFIG.sytax_coloring.arg_imm_col + '">' + _lnArg.str + '</span>';

    case OperandType.ABS16:
    case OperandType.ABS32:
    return '<span style="color: ' + DEBUGGER_CONFIG.sytax_coloring.arg_abs_col + '">' + _lnArg.str + '</span>';

    case OperandType.DR:
    case OperandType.AR:
    return '<span style="color: ' + DEBUGGER_CONFIG.sytax_coloring.arg_reg_col + '">' + _lnArg.str + '</span>';
    
    case OperandType.ARIND:
    case OperandType.ARINC:
    case OperandType.ARDEC:
    case OperandType.ARDISP:
    case OperandType.PCDISP:
    case OperandType.DISP:
      let ret = _arg.str.replace('(', '<span style="color: ' + DEBUGGER_CONFIG.sytax_coloring.arg_ind_col + '">(</span>');
      ret = ret.replace(')', '<span style="color: ' + DEBUGGER_CONFIG.sytax_coloring.arg_ind_col + '">)</span>');
    return ret;

    default:
    return '<span style="color: ' + DEBUGGER_CONFIG.sytax_coloring.defaultCol + '">' + _lnArg.str + '</span>';
  }
}

function syntaxColoring(_s, _ln) {
  if (!_s || _s.length == 0)
    return _ln.filtered;
  let r = '';

  if (_s.isJS) {
    let content = "";
    let comment = _ln.text.indexOf('>JS');
    if (comment >= 0) {
      comment +=3;
      while (true) {
        const c = _ln.text[comment];
        if (c == ';' || c == '\t' || c == ' ') comment++;
        else break;
      }
      content = _ln.text.slice(comment);
    } else content = _s.instr;
    return '<span style="color:'+ DEBUGGER_CONFIG.sytax_coloring.JSCol +'">'+ content +'</span>';
  }
  

    if (_s.isLabl)
    return '<span style="color:'+ DEBUGGER_CONFIG.sytax_coloring.LabelCol+'">'+ _s.instr.toUpperCase() +'</span>';

  if (!_ln.instr) {
    return syntaxColour_notInstr(_ln.filtered,r);
  }


  if (_ln.instr == "MOVEM")
    return _ln.filtered; // movem takes a specific parsing

  r += _s.instr;
  if (_s.ext) {
    r += '<span style="color: ' + DEBUGGER_CONFIG.sytax_coloring.InstrSizeCol + '">';
    r += '.' + _s.ext;
    r += '</span>';
  }

  if (_s.arg1 || _s.arg2)
    r += '\t';

  if (_s.arg1) {
    r += syntaxColour_arg(_s.arg1, _ln.arg1);
  }
  if (_s.arg2) {
    if (_s.arg1) r += ',';
    if (_ln.arg2) r += syntaxColour_arg(_s.arg2, _ln.arg2);
    else r += syntaxColour_arg(_s.arg2, _ln.arg1);
  }
  return r;

  }


function DEBUGGER_initFile(_refreshCyclesOnly = false) {
  DEBUGGER_origlines = [];
  DEBUGGER_disamlines = [];
  DEBUGGER_lastUpdLine = -1;
  DEBUGGER_rowToIP = []; // translates debugger line to IP
  PARSER_lines = CODERPARSER_SINGLETON.strings.lines;
  let bpList = [];
  for (let i = 0; i < PARSER_lines.length; i++) {
    let disam = null;
    let l = PARSER_lines[i];
    if (l.isInstr) {
      if (l.breakpoint) {
        bpList.push(i);
      }
      let byteCode = new Uint8Array(16);
      let w = 0;
   //   console.log("ln " + i + ": " + l.filtered);
      let bcount = 16;
      if (i<PARSER_lines.length-1) 
        bcount = PARSER_lines[i+1].codeSectionOfs-l.codeSectionOfs;
      let endOfs = l.codeSectionOfs + bcount;
      for (let k = l.codeSectionOfs; k < endOfs; k++) {
        byteCode[w++] = CPU_CODE_SECTION[k++];
        byteCode[w++] = CPU_CODE_SECTION[k];
     //   console.log(wordToHexString((byteCode[w-2]<<8)+byteCode[w-1]) + '.');
      }
      let r = decode_instruction_generated(byteCode, l.codeSectionOfs);
      if (!r || !r.instruction)
      {
        disam = "ERROR";
        disam.IP = l.codeSectionOfs;
        disam.lineIndex = i;  
      } else {
        disam = InstructionToString(r.instruction);
        disam.IP = l.codeSectionOfs;
        disam.lineIndex = i;  
      }
    }

    DEBUGGER_origlines.push(l.filtered);
    if (l.jsString)
      DEBUGGER_disamlines.push({lineIndex:i, isJS:true, IP:l.codeSectionOfs, instr:l.jsString, ext:null, arg1:null, arg2:null, fullString:l.jsString});
    else if (disam)
      DEBUGGER_disamlines.push(disam);
    else if (l.isLabel)
      DEBUGGER_disamlines.push({lineIndex:i, isLabl:true, IP:l.codeSectionOfs, instr:l.filtered, ext:null, arg1:null, arg2:null, fullString:l.filtered});
    else if (l.isDC && DEBUGGER_CONFIG.SHOW_DC) {
      let labelIp = 0
      if (l.codeSectionOfs) labelIp = l.codeSectionOfs;
      if (l.dcAddress) labelIp = l.dcAddress;
      DEBUGGER_disamlines.push({lineIndex:i, IP:labelIp.toString(16), instr:l.filtered, ext:null, arg1:null, arg2:null, fullString:l.filtered});
    }
    l.originalIndex = i;
  }

  localStorage.setItem(LOCALSTORAGE_BREAKPOINTS, JSON.stringify(bpList));
  let elm = document.getElementById('debugger-left');
  let str = '';

  // LABELS
  DEBUGGER_labels = [];
  let lastNotLocalLabel = '';
  for (let i = 0; i < CODERPARSER_SINGLETON.labels.length; i++) {
    let labelName = CODERPARSER_SINGLETON.labels[i].label.toUpperCase();
    if (labelName[0] == '.') {
      labelName += " ( " + lastNotLocalLabel + " )";
    } else lastNotLocalLabel = labelName;
    DEBUGGER_labels.push(labelName);
    let origLn = null;
    origLn = PARSER_lines[CODERPARSER_SINGLETON.labels[i].index];
    str += '  <option value="' + CODERPARSER_SINGLETON.labels[i].label.toUpperCase() + '">' + labelName + '</option>';
  }
  document.getElementById('labels').innerHTML = str;

  str = '';
  str += '<table name="DBGlines" id="DBGlines">';
  str += '<thead><tr><th style="width:5%">ofs</th><th style="width:5%">opcode</th><th style="width:40%">instruction</th><th>comments</th></tr></thead><tbody>';
  DEBUGGER_startRow = 0;
  DEBUGGER_endRow = DEBUGGER_disamlines.length;
  DEBUGGER_rowToIP = [];
  for (let i = DEBUGGER_startRow; i < DEBUGGER_endRow; i++) {
    const IP = DEBUGGER_disamlines[i].IP;
    const parsedLn = PARSER_lines[DEBUGGER_disamlines[i].lineIndex];
    DEBUGGER_rowToIP.push(IP);
    let lnID = getCodeLineID(IP);
    if (DEBUGGER_disamlines[i].isLabl) lnID = DEBUGGER_disamlines[i].instr.toUpperCase();
    str += '<tr id="' + lnID + '" tabindex="' + i + '"';
    str += '><td ';
    if (parsedLn.breakpoint) {
      str += 'style="background-color:red;"';      
    }
    str += 'onclick = "onCodeRow(this,' + IP + ');">' + parsedLn.codeSectionOfs.toString(16) + '</td>';
   /* let cycles = parsedLn.cycles;
    if (!cycles || isNaN(cycles)) cycles = ' '; else cycles = cycles.toString();
    str += '<td>' + cycles + '</td>';
    */
    let opcode = "";
    if (!parsedLn.instrBytes) {
      opcode=" ";
    } else {
      for (let oi =0; oi < parsedLn.instrBytes; oi++) {
        let newByte = CPU_CODE_SECTION[parsedLn.codeSectionOfs + oi].toString(16);
        while (newByte.length < 2) newByte = "0" + newByte; 
        opcode += newByte;
      }  
    }
    str += '<td>' + opcode + '</td>';
   
    let bold = DEBUGGER_disamlines[i].isLabl;
    if (bold) 
      str += '<td style="color:#ddddee; background-color:#444444;">';
    else
      str += '<td>';
    str += syntaxColoring(DEBUGGER_disamlines[i], parsedLn);
    str += '</td>';
    str += '<td><span style="color:#667766">';
    let cmt = ' ';
    if (!DEBUGGER_disamlines[i].isJS) {
      let comment = parsedLn.text.indexOf(';');
      if (comment >= 0) {
        while (true) {
          const c = parsedLn.text[comment];
          if (c == ';' || c == '\t' || c == ' ') comment++;
          else break;
        }
        cmt = parsedLn.text.slice(comment);
      }  
    }
    str += cmt;
    str += '</span></td></tr>';
  }
  str += '</tbody></table>';
  elm.innerHTML = str;
  autocomplete(document.getElementById("filterLabel"), DEBUGGER_labels);
  DEBUGGER_dumpRegistersValues();
}

function DEBUGGER_HitBp(_IP) {  
  if (DEBUGGER_hitBP_prevRow) {
    DEBUGGER_hitBP_prevRow.classList.remove('breakPoint_row');          
    DEBUGGER_hitBP_prevRow = null;
  }
  let cursorLineName = getCodeLineID(_IP);
  let cursorItem = document.getElementById(cursorLineName);
  if (cursorItem) {
    DEBUGGER_hitBP_prevRow = cursorItem;
    cursorItem.classList.add('breakPoint_row');
  }
//  DEBUGGER_ForceFocus = _IP;
}

function DEBUGGER_onTimeMachine() {
  focusOnCodeLine(M68K_IP);
  DEBUGGER_update(true);
  DEBUGGER_dumpRegistersValues();
  if (DEBUGGER_timeM_prevRow)
    DEBUGGER_timeM_prevRow.classList.remove('timeMachine_row');          
  let cursorLineName = getCodeLineID(M68K_IP);
  let cursorItem = document.getElementById(cursorLineName);
  if (cursorItem) {
      DEBUGGER_timeM_prevRow = cursorItem;
      cursorItem.classList.add('timeMachine_row');
  }        
  focusOnCodeLine(M68K_IP);
}

function DEBUGGER_dumpRegistersValues() {
  // print data registeers values
  let str = '<table>';
  str += '<thead><tr><th>D0</th><th>D1</th><th>D2</th><th>D3</th><th>D4</th><th>D5</th><th>D6</th><th>D7</th></tr></thead><tbody>';
  str += '<tr>';
  for (let i = 0; i < 8; i++) {
    if (regs.d[i] == DEBUGGER_saveReg[i])
      str += '<td onclick="onRegDataClicked(' + i + ');" style="background-color:#1e1e1e; color:#ddddee;">'
    else
      str += '<td onclick="onRegDataClicked(' + i + ');" style="background-color:green; color:white;">'
    str += DBG_reg('d' + i, 4, DEBUGGER_signed).toString(DEBUGGER_Base) + '</td>';
  }
  str += '</tr>';
  str += '</tbody></table>'

  // print address registers values
  const normal = '<td style="background-color:#1e1e1e; color:#ddddee;">';
  const changed = '<td style="background-color:green; color:white;">';
  str += '<br><table>';
  str += '<thead><tr><th>A0</th><th>A1</th><th>A2</th><th>A3</th><th>A4</th><th>A5</th><th>A6</th><th>A7</th></tr></thead><tbody>';
  str += '<tr>';
  for (let i = 0; i < 8; i++) {
    if (regs.a[i] == DEBUGGER_saveReg[i + 8])
      str += normal;
    else
      str += changed;
    str += DBG_reg('a' + i, 4, DEBUGGER_signed).toString(DEBUGGER_Base) + '</td>';
  }
  str += '</tr>';
  str += '</tbody></table>'

  // print CPU flags values
  str += '<br><table>';
  str += '<thead><tr><th>X</th><th>N</th><th>Z</th><th>V</th><th>C</th></tr></thead><tbody>';
  str += '<tr>';
  if (regs.x == DEBUGGER_saveReg[16]) str += normal; else str += changed;
  str += regs.x + '</td>';
  if (regs.n == DEBUGGER_saveReg[17]) str += normal; else str += changed;
  str += regs.n + '</td>';
  if (regs.z == DEBUGGER_saveReg[18]) str += normal; else str += changed;
  str += regs.z + '</td>';
  if (regs.v == DEBUGGER_saveReg[19]) str += normal; else str += changed;
  str += regs.v + '</td>';
  if (regs.c == DEBUGGER_saveReg[20]) str += normal; else str += changed;
  str += regs.c + '</td>';
  str += '</tr>';
  str += '</tbody></table>'
  str += '<br>command: <input type="text" id="command" name="command" size="30" onchange="DEBUGGER_onNewCommand()"><hr>';
  document.getElementById('registersDump').innerHTML = str;
}

function get8BitBinStr(_v) {
  let str = "";
  if (((_v >>> 7) & 1) != 0) str += "1"; else str += "0";
  if (((_v >>> 6) & 1) != 0) str += "1"; else str += "0";
  if (((_v >>> 5) & 1) != 0) str += "1"; else str += "0";
  if (((_v >>> 4) & 1) != 0) str += "1"; else str += "0";
  if (((_v >>> 3) & 1) != 0) str += "1"; else str += "0";
  if (((_v >>> 2) & 1) != 0) str += "1"; else str += "0";
  if (((_v >>> 1) & 1) != 0) str += "1"; else str += "0";
  if ((_v & 1) != 0) str += "1"; else str += "0";
  return str;
}

function get4BitHexStr(_v) {
  switch(_v) {
    case 0 : return '0';
    case 1 : return '1';
    case 2 : return '2';
    case 3 : return '3';
    case 4 : return '4';
    case 5 : return '5';
    case 6 : return '6';
    case 7 : return '7';
    case 8 : return '8';
    case 9 : return '9';
    case 10 : return 'A';
    case 11 : return 'B';
    case 12 : return 'C';
    case 13 : return 'D';
    case 14 : return 'E';
    case 15 : return 'F';
    default: return "ERROR";
  }
}

function get8BitHexStr(_v) {
  let str = get4BitHexStr((_v>>>4)&15);
  str += get4BitHexStr(_v&15);
  return str;
}

function get16BitHexStr(_v) {
  let str = get8BitHexStr((_v>>>8)&255);
  str += '.';
  str += get8BitHexStr(_v&255);
  return str;
}

function get32BitHexStr(_v) {
  let str = get16BitHexStr((_v>>>16)&65535);
  str += '.';
  str += get16BitHexStr(_v&65535);
  return str;
}

function onRegDataClicked(_index) {
  let v = new Uint32Array(1);
  v[0]  = regs.d[_index];
  const u32 = v[0];
  const i32 = TOOLS.toInt32(v[0]);
  const u16Hi = (v[0] >>> 16) & 0xffff;
  const i16Hi = TOOLS.toInt16(u16Hi);
  const u16Lo = v[0] & 0xffff;
  const i16Lo = TOOLS.toInt16(u16Lo);
  const u16Lo8hi = u16Lo >>> 8;
  const i16Lo8hi = TOOLS.toInt8(u16Lo8hi);
  const u16Lo8Lo = u16Lo & 0xff;
  const i16Lo8Lo = TOOLS.toInt8(u16Lo8Lo);
  const str32 = "D"+_index+".l";
  const str16Hi = "D"+_index+" >> 16";
  const str16Lo = "D"+_index+" & 0xffff";
  const str8Hi = "(D"+_index+" >> 8) & 0xff";
  const str8Lo = "D"+_index+" & 0xff";
  binval = get8BitBinStr((u32 >>> 24) & 0xff);
  binval += '.'+get8BitBinStr((u32 >>> 16) & 0xff);
  binval += '.'+get8BitBinStr((u32 >>> 8) & 0xff);
  binval += '.'+get8BitBinStr(u32 & 0xff);
  let msg = "<h1><center>D"+_index+":</center></h1><br>HEX: $" + get32BitHexStr(v[0]) + "<br>BIN: %" + binval + "<br><br><table>";
  msg += '<thead><tr><th>part</th><th>Unsigned Hex</th><th>Signed Hex</th><th>Unsigned Dec</th><th>Signed Dec</th></thead><tbody>';
  msg += '<tr><th>'+str32+'</th><td>$'+u32.toString(16)+'</td><td>$'+i32.toString(16)+'</td>';
  msg += '<td>'+u32.toString()+'</td><td>'+i32.toString()+'</td></tr>';
  msg += '<tr><th>'+str16Hi+'</th><td>$'+u16Hi.toString(16)+'</td><td>$'+i16Hi.toString(16)+'</td>';
  msg += '<td>'+u16Hi.toString()+'</td><td>'+i16Hi.toString()+'</td></tr>';
  msg += '<tr><th>'+str16Lo+'</th><td>$'+u16Lo.toString(16)+'</td><td>$'+i16Lo.toString(16)+'</td>';
  msg += '<td>'+u16Lo.toString()+'</td><td>'+i16Lo.toString()+'</td></tr>';
  msg += '<tr><th>'+str8Hi+'</th><td>$'+u16Lo8hi.toString(16)+'</td><td>$'+i16Lo8hi.toString(16)+'</td>';
  msg += '<td>'+u16Lo8hi.toString()+'</td><td>'+i16Lo8hi.toString()+'</td></tr>';
  msg += '<tr><th>'+str8Lo+'</th><td>$'+u16Lo8Lo.toString(16)+'</td><td>$'+i16Lo8Lo.toString(16)+'</td>';
  msg += '<td>'+u16Lo8Lo.toString()+'</td><td>'+i16Lo8Lo.toString()+'</td></tr>';
  msg += '</tbody></table>'

  showModalBox(msg, null);  
}

var DEBUGGER_lastUpdLine = -1;
function DEBUGGER_update(_force) {
  if (!CODERPARSER_SINGLETON || !MYFX)
    return; // in case keys are pressed beore the fx is loaded

  if (!_force) {
    if (DEBUGGER_lastUpdLine == M68K_IP)
      return; // otherwise constantly refreshes the right pane and cant select an address to watch
  }

  DEBUGGER_lastUpdLine = M68K_IP;
  
  let elm = document.getElementById('debugger-right');
  let str = '';

  // print current instruction
  if (isNaN(M68K_IP)) {
    return; // can happen when reaching end of file
  }

  if (DEBUGGER_tracing) {
    if (typeof PARSER_lines !== 'undefined' && ASMBL_ADRSTOLINE) {
      let lnIndex = ASMBL_ADRSTOLINE[M68K_IP];
      if (lnIndex == null || typeof lineIndex == 'undefined') {
        const l = ASMBL_ADRSTOLINE_GEN.length;
        for (let i = 0; i < l; i++) {
          if (ASMBL_ADRSTOLINE_GEN[i].ip == M68K_IP) {
            lnIndex = ASMBL_ADRSTOLINE_GEN[i].ln;
            break;
          }
        }
      }    
      let curLine = PARSER_lines[lnIndex];
      if (curLine) {
        if ((DEBUGGER_lastJSExecLog != null) && (curLine.filtered == 'ILLEGAL')) {
          str += DEBUGGER_lastJSExecLog + '<br><hr>';  
        }
        str += 'tracing, next: ' + curLine.filtered;
        if (DEBUGGER_AdditionalDbgMsg.length > 0) {
          str += "<br>" + DEBUGGER_AdditionalDbgMsg;
        }
        ShowTracingLog(str);
        str += '<br><hr>';
      }
        
    }  
  } else {
    str += 'running<hr>';
    HideTracingLog();
    elm.innerHTML = str;
  }

  

  // print memory dump
  str += "<select name='dbgreg' id='dbgreg' onchange='onChangeDumpReg(this);'>";

  str += '<option value="' + "last written mem" + '"';
  if (DEBUGGER_dumpReg == "last written mem")
    str += ' selected="selected"';
  str += '>' + "last written mem" + '</option>';

  str += '<option value="' + "last read mem" + '"';
  if (DEBUGGER_dumpReg == "last read mem")
    str += ' selected="selected"';
  str += '>' + "last read mem" + '</option>';

  for (let i = 0; i < 8; i++) {
    let name = 'a' + i;
    str += '<option value="a' + i + '"';
    if (DEBUGGER_dumpReg == name)
      str += ' selected="selected"';
    str += '>a' + i + '</option>';
  }

  for (let i = 0; i < CODERPARSER_SINGLETON.labels.length; i++) {
    let lab = CODERPARSER_SINGLETON.labels[i];
    if (lab.dcData) {
      str += '<option value="' + lab.label + '"';
      if (DEBUGGER_dumpReg == lab.label)
        str += ' selected="selected"';
      str += '>' + lab.label + '</option>';
    }
  }
  str += '</select>';

  let reg, ofs, label;
  reg = NaN;
  if (DEBUGGER_dumpReg == "last read mem") {
    reg = DEBUGGER_lastReadAdrs;
  } else if (DEBUGGER_dumpReg == "last written mem") {
    reg = DEBUGGER_lastWrittenAdrs;
  } else {
    reg = TOOLS.getLabelAdrs(DEBUGGER_dumpReg, true);
    if (isNaN(reg)) {
      reg = DBG_reg(DEBUGGER_dumpReg, 4, false);
    }
  }
  if (!isNaN(DEBUGGER_customWatch)) {
    reg = DEBUGGER_customWatch;
  }
  if (isNaN(reg)) {
    str += "<br><b>CAN'T SHOW MEMORY DUMP: INVALID TARGET: " + DEBUGGER_dumpReg + "</b><br>";
  } else {
    ofs = 0;
    label = DEBUGGER_dumpReg;
    str += '<table>';
    str += '<thead><tr><th style="width:10%">ofs</th><th>data (' + label + ' = $' + reg.toString(16) + ')</th><th>ascii</th></tr></thead><tbody>';
    const lnCount = 128;
    if (reg > 0) {
      for (let i = 0; i < lnCount; i++) {
        str += '<tr><td>' + ofs.toString(DEBUGGER_Base) + '</td><td>';
        let ascii = "";
        for (let j = 0; j < 4; j++) {
          if (reg + ofs >= MACHINE.ram.length) break;
          let v1 = MACHINE.ram[reg + ofs];
          str += DEBUGGER_strToByte(v1); ofs++;
          if (reg + ofs >= MACHINE.ram.length) break;
          let v2 = MACHINE.ram[reg + ofs];
          str += DEBUGGER_strToByte(v2); ofs++;
          if (reg + ofs >= MACHINE.ram.length) break;
          let v3 = MACHINE.ram[reg + ofs];
          str += DEBUGGER_strToByte(v3); ofs++;
          if (reg + ofs >= MACHINE.ram.length) break;
          let v4 = MACHINE.ram[reg + ofs];
          str += DEBUGGER_strToByte(v4); ofs++;
          str += '.';
          ascii += String.fromCharCode(v1);
          ascii += String.fromCharCode(v2);
          ascii += String.fromCharCode(v3);
          ascii += String.fromCharCode(v4);
        }
        str +=  '</td><td>';
        str += ascii;
        '</td></tr>';
      }
    }
    str += '</tbody></table>'
  }

  elm.innerHTML = str;
  if (DEBUGGER_tracing) {
    focusOnCodeLine(M68K_IP);
  }
}

function onChangeDumpReg(_t) {
  DEBUGGER_customWatch = NaN;
  DEBUGGER_dumpReg = _t.value;
  DEBUGGER_update(true);
}

function DBG_setColor(_r, _g, _b) {
  const col = 'rgba(' + _r + ',' + _g + ',' + _b + ',255';
  ctx.fillStyle = col;
  ctx.strokeStyle = col;
}

function DBG_Plot(x, y) {
  ctx.fillRect(x, y, 1, 1);
}

function dbg_sleep(millis)
{
    var date = new Date();
    var curDate = null;
    do { curDate = new Date(); }
    while(curDate-date < millis);
}

function breakpoint(_alertMessage) {
  return debug(_alertMessage);
}

function debug(_alertMessage) {
  let beg = "code OFS = $" + M68K_IP.toString(16) + ", paused: ";
  if (_alertMessage) {
    DEBUGGER_AdditionalDbgMsg = _alertMessage;
    showHTMLError(_alertMessage);
    main_Alert(beg + _alertMessage, true);   
  } else main_Alert(beg, true);   

  setTraceMode(true);
  DEBUGGER_traceTillRTS = false;
  DEBUGGER_runTillIP = null;
  DEBUGGER_update();
  DEBUGGER_dumpRegistersValues();
  DEBUGGER_HitBp(M68K_IP);
  focusOnCodeLine(M68K_PREVIP);
}

function onCodeRow(_r, _IP) {
  const parsedLn = PARSER_lines[ASMBL_ADRSTOLINE[_IP]];
  
  if (parsedLn.breakpoint)
    parsedLn.breakpoint = false;
  else
    parsedLn.breakpoint = true;
  DEBUGGER_initFile();
  document.getElementById('DBGlines').focus();
  focusOnCodeLine(_IP);
}


function DBG_setDumpReg(_name) {
  DEBUGGER_customWatch = NaN;
  DEBUGGER_dumpReg = _name;
  DEBUGGER_update();
}


// AUTOCOMPLETE
function autocomplete(inp, arr) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function(e) {
      var a, b, i, val = this.value;
      /*close any already open lists of autocompleted values*/
      closeAllLists();
      if (!val) { return false;}
      currentFocus = -1;
      /*create a DIV element that will contain the items (values):*/
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      /*append the DIV element as a child of the autocomplete container:*/
      const rect=this.getBoundingClientRect();
      a.style.position = "absolute";
      a.style.left = Math.floor(rect.left  + window.scrollX).toString() +'px';
      a.style.top = Math.floor(rect.bottom + window.scrollY + 20).toString() +'px';//this.style.top;//y_pos+'px';
      this.parentNode.appendChild(a);
      /*for each item in the array...*/
      for (i = 0; i < arr.length; i++) {
        /*check if the item starts with the same letters as the text field value:*/
        if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
          /*create a DIV element for each matching element:*/
          b = document.createElement("DIV");
          /*make the matching letters bold:*/
          b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
          b.innerHTML += arr[i].substr(val.length);
          /*insert a input field that will hold the current array item's value:*/
          b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
          b.jumpName = CODERPARSER_SINGLETON.labels[i].label.toUpperCase();
          /*execute a function when someone clicks on the item value (DIV element):*/
              b.addEventListener("click", function(e) {
              /*insert the value for the autocomplete text field:*/
              inp.value = this.getElementsByTagName("input")[0].value;
              DEBUGGER_onNewLabel(this.jumpName);
              /*close the list of autocompleted values,
              (or any other open lists of autocompleted values:*/
              closeAllLists();
          });
          a.appendChild(b);
        }
      }
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function(e) {
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {
        /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
        currentFocus++;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 38) { //up
        /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
        currentFocus--;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 13) {
        /*If the ENTER key is pressed, prevent the form from being submitted,*/
        e.preventDefault();
        if (currentFocus > -1) {
          /*and simulate a click on the "active" item:*/
          if (x) x[currentFocus].click();
        }
      }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
      x[i].parentNode.removeChild(x[i]);
    }
  }
}
/*execute a function when someone clicks in the document:*/
document.addEventListener("click", function (e) {
    closeAllLists(e.target);
});
}