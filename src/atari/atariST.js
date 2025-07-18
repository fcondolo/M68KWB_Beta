/*
http://fileformats.archiveteam.org/wiki/Atari_ST_executable

- All screens are storeed on 32000 bytes. The ways these 32000 bytes are used depend on the mode / resolution
- In high resolution (640x400, 2 colors), the ST behaves like an ST with a single bitplane: Every bit is a pixel (MSB to LSB)
- In low resolution (320x200, 16 colors), pixels are described by groups of 16 (word). You need 4 words for 16 pixels:
==> word1 = palette index bit 3 for each of the 16 pixels
==> word2 = palette index bit 2 for each of the 16 pixels
==> word3 = palette index bit 1 for each of the 16 pixels
==> word4 = palette index bit 0 for each of the 16 pixels
*/

ST_LOGICAL_SCREEN = -1;
ST_PHYSICAL_SCREEN = -1;

const ST_SCREENSIZE = 32000;
const ATARI_MODEL_ST = 0;
const ATARI_MODEL_STE = 1;

// BEGIN CUSTOM REGISTERS
const ST_CUSTOM_START       =   0xff8201;
// SCREEN & PALETTE
const ST_SCREEN_HI          =   0xff8201;    // screen high byte
const ST_SCREEN_MID         =   0xff8203;    // screen mid byte
const ST_SCREEN_COUNTER_HI  =   0xFF8205;
const ST_SCREEN_COUNTER_MID =   0xFF8207;
const ST_SCREEN_COUNTER_LOW =   0xFF8209;
const STE_SCREEN_LOW        =   0xff820d;    // screen low byte (STE only)
const ST_COLOR0             =   0xFF8240;
const STE_PIXOFFSET         =   0xFF8265;
const STE_LINEOFFSET        =   0xFF820F;
// SOUND
const SND_DMACTRL           =   0xFF8900;
const SND_FRMBASEADRS_HI    =   0xFF8902;
const SND_FRMBASEADRS_MID   =   0xFF8904;
const SND_FRMBASEADRS_LOW   =   0xFF8906;
const SND_FRMADRSCNT_HI     =   0xFF8908;
const SND_FRMADRSCNT_MID    =   0xFF890A;
const SND_FRMADRSCNT_LOW    =   0xFF890C;
const SND_FRMENDADRS_HI     =   0xFF890E;
const SND_FRMENDADRS_MID    =   0xFF8910;
const SND_FRMENDADRS_LOW    =   0xFF8912;
const SND_MODECTRL          =   0xFF8920;
// BLITTER HALFTONE PATTERNS 
const BLT_HALFTONE_0        =   0xFF8A00; // Halftone Pattern 0  (16 Bits)
const BLT_HALFTONE_1        =   0xFF8A02; // Halftone Pattern 1  (16 Bits)
const BLT_HALFTONE_2        =   0xFF8A04; // Halftone Pattern 2  (16 Bits)
const BLT_HALFTONE_3        =   0xFF8A06; // Halftone Pattern 3  (16 Bits)
const BLT_HALFTONE_4        =   0xFF8A08; // Halftone Pattern 4  (16 Bits)
const BLT_HALFTONE_5        =   0xFF8A0A; // Halftone Pattern 5  (16 Bits)
const BLT_HALFTONE_6        =   0xFF8A0C; // Halftone Pattern 6  (16 Bits)
const BLT_HALFTONE_7        =   0xFF8A0E; // Halftone Pattern 7  (16 Bits)
const BLT_HALFTONE_8        =   0xFF8A10; // Halftone Pattern 8  (16 Bits)
const BLT_HALFTONE_9        =   0xFF8A12; // Halftone Pattern 9  (16 Bits)
const BLT_HALFTONE_10       =   0xFF8A14; // Halftone Pattern 10  (16 Bits)
const BLT_HALFTONE_11       =   0xFF8A16; // Halftone Pattern 11  (16 Bits)
const BLT_HALFTONE_12       =   0xFF8A18; // Halftone Pattern 12  (16 Bits)
const BLT_HALFTONE_13       =   0xFF8A1A; // Halftone Pattern 13  (16 Bits)
const BLT_HALFTONE_14       =   0xFF8A1C; // Halftone Pattern 14  (16 Bits)
const BLT_HALFTONE_15       =   0xFF8A1E; // Halftone Pattern 15  (16 Bits)
// BLITTER SOURCE
const BLT_SRC_XINCR         =   0xFF8A20; // Source X Increment (15 Bit - Bit 0 is unused) - signed
const BLT_SRC_YINCR         =   0xFF8A22; // Source Y Increment (15 Bit - Bit 0 is unused) - signed
const BLT_SRC_ADRS          =   0xFF8A24; // Source Address (23 Bit - Bit 31..24, Bit 0 unused)
// BLITTER END MASKS
const BLT_ENDMASK_1         =   0xFF8A28; // ENDMASK 1 (16 Bits)
const BLT_ENDMASK_2         =   0xFF8A2A; // ENDMASK 2 (16 Bits)
const BLT_ENDMASK_3         =   0xFF8A2C; // ENDMASK 3 (16 Bits)
// BLITTER DESTINATION
const BLT_TGT_XINCR         =   0xFF8A2E; // Destination X Increment (15 Bit - Bit 0 is unused)
const BLT_TGT_YINCR         =   0xFF8A30; // Destination Y Increment (15 Bit - Bit 0 is unused)
const BLT_TGT_ADRS          =   0xFF8A32; // Destination Address (23 Bit - Bit 31..24, Bit 0 unused)
// BLITTER COUNTS
const BLT_COUNT_X           =   0xFF8A36; // X Count (16 Bits)
const BLT_COUNT_Y           =   0xFF8A38; // Y Count (16 Bits)
// BLITTER OP REGISTERS
const BLT_HOP               =   0xFF8A3A; // HOP (8 Bits)
const BLT_OP                =   0xFF8A3B; // OP (8 Bits)
// BLITTER MISC REGISTERS
const BLT_MISC_1            =   0xFF8A3C; // (8 Bits)
const BLT_MISC_2            =   0xFF8A3D; // (8 Bits)

