const LOCALSTORAGE_FX_NAME = "fxname";
const LOCALSTORAGE_FX_PREV = "fxprev";
const LOCALSTORAGE_BREAKPOINTS = "breakpoints";
const LOCALSTORAGE_FX_PAUSED = "paused";
const LOCALSTORAGE_FX_ZOOM = "zoom";



var SIMU_DEFAULT_WIDTH, PAL_VIDEO_LINES_COUNT, PAL_PLAYFIELD_LINES_COUNT;
var SIMU_START_BITPLANE, SIMU_END_BITPLANE;
var PLAYFIELD_LINES_COUNT;

var MAIN_ALERTS_LIST = [];
var MAIN_ALERTS_ALLLOWED = true;

var GLOBAL_MOUSEX = 0;
var GLOBAL_MOUSEY = 0;

var FRAME = 0;
var ANIM_FRAME_WAIT = 0;
var ANIM_FRAME_LAST_TIME = 0;

var FX_INFO = null;
var PLATFORM_OFSX = 0;
var PLATFORM_OFSY = 0;

var PAUSED = false;

var cvs, ctx, smallRenderCtx, smallRenderCvs;
var REQUEST_ANIMFRAME = true;
var WAITING_USERINPUT = false;

var play = true;

let DisplayWindowStart_x = 0;
let DisplayWindowStart_y = 0;
let DisplayWindowStop_x = 319;
let DisplayWindowStop_y = 255;

var CANVAS_DISPLAY_WIDTH = SIMU_DEFAULT_WIDTH;
var CANVAS_DISPLAY_HEIGHT = PAL_VIDEO_LINES_COUNT;
var BACKBUF_CVS;
var BACKBUF_CTX;
var CANVAS_SCALE = 1;

var MYFX = {};  // don't set to null, keep as an empty struct


function SET_PAUSE(_p) {
  if (PAUSED != _p) {
    PAUSED = _p;
    var elm = document.getElementById('paused').style;
    if (PAUSED) {
      elm.left = 0;
      elm.top = 0;
      elm.display="block";
    } else {
      elm.display="none";
    }
  }
}

function REGISTER_FX(_info) {
  if (!_info.fxName)
    _info.fxName = _info.className;
  user_fx.push(_info);
}

function get2DContext(_cvs) {
  _cvs.style.cssText = 'image-rendering: optimizeSpeed;' + // FireFox < 6.0
 'image-rendering: -moz-crisp-edges;' + // FireFox
 'image-rendering: -o-crisp-edges;' +  // Opera
 'image-rendering: -webkit-crisp-edges;' + // Chrome
 'image-rendering: crisp-edges;' + // Chrome
 'image-rendering: -webkit-optimize-contrast;' + // Safari
 'image-rendering: pixelated; ' + // Future browsers
 '-ms-interpolation-mode: nearest-neighbor;'; // IE
  let c = _cvs.getContext('2d', { willReadFrequently: true });
  c.imageSmoothingQuality = "low";
  c.imageSmoothingEnabled = false; 
  c.webkitImageSmoothingEnabled = false;
  c.mozImageSmoothingEnabled = false;
  c.msImageSmoothingEnabled = false;
 return c;
}

function main_updateAsmOnly() {
  execCPU();
}

function main_doInit() {
  MYFX.SYS_initialized = true;
  MYFX.updatedFramesCount = 0;
  try {
    if (MYFX.FX_Init)
      MYFX.FX_Init();
    if (FX_INFO.asmInit)
      invoke68K(FX_INFO.asmInit);
  } catch (err) {
    if (err.message == "WAITING_USERINPUT") {
      WATCHES.update();
      return; // just waiting for the user to press the trace key, don't execute JS further
    }
    let msg = "Exception occurred while initializing the FX:\n" + err.message;
    if (err.stack) msg += "\ncallstack:\n" + err.stack;
    main_Alert(msg, false, true);
  }
}

