const CUSTOM				= 0xdff000;
const AMIGA_CUSTOM_START	= CUSTOM;
const AMIGA_CUSTOM_END 		= CUSTOM + 0x200;


const BLTDDAT =  0x000;
const DMACONR =  0x002;
const INTREQR =	 0x01E;
const BLTCON0 =  0x040;
const BLTCON1 =  0x042;
const BLTAFWM =  0x044;
const BLTALWM =  0x046;
const BLTCPTR =  0x048;
const BLTCPTH =  0x048;
const BLTCPTL =  0x04A;
const BLTBPTR =  0x04c;
const BLTBPTH =  0x04C;
const BLTBPTL =  0x04E;
const BLTAPTH =  0x050;
const BLTAPTR =  0x050;
const BLTAPTL =  0x052;
const BLTDPTR =  0x054;
const BLTDPTH =  0x054;
const BLTDPTL =  0x056;
const BLTSIZE =  0x058;
const BLTCMOD =  0x060;
const BLTBMOD =  0x062;
const BLTAMOD =  0x064;
const BLTDMOD =  0x066;
const BLTCDAT =  0x070;
const BLTBDAT =  0x072;
const BLTADAT =  0x074;
const COP1LCH =	 0x080;
const COP1LCL =	 0x082;
const COPJMP1 =	 0x088;
const COPJMP2 =	 0x08A;
const DIWSTRT =  0x08E;
const DIWSTOP =  0x090;
const DDFSTRT =  0x092;
const DDFSTOP =  0x094;
const DMACON =   0x096;
const INTREQ =	 0x09C;
const BPL1PTH =  0x0E0;
const BPL1PTL =  0x0E2;
const BPL2PTH =  0x0E4;
const BPL2PTL =  0x0E6;
const BPL3PTH =  0x0E8;
const BPL3PTL =  0x0EA;
const BPL4PTH =  0x0EC;
const BPL4PTL =  0x0EE;
const BPL5PTH =  0x0F0;
const BPL5PTL =  0x0F2;
const BPL6PTH =  0x0F4;
const BPL6PTL =  0x0F6;
const BPLCON0 =  0x100;
const BPLCON1 =  0x102;
const BPLCON2 =  0x104;
const BPLCON3 =  0x106;
const BPL1MOD =	 0x108;
const BPL2MOD =	 0x10a;
const BPL1DAT =  0x110;
const BPL2DAT =  0x112;
const BPL3DAT =  0x114;
const BPL4DAT =  0x116;
const BPL5DAT =  0x118;
const BPL6DAT =  0x11a;

const SPR0PTH =	 0x120;
const SPR0PTL =	 0x122;
const SPR1PTH =	 0x124;
const SPR1PTL =	 0x126;
const SPR2PTH =	 0x128;
const SPR2PTL =	 0x12a;
const SPR3PTH =	 0x12c;
const SPR3PTL =	 0x12e;
const SPR4PTH =	 0x130;
const SPR4PTL =	 0x132;
const SPR5PTH =	 0x134;
const SPR5PTL =	 0x136;
const SPR6PTH =	 0x138;
const SPR6PTL =	 0x13a;
const SPR7PTH =	 0x13c;
const SPR7PTL =	 0x13e;

const SPR0CTL =  0x142;// Sprite 0 vert stop position and control data
const SPR0DATA =  0x144;// Sprite 0 image data register A
const SPR0DATB =  0x146;// Sprite 0 image data register B
const SPR1POS =  0x148;// Sprite 1 vert - horiz start position data
const SPR1CTL =  0x14A;// Sprite 1 vert stop position and control data
const SPR1DATA =  0x14C;// Sprite 1 image data register A
const SPR1DATB =  0x14E;// Sprite 1 image data register B
const SPR2POS =  0x150;// Sprite 2 vert - horiz start position data
const SPR2CTL =  0x152;// Sprite 2 vert stop position and control data
const SPR2DATA =  0x154;// Sprite 2 image data register A
const SPR2DATB =  0x156;// Sprite 2 image data register B
const SPR3POS =  0x158;// Sprite 3 vert - horiz start position data
const SPR3CTL =  0x15A;// Sprite 3 vert stop position and control data
const SPR3DATA =  0x15C;// Sprite 3 image data register A
const SPR3DATB =  0x15E;// Sprite 3 image data register B
const SPR4POS =  0x160;// Sprite 4 vert - horiz start position data
const SPR4CTL =  0x162;// Sprite 4 vert stop position and control data
const SPR4DATA =  0x164;// Sprite 4 image data register A
const SPR4DATB =  0x166;// Sprite 4 image data register B
const SPR5POS =  0x168;// Sprite 5 vert - horiz start position data
const SPR5CTL =  0x16A;// Sprite 5 vert stop position and control data
const SPR5DATA =  0x16C;// Sprite 5 image data register A
const SPR5DATB =  0x16E;// Sprite 5 image data register B
const SPR6POS =  0x170;// Sprite 6 vert - horiz start position data
const SPR6CTL =  0x172;// Sprite 6 vert stop position and control data
const SPR6DATA =  0x174;// Sprite 6 image data register A
const SPR6DATB =  0x176;// Sprite 6 image data register B
const SPR7POS =  0x178;// Sprite 7 vert - horiz start position data
const SPR7CTL =  0x17A;// Sprite 7 vert stop position and control data
const SPR7DATA =  0x17C;// Sprite 7 image data register A
const SPR7DATB =  0x17E;// Sprite 7 image data register B

