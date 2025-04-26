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

var FRAME = 0;
var ANIM_FRAME_WAIT = 0;
var ANIM_FRAME_LAST_TIME = 0;

var FX_INFO = null;
var PLATFORM_OFSX = 0;
var PLATFORM_OFSY = 0;

var PAUSED = false;

var cvs, ctx;
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

var MYFX = null;
var REGISTERED_FX;


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
  if (!REGISTERED_FX) {
    REGISTERED_FX = [];
    REGISTERED_FX.push(_info);
    return;
  }
  let order = parseInt(_info.order);
  if (!isNaN(order)) {
    if ((order >= 0) && (order < REGISTERED_FX.length)) {
      REGISTERED_FX.splice(order, 0, _info);
    } else {
      REGISTERED_FX.splice(0, 0, _info);
    }
    return;
  }
  for (let i = 0; i < REGISTERED_FX.length; i++) {
    if (_info.platform == REGISTERED_FX[i].platform) { // sort by platform
      REGISTERED_FX.splice(i, 0, _info);
      return;
    }
  }
  REGISTERED_FX.push(_info);
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
  if (MYFX.FX_Init) {
    MYFX.FX_Init();
  }
}

function main_mainLoop() {
  if (PAUSED || WAITING_USERINPUT) {
    return;
  }

  // Handle case when user is tracing asm code
  if (DEBUGGER_insideInvoke) {
    console.log("inside invoke: " + DEBUGGER_insideInvoke);
    try {
      main_updateAsmOnly(); // tracing code
      if (DEBUGGER_QueryDisplayRefresh) {
        DEBUGGER_QueryDisplayRefresh = false;
        MACHINE.customUpdate();
      }
    } catch (err) {
      if (err.message == "WAITING_USERINPUT")  {
        console.log("main_updateAsmOnly - waiting for the user to trace. don't execute further");
        return; // just waiting for the user to trace. don't execute further
      }
      alert("Exception occurred while tracing assembler: " + err.message);
    }
    return;
  }

  if (play) {
    // Handle case when FX has not yet been initialized
    if (!MYFX.SYS_initialized) {
        main_doInit();
        return;
    }

    // Handle classic FX update case
    ctx.save();
    ctx.translate(SIMU_START_BITPLANE, DisplayWindowStart_y);   
    if (DEBUGGER_SHOWCPUCYCLES) M68K_CYCLES = 0;
    if (MYFX.FX_Update) {
      try {
        MYFX.FX_Update();
      } catch (err) {
        if (err.message == "WAITING_USERINPUT") {
          console.log("MYFX.FX_Update() - waiting for the user to trace. don't execute JS further");
          return; // just waiting for the user to press the trace key, don't execute JS further
        }
        alert("Exception occurred while updating the FX: " + err.message);
      }
    } 
    if (DEBUGGER_SHOWCPUCYCLES) {
      if (M68K_MINCYCLES == -1 || M68K_CYCLES < M68K_MINCYCLES) M68K_MINCYCLES = M68K_CYCLES;
      if (M68K_MAXCYCLES == -1 || M68K_CYCLES > M68K_MAXCYCLES) M68K_MAXCYCLES = M68K_CYCLES;
      ShowDebugLog("cycles: " + M68K_CYCLES + "<br>min: " + M68K_MINCYCLES + "<br>max: " + M68K_MAXCYCLES);
    }

    ctx.restore();
    MACHINE.customUpdate();
    ctx.save();    
    ctx.scale(CANVAS_SCALE,CANVAS_SCALE);
    ctx.translate(PLATFORM_OFSX, PLATFORM_OFSY);
    if (MYFX.FX_DrawDebug)
      MYFX.FX_DrawDebug(ctx);
    ctx.restore();
  }
}