function main_mainLoop() {
  if (PAUSED || WAITING_USERINPUT) {
    WATCHES.update();
    return;
  }

  // Handle case when user is tracing asm code
  if (DEBUGGER_insideInvoke && !MACHINE.stop) {
    console.log("inside invoke: " + DEBUGGER_insideInvoke);
    try {
      main_updateAsmOnly(); // tracing code
      if (DEBUGGER_QueryDisplayRefresh) {
        DEBUGGER_QueryDisplayRefresh = false;
        MACHINE.customUpdate();
      }
    } catch (err) {
      if (err.message == "WAITING_USERINPUT")  {
        WATCHES.update();
        //console.log("main_updateAsmOnly - waiting for the user to trace. don't execute further");
        return; // just waiting for the user to trace. don't execute further
      }
      alert("Exception occurred while tracing assembler: " + err.message);
    }
    WATCHES.update();
    return;
  }

  if (play) {
    // Handle case when FX has not yet been initialized
    if (!MYFX.SYS_initialized) {
        main_doInit();
      WATCHES.update();
        return;
    }

    // Handle classic FX update case
    ctx.save();
    ctx.translate(SIMU_START_BITPLANE, DisplayWindowStart_y);   
    if (DEBUGGER_SHOWCPUCYCLES) M68K_CYCLES = 0;
    if ((!MACHINE) || (!MACHINE.stop)) {
      try {
        MYFX.updateInvokedAsm = false;
        if (MYFX.FX_Update)
          MYFX.FX_Update();
        if (FX_INFO.asmUpdate)
          invoke68K(FX_INFO.asmUpdate);

        if (!MYFX.updateInvokedAsm && FX_INFO.source) // do not call if no asm at all
          invoke68K("M68KWB_defaultMainLoop"); // need to update something with the CPU at every frame, otherwise interrupts won' trigger (especially vbl)
        MYFX.updatedFramesCount++;
      } catch (err) {
        if (err.message == "WAITING_USERINPUT") {
          WATCHES.update();
          //console.log("MYFX.FX_Update() - waiting for the user to trace. don't execute JS further");
          return; // just waiting for the user to press the trace key, don't execute JS further
        } {
          let msg = "Exception occurred while updating the FX:\n" + err.message;
          msg += "\ncallstack:\n" + err.stack;
          main_Alert(msg, false, true);
        }
      }
    } 
    if (DEBUGGER_SHOWCPUCYCLES) {
      if (M68K_MINCYCLES == -1 || M68K_CYCLES < M68K_MINCYCLES) M68K_MINCYCLES = M68K_CYCLES;
      if (M68K_MAXCYCLES == -1 || M68K_CYCLES > M68K_MAXCYCLES) M68K_MAXCYCLES = M68K_CYCLES;
      ShowDebugLog("cycles: " + M68K_CYCLES + "<br>min: " + M68K_MINCYCLES + "<br>max: " + M68K_MAXCYCLES);
    }

    ctx.restore();
    MACHINE.customUpdate();

    if (MYFX.FX_DrawDebug) {
      BACKBUF_CTX.save();    
      BACKBUF_CTX.translate(DEBUGPRIM.startScreenX, DEBUGPRIM.startScreenY);
      MYFX.FX_DrawDebug(BACKBUF_CTX);
      BACKBUF_CTX.restore();
    }

    DEBUGPRIM.draw(BACKBUF_CTX);
    imgDataToScreen();

    WATCHES.update();
  }
}


function main_startAll() {
  if (!WATCHES)
    new M68K_Watches(true); // in case no asm files
  if (!TOOLBOX) new Toolbox();
  if (FX_INFO.zoom) {
    try {
      setZoom(FX_INFO.zoom);
    } catch(e) {
      alert("REGISTER_FX: zoom failed:\n" + e);
    }
  }
  if (FX_INFO.hasAudio) {
    try {
      AUDIO_SINGLETON = new Audio();
    } catch(e) {
      alert("Could not create Audio:\n" + e);
    }
  }

  TOOLBOX.onFXStart(FX_INFO);

  MYFX.SYS_initialized = false;

  var rAF_ID;
  var rAFCallback = function () {
    if (ANIM_FRAME_WAIT > 0) {
      const curTime = Date.now();
      const deltaTime = curTime - ANIM_FRAME_LAST_TIME;
      if (deltaTime >= ANIM_FRAME_WAIT*100) {
        ANIM_FRAME_LAST_TIME =  curTime;
      } else {
        rAF_ID = requestAnimationFrame(rAFCallback);
        return;
      }
    }
    main_mainLoop();
    if (REQUEST_ANIMFRAME)
      rAF_ID = requestAnimationFrame(rAFCallback);
  }

  rAF_ID = requestAnimationFrame(rAFCallback);
}

