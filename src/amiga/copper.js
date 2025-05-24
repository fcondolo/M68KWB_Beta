let cper_cur = null;
let cplist = 0;
let wait255Reached = 0;
let copper_xToWait = 0;
let copper_yToWait = 0;
let copperExecMove = 0;	// simulates time taken to execute a MOVE instruction


function copper_toHTML() {
	let ptr = AMIGA_getCustomFromPtr_L(0xdff080);
	if (!ptr) {
		return "nothing found at $dff080. Please set a copperlist";
	}
	let reached255 = 0;
	let watchdog = 0;
	DEBUGGER_copperListDump = "<table><tr><th>adrs</th><th>opcode</th><th>instruction</th></tr>";

	while (true) {
		const word1 = MACHINE.getRAMValue(ptr,2,false);
		const word2 = MACHINE.getRAMValue(ptr+2,2,false);
	
		let w1s = word1.toString(16);
		while (w1s.length<4) w1s = "0"+w1s;
		let w2s = word2.toString(16);
		while (w2s.length<4) w2s = "0"+w2s;
		DEBUGGER_copperListDump += "<tr><td>"+ptr.toString(16)+"</td><td>"+w1s+","+w2s+"</td>";
	
		if ((word1&1)  != 0) { // wait --> NOT taking into account blitter wait flag. Very basic implementation
			if (word1 == 0xffff) { // end of copperlist?
				DEBUGGER_copperListDump += "<td>END OF COPPERLIST</td></tr></table>";
				return DEBUGGER_copperListDump;
			}
			let yToWait = (word1 >> 8) & 0xff;
			if (yToWait < 64) // handling the case when we are still on line 255
				yToWait += reached255;
			DEBUGGER_copperListDump += "<td>WAIT x: $" + (word1 & 0xff).toString(16)  + ", y: $" + yToWait.toString(16) + "</td></tr>";
		}
		else { // move
			DEBUGGER_copperListDump += "<td>" + AMIGA_GetConstantName(word1) + " = $" + word2.toString(16) + "</td></tr>";
		}
		ptr += 4;
		watchdog++;
		if (watchdog > 2048) {
			DEBUGGER_copperListDump += "<td>STOPPING - TOO MANY INSTRUCTIONS</td></tr></table>";
			return DEBUGGER_copperListDump;
		}
	}
}

function copper_onNewFrame() {
	// Fetch copper list address and reset copper instruction pointer
	cper_cur = null;
	cplist = AMIGA_getCustomFromPtr_L(0xdff080);
	if (cplist != 0) {
		cper_cur = cplist;
	}
	if (!cper_cur) return;
	wait255Reached = 0;
	// Execute first copperlist instructions occurring during VBL.
	// This is totally rough and inaccurate. 
	// Basically, executes the first 100 copper MOVES, unless a WAIT is met
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


	const word1 = MACHINE.getRAMValue(cper_cur,2,false);
	const word2 = MACHINE.getRAMValue(cper_cur+2,2,false);

	if ((word1&1)  != 0) { // wait --> NOT taking into account blitter wait flag. Very basic implementation
		if (_breakIfWait)
			return false;
		if (word1 == 0xffff) { // end of copperlist?
			return false;
		}
		copper_xToWait = ((word1 & 0xff) - OCS_CONFIG.COPPER_SCREEN_LEFT_X) / 4; // Division by 4 : see note 2
		copper_yToWait = (word1 >> 8) & 0xff;
		if (copper_yToWait < 64) // handling the case when we are still on line 255
			copper_yToWait += wait255Reached;
		if (_x >= copper_xToWait && _y >= copper_yToWait) {
			if ((word1 >> 8) == 0xff)
				wait255Reached = _y;
			cper_cur += 4;
			copperExecMove = 0; // See note 1
			return true;
		}
		return false;
	}
	else { // move
		AMIGA_setCustom(word1,word2);
		cper_cur += 4;
		if ((bitpane_bplCount < 5) || (_x < DisplayDataFetchFirstPix) || (_x > DisplayDataFetchLastPix))
			copperExecMove = 8; // See note 5 & tests
		else if (bitpane_bplCount == 5) {
			copperExecMove = next5BplInstrDuration; // See tests
			if (next5BplInstrDuration == 8) next5BplInstrDuration = 12; else next5BplInstrDuration = 8;
		}
		else
			copperExecMove = 16; // See tests
		return true;
	}
}