const COLOR0 =  0x180;
const COLOR1 =  0x182;
const COLOR2 =  0x184;
const COLOR3 =  0x186;
const COLOR4 =  0x188;
const COLOR5 =  0x18a;
const COLOR6 =  0x18c;
const COLOR7 =  0x18e;
const COLOR8 =  0x190;
const COLOR9 =  0x192;
const COLOR10 =  0x194;
const COLOR11 =  0x196;
const COLOR12 =  0x198;
const COLOR13 =  0x19a;
const COLOR14 =  0x19c;
const COLOR15 =  0x19e;
const COLOR16 =  0x1a0;
const COLOR17 =  0x1a2;
const COLOR18 =  0x1a4;
const COLOR19 =  0x1a6;
const COLOR20 =  0x1a8;
const COLOR21 =  0x1aa;
const COLOR22 =  0x1ac;
const COLOR23 =  0x1ae;
const COLOR24 =  0x1b0;
const COLOR25 =  0x1b2;
const COLOR26 =  0x1b4;
const COLOR27 =  0x1b6;
const COLOR28 =  0x1b8;
const COLOR29 =  0x1ba;
const COLOR30 =  0x1bc;
const COLOR31 =  0x1be;
const FMODE =	 0x1fc;


var AMIGA_NEED_WAIT_BLT  = false;
var AMIGA_LASTBLIT_LINE = null;

/**
AMIGA_getCustom(_index)
Returns the current 16 bit value of a custom register
@param      _index  :   custom register index (relative to $dff000)
@return     the register's 16 bit value
*/
function AMIGA_getCustom(_index) {
	if (_index%2 != 0) 
		debug("reading CUSTOM register at an ODD address");
	if (_index == DMACONR)
		AMIGA_NEED_WAIT_BLT = false; // very approximate way to test if blitter status has been checked
	return AMIGA_customregs[_index/2];
}

function AMIGA_getCustom_B(_index) {
	let v = AMIGA_customregs[_index>>>1];
	if (_index%2 == 0) {
		if (_index == DMACONR)
			AMIGA_NEED_WAIT_BLT = false; // very approximate way to test if blitter status has been checked
		return (v>>>8)&0xff; // want the MSB
	}
	return v&0xff;		// want the LSB
}

/**
AMIGA_getCustom_L(_index)
Returns the current 32 bit value of a custom register and the following register.
Useful to read a bitplane's current address for example, e.g; AMIGA_getCustom_L(BPL1PTH);
@param      _index  :   custom register index (relative to $dff000)
@return     the register's 32 bit value
*/
function AMIGA_getCustom_L(_index) {
    let r = new Uint32Array(1);
    r[0] = AMIGA_getCustom(_index);
	r[0] <<= 16;
    r[0] |= AMIGA_getCustom(_index + 2);
	return r[0];
}


/**
AMIGA_getCustomFromPtr(_p)
Same as AMIGA_getCustom(), except that the parameter is not relative to $dff000, but an absolute address
*/
function AMIGA_getCustomFromPtr(_p) {
	return AMIGA_getCustom(_p - AMIGA_CUSTOM_START);
}

/**
AMIGA_getCustomFromPtr_L(_p)
Same as AMIGA_getCustom_L(), except that the parameter is not relative to $dff000, but an absolute address
*/
function AMIGA_getCustomFromPtr_L(_p) {
	let r = AMIGA_getCustomFromPtr(_p);
	r = (r<<16)+AMIGA_getCustomFromPtr(_p+2);
	return r;
}