function setTooltipPos(e, d) {
	d.left = (e.clientX + 10).toString()+"px";
	d.top = (e.clientY + 10).toString()+"px";
  d.display="block";
}

function showMouseCoord(event) {
  let x = (event.pageX - this.offsetLeft) * 100 / CANVAS_SCALE;
  let y = (event.pageY - this.offsetTop) * 100 / CANVAS_SCALE;
  x -= DEBUGPRIM.startScreenX;
  y -= DEBUGPRIM.startScreenY;
  let px = Math.floor(x);
  let py = Math.floor(y);
  cvs.style.cursor = "crosshair";
  document.getElementById("mouseCoordLabel").innerHTML = px + ", " + py;

  var elm = document.getElementById('mouseFollow').style;
  setTooltipPos(event,elm);	
}


function failedStartingFX(_fxName) {
  MYFX.couldStart = false;
  // could not instanciate FX: show a modal box to choose from a list
  if (CODERPARSER_SINGLETON && CODERPARSER_SINGLETON.stopGlobalCompilation) {
    hideModalBox();
    return;
  }
  let fxList = "";
  if (_fxName)
    fxList += "FX " + _fxName + " from last session could not be started<br>";
  fxList += '<center>Please select a FX from the below list:<br><br>';
  fxList += '<select name="fxListSelect" id="fxListSelect">';
  let prevName = localStorage.getItem(LOCALSTORAGE_FX_PREV);
  for (let i = 0; i < user_fx.length; i++) {
    const name = user_fx[i].fxName;
    let fullName = name + " (" + user_fx[i].platform + ")";
    if (name == prevName)
      fxList += '<option value="' + name + '" selected="selected">' + fullName + '</option>';
    else
      fxList += '<option value="' + name + '">' + fullName + '</option>';
  }
  fxList += '</select>';
  fxList += '<br><hr><br>Filter by name:<br><br><input type="text" id="searchfx" name="searchfx" oninput="updateFxList()"><br><br>';
  showModalBox(fxList, onFxChosen);
  document.getElementById("searchfx").focus();
}

function main_startChosenFx(_fxName) {
  hideModalBox();

  FX_INFO = null;
  let _index = -1;

  for (let i = 0; i < user_fx.length; i++) {
    if (user_fx[i].fxName.toUpperCase() == _fxName.toUpperCase()) {
      _index = i;
      break;
    }
  }

  if (_index < 0 ||_index >= user_fx.length) {
    return failedStartingFX(_fxName);
  }

  try {
    FX_INFO = user_fx[_index];
  } catch(_err) {
    alert(_err);
    return failedStartingFX(_fxName);
  }
  if (!FX_INFO) {
    return failedStartingFX(_fxName);
  }

  if (FX_INFO.js)
    loadScript(FX_INFO.js);
  else
    main_onFXJSLoaded();
}


function findFxIndexFromName(_name) {
  if (_name) {
    for (let i = 0; i < user_fx.length; i++) {
      if (user_fx[i].fxName == _name) {
        return i;
      }
    }
  }
  return -1;
}

function onFxChosen() {
  if (document.getElementById("searchfx").value.toUpperCase() == "CHAIN") {
    localStorage.setItem(LOCALSTORAGE_CHAININDEX, 1);
    window.location.reload(true);
  }
  hideModalBox();
  let sel = document.getElementById("fxListSelect");
  const name = sel.options[sel.selectedIndex].value;
  main_startChosenFx(name);
}

function findFxIndexFromName(_name) {
  if (_name) {
    for (let i = 0; i < user_fx.length; i++) {
      if (user_fx[i].fxName == _name) {
        return i;
      }
    }
  }
  return -1;
}


