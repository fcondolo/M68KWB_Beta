// Palette definition: https://www.chibiakumas.com/68000/platform2.php#LessonP14
// Bitplane definition: https://www.fxjavadevblog.fr/atari-st-4-bitplanes/
// We use Memory addresses $FF8240-$FF825F to define the palettes of the Atari ST, Each entry uses 2 bytes

// 320x200 screen = 32000 bytes.
// pixels are encoded by packets of 16 pixels, on 64 bytes (4*16 bits).
// each line on screen is made of 20 blocks of 16 pixels. Each block takes 64 bits (8 bytes) hence 160 bytes.
// each pixel is represented by a 4 bit (0..15) index in the palette.
// the LSB of the palette index goes to the 1st word, the MSB to the 4th word.

const ST_colCompSize = 8;	// 0..7 : 3 bits per component
const ST_colMult = 256/ST_colCompSize;
const ST_brightness = 255-((ST_colCompSize-1)*ST_colMult);
const ST_To_HTML = [
	Math.floor(0 * ST_colMult),
	Math.floor(1 * ST_colMult + ST_brightness / 7),
	Math.floor(2 * ST_colMult + ST_brightness / 6),
	Math.floor(3 * ST_colMult + ST_brightness / 5),
	Math.floor(4 * ST_colMult + ST_brightness / 4),
	Math.floor(5 * ST_colMult + ST_brightness / 3),
	Math.floor(6 * ST_colMult + ST_brightness / 2),
	Math.floor(7 * ST_colMult + ST_brightness / 1),
];

const STE_colCompSize = 16;	// 0..15 : 4 bits per component (LSB first)
const STE_colMult = 256/STE_colCompSize;
const STE_brightness = 255-((STE_colCompSize-1)*STE_colMult);
/*
const STE_To_HTML = [
  0x00,
  0x22,
  0x43,
  0x66,
  0x88,
  0xAA,
  0xCC,
  0xEE,
  0x11,
  0x33,
  0x44,
  0x55,
  0x99,
  0xBB,
  0xDD,
  0xFF,
];
*/
const STE_To_HTML = [
														// 0321 ==> 3210 - color 0..15
	Math.floor(0 * STE_colMult), 						// 0000 ==> 0000 - 00
	Math.floor(2 * STE_colMult + STE_brightness / 15),	// 0001 ==> 0010 - 02
	Math.floor(4 * STE_colMult + STE_brightness / 14),	// 0010 ==> 0100 - 04
	Math.floor(6 * STE_colMult + STE_brightness / 13),	// 0011 ==> 0110 - 06
	Math.floor(8 * STE_colMult + STE_brightness / 12),	// 0100 ==> 1000 - 08
	Math.floor(10 * STE_colMult + STE_brightness / 11), // 0101 ==> 1010 - 10
	Math.floor(12 * STE_colMult + STE_brightness / 10), // 0110 ==> 1100 - 12
	Math.floor(14 * STE_colMult + STE_brightness / 9),	// 0111 ==> 1110 - 14
	Math.floor(1 * STE_colMult + STE_brightness / 8),	// 1000 ==> 0001 - 01
	Math.floor(3 * STE_colMult + STE_brightness / 7),	// 1001 ==> 0011 - 03
	Math.floor(5 * STE_colMult + STE_brightness / 6),	// 1010 ==> 0101 - 05
	Math.floor(7 * STE_colMult + STE_brightness / 5),	// 1011 ==> 0111 - 07
	Math.floor(9 * STE_colMult + STE_brightness / 4),	// 1100 ==> 1001 - 09
	Math.floor(11 * STE_colMult + STE_brightness / 3),	// 1101 ==> 1011 - 11
	Math.floor(13 * STE_colMult + STE_brightness / 2),	// 1110 ==> 1101 - 13
	Math.floor(15 * STE_colMult + STE_brightness / 1)	// 1111 ==> 1111 - 15
];

ST_BITPLANES_CTX = {
	pal : [],
	skipStart : 0,
	skipEnd : 0,
	bpl : 0
}

function ST_ColConvertSTEto255(_v) {
	const _3 = (_v & 0b0100) >> 2;
	const _2 = (_v & 0b0010) >> 1;
	const _1 = (_v & 0b0001);
	const _0 = (_v & 0b1000) >> 3;
	const col = _0 | (_1<<1) | (_2<<2) | (_3<<3);
	return col * 16;
}


function ST_bitplanes_adrsToRegs(_adrs, _hi, _mid, _low) {
	ST_setCustom_B(_low-ST_CUSTOM_START, _adrs & 0xff);
	ST_setCustom_B(_mid-ST_CUSTOM_START, (_adrs>>8) & 0xff);
	ST_setCustom_B(_hi-ST_CUSTOM_START, (_adrs>>16) & 0xff);
}

