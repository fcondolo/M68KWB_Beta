/*  ======================================
    BITPLANE CONSTANTS
    ====================================== */

var AMIGA_STARTSTACK;

var AMIGA_customregs = null;


let AMIGA_data_index = 0;
let AMIGA_started = false;

var AMIGA_Chunky8 = null;


/**
AMIGA_drawChunky8   sets graphics rendering on 16 bits Chunky instead of Bitplanes
@param      _chunkyBuffer   :   Source buffer. UInt8Array containing the pixels values
@param      _srcW           :   width in pix of the source buffer (so _srcW * 2 bytes per line)
@param      _srcH           :   height in pix of the source buffer
@param      _dstW           :   width in pix of the destination buffer (screen)
@param      _dstH           :   height in pix of the destination buffer (screen)
*/
function AMIGA_drawChunky8(_chunkyBuffer, _srcW, _srcH, _dstW, _dstH) {
    AMIGA_Chunky8 = {
        buf : _chunkyBuffer,
        sw : _srcW,
        sh  : _srcH,
        dw : _dstW,
        dh  : _dstH
    };
}



function AMIGA_updateScreenHelper(_params) {
    let ptr = _params.bitplanes;
    if (_params.double) {
        _params.swapCounter ^= 1;
        if (_params.swapCounter == 1) {
            ptr +=  _params.alloc / 2;
        }
    }
    let bitplanesCount = _params.bplCount;
    let bplSize = _params.bplSize;
    let reg = BPL1PTH;
    let w = _params.cpListBplAdrs;

    for (let i = 0; i < bitplanesCount; i++) {
        AMIGA_setCustom_L(reg, ptr);
        reg += 4;
        w += 2; // skip copper reg
        w = MACHINE.setRAMValue(ptr>>>16, w, 2);
        w += 2; // skip copper reg
        w = MACHINE.setRAMValue(ptr&0xffff, w, 2);
        ptr += bplSize;
    }

}


/**
AMIGA_GetScreenHelper(_params)
input _params = {
    bplCount    : bitplanes count  (default:1),
    width       : width in pixels  (default:320),
    height      : height in pixels (default:180),
    double      : double buffering (true/false, default: false)
    protected   : add allocated bitplanes to the protected "allowed RAM" system (default: false)
    cplistSize  : bytes allocated for copperlist. Default is 1024 
}
The following fields will be automatically added to the _params struct: {
    bplSize     : size of one bitplane in bytes
    bitplanes   : address of the first bitplane (all bitpanes are contiguous in RAM)
    alloc       : total amount of RAM allocated
    lineBytes   : size in bytes of a horizontal line
}
@note       Only tested for low resolution 320x180 bitplanes, HAM/dual playfield/EHB not supported yet.
*/
function AMIGA_GetScreenHelper(_params) {
    if (!_params.bplCount) _params.bplCount = 1;
    if (!_params.width) _params.width = 320;
    if (!_params.height) _params.height = 180;
    if (!_params.double) _params.double = false;
    if (!_params.protected) _params.protected = false;
    if (!_params.cplistSize) _params.cplistSize = 1024;
    if ((_params.width % 8) != 0) main_Alert("ERROR: AMIGA_GetScreenHelper called with a screen width that is not a multiple of 8");
    _params.lineBytes = Math.floor(_params.width / 8);

    AMIGA_start();
    _params.bplSize = _params.lineBytes * _params.height;
    _params.alloc = _params.bplSize * _params.bplCount;
    if (_params.double) {
        _params.swapCounter = 0;
        _params.alloc *= 2;
    }
    _params.bitplanes = MACHINE.allocRAM(_params.alloc, 2, 'AMIGA_GetScreenHelper: bitplanes');
    AMIGA_updateScreenHelper(_params);

    // default values for 320x180
    let diwStart = 0x4c81;
    let diwStop = 0x00c1;
    let ddfStart = 0x0038;
    let ddfStop = 0x00d0;
    // update values in case of 320x256
    if (_params.height == 256) {
        diwStart = 0x2c81;
        diwStop = 0x2cc1;
    }
    AMIGA_setCustom(DMACON, 0x83c0); // blitter + copper + bitplane DMA

    // create copperlist
    _params.copperList = MACHINE.allocRAM(_params.cplistSize, 2, 'AMIGA_GetScreenHelper: copperlist');
    let w = _params.copperList;
    // window
    w = MACHINE.setRAMValue(DIWSTRT, w, 2);
    w = MACHINE.setRAMValue(diwStart, w, 2);
    w = MACHINE.setRAMValue(DIWSTOP, w, 2);
    w = MACHINE.setRAMValue(diwStop, w, 2);
    w = MACHINE.setRAMValue(DDFSTRT, w, 2);
    w = MACHINE.setRAMValue(ddfStart, w, 2);
    w = MACHINE.setRAMValue(DDFSTOP, w, 2);
    w = MACHINE.setRAMValue(ddfStop, w, 2);
    // bitplane pointers
    _params.cpListBplAdrs = w;
    let reg = BPL1PTH;
    let adrs = _params.bitplanes;
    for (let i = 0; i < _params.bplCount; i++) {
        w = MACHINE.setRAMValue(reg, w, 2);
        w = MACHINE.setRAMValue(adrs>>>16, w, 2);
        reg += 2;
        w = MACHINE.setRAMValue(reg, w, 2);
        w = MACHINE.setRAMValue(adrs&0xffff, w, 2);    
        reg += 2;
        adrs += _params.bplSize;
    }
    // sprites pointers
    _params.cpListSprtAdrs = w;
    for (let i = 0; i < 16; i++) {
        w = MACHINE.setRAMValue(SPR0PTH + i * 2, w, 2);
        w = MACHINE.setRAMValue(0, w, 2);    
    }
    // bitplane scroll & modulos
    for (let i = 0; i < 4; i++) {
        w = MACHINE.setRAMValue(BPLCON1 + i * 2, w, 2);
        w = MACHINE.setRAMValue(0, w, 2);    
    }
    // bitplane count
    w = MACHINE.setRAMValue(BPLCON0, w, 2);    
    w = MACHINE.setRAMValue(0x1000 * _params.bplCount + 0x0200, w, 2);
    // end coperlist
    _params.endOfCopperlist = w;
    w = MACHINE.setRAMValue(0xfffffffe, w, 4);
    // set copperlist
    AMIGA_setCustom_L(COP1LCH,_params.copperList);
    console.log("starting Amiga helper, bitplanes at $" + _params.bitplanes.toString(16) + ", copperlist at $" + _params.copperList.toString(16));
    return _params;
}