function updateFxList() {
  let fxList = document.getElementById("fxListSelect");
  while (fxList.length > 0) {
    fxList.remove(0);
  }  
  let search = document.getElementById("searchfx").value.toUpperCase();
  let firstDone = false;
  for (let i = 0; i < user_fx.length; i++) {
    if (!user_fx[i].fxName) {
      if (user_fx[i].className) {
        user_fx[i].fxName = user_fx[i].className;
      } else {
        continue;
      }
    }
    const name = user_fx[i].fxName.toUpperCase();
    if (name.includes(search)) {
      const name = user_fx[i].fxName;
      if (!name) {
        alert("error parsing 'user_fx'. Index '" + i + "' has no 'fxName' field.");
        continue;
      }
      let objOption = document.createElement("option");
      objOption.text = name;
      objOption.value = name;
      if (!firstDone) {
        objOption.selected="selected";
        firstDone = true;
      }
      fxList.options.add(objOption);
    }
  }
}


function main_onload() {
  for (let i = 0; i < user_fx.length; i++) {
    if (!user_fx[i].fxName) {
      if (user_fx[i].classname) {
        user_fx[i].fxName = user_fx[i].classname;
      }
      else {
        alert("user_fx: entry #" + i + " has no 'fxName' or 'classname' field");
        return;
      }
    }
    switch (user_fx[i].platform) {
      case "OCS": 
      case "ST":
      case "STE":
      break;
      default:
        alert("user_fx: entry #" + i + " has no or bad 'platform' field");
      return;
    }
  }

  if (Check_Chain())
    return;

  // First try to start the FX in URL params
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  let FXName = urlParams.get('fx');
  if (FXName) {
    FXName = FXName.toUpperCase();
    if (FXName == "RESET") {
      localStorage.clear();
    }
  }

  // Try to run previous session's FX stored in localStorage
  if (FXName != "RESET")
  {
    FXName = localStorage.getItem(LOCALSTORAGE_FX_NAME);
    if (FXName) {
      return main_startChosenFx(FXName);
    } else {
      failedStartingFX();
    }
  }  
}

// _zoom : 100..200
function setZoom(_zoom) {
  if (_zoom < 100) {
    main_Alert("setZoom: argument must be in [100..200] range (you passed: " + _zoom + ")");
    _zoom = 100;
  }
  if (_zoom > 200) {
    main_Alert("setZoom: argument must be in [100..200] range (you passed: " + _zoom + ")");
    _zoom = 200;
  }
  document.getElementById("outpuResolution").value = _zoom;
  onNewOutputResolution();
}


function onNewOutputResolution() {
  // default resolution: 100
  let rez = document.getElementById("outpuResolution").value;
  CANVAS_SCALE = rez;
  switch (FX_INFO.platform) {
    case "OCS":
      CANVAS_DISPLAY_WIDTH = Math.floor((rez * 483)/100);
      CANVAS_DISPLAY_HEIGHT = Math.floor((rez * 470)/100);
    break;    
    case "ST":
      CANVAS_DISPLAY_WIDTH = Math.floor((rez * 390)/100);
      CANVAS_DISPLAY_HEIGHT = Math.floor((rez * 312)/100);
    break;    
    case "STE":
      CANVAS_DISPLAY_WIDTH = Math.floor((rez * 390)/100);
      CANVAS_DISPLAY_HEIGHT = Math.floor((rez * 312)/100);
    break;    
  }
  cvs.width =  CANVAS_DISPLAY_WIDTH;
  cvs.height =  CANVAS_DISPLAY_HEIGHT;
}


function onNewRunningSpeed(_forceVal) {
  if (_forceVal)
    document.getElementById("runningSpeed").value = _forceVal;
  let rez = document.getElementById("runningSpeed").value;
  ANIM_FRAME_WAIT = (100-rez)/40;
  ANIM_FRAME_LAST_TIME =  Date.now();
}


