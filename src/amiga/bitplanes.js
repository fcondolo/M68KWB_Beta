/*
VERY VERY BASIC IMPLEMENTATION
This is not supposed to be an Amiga emulator. Just provides basic support for bitplanes
and some copper (changing bitplane pointers per line, bitplane modulo, etc.)
- The only value taken from BPLCON0 is the number of bitplanes
- BPLxPTH, BPLxPTL, BPLxMOD & BPLCON1 are taken into account (You can use bitplanes pointers, modulos and scroll values)
- Changes made to BPLxPTH, BPLxPTL, BPLxMOD & BPLCON1 by the COPPER during the frame are taken into account
- 6 bitplanes modes (HAM, EHB) are not supported. The 7 bitplanes OCS trick is not yet supported either
- No dual playfield
- No high-resolution, 320x256 et 320x180 resolutions tested only
*/

// TODO: Implement proper start/stop using: https://amigafonteditor.ozzyboshi.com/diwstartstop.html

let DisplayDataFetchFirstPix = 0;
let DisplayDataFetchLastPix = 0;
let bitpane_bplCount = 0;
let bitplaneAdrs = new Uint32Array(6);
let bitplaneMod = new Int16Array(6);
let bitplaneHScroll = new Uint16Array(6);
let bplHorizByteCount = 40;
let bitplaneWeight = [1, 1, 1, 1, 1, 1]; // for debug purposes only. Used to switch on/off bitplanes
let BPL_R, BPL_G, BPL_B;
// DMA enable through DMACON
let DMA_Bitplane = false;
let DMA_Copper = false;

function useColorIndex(_index) {
	const color = AMIGA_customregs[COLOR0 / 2 + _index]; // tap directly into table to avoid calling AMIGA_getCustom() once per pixel...
	BPL_B = (color & 15) * 16;
	BPL_G = ((color >> 4) & 15) * 16;
	BPL_R = ((color >> 8) & 15) * 16;
}


function bitplanes_updateAllValues() {
	const DMACONVal = AMIGA_getCustom(DMACONR);
	if (((DMACONVal >> 7) & 1) != 0)
		DMA_Copper = true;
	else
		DMA_Copper = false;
	if (((DMACONVal >> 8) & 1) != 0)
		DMA_Bitplane = true;
	else
		DMA_Bitplane = false;

	let DIWSTRT_val = AMIGA_getCustom(DIWSTRT);
	if (DIWSTRT_val != 0) {
		DisplayWindowStart_x = (DIWSTRT_val & 0xff);
		DisplayWindowStart_y = ((DIWSTRT_val >> 8) & 0xff);
	}

	let DIWSTOP_val = AMIGA_getCustom(DIWSTOP);
	if (DIWSTOP_val != 0) {
		DisplayWindowStop_x = 256 + (DIWSTOP_val & 0xff);
		DisplayWindowStop_y = ((DIWSTOP_val >>> 8) & 0xff);
		if ((DisplayWindowStop_y & (1<<7)) == 0) DisplayWindowStop_y += 256;
	}

	let DDFSTRT_val = AMIGA_getCustom(DDFSTRT);
	if (DDFSTRT_val != 0) {
		DisplayDataFetchFirstPix = (DDFSTRT_val & 0b11111100) / 2 + 8;
	}

	let DDFSTOP_val = AMIGA_getCustom(DDFSTOP);
	if (DDFSTOP_val != 0) {
		DisplayDataFetchLastPix = (DDFSTOP_val & 0b11111100);
		let wordCount = DisplayDataFetchLastPix - (DDFSTRT_val & 0b11111100);
		wordCount = wordCount / 8 + 1;
		DisplayDataFetchLastPix = DisplayDataFetchFirstPix + 16 * wordCount;
	}

	bplHorizByteCount = (DisplayDataFetchLastPix - DisplayDataFetchFirstPix) / 8;
	bitplaneAdrs[0] = (AMIGA_getCustom(BPL1PTH) << 16) | AMIGA_getCustom(BPL1PTL);
	bitplaneAdrs[1] = (AMIGA_getCustom(BPL2PTH) << 16) | AMIGA_getCustom(BPL2PTL);
	bitplaneAdrs[2] = (AMIGA_getCustom(BPL3PTH) << 16) | AMIGA_getCustom(BPL3PTL);
	bitplaneAdrs[3] = (AMIGA_getCustom(BPL4PTH) << 16) | AMIGA_getCustom(BPL4PTL);
	bitplaneAdrs[4] = (AMIGA_getCustom(BPL5PTH) << 16) | AMIGA_getCustom(BPL5PTL);
	bitplaneAdrs[5] = (AMIGA_getCustom(BPL6PTH) << 16) | AMIGA_getCustom(BPL6PTL);

	bitplaneMod[0] = AMIGA_getCustom(BPL1MOD);
	bitplaneMod[1] = AMIGA_getCustom(BPL2MOD);
	bitplaneMod[2] = AMIGA_getCustom(BPL1MOD);
	bitplaneMod[3] = AMIGA_getCustom(BPL2MOD);
	bitplaneMod[4] = AMIGA_getCustom(BPL1MOD);
	bitplaneMod[5] = AMIGA_getCustom(BPL2MOD);

	bitplaneHScroll[0] = AMIGA_getCustom(BPLCON1) & 0x0f;
	bitplaneHScroll[1] = (AMIGA_getCustom(BPLCON1) & 0xf0) >> 4;
	bitplaneHScroll[2] = bitplaneHScroll[0];
	bitplaneHScroll[3] = bitplaneHScroll[1];
	bitplaneHScroll[4] = bitplaneHScroll[0];
	bitplaneHScroll[5] = bitplaneHScroll[1];

	let BPLCON0_Val = AMIGA_getCustom(BPLCON0);
	bitpane_bplCount = (BPLCON0_Val >> 12) & 7;	
}

