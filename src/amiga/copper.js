let cper_cur = null;
let cplist = 0;
let wait255Reached = 0;
let copper_xToWait = 0;
let copper_yToWait = 0;
let copperExecMove = 0;	// simulates time taken to execute a MOVE instruction
let cper_activeList = 0xdff080;


function CPER_4digitHex(_s) {
  if (!_s) return "0000";
  _s >>>= 0;
  let r = _s.toString(16);
  while (r.length < 4) r = "0" + r;
  return r;
}

function copper_toHTML() {
	let ptr = AMIGA_getCustomFromPtr_L(cper_activeList);
	if (!ptr) {
		return "nothing found at $dff080. Please set a copperlist";
	}
	if (MACHINE.stop) {
		return ("can't dump copperlist, machine is stopped due to a previous error");
	}
	let reached255 = 0;
	let watchdog = 0;
	DEBUGGER_copperListDump = "<table><tr><th>adrs</th><th>opcode</th><th>instruction</th></tr>";

	MACHINE.pauseMemCheck();

	while (true) {
		const word1 = MACHINE.getRAMValue(ptr,2,false);
		if (MACHINE.stop) {
			MACHINE.unpauseMemCheck();
			return ("error, COPPER reading an invalid address");
		}
		const word2 = MACHINE.getRAMValue(ptr+2,2,false);
		if (MACHINE.stop) {
			MACHINE.unpauseMemCheck();
			return ("error, COPPER reading an invalid address");
		}
		if (MACHINE.stop) {
			MACHINE.unpauseMemCheck();
			return ("error, COPPER reading an invalid address");
		}

		let w1s = CPER_4digitHex(word1);
		while (w1s.length<4) w1s = "0"+w1s;
		let w2s = CPER_4digitHex(word2);
		while (w2s.length<4) w2s = "0"+w2s;
		DEBUGGER_copperListDump += "<tr><td>"+CPER_4digitHex(ptr)+"</td><td>"+w1s+","+w2s+"</td>";
	
		if ((word1&1)  != 0) { // wait
			if (word1 == 0xffff) { // end of copperlist?
				DEBUGGER_copperListDump += "<td>END OF COPPERLIST</td></tr></table>";
				MACHINE.unpauseMemCheck();
				return DEBUGGER_copperListDump;
			}
			let yToWait = (word1 >>> 8) & 0xff;
			if (yToWait < 64) // handling the case when we are still on line 255
				yToWait += reached255;
			if ((word2&1) == 1)
				DEBUGGER_copperListDump += "<td>SKIP";
			else
				DEBUGGER_copperListDump += "<td>WAIT";
			DEBUGGER_copperListDump += " x: $" + CPER_4digitHex(word1 & 0xfe)  + ", y: $" + CPER_4digitHex(yToWait) + "</td></tr>";
		}
		else { // move
			DEBUGGER_copperListDump += "<td>" + AMIGA_GetConstantName(word1) + " = $" + CPER_4digitHex(word2) + "</td></tr>";
		}
		ptr += 4;
		watchdog++;
		if (watchdog > 2048) {
			DEBUGGER_copperListDump += "<td>STOPPING - TOO MANY INSTRUCTIONS</td></tr></table>";
			MACHINE.unpauseMemCheck();
			return DEBUGGER_copperListDump;
		}
	}
	MACHINE.unpauseMemCheck();
}

function copper_onNewFrame() {
	// Fetch copper list address and reset copper instruction pointer
	cper_cur = null;
	cplist = AMIGA_getCustomFromPtr_L(cper_activeList);
	if (cplist != 0) {
		cper_cur = cplist;
	}
	if (!cper_cur) return;
	wait255Reached = 0;
	// Execute first copperlist instructions occurring during VBL.
	// This is totally rough and inaccurate. 
	// Basically, executes the first 100 copper MOVES, unless a WAIT or SKIP is met
	for (let i = 0; i < 100; i++) {
		if (!copper_processOneInstr(0, 0, true))
			break;
	}
	copperExecMove = 0;
}