function imgDataToScreen(imagedata) {
  ctx.imageSmoothingEnabled = false;
  if (CANVAS_SCALE == 100)
    ctx.drawImage(BACKBUF_CVS, 0, 0);
  else
    ctx.drawImage(BACKBUF_CVS, 0, 0, BACKBUF_CVS.width, BACKBUF_CVS.height, 0, 0, CANVAS_DISPLAY_WIDTH, CANVAS_DISPLAY_HEIGHT);

    smallRenderCtx.drawImage(BACKBUF_CVS, 0, 0, BACKBUF_CVS.width, BACKBUF_CVS.height, 0, 0, smallRenderCvs.width, smallRenderCvs.height);
  }


function hideModalBox(_content, _closeCallback) {
  var modal = document.getElementById("myModal");
  modal.style.display = "none";
  if (_closeCallback) _closeCallback();
}


function getDebugCanvas(_width, _height) {
  if (!_width) _width = 512;
  if (!_height) _height = 256;
  let modal = document.getElementById("modalContent");
  modal.innerHTML = "<canvas id='modalCvs' width='" + _width + "' height='" + _height + "'></canvas>";
  let c = document.getElementById('modalCvs');
  return c;
}

function showDebugCanvas() {
  showModalBox(null, null);
}


function main_Alert(_msg, _makeLastMsg = false, _skipAsm = false) {
  if (MAIN_ALERTS_LIST.length >= 3) {
    if (MAIN_ALERTS_ALLLOWED) {
      MAIN_ALERTS_ALLLOWED = false;
      let msg = "Too many alerts, won't show any further error. Please fix the errors you alredy have (also consider the 1st error probably provoked the others):\n";
      for (let i = 0; i < MAIN_ALERTS_LIST.length; i++) {
        msg += "\n- ERROR #" + (i+1).toString() + ": " + MAIN_ALERTS_LIST[i];
      }
      msg += "\n- ERROR #" + (MAIN_ALERTS_LIST.length+1).toString() + ": " + _msg;
      alert(msg);  
    }
    return;
  }
  if (MAIN_ALERTS_ALLLOWED) {
    let curLine = null;
    if ((typeof PARSER_lines !== 'undefined') && PARSER_lines && ASMBL_ADRSTOLINE) curLine = PARSER_lines[ASMBL_ADRSTOLINE[M68K_IP]];
    if (curLine && !_skipAsm) {
      _msg += "<br>in file: " + curLine.path + "<br>at line: " + curLine.line;
    }    
    const l = DBGCTX.length;
    if (l > 0) {
      _msg += "<br>Context:<br>";
      for (let i = 0; i < l; i++) {
        _msg += DBGCTX[i]+"\n";
      }
    }  
    MAIN_ALERTS_LIST.push(_msg);
    let strippedMsg = _msg.replaceAll("<br>","\n");
    strippedMsg = strippedMsg.replaceAll("\t","\u00A0");
    alert(strippedMsg);  
  }
  if (_makeLastMsg) {
    MAIN_ALERTS_ALLLOWED = false;
  }
}

function HideDebugLog() {
  document.getElementById('oneLiner').style.display = 'none';
}

function ShowDebugLog(_msg) {
  if (!DEBUGGER_ALLOWONELINER) return;
  let elm = document.getElementById('oneLiner');
  elm.style.display = 'inline-block';
  document.getElementById('liner').innerHTML = _msg.toString();
}

function HideTracingLog() {
  document.getElementById('tracingLog').style.display = 'none';
}

function ShowTracingLog(_msg) {
  let elm = document.getElementById('tracingLog');
  elm.style.display = 'inline-block';
  document.getElementById('tracing').innerHTML = _msg.toString();
}

function AddDebugLog(_msg) {
  if (!DEBUGGER_ALLOWONELINER) return;
  let elm = document.getElementById('oneLiner');
  elm.style.display = 'inline-block';
  let elm2 = document.getElementById('liner');
  if (elm2.innerHTML.length > 1)
    elm2.innerHTML += "<br>" + _msg.toString();
  else
   elm2.innerHTML = _msg.toString();
}

function getDebugLogString() {
  return document.getElementById('liner').innerHTML;
}