function bitplanes_update() {
	if (AMIGA_Chunky8 != null) {
		AMIGA_Chunky8_update();
		return;
	}

	let monitor = document.getElementById("OCSMonitorImage");
	BACKBUF_CTX.imageSmoothingEnabled = false;
	BACKBUF_CTX.drawImage(monitor, 0, 0, SIMU_DEFAULT_WIDTH, PAL_VIDEO_LINES_COUNT, 0, 0, SIMU_DEFAULT_WIDTH, PAL_VIDEO_LINES_COUNT);
	BACKBUF_CTX.imageSmoothingEnabled = false;
	let imgdata = BACKBUF_CTX.getImageData(0, 0, SIMU_DEFAULT_WIDTH, PAL_VIDEO_LINES_COUNT);

	PLATFORM_OFSX = (SIMU_DEFAULT_WIDTH - 320) / 2;
	PLATFORM_OFSY = (PAL_VIDEO_LINES_COUNT - 180) / 2;
	let data = imgdata.data;

	bitplanes_updateAllValues();
	let bplReadY = new Int32Array(6);
	for (let i = 0; i < 6; i++) {
		bplReadY[i] = 0;
	}
	copperExecMove = 0;
	DEBUGPRIM.startScreenX = DisplayDataFetchFirstPix;
	DEBUGPRIM.startScreenY = DisplayWindowStart_y-25;
	let d = 4 * DEBUGPRIM.startScreenY * SIMU_DEFAULT_WIDTH;
	for (let y = 0; y < PLAYFIELD_LINES_COUNT; y++) {
		let rasterY = y + DisplayWindowStart_y;
		let bplReadX = 0;
		for (let rasterX = 0; rasterX < SIMU_DEFAULT_WIDTH; rasterX++, copperExecMove--) {
			if (DMA_Copper && (copperExecMove <= 0)) {
				if (copper_processOneInstr(rasterX, rasterY))
					bitplanes_updateAllValues(); // in case the just executed copper instruction modified some HW register
			}
			if (!DMA_Bitplane) {
				d += 4;
				continue;
			}
			// update only color0 if outside of bitplanes visible area
			if (rasterX < DisplayDataFetchFirstPix || rasterX >= DisplayDataFetchLastPix || rasterY >= DisplayWindowStop_y) {
				if (data[d] + data[d + 1] + data[d + 2] < 10) { // do not overwrite javascript graphics
					useColorIndex(0);	// write color00 outside of display window
					data[d++] = BPL_R;
					data[d++] = BPL_G;
					data[d++] = BPL_B;
					data[d++] = 255;
				} else d += 4;
			}
			else { // update bitplanes
				let colorIndex = 0;
				for (let curBpl = 0; curBpl < bitpane_bplCount; curBpl++) {
					let readx = bplReadX - bitplaneHScroll[curBpl];
					if (readx >= 0) {
						let pixindex = (readx >> 3) + bplReadY[curBpl];
						let bitplane = bitplaneAdrs[curBpl];
						let mask = 1 << (7 - (readx & 7));
						//if (pixindex >= 0 && pixindex < bplHorizByteCount*PLAYFIELD_LINES_COUNT) {
						let data = MACHINE.ram[bitplane + pixindex] & mask;
						if (data != 0) data = 1;
						colorIndex |= bitplaneWeight[curBpl] * (data << curBpl);
						//} else 
						//	debugger;
					}
				}
				bplReadX++;
				if (data[d] + data[d + 1] + data[d + 2] < 10) { // do not overwrite javascript graphics
					useColorIndex(colorIndex);
					data[d++] = BPL_R;
					data[d++] = BPL_G;
					data[d++] = BPL_B;
					data[d++] = 255;
				} else {
					d += 4;
				}
			}
		}
		for (let i = 0; i < 6; i++) {
			bplReadY[i] += bplHorizByteCount + bitplaneMod[i];
		}
	}

	// update BPLxPT (should be done every 16 pix in theory, but no difference here as it's write only registers)
	for (let i = 0; i < 6; i++) {
		let bplAdrs = (bitplaneAdrs[i] + bplReadY[i] + bplHorizByteCount) & (~15);
		AMIGA_setCustom_L(BPL1PTH + 4 * i, bplAdrs);
	}

	imgDataToScreen(imgdata);
}