const   INTENA_A            =   0xFFFA07; // 8 bits - Interrupt enable A
const   INTENA_B            =   0xFFFA09; // 8 bits - Interrupt enable B
const   INTMSK_A            =   0xFFFA13; // 8 bits - Interrupt mask A
const   INTMSK_B            =   0xFFFA15; // 8 bits - Interrupt mask B
const   TIMERA_CONTROL      =   0xFFFA19; // 8 bits - Timer A control
const   TIMERB_CONTROL      =   0xFFFA1B; // 8 bits - Timer B control
const   TIMERB_COUNT        =   0xFFFA21; // 8 bits - Timer B data
// END CUSTOM REGISTERS
const ST_CUSTOM_END         =   TIMERB_COUNT+2;


const ST_DATASTART = 0;

var     ST_customregs = null;

let ST_started = false;
var ST_MODEL = ATARI_MODEL_ST; // 0 : ST, 1 : STE



function Atari_Common_Start(_ramSize, _stackSize) {
    if (ST_started) {
        return;
    }

    ST_customregs = new Uint8Array(ST_CUSTOM_END - ST_CUSTOM_START + 2);
    const totalRAMAllocated = ASSEMBLER_CONFIG.CPU_CODE_SECTION_BYTES + _ramSize + _stackSize;
    DEBUGGER_AllocsList.push({ label: "Total RAM size", adrs: 0, size: totalRAMAllocated });

    MACHINE = new M68K_Machine(
        totalRAMAllocated,
        _stackSize,
        ST_custom_update,
        ATARI_Constants
    );

    MACHINE.ramIndex = ASSEMBLER_CONFIG.CPU_CODE_SECTION_BYTES;

    ST_started = true;
    CPU_isCustomAdrs    = ST_isCustomAdrs;
    CPU_setCustom_B     = ST_setCustom_B;
    CPU_setCustom_W     = ST_setCustom_W;
    CPU_setCustom_L     = ST_setCustom_L;
    CPU_getCustom_B     = ST_getCustom_B;
    CPU_getCustom_W     = ST_getCustom_W;
    CPU_getCustom_L     = ST_getCustom_L;

    CPU_CUSTOM_START    = ST_CUSTOM_START;
    M68K_TICKS_PER_SECOND   = ST_CONFIG.M68K_TICKS_PER_SECOND;
    M68K_TICKS_PER_FRAME = Math.floor(M68K_TICKS_PER_SECOND/50);
   
    SIMU_DEFAULT_WIDTH          = 390;
    PAL_VIDEO_LINES_COUNT       = 312;
    PAL_PLAYFIELD_LINES_COUNT   = 200; 
    SIMU_START_BITPLANE         = ((SIMU_DEFAULT_WIDTH - 320) / 2);
    SIMU_END_BITPLANE           = (SIMU_DEFAULT_WIDTH - SIMU_START_BITPLANE);

    if (FX_INFO.hasAudio)
        ST_sound_onReset();

    MACHINE.OnVectorWritten = ST_OnVectorWritten;
    MACHINE.TimerBCounter  = 0;
}