/*
Notes:
According to http://ada.evergreen.edu/~tc_nik/files/AmigaHardRefManual.pdf
- 1: While waiting, the Copper is off the bus and not using memory cycles
- 2: The horizontal beam position has a value of $0 to $E2 --> 113  positions --> 4 pixels in low res, 8 in high res
- 3: Horizontal blanking falls in the range of $0F to $35. 
- 4: The 320 pixels wide screen has an unused  horizontal  portion  of  $04  to  $47  (during  which  only  the  background
color  is displayed)

According to http://coppershade.org/articles/AMIGA/Agnus/Copper:_Exact_WAIT_Timing/
- 5: During horizontal blanking, MOVEs take 8 cycles (pixels) to execute. 
- 6: During DMA activity, MOVEs will take 12 or 16 (but no more than 16). 
A typical example is between DDFSTRT and DDFSTOP when bitplane DMA has to be read and output to the screen. 
Here, 3 bitplanes will increase the timing to 12px and 4 (or more) bitplanes will increase it to 16.

According to tests:
- 4 planes : 8 pix copper
- 5 planes : 8/12 pix copper
- 6 planes : 16 pix copper
*/

let next5BplInstrDuration = 8;
function copper_processOneInstr(_x, _y, _breakIfWait = false) {
	if (!cplist || !cper_cur)
		return false;

	if (MACHINE.stop)
		return false;

	MACHINE.pauseMemCheck();

	const word1 = MACHINE.getRAMValue(cper_cur,2,false);
	const word2 = MACHINE.getRAMValue(cper_cur+2,2,false);

	if ((word1&1)  != 0) { // wait
		if (_breakIfWait) {
			MACHINE.unpauseMemCheck();
			return false;
		}
		if ((word2 & (1<<15)) == 0) // wait blitter bit is cleared ==> wait for blitter (yes, wait when it's cleared, not set)
			AMIGA_NEED_WAIT_BLT = false;
		if (word1 == 0xffff) { // end of copperlist?
			MACHINE.unpauseMemCheck();
			return false;
		}
		if ((word2&0xff) == 0)
			copper_xToWait = 0;
		else 
			copper_xToWait = ((word1 & 0xfe) - OCS_CONFIG.COPPER_SCREEN_LEFT_X) / 4; // Division by 4 : see note 2
		if ((word2&0xff00) == 0)
			copper_yToWait = 0;
		else 
			copper_yToWait = (word1 >>> 8) & 0xff;
		if (copper_yToWait < 64) // handling the case when we are still on line 255
			copper_yToWait += wait255Reached;
		if (_x >= copper_xToWait && _y >= copper_yToWait) {
			if ((word1 >>> 8) == 0xff)
				wait255Reached = _y;
			if ((word2 & 1) == 0)
				cper_cur += 4;	// this was a WAIT, go to next instruction
			else
				cper_cur += 8;	// this was a SKIP, skip next instruction
			copperExecMove = 0; // See note 1
			MACHINE.unpauseMemCheck();
			return true;
		} else {
			if ((word2 & 1) != 0) {
				cper_cur += 4;	// this was a SKIP, go to next instruction
				copperExecMove = 0;
			}
		}
		MACHINE.unpauseMemCheck();
		return false;
	}
	else { // move
		cper_cur += 4; // increment before calling AMIGA_setCustom, because AMIGA_setCustom might execute a copjmp
		AMIGA_setCustom(word1,word2,true);
		if ((bitpane_bplCount < 5) || (_x < DisplayDataFetchFirstPix) || (_x > DisplayDataFetchLastPix))
			copperExecMove = 8; // See note 5 & tests
		else if (bitpane_bplCount == 5) {
			copperExecMove = next5BplInstrDuration; // See tests
			if (next5BplInstrDuration == 8) next5BplInstrDuration = 12; else next5BplInstrDuration = 8;
		}
		else
			copperExecMove = 16; // See tests
		MACHINE.unpauseMemCheck();
		return true;
	}
	MACHINE.unpauseMemCheck();
}