function showModalBox(_content, _closeCallback) {
  // Get the modal
  var modal = document.getElementById("myModal");
  if (_content) // content may already be filled outside of this function (by the caller)
    document.getElementById("modalContent").innerHTML = _content;

  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0];
  var closeb = document.getElementById("modalclose");

  modal.style.display = "block";

  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
    modal.style.display = "none";
    if (_closeCallback) _closeCallback();
  }

  closeb.onclick = function() {
    modal.style.display = "none";
    if (_closeCallback) _closeCallback();
  }



  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
      if (_closeCallback) _closeCallback();
    }
  }  
}

function showChunky(_srcAdrs,_w,_h) {
  var ckycvs = document.getElementById("chunkyDraw");
  var ckyctx = get2DContext(ckycvs);
  ckycvs.width = _w;
  ckycvs.height = _h;
  ckyctx.width = _w;
  ckyctx.height = _h;
	let ckydata = ckyctx.getImageData(0, 0, _w, _h);
  let dat = ckydata.data;
  let ofs = 0;
  for (let y = 0; y < _h; y++) {
    for (let x = 0; x < _w; x++) {
      let v = MACHINE.getRAMValue(_srcAdrs, 1, false);
      dat[ofs++] = v;
      dat[ofs++] = v;
      dat[ofs++] = v;
      dat[ofs++] = 255;
      _srcAdrs++;
    }  
  }
  ckyctx.imageSmoothingEnabled = false;
  ckyctx.putImageData(ckydata,0,0);
  var showcvs = document.getElementById("chunkyShow");
  showctx = get2DContext(showcvs);
  let rez = document.getElementById("outpuResolution").value;
  let showW  = Math.floor((rez * _w)/100);
  let showH  = Math.floor((rez * _h)/100);

  showcvs.width = showW;
  showcvs.height = showH;
  showctx.width = showW;
  showctx.height = showH;
  showcvs.style.visibility = 'visible';
  showctx.imageSmoothingEnabled = false;
  showctx.drawImage(ckycvs, 0, 0, ckycvs.width, ckycvs.height, 0, 0, showW, showH);
  ckycvs.style.visibility = 'hidden';
}

var SCRIPT_LOG_MSG = [];
function SCRIPT_LOG(_msg) {
  let str = "";
  if (SCRIPT_LOG_MSG.length > 0) {
    SCRIPT_LOG_MSG.push(_msg);
    str += SCRIPT_LOG_MSG[0]; // title
    for (let i = 1; i < SCRIPT_LOG_MSG.length; i++) {
      str += "<br>--> " + SCRIPT_LOG_MSG[i]; // content
    }
    ShowDebugLog(str);
    MACHINE.errorContext.script = str;
  } else {
    ShowDebugLog(_msg);
    MACHINE.errorContext.script = _msg;
  }
}

function SCRIPT_LOG_STARTLIST(_msg) {
  SCRIPT_LOG_MSG.push(_msg);
}

function SCRIPT_LOG_ENDLIST() {
  SCRIPT_LOG_MSG = [];
}