function ST_OnVectorWritten(_v, _at, _size) {
    switch (_at) {
        case 0x68:
        case 0x120:
            M68K_HBL_CALLBACK = _v;
        break;
        case 0x70:
            M68K_VBL_CALLBACK = _v;
        break;
    }
}

function STE_start() {
    ST_MODEL = ATARI_MODEL_STE;
    Atari_Common_Start(STE_CONFIG.RAMSIZE, STE_CONFIG.STACKSIZE);
    ATARI_bltReset();
}

function ST_start() {
    ST_MODEL = ATARI_MODEL_ST;
    Atari_Common_Start(ST_CONFIG.RAMSIZE, STE_CONFIG.STACKSIZE);
}



function gemdos_rawconio() {
    let isKb = MACHINE.getRAMValue(regs.a[7]+2, 2, false); // fetch argument
    if (isKb == 0xff) {
        regs.d[0] = PREV_KEYDOWN;
    }
    return regs.d[0];
}

function gemdos_malloc() {
    let size = MACHINE.getRAMValue(regs.a[7]+2, 4, false); // fetch argument
    regs.d[0] = ST_allocRAM(size, 4, null);
    return regs.d[0];
}

function gemdos_mxalloc() {
    let size = MACHINE.getRAMValue(regs.a[7]+2, 4, false); // fetch argument
    regs.d[0] = ST_allocRAM(size, 4, null);
    return regs.d[0];
}

// bios call 1 : alloc mem
function xbios_ssbrk() {
    let size = MACHINE.getRAMValue(regs.a[7]+2, 2, false); // fetch argument
    regs.d[0] = ST_allocRAM(size, 4, null);
}

// A call to the operating System to find the physical screen address
function xbios_physbase() {
    regs.d[0] = ST_PHYSICAL_SCREEN; // OS screen is not emulated, so you'll get crap if not set before, but this remains so that your nativ ecode still runs
    return ST_PHYSICAL_SCREEN;
}

function xbios_logbase() {
    regs.d[0] = ST_LOGICAL_SCREEN;  // OS screen is not emulated, so you'll get crap if not set before, but this remains so that your nativ ecode still runs
    return ST_LOGICAL_SCREEN;
}

function xbios_getrez() {
    regs.d[0] = 0; // low rez, 16 colors
    return 0;
}

function xbios_setscreen() {
    const logBase = MACHINE.getRAMValue(regs.a[7]+2, 4, false);
    if (logBase != 0xffffffff)
        ST_LOGICAL_SCREEN = logBase;
    const phyBase = MACHINE.getRAMValue(regs.a[7]+6, 4, false);
    if (phyBase != 0xffffffff)
        ST_PHYSICAL_SCREEN = phyBase;
    ST_setCustomFromPtr_B(ST_SCREEN_HI,(ST_PHYSICAL_SCREEN>>>16)&255);
    ST_setCustomFromPtr_B(ST_SCREEN_MID,(ST_PHYSICAL_SCREEN>>>8)&255);
    if (ST_PHYSICAL_SCREEN == -1) return null;
    switch(ST_MODEL) {
        case ATARI_MODEL_ST:
            if ((ST_PHYSICAL_SCREEN&255) != 0) console.error("xbios_setscreen: on ST, screen address must be aligned on 256 bytes");
        break;
        case ATARI_MODEL_STE:
            if ((ST_PHYSICAL_SCREEN&1) != 0) console.error("xbios_setscreen: on STE, screen address must be WORD aligned");
            ST_setCustomFromPtr_B(STE_SCREEN_LOW,ST_PHYSICAL_SCREEN&255);
        break;
        default:
            console.error("xbios_setscreen: unsupported model");
        break;
    }
    return null;
}