function ST_bitplanes_getRegs(_hi, _mid, _low) {
    let ret = 0;
    ret |= ST_getCustomFromPtr_B(_hi)<<16;
    ret |= ST_getCustomFromPtr_B(_mid)<<8;
    ret |= ST_getCustomFromPtr_B(_low);
	return ret;
}

function ST_bitplanes_updateValues() {
	ST_BITPLANES_CTX.pal = [];
	ST_BITPLANES_CTX.skipStart = 0;
	ST_BITPLANES_CTX.skipEnd = 0;
	
	let wpal = 0;
	switch (ST_MODEL) {
		case ATARI_MODEL_ST: {// ST
			for (let i = 0; i < 16; i++) {
				const stCol = ST_getCustomFromPtr_W(ST_COLOR0 + 2 * i, 2, false);
				const red = (stCol>>8)&7;
				const green = (stCol>>4)&7;
				const blue = stCol&7;
				ST_BITPLANES_CTX.pal[wpal++] = ST_To_HTML[red];
				ST_BITPLANES_CTX.pal[wpal++] = ST_To_HTML[green];
				ST_BITPLANES_CTX.pal[wpal++] = ST_To_HTML[blue];
				ST_BITPLANES_CTX.pal[wpal++] = 255;
			}
		}
		break;

		case ATARI_MODEL_STE: {// STE
			ST_BITPLANES_CTX.skipStart = ST_getCustomFromPtr_B(STE_PIXOFFSET);
			ST_BITPLANES_CTX.skipEnd = ST_getCustomFromPtr_B(STE_LINEOFFSET);
			if ((ST_BITPLANES_CTX.skipEnd%4) !=0) debug("in low resolution, line offset ($FF820F) must always be a multiple of 4");
			for (let i = 0; i < 16; i++) {
				const stCol = ST_getCustomFromPtr_W(ST_COLOR0 + 2 * i, 2, false);
				const red = (stCol>>8)&15;
				const green = (stCol>>4)&15;
				const blue = stCol&15;
				ST_BITPLANES_CTX.pal[wpal++] = STE_To_HTML[red];
				ST_BITPLANES_CTX.pal[wpal++] = STE_To_HTML[green];
				ST_BITPLANES_CTX.pal[wpal++] = STE_To_HTML[blue]; 
				/*pal[wpal++] = ST_ColConvertSTEto255(red);
				pal[wpal++] = ST_ColConvertSTEto255(green);
				pal[wpal++] = ST_ColConvertSTEto255(blue);*/
				ST_BITPLANES_CTX.pal[wpal++] = 255;
			}
		}
		break;
		
		default:
			alert("'ST_MODEL' is invalid. Please call 'ST_start();' or 'STE_start();' first");
		return;
	}

    ST_BITPLANES_CTX.bpl = ST_bitplanes_getRegs(ST_SCREEN_COUNTER_HI, ST_SCREEN_COUNTER_MID, ST_SCREEN_COUNTER_LOW);	
}