function main_onFXJSLoaded() {
  hideModalBox();

  const className = FX_INFO.classname;
  const FXName = FX_INFO.fxName;

  MAIN_ALERTS_LIST = [];
  MAIN_ALERTS_ALLLOWED = true;

  console.log("launching FX: " + FX_INFO.fxName + ", platform:" + FX_INFO.platform);

  if (className) { // instanciate JS class
    try {
      eval("MYFX = new " + className + "();");
    } catch (e) {
      alert("could not create FX class: " + className + ". Error: " + e);
      return;
    }
  } else {
    MYFX = {};
  }

  const prevFx = localStorage.getItem(LOCALSTORAGE_FX_NAME);
  if (prevFx != FXName) {
    localStorage.setItem(LOCALSTORAGE_FX_NAME, FXName);
  }

  document.addEventListener('mousemove', function(event) {
    GLOBAL_MOUSEX = event.pageX;
    GLOBAL_MOUSEY = event.pageY;
  });

  // Create canvases
  cvs = document.getElementById("mycvs");
  ctx = get2DContext(cvs);

  cvs.addEventListener('mouseover', showMouseCoord );
  cvs.addEventListener('mousemove', showMouseCoord );

  cvs.addEventListener('mouseout', function (event) {
    cvs.style.cursor = "default";
    var elm = document.getElementById('mouseFollow').style;
    elm.display = "none";

  });

  let backbufw = SIMU_DEFAULT_WIDTH;
  let backbufh = PAL_VIDEO_LINES_COUNT;
  switch (FX_INFO.platform) {
    case "OCS" : AMIGA_start(); backbufw = 483; backbufh = 470; break;
    case "ST" : ST_start(); backbufw = 390; backbufh = 312; break;
    case "STE" : STE_start(); backbufw = 390; backbufh = 312; break;
    default: alert("'platform' field must be 'OCS', 'ST', or 'STE'"); break;
  }
  
  new JS_ASM_Tools();
  new M68K_TimeMachine();
  new DebugPrimitives();
  
  DEBUGGER_AllocsList.push({ label: "Code Section", adrs: 0, size: ASSEMBLER_CONFIG.CPU_CODE_SECTION_BYTES });

  // now that machine is started, we can create the backbuff of the right resolution
  BACKBUF_CVS = document.getElementById('backBuffer');
  BACKBUF_CVS.width = backbufw;
  BACKBUF_CVS.height = backbufh;
	BACKBUF_CTX = get2DContext(BACKBUF_CVS);
  BACKBUF_CVS.style.display = "none";
  SIMU_START_BITPLANE = ((SIMU_DEFAULT_WIDTH - 320) / 2);
  SIMU_END_BITPLANE = (SIMU_DEFAULT_WIDTH - SIMU_START_BITPLANE);
  PLAYFIELD_LINES_COUNT = PAL_PLAYFIELD_LINES_COUNT;
  CANVAS_DISPLAY_WIDTH = SIMU_DEFAULT_WIDTH;
  CANVAS_DISPLAY_HEIGHT = PAL_VIDEO_LINES_COUNT;
  smallRenderCvs = document.getElementById("smallrender");
  smallRenderCvs.width = Math.floor(BACKBUF_CVS.width * 0.7);
  smallRenderCvs.height = Math.floor(BACKBUF_CVS.height * 0.7);
  smallRenderCtx = smallRenderCvs.getContext('2d');


  if (FX_INFO.source) {
    let finalPath  = "";
    if (FX_INFO.rootPath) {
      finalPath = FX_INFO.rootPath;
      if (FX_INFO.rootPath[FX_INFO.rootPath.length-1] != '/')
        finalPath += "/";
    }
    finalPath += FX_INFO.source;

    let cp = new CodeParser();
    if (!cp.ascii68k_loadfile(finalPath)) {
      alert("could not load/process asm file: " + finalPath);
      return failedStartingFX(_fxName);
    }
  }

  let item = localStorage.getItem(LOCALSTORAGE_FX_PAUSED);
  if (item == true) SET_PAUSE(true);
  if (FX_INFO.startPaused) SET_PAUSE(FX_INFO.startPaused);
  let zoom = localStorage.getItem(LOCALSTORAGE_FX_ZOOM);
  if (zoom) {
    document.getElementById("outpuResolution").value = zoom;
  }
  onNewOutputResolution();  
  onNewRunningSpeed();
  if (CODERPARSER_SINGLETON)  // some FX have no asm
    invoke68K("M68KWB_TargetPlatformInit");

  if (FX_INFO.clickToStart || FX_INFO.hasAudio)
    showModalBox("close (or click outside) to start", main_startAll);
  else main_startAll();
  
  window.scrollTo(0,0);
  MYFX.couldStart = true;
}


function loadScript(file) {
  const newScript = document.createElement('script');
  newScript.setAttribute('src', file);
  newScript.setAttribute('async', 'true');

  newScript.onload = () => {
      main_onFXJSLoaded();
  };

  newScript.onerror = () => {
    alert(`Error loading script: ${file}`, 'error');
  };

  document.head.appendChild(newScript);
}