/**
AMIGA_onCustomWrite(_index_, _value, _fromCopper)
Checks if a write to a custom register should trigger a reaction from the Amiga
@param      _index  	:   custom register index (relative to $dff000)
@param      _value  	:   written value
@param      _fromCopper	:   true if this function is called by the copper's MOVE instructions
*/
function AMIGA_onCustomWrite(_index, _value, _fromCopper = false) {
	switch (_index) {
		case BLTSIZE:
			let showErr = true;
			if (M68K_CURLINE && M68K_CURLINE.isErrorImmune) 
				showErr = false;
			if (_fromCopper)
				showErr = false;
			if (AMIGA_NEED_WAIT_BLT && OCS_CONFIG.force_blitter_wait) {
				if (showErr && AMIGA_LASTBLIT_LINE) {
					debug("Seems like you did not check DMACONR since you last invoked the Blitter.\nBlitter previously invoked in file: " + AMIGA_LASTBLIT_LINE.path + "\nat line: " + AMIGA_LASTBLIT_LINE.line + "\nAdd comment '; M68KWB_NOERROR' at the end of the current line to disable this error, or set OCS_CONFIG.force_blitter_wait to false.");
				}
			}
			if (M68K_CURLINE) {
				AMIGA_NEED_WAIT_BLT = true;
				AMIGA_LASTBLIT_LINE = M68K_CURLINE;
			}
			TIME_MACHINE.paused = true;
			const saveDMACON = AMIGA_customregs[DMACONR/2];
			if ((showErr) && ((saveDMACON & (1<<6)) == 0)) debug("trying to start blitter but DMACON bit 6 shows blitter is disabled.\nDMACON: $" + saveDMACON.toString(16));
			AMIGA_customregs[DMACONR/2] |= 1<<14; // set blitter busy bit
			AMIGA_BLITTER.blitter_fillStruct();
			AMIGA_customregs[DMACONR/2] = saveDMACON; // clear blitter busy bit
			TIME_MACHINE.paused = false;
            MACHINE.errorContext.blitter = null; // finished
		break;
		case DMACON: {
			if (_value & 0x8000) 
				AMIGA_customregs[DMACONR/2] |= _value; // switch on
			else 
				AMIGA_customregs[DMACONR/2] &= ~_value; // switch off
			AMIGA_customregs[DMACON/2] = AMIGA_customregs[DMACONR/2];
		}
		break;
		case INTREQ: { // test vblank interrupt strobe register specific case
			if (_value & 0x8000) {	// SET/CLR bit
				if (_value & 0x0010) { // vertival blank bit
					M68K_FORCENEXTVBL = true;
				}
			}
		}
		break;
		case COPJMP1: 
			cper_activeList = 0xdff080;
			cplist = AMIGA_getCustomFromPtr_L(cper_activeList);
			cper_cur = cplist;
		break;
		case COPJMP2: 
			cper_activeList = 0xdff084;
			cplist = AMIGA_getCustomFromPtr_L(cper_activeList);
			cper_cur = cplist;
		break;
	}
}

/**
AMIGA_setCustom(_index_, _value, _fromCopper)
Sets the current 16 bit value of a custom register
@param      _index  	:   custom register index (relative to $dff000)
@param      _value  	:   value to set
@param      _fromCopper	:   true if this function is called by the copper's MOVE instructions
*/
function AMIGA_setCustom(_index, _value, _fromCopper = false) {
	AMIGA_customregs[_index/2] = _value;
	AMIGA_onCustomWrite(_index, _value, _fromCopper);
}

/**
AMIGA_setCustom_L(_index_, _value)
Sets the current 32 bit value of a custom register and the next one, e.g:
    let ptr = MACHINE.allocRAM(bplSize*_bitplanesCount);
    AMIGA_setCustom_L(BPL1PTH, ptr);
@param      _index  :   custom register index (relative to $dff000)
@param      _value  :   value to set
*/
function AMIGA_setCustom_L(_index, _value) {
	const hi  = (_value >>> 16) & 0xffff;
	const lo  = _value & 0xffff;
	AMIGA_customregs[_index/2] = hi;
	AMIGA_customregs[_index/2+1] = lo;
	// we want the long to be fully written in memory before the Amiga reacts and triggers anything
	AMIGA_onCustomWrite(_index, hi);
	AMIGA_onCustomWrite(_index+2, lo);
}

/**
AMIGA_setCustomFromPtr(_p, _val)
Same as AMIGA_setCustom(), except that the parameter is not relative to $dff000, but an absolute address
*/
function AMIGA_setCustomFromPtr(_p, _val) {
	if (!custom_isCustomAdrs(_p))
		return false;
	_p -= AMIGA_CUSTOM_START;
	AMIGA_setCustom(_p,_val);
	return true;
}


/**
AMIGA_setCustomFromPtr_L(_p, _val)
Same as AMIGA_setCustom_L(), except that the parameter is not relative to $dff000, but an absolute address
*/
function AMIGA_setCustomFromPtr_L(_p, _val) {
	if(!AMIGA_setCustomFromPtr(_p,(_val>>>16)&0xffff)) return false;
	if(!AMIGA_setCustomFromPtr(_p+2,_val&0xffff)) return false;
	return true;
}




function custom_isCustomAdrs(_p) {
	if ((_p >= AMIGA_CUSTOM_START) && (_p < AMIGA_CUSTOM_END))
		return true;
	return false;
}




function AMIGA_custom_update() {
	if (DEBUGGER_DumpCopperList == 1)
		DEBUGGER_DumpCopperList = 2
	copper_onNewFrame();
	bitplanes_update();
	if (DEBUGGER_DumpCopperList == 2) {
		DEBUGGER_DumpCopperList = 0; // clear only if full copperlist dumped
		let msg = copper_toHTML();
		if (msg)
			showModalBox(msg, null);
	}
}