function xbios_setpalette() {
    let palPtr = MACHINE.getRAMValue(regs.a[7]+2, 4, false);
    let curCol = ST_COLOR0;
    for (let i = 0; i < 16; i++) {
        let color = MACHINE.getRAMValue(palPtr + 2 * i, 2, false);
        MACHINE.setRAMValue(color, curCol, 2);
        curCol += 2;
    }
    return null;
}

function xbios_setcolor() {
    let num = MACHINE.getRAMValue(regs.a[7]+2, 2, false);
    let val = MACHINE.getRAMValue(regs.a[7]+4, 2, false);
    MACHINE.setRAMValue(val, ST_COLOR0 + 2 * num, 2);
    return null;
}

function ST_Trap(_arg) {
    // see: https://st-news.com/issues/st-news-volume-1-compendium/features/xbios-functions-i/
    if (_arg == 14) { // xbios call
        let r = MACHINE.getRAMValue(regs.a[7], 2, false); // fetch argument
        switch (r) {
            case 0 : return null; // "initmous" ==> mouse is not emulated
            case 1 : return xbios_ssbrk();
            case 2 : return xbios_physbase();
            case 3 : return xbios_logbase();
            case 4 : return xbios_getrez();
            case 5 : return xbios_setscreen();
            case 6 : return xbios_setpalette();
            case 7 : return xbios_setcolor();
            case 8 :
            case 9 :
            case 10 :
            case 11 :
                regs.d[0] = -1; // all floppy calls will return "floppy general error"
            return null;
            case 37: {
                let com = "xbios call #37 (wait vbl). Sorry, this one is not yet supported. As a work around, you can install a vbl routine using vector $70.w";
                debug(com);
                console.error(com);
            }
            return null;
            default: console.error("xbios call: function #" + r + " is not supported, sorry!"); break; 
        }    
    } else if (_arg == 1) { // gemdos call
        let r = MACHINE.getRAMValue(regs.a[7], 2, false); // fetch argument
        switch (r) {
            case 6 : return gemdos_rawconio();
            case 32 : return null;  // set supervisor
            case 68 : return gemdos_mxalloc();
            case 72 : return gemdos_malloc();
            default: console.error("gemdos call: function #" + r + " is not supported, sorry!"); break; 
        }    
    }
    else {
        console.error("TRAP: argument #" + _arg + " is not supported, sorry! Only xbios and gemdos calls (TRAP #1 and #14) are supported.");
    }
    return null; 
}





/**
ST_getXScreenOfs(_x)
@param      _x      :   x coord
@return     the byte offset of _x in the current line 
*/
function ST_getXScreenOfs(_x) {
	_x = Math.floor(_x);
	const blockindex = Math.floor(_x / 16); // 16 bit block index
	return 8 * blockindex;	// byte offset
}


/**
ST_getXScreenMask(_x)
@param      _x      :   x coord
@return     the 16 bit mask to address this _x
*/
function ST_getXScreenMask(_x) {
	const bitIndex = 15-(Math.floor(_x) & 15);
	return 1 << bitIndex;	// mask.
}

/**
ST_getYScreenOfs(_y)
@param      _y      :   y coord
@return     the byte offset of _x in the current screen
*/
function ST_getYScreenOfs(_y) {
	return Math.floor(_y) * 160;
}

/**
ST_getXYFromOfs(_msk, _ofs)
@param      _msk :   word mask used to display the pix within the 16 bits block
@param      _ofs :   ofs of the 16 bits block in screen
@return     {x:x, y:y}
*/
function ST_getXYFromOfs(_msk, _ofs) {
	let y = Math.floor(_ofs/160);
    let blockOfs = _ofs % 160;
    if (blockOfs % 8 != 0) main_Alert("ST_getXYFromOfs: wrong ofs");
    let x = (blockOfs / 8) * 16;
    for (let j = 0; j < 16; j++) {
        if (_msk == 1<<j) {
            x += 15-j;
            break;
        }
    }
    return {x:x, y:y};
}