function AMIGA_start() {
    if (AMIGA_started) {
        return;
    }

    AMIGA_customregs = new Uint16Array((AMIGA_CUSTOM_END - AMIGA_CUSTOM_START) / 2);
    const totalRAMAllocated = ASSEMBLER_CONFIG.CPU_CODE_SECTION_BYTES + OCS_CONFIG.RAMSIZE  + OCS_CONFIG.STACKSIZE;
    DEBUGGER_AllocsList.push({ label: "Total RAM size", adrs: 0, size: totalRAMAllocated });

    AMIGA_customregs[DMACONR] = 0;  // set blitter ready

    MACHINE = new M68K_Machine(
        totalRAMAllocated,
        OCS_CONFIG.STACKSIZE,
        AMIGA_custom_update,
        AMIGA_Constants
    );

    MACHINE.ramIndex = ASSEMBLER_CONFIG.CPU_CODE_SECTION_BYTES;

    AMIGA_started = true;
    CPU_isCustomAdrs    = custom_isCustomAdrs;
    CPU_setCustom_B     = AMIGA_setCustom;
    CPU_setCustom_W     = AMIGA_setCustom;
    CPU_setCustom_L     = AMIGA_setCustom_L;
    CPU_CUSTOM_START    = AMIGA_CUSTOM_START;
    M68K_TICKS_PER_SECOND   = OCS_CONFIG.M68K_TICKS_PER_SECOND;
    M68K_TICKS_PER_FRAME = Math.floor(M68K_TICKS_PER_SECOND/50);
   
    SIMU_DEFAULT_WIDTH          = 390;
    PAL_VIDEO_LINES_COUNT       = 312;
    PAL_PLAYFIELD_LINES_COUNT   = 256
    SIMU_START_BITPLANE         = ((SIMU_DEFAULT_WIDTH - 320) / 2);
    SIMU_END_BITPLANE           = (SIMU_DEFAULT_WIDTH - SIMU_START_BITPLANE);


    // no copperlist
    AMIGA_setCustomFromPtr_L(0xdff080, null);

    MACHINE.OnVectorWritten = AMIGA_OnVectorWritten;
}

function AMIGA_OnVectorWritten(_v, _at, _size) {
    switch (_at) {
        case 0x6c:
            M68K_VBL_CALLBACK = _v;
        break;
    }
}



function getLabelFromName(_l) {
    const l = CODERPARSER_SINGLETON.labels.length;
    for (let i = 0; i < l; i++) {
        if (CODERPARSER_SINGLETON.labels[i].label == _l)
            return CODERPARSER_SINGLETON.labels[i];
    }
    return null;
}



/**
AMIGA_pix2Bitplane(_x,_y,_bpl,_clr = false)
writes a pixel in a bitplane. note: assumes line width is 40 bytes
@param _x: x coordinate (in pixels)
@param _y: y coordinate (in pixels)
@param _bpl: address of the bitplane to write
@param _clip: clippingrectangle
@param _clr: clear pixel instead of writing it
*/
function AMIGA_pix2Bitplane(_x,_y,_bpl, _clip = null, _clr = false) {
    if (!_clip) {
        _clip = {minx:0,miny:0,maxx:320,maxy:256};
    }
    _x = Math.floor(_x);
    _y = Math.floor(_y);
    if (_x < _clip.minx) return;
    if (_y < _clip.miny) return;
    if (_x >= _clip.maxx) return;
    if (_y >= _clip.maxy) return;
    const ofs = bplHorizByteCount * _y + Math.floor(_x / 8);
    const adrs = _bpl + ofs;
    let d = MACHINE.getRAMValue(adrs, 1, false);
    const msk = 1<<(7-(_x&7));
    if (_clr) 
        d &= ~msk;
    else
        d |= msk;
    MACHINE.setRAMValue(d, adrs, 1);    
}


  function AMIGA_line(_x0,_y0,_x1,_y1,_bpl, _clr = false) {
    const dx = Math.abs(_x1 - _x0);
    const dy = Math.abs(_y1 - _y0);
    const sx = Math.sign(_x1 - _x0);
    const sy = Math.sign(_y1 - _y0);
    let err = dx - dy;
    if (Math.abs(dx) > OCS_CONFIG.AMIGA_line_maxLen) return main_Alert("AMIGA_line: dx > OCS_CONFIG.AMIGA_line_maxLen: " + dx);
    if (Math.abs(dy) > OCS_CONFIG.AMIGA_line_maxLen) return main_Alert("AMIGA_line: dy > OCS_CONFIG.AMIGA_line_maxLen: " + dy);
    while (true) {
        AMIGA_pix2Bitplane(_x0,_y0,_bpl, null, _clr);
      if (_x0 === _x1 && _y0 === _y1) break;
  
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; _x0 += sx; }
      if (e2 <  dx) { err += dx; _y0 += sy; }
    }
  }  