function AMIGA_Chunky8_update() {
	BACKBUF_CTX.imageSmoothingEnabled = false;
	BACKBUF_CTX.imageSmoothingEnabled = false;
	let imgdata = BACKBUF_CTX.getImageData(0, 0, SIMU_DEFAULT_WIDTH, PAL_VIDEO_LINES_COUNT);
	let data = imgdata.data;

	const rptX = Math.floor(AMIGA_Chunky8.dw / AMIGA_Chunky8.sw);
	const rptY = Math.floor(AMIGA_Chunky8.dh / AMIGA_Chunky8.sh);
	let read = AMIGA_Chunky8.buf;
	for (let y = 0; y < AMIGA_Chunky8.sh; y++) {
		let d = SIMU_DEFAULT_WIDTH * 4 * y * rptY;
		for (let x = 0; x < AMIGA_Chunky8.sw; x++) {
			const color = MACHINE.getRAMValue(read, 1, false);
			read++;
			const blue = color;
			const green = color;
			const red =color;
			for (let j = 0; j < rptY; j++) {
				const jOfs = j * SIMU_DEFAULT_WIDTH * 4;
				for (let i = 0; i < rptX; i++) {
					data[jOfs + d + 4 * i] = red;
					data[jOfs + d + 4 * i + 1] = green;
					data[jOfs + d + 4 * i + 2] = blue;
					data[jOfs + d + 4 * i + 3] = 255;	
				}
			}
			d += 4 * rptX; 
		}
		d += 4 * rptY;
	}

	imgDataToScreen(imgdata);
}