/**
ST_drawPix(_x, _y, _colorIndex, _destScreen)
@param      _x          :   x coord
@param      _y          :   y coord
@param      _colorIndex :   index in palette (0..15)
@param      _destScreen :   the destination screen (defaulting to ST_PHYSICAL_SCREEN if param is null)
*/
function ST_drawPix(_x, _y, _colorIndex, _destScreen) {
    if (!_destScreen) {
        if (ST_PHYSICAL_SCREEN <= 0) return;
        _destScreen = ST_PHYSICAL_SCREEN;
    }
    if (_x < 0) return;
    if (_x > 319) return;
    if (_y < 0) return;
    if (_y > 199) return;
    let adrs = _destScreen;
    adrs += ST_getYScreenOfs(_y);
    adrs += ST_getXScreenOfs(_x);
    let msk = ST_getXScreenMask(_x);
    let invmsk = ~msk;
    for (let i = 0; i < 4; i++) 
    {
        const ad = adrs + 2*i;
        let data = MACHINE.getRAMValue(ad, 2, false);
        data &= invmsk;
        if ( ((_colorIndex >>> i) & 1) == 1) {
            data |= msk;
        }
        MACHINE.setRAMValue(data, ad, 2);
    }
}

function ST_clearScreen(_colorIndex = 0, _destScreen = null) {
    if (!_destScreen) {
        if (ST_PHYSICAL_SCREEN <= 0) return;
        _destScreen = ST_PHYSICAL_SCREEN;
    }
    let adrs = _destScreen;
    for (let i = 0; i < 160*200; i++) 
    {
        MACHINE.setRAMValue(_colorIndex, adrs, 1);
        adrs++;
    }
}

/**
ST_readPix(_x, _y, _formScreen)
@param      _x          :   x coord
@param      _y          :   y coord
@param      _formScreen :   the source screen (defaulting to ST_PHYSICAL_SCREEN if param is null)
@return     index in palette (0..15)
*/
function ST_readPix(_x, _y, _formScreen) {
    if (!_formScreen) {
        if (ST_PHYSICAL_SCREEN <= 0) return;
        _formScreen = ST_PHYSICAL_SCREEN;
    }
    if (_x < 0) return 0;
    if (_x > 319) return 0;
    if (_y < 0) return 0;
    if (_y > 199) return 0;
    let adrs = _formScreen;
    adrs += ST_getYScreenOfs(_y);
    adrs += ST_getXScreenOfs(_x);
    let msk = ST_getXScreenMask(_x);
    let ret = 0;
    for (let i = 0; i < 4; i++) {
        let data = MACHINE.getRAMValue(adrs + 2*i, 2, false);
        if ((data & msk) != 0)
            ret |= 1<<i;
    }
    return ret;
}


// CUSTOM REGISTERS
function ST_isCustomAdrs(_p) {
	if ((_p >= ST_CUSTOM_START) && (_p <= ST_CUSTOM_END))
		return true;
    // blitter
    if ((_p >= 0xff8a28) && (_p <= 0xff8a28+24))
		return true;
	return false;
}



function ST_CheckBlitterStart(_index, _value) {
    if (_index == BLT_MISC_1-ST_CUSTOM_START) {
        if ((_value & 128) == 128) {
            ATARI_bltStart();//Blitter_Start();
            MACHINE.errorContext.blitter = null; // finished
        }
    }
}


function ST_setCustom_B(_index, _value) {
	ST_customregs[_index] = _value;
    ST_CheckBlitterStart(_index, _value);
}

function ST_setCustom_W(_index, _value, _trigger = true) {
    if (_trigger) {
        switch (_index) {
            case SND_DMACTRL-ST_CUSTOM_START:
                if (FX_INFO.hasAudio)
                    ST_sound_onDMAControl(_value);
            break;
            default:
            break;
        }     
    }
    const hi = (_value>>>8)&255;
    const lo = _value&255;
	ST_customregs[_index] = hi;
	ST_customregs[_index + 1] = lo;
    // we want the word to be fully written in memory before the ST reacts and triggers anything
    ST_CheckBlitterStart(_index, hi);
    ST_CheckBlitterStart(_index + 1, lo);
}