function ST_bitplanes_update() {
	let monitor = document.getElementById("atariMonitorImage");
	BACKBUF_CTX.imageSmoothingEnabled = false;   
	BACKBUF_CTX.drawImage(monitor, 0, 0, SIMU_DEFAULT_WIDTH, PAL_VIDEO_LINES_COUNT, 0, 0, SIMU_DEFAULT_WIDTH, PAL_VIDEO_LINES_COUNT);
	BACKBUF_CTX.imageSmoothingEnabled = false;   
	let imgdata = BACKBUF_CTX.getImageData(0,0,SIMU_DEFAULT_WIDTH, PAL_VIDEO_LINES_COUNT);
		
	PLATFORM_OFSX = (SIMU_DEFAULT_WIDTH-320)/2;
	PLATFORM_OFSY = (PAL_VIDEO_LINES_COUNT-200)/2;
	let data = imgdata.data;

    ST_PHYSICAL_SCREEN = ST_bitplanes_getRegs(ST_SCREEN_HI, ST_SCREEN_MID, STE_SCREEN_LOW);
    if (ST_MODEL == ATARI_MODEL_ST)
		ST_PHYSICAL_SCREEN &= ~255;	// aligned on 256 on ST (ignore STE_SCREEN_LOW's value)
    else if (ST_MODEL == ATARI_MODEL_STE && STE_CONFIG.CHECK_VIDEO_BASE_ADRS)
		if (!(ST_PHYSICAL_SCREEN%2 == 0)) main_Alert("video base is set to an odd address, please update 0xff820d, or set STE_CONFIG.CHECK_VIDEO_BASE_ADRS to false");

	ST_PHYSICAL_SCREEN &= ~1; // lowest bit always assumed as 0, even on STe
	
	if (!ST_PHYSICAL_SCREEN) {
		let ft = ctx.font;
		let st = ctx.fillStyle;
		ctx.font = "48px serif";
		ctx.fillStyle = "purple";
		ctx.fillText("Please set", 10, 50);
		ctx.fillText("screen pointer", 10, 80);
		ctx.font = ft;
		ctx.fillStyle = st;
		return;
	}

	ST_bitplanes_adrsToRegs(ST_PHYSICAL_SCREEN, ST_SCREEN_COUNTER_HI, ST_SCREEN_COUNTER_MID, ST_SCREEN_COUNTER_LOW);
	ST_bitplanes_updateValues();
	let pal = ST_BITPLANES_CTX.pal;
	let d = 0;

	DEBUGPRIM.startScreenX = PLATFORM_OFSX;
	DEBUGPRIM.startScreenY = PLATFORM_OFSY;

	for (let y = 0; y < 200; y++)
	{
		const skp = ST_BITPLANES_CTX.skipStart;
		for (let rasterX = 0; rasterX < 320; rasterX+=16)
		{
			ST_bitplanes_adrsToRegs(ST_BITPLANES_CTX.bpl, ST_SCREEN_COUNTER_HI, ST_SCREEN_COUNTER_MID, ST_SCREEN_COUNTER_LOW);
			d = (PLATFORM_OFSY+y)*SIMU_DEFAULT_WIDTH*4 + 4*(PLATFORM_OFSX+rasterX);
			// fetch data for the 16 next pixels (4 words)
			let p1 = MACHINE.getRAMValue(ST_BITPLANES_CTX.bpl, 2, false); // bitplane 1
			ST_BITPLANES_CTX.bpl += 2;
			let p2 = MACHINE.getRAMValue(ST_BITPLANES_CTX.bpl, 2, false); // bitplane 2
			ST_BITPLANES_CTX.bpl += 2;
			let p3 = MACHINE.getRAMValue(ST_BITPLANES_CTX.bpl, 2, false); // bitplane 3
			ST_BITPLANES_CTX.bpl += 2;
			let p4 = MACHINE.getRAMValue(ST_BITPLANES_CTX.bpl, 2, false); // bitplane 4
			ST_BITPLANES_CTX.bpl += 2;
			if (skp > 0) {
				let p1n = MACHINE.getRAMValue(ST_BITPLANES_CTX.bpl+0, 2, false);
				let p2n = MACHINE.getRAMValue(ST_BITPLANES_CTX.bpl+2, 2, false);
				let p3n = MACHINE.getRAMValue(ST_BITPLANES_CTX.bpl+4, 2, false);
				let p4n = MACHINE.getRAMValue(ST_BITPLANES_CTX.bpl+6, 2, false);
				const sft = 16-skp;
				p1 = (p1 << skp) & 0xffff;
				p1 |= p1n >> sft;
				p2 = (p2 << skp) & 0xffff;
				p2 |= p2n >> sft;
				p3 = (p3 << skp) & 0xffff;
				p3 |= p3n >> sft;
				p4 = (p4 << skp) & 0xffff;
				p4 |= p4n >> sft;
			}
			for (let bit = 15; bit >= 0; bit--) {
				const msk = 1<<bit;
				let v = 0;
				if ((p4 & msk)!==0) v |= 1<<3;
				if ((p3 & msk)!==0) v |= 1<<2;
				if ((p2 & msk)!==0) v |= 1<<1;
				if ((p1 & msk)!==0) v |= 1;
				v *= 4;
			//	if (data[d]<16) {
				data[d++] = pal[v];
				data[d++] = pal[v+1];
				data[d++] = pal[v+2];
				data[d++] = 255;	
			//	} else d+=4;
			}
		}
		if (skp > 0) ST_BITPLANES_CTX.bpl +=8;
		// BEFORE HBL
		ST_BITPLANES_CTX.bpl += ST_BITPLANES_CTX.skipEnd * 2;	// STE_LINEOFFSET is words
		ST_bitplanes_adrsToRegs(ST_BITPLANES_CTX.bpl, ST_SCREEN_COUNTER_HI, ST_SCREEN_COUNTER_MID, ST_SCREEN_COUNTER_LOW);
		if (M68K_HBL_CALLBACK) {
			if (
				(ST_getCustomFromPtr_B(TIMERB_CONTROL) == 8)
			) {
				MACHINE.TimerBCounter++;
				const maxCount = ST_getCustomFromPtr_B(TIMERB_COUNT);
				if (MACHINE.TimerBCounter >= maxCount) {
					MACHINE.TimerBCounter = 0;
					MACHINE.enterSuper(M68K_HBL_CALLBACK, null);
					DEBUGGER_insideInvoke = "HBL Timer B line: " + y;
					execCPU();
					MACHINE.forceExitAsm = false;
				}
			}
		}
		// AFTER HBL
		ST_bitplanes_updateValues();
		pal = ST_BITPLANES_CTX.pal;
	}

	imgDataToScreen(imgdata);
}