function main_startAll() {
  if (FX_INFO.hasAudio)
    AUDIO_SINGLETON = new Audio();
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
  bounds=this.getBoundingClientRect();

  let hardcoded_skip_monitor_x = 0;
  let hardcoded_skip_monitor_y = 0;

  switch (FX_INFO.platform) {
    case "OCS":
      if (AMIGA_Chunky8 == null) {
        hardcoded_skip_monitor_x = 35;
        hardcoded_skip_monitor_y = 41;  
      }
    break;
    case "ST" : ST_start();
    case "STE" : STE_start();
      hardcoded_skip_monitor_x = 35;
      hardcoded_skip_monitor_y = 56;
    break;
  }

  var x = Math.floor((event.pageX - this.offsetLeft) / CANVAS_SCALE);
  var y = Math.floor((event.pageY - this.offsetTop) / CANVAS_SCALE);
  x -= hardcoded_skip_monitor_x;
  y -= hardcoded_skip_monitor_y;
  var px=x;
  var py=y;
  cvs.style.cursor = "crosshair";
  document.getElementById("mouseCoordLabel").innerHTML = px + ", " + py;

  var elm = document.getElementById('mouseFollow').style;
  setTooltipPos(event,elm);	
}

function main_startChosenFx(_className) {
  hideModalBox();

  FX_INFO = null;
  _className = _className.toUpperCase();
  for (let i = 0; i < REGISTERED_FX.length; i++) {
    if (REGISTERED_FX[i].classname.toUpperCase() == _className) {
      FX_INFO = REGISTERED_FX[i];
      break;
    }
  }
  if (!FX_INFO) {
    return false;
  }

  const FXName = FX_INFO.classname;
  MAIN_ALERTS_LIST = [];
  MAIN_ALERTS_ALLLOWED = true;

  try {
    eval("MYFX = new " + FXName + "();");
  } catch (e) {
    alert("could not create FX: " + FXName + ". Error: " + e);
    return false;
  }

  console.log("launching FX: " + FXName + ", platform:" + FX_INFO.platform);

  const prevFx = localStorage.getItem(LOCALSTORAGE_FX_NAME);
  if (prevFx != FXName) {
    localStorage.clear();
    localStorage.setItem(LOCALSTORAGE_FX_NAME, FXName);
  }

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



  switch (FX_INFO.platform) {
    case "OCS" : AMIGA_start(); break;
    case "ST" : ST_start(); break;
    case "STE" : STE_start(); break;
    default: alert("REGISTERED_FX : 'platform' field must be 'OCS', 'ST', or 'STE'"); break;
  }
  
  new M68K_TimeMachine();
  new DebugPrimitives();
  
  DEBUGGER_AllocsList.push({ label: "Code Section", adrs: 0, size: ASSEMBLER_CONFIG.CPU_CODE_SECTION_BYTES });

  // now that machine is started, we can create the backbuff of the right resolution
  BACKBUF_CVS = document.getElementById('backBuffer');
  BACKBUF_CVS.width = SIMU_DEFAULT_WIDTH;
  BACKBUF_CVS.height = PAL_VIDEO_LINES_COUNT;
	BACKBUF_CTX = get2DContext(BACKBUF_CVS);
  SIMU_START_BITPLANE = ((SIMU_DEFAULT_WIDTH - 320) / 2);
  SIMU_END_BITPLANE = (SIMU_DEFAULT_WIDTH - SIMU_START_BITPLANE);
  PLAYFIELD_LINES_COUNT = PAL_PLAYFIELD_LINES_COUNT;
  CANVAS_DISPLAY_WIDTH = SIMU_DEFAULT_WIDTH;
  CANVAS_DISPLAY_HEIGHT = PAL_VIDEO_LINES_COUNT;

  if (FX_INFO.source) {
    let finalPath  = "";
    if (FX_INFO.rootPath) {
      finalPath = FX_INFO.rootPath;
      if (FX_INFO.rootPath[FX_INFO.rootPath.length-1] != '/')
        finalPath += "/";
    }
    finalPath += FX_INFO.source;

    let cp = new CodeParser();
    if (!cp.ascii68k_loadfile(finalPath))
      return;
  //  ascii68k_loadfile(finalPath); // OLD PARSER  
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
  return true;
}

function onFxChosen() {
  let sel = document.getElementById("fxListSelect");
  const name = sel.options[sel.selectedIndex].value;
  if (!main_startChosenFx(name)) {
    alert("ERROR: Can't start FX " + name);
  }
}

function findFxIndexFromName(_name) {
  if (_name) {
    for (let i = 0; i < REGISTERED_FX.length; i++) {
      if (REGISTERED_FX[i].classname == _name) {
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
  for (let i = 0; i < REGISTERED_FX.length; i++) {
    const name = REGISTERED_FX[i].classname.toUpperCase();
    if (name.includes(search)) {
      let objOption = document.createElement("option");
      objOption.text = REGISTERED_FX[i].classname;
      objOption.value = REGISTERED_FX[i].classname;
      if (!firstDone) {
        objOption.selected="selected";
        firstDone = true;
      }
      fxList.options.add(objOption);
    }
  }
}

function main_onload() {
  let fxList = "";

  // First try to start the FX in URL params
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  let FXName = urlParams.get('fx');
  if (!FXName)
    FXName = urlParams.get('FX');
  if (FXName) {
    if (FXName != "reset") {
      if (main_startChosenFx(FXName))
        return;
      fxList += "FX " + FXName + " from URL could not be started<br>";  
    }
  }

  // If failed, try to run previous session's FX stored in localStorage
  if (FXName != "reset")
  {
    FXName = localStorage.getItem(LOCALSTORAGE_FX_NAME);
    if (FXName) {
      if (main_startChosenFx(FXName))
        return;  
      fxList += "FX " + FXName + " from last session could not be started<br>";
    }
  }
  
  // could not instanciate FX: show a modal box to choose from a list
  fxList += '<center>Please select a FX from the below list:<br><br>';
  fxList += '<select name="fxListSelect" id="fxListSelect">';
  let prevName = localStorage.getItem(LOCALSTORAGE_FX_PREV);
  for (let i = 0; i < REGISTERED_FX.length; i++) {
    const name = REGISTERED_FX[i].classname;
    let fullName = name + " (" + REGISTERED_FX[i].platform + ")";
    if (name == prevName)
      fxList += '<option value="' + name + '" selected="selected">' + fullName + '</option>';
    else
      fxList += '<option value="' + name + '">' + fullName + '</option>';
  }
  fxList += '</select>';
  fxList += '<br><hr><br>Filter by name:<br><br><input type="text" id="searchfx" name="searchfx" oninput="updateFxList()"><br><br>';
  fxList += "<br><br>You can also use '?FX=classname' in the address bar</center>";
  showModalBox(fxList, onFxChosen);
}

function onNewOutputResolution() {
  let rez = document.getElementById("outpuResolution").value;
  CANVAS_SCALE = rez/100;
  CANVAS_DISPLAY_WIDTH = Math.floor((rez * SIMU_DEFAULT_WIDTH)/100);
  CANVAS_DISPLAY_HEIGHT = Math.floor((rez * PAL_VIDEO_LINES_COUNT)/100);
  cvs.width =  CANVAS_DISPLAY_WIDTH;
  cvs.height =  CANVAS_DISPLAY_HEIGHT;
}


function onNewRunningSpeed() {
  let rez = document.getElementById("runningSpeed").value;
  ANIM_FRAME_WAIT = (100-rez)/40;
  ANIM_FRAME_LAST_TIME =  Date.now();
}


function imgDataToScreen(imagedata) {
  BACKBUF_CTX.imageSmoothingEnabled = false;    
  BACKBUF_CTX.putImageData(imagedata,0,0);
  DEBUGPRIM.draw(BACKBUF_CTX);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(BACKBUF_CVS, 0, 0, BACKBUF_CVS.width, BACKBUF_CVS.height, 0, 0, CANVAS_DISPLAY_WIDTH, CANVAS_DISPLAY_HEIGHT);
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


function main_Alert(_msg, _makeLastMsg = false) {
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
    if (curLine) {
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

function SCRIPT_LOG(_msg) {
  console.log(_msg);
}