function ST_setCustom_L(_index, _value) {
	const v1 = (_value>>>24)&255;
	const v2 = (_value>>>16)&255;
	const v3 = (_value>>>8)&255;
	const v4 = _value&255;
	ST_customregs[_index] = v1;
	ST_customregs[_index + 1] = v2;
	ST_customregs[_index + 2] = v3;
	ST_customregs[_index + 3] = v4;
    // we want the long to be fully written in memory before the ST reacts and triggers anything
    ST_CheckBlitterStart(_index, v1);
    ST_CheckBlitterStart(_index + 1, v2);
    ST_CheckBlitterStart(_index + 2, v3);
    ST_CheckBlitterStart(_index + 3, v4);
}

function ST_custom_update() {
	ST_bitplanes_update();
    if (FX_INFO.hasAudio)
    	ST_sound_update();
}


/**
ST_getCustom_W(_index)
Returns the current 8 bit value of a custom register
@param      _index  :   custom register index (relative to ST_CUSTOM_START)
@return     the register's 8 bit value
*/
function ST_getCustom_B(_index) {
	return ST_customregs[_index];
}

/**
ST_getCustom_W(_index)
Returns the current 16 bit value of a custom register
@param      _index  :   custom register index (relative to ST_CUSTOM_START)
@return     the register's 16 bit value
*/
function ST_getCustom_W(_index) {
    let r = new Uint32Array(1);
    r[0] = ST_customregs[_index]<<8; 
    r[0] |= ST_customregs[_index + 1];
	return r[0];
}

/**
ST_getCustom_L(_index)
Returns the current 32 bit value of a custom register and the following register.
@param      _index  :   custom register index (relative to ST_CUSTOM_START)
@return     the register's 32 bit value
*/
function ST_getCustom_L(_index) {
    let r = new Uint32Array(1);
    r[0] = ST_customregs[_index]<<24;
    r[0] |= ST_customregs[_index + 1]<<16;
    r[0] |= ST_customregs[_index + 2]<<8;
    r[0] |= ST_customregs[_index + 3];
	return r[0];
}


function ST_getCustomFromPtr_B(_p) {
	return ST_getCustom_B(_p - ST_CUSTOM_START);
}

/**
ST_getCustomFromPtr(_p)
Same as ST_getCustom(), except that the parameter is not relative to ST_CUSTOM_START, but an absolute address
*/
function ST_getCustomFromPtr_W(_p) {
	return ST_getCustom_W(_p - ST_CUSTOM_START);
}

/**
ST_getCustomFromPtr_L(_p)
Same as ST_getCustom_L(), except that the parameter is not relative to ST_CUSTOM_START, but an absolute address
*/
function ST_getCustomFromPtr_L(_p) {
    let r = new Uint32Array(1);
	r[0] = ST_getCustomFromPtr_W(_p);
	r[0] <<= 16;
    r[0] |= ST_getCustomFromPtr_W(_p+2);
	return r[0];
}

/**
ST_setCustomFromPtr_B(_p, _val)
*/
function ST_setCustomFromPtr_B(_p, _val) {
	if (!ST_isCustomAdrs(_p)) {
        console.error("trying to access non-custom address as custom");
		return false;
    }
	_p -= ST_CUSTOM_START;
	ST_setCustom_B(_p,_val);
	return true;
}

/**
ST_setCustomFromPtr(_p, _val)
Same as ST_setCustom(), except that the parameter is not relative to ST_CUSTOM_START, but an absolute address
*/
function ST_setCustomFromPtr(_p, _val) {
	if (!ST_isCustomAdrs(_p)) {
        console.error("trying to access non-custom address as custom");
		return false;
    }
	_p -= ST_CUSTOM_START;
	ST_setCustom_W(_p,_val);
	return true;
}


/**
ST_setCustomFromPtr_L(_p, _val)
Same as ST_setCustom_L(), except that the parameter is not relative to ST_CUSTOM_START, but an absolute address
*/
function ST_setCustomFromPtr_L(_p, _val) {
	if(!ST_setCustomFromPtr(_p,(_val>>>16)&0xffff)) return false;
	if(!ST_setCustomFromPtr(_p+2,_val&0xffff)) return false;
	return true;
}

