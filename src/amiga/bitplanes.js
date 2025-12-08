let DisplayDataFetchFirstPix = 0;
let DisplayDataFetchLastPix = 0;
let bitpane_bplCount = 0; // Beware, also used by TOOLBOX
let bitplaneAdrs = new Uint32Array(6);
let bitplaneMod = new Int16Array(6);
let bitplaneHScroll = new Uint16Array(6);
let bplHorizByteCount = 40;
let BPL_R, BPL_G, BPL_B;
// DMA enable through DMACON
let DMA_Bitplane = false;
let DMA_Copper = false;
let isHAMMode = false;
let isDualPlayfield = false;
let PF2PRI = false;
let BPL5DAT_val = 0;
let BPL6DAT_val = 0;

function useColorIndex(_index) {
	const color = AMIGA_customregs[COLOR0 / 2 + _index]; // tap directly into table to avoid calling AMIGA_getCustom() once per pixel...
	BPL_B = (color & 15) * 16;
	BPL_G = ((color >>> 4) & 15) * 16;
	BPL_R = ((color >>> 8) & 15) * 16;
}


function bitplanes_updateAllValues() {
	const DMACONVal = AMIGA_customregs[DMACONR/2]; // don't use AMIGA_getCustom(DMACONR), it will make the system believe the user waited for blitter
	if (((DMACONVal >>> 7) & 1) != 0)
		DMA_Copper = true;
	else
		DMA_Copper = false;
	if (((DMACONVal >>> 8) & 1) != 0)
		DMA_Bitplane = true;
	else
		DMA_Bitplane = false;

	let DIWSTRT_val = AMIGA_customregs[DIWSTRT/2];
	if (DIWSTRT_val != 0) {
		DisplayWindowStart_x = (DIWSTRT_val & 0xff)*SIMU_DEFAULT_WIDTH/640;
		DisplayWindowStart_y = ((DIWSTRT_val >>> 8) & 0xff);
	}

	let DIWSTOP_val = AMIGA_customregs[DIWSTOP/2];
	if (DIWSTOP_val != 0) {
		DisplayWindowStop_x = 256 + (DIWSTOP_val & 0xff);
		DisplayWindowStop_y = ((DIWSTOP_val >>> 8) & 0xff);
		if ((DisplayWindowStop_y & (1<<7)) == 0) DisplayWindowStop_y += 256;
	}

	let DDFSTRT_val = AMIGA_customregs[DDFSTRT/2];
	if (DDFSTRT_val != 0) {
		DisplayDataFetchFirstPix = (DDFSTRT_val & 0b11111100) / 2 + 8;
	}

	let DDFSTOP_val = AMIGA_customregs[DDFSTOP/2];
	if (DDFSTOP_val != 0) {
		DisplayDataFetchLastPix = (DDFSTOP_val & 0b11111100);
		let wordCount = DisplayDataFetchLastPix - (DDFSTRT_val & 0b11111100);
		wordCount = wordCount / 8 + 1;
		DisplayDataFetchLastPix = DisplayDataFetchFirstPix + 16 * wordCount;
	}

	PLAYFIELD_LINES_COUNT = DisplayWindowStop_y - DisplayWindowStart_y;

	bplHorizByteCount = (DisplayDataFetchLastPix - DisplayDataFetchFirstPix) / 8;
	bitplaneAdrs[0] = (AMIGA_customregs[BPL1PTH/2] << 16) | AMIGA_customregs[BPL1PTL/2];
	bitplaneAdrs[1] = (AMIGA_customregs[BPL2PTH/2] << 16) | AMIGA_customregs[BPL2PTL/2];
	bitplaneAdrs[2] = (AMIGA_customregs[BPL3PTH/2] << 16) | AMIGA_customregs[BPL3PTL/2];
	bitplaneAdrs[3] = (AMIGA_customregs[BPL4PTH/2] << 16) | AMIGA_customregs[BPL4PTL/2];
	bitplaneAdrs[4] = (AMIGA_customregs[BPL5PTH/2] << 16) | AMIGA_customregs[BPL5PTL/2];
	bitplaneAdrs[5] = (AMIGA_customregs[BPL6PTH/2] << 16) | AMIGA_customregs[BPL6PTL/2];

	bitplaneMod[0] = AMIGA_customregs[BPL1MOD/2];
	bitplaneMod[1] = AMIGA_customregs[BPL2MOD/2];
	bitplaneMod[2] = AMIGA_customregs[BPL1MOD/2];
	bitplaneMod[3] = AMIGA_customregs[BPL2MOD/2];
	bitplaneMod[4] = AMIGA_customregs[BPL1MOD/2];
	bitplaneMod[5] = AMIGA_customregs[BPL2MOD/2];

	bitplaneHScroll[0] = AMIGA_customregs[BPLCON1/2] & 0x0f;
	bitplaneHScroll[1] = (AMIGA_customregs[BPLCON1/2] & 0xf0) >>> 4;
	bitplaneHScroll[2] = bitplaneHScroll[0];
	bitplaneHScroll[3] = bitplaneHScroll[1];
	bitplaneHScroll[4] = bitplaneHScroll[0];
	bitplaneHScroll[5] = bitplaneHScroll[1];

	let BPLCON0_Val = AMIGA_customregs[BPLCON0/2];
	let BPLCON2_Val = AMIGA_customregs[BPLCON2/2];
	if ((BPLCON2_Val & 1<<6) != 0)
		PF2PRI = true;
	else
		PF2PRI = false;

	bitpane_bplCount = (BPLCON0_Val >>> 12) & 7;
	if (bitpane_bplCount == 7) {
		BPL5DAT_val = AMIGA_customregs[BPL5DAT/2];
		BPL6DAT_val = AMIGA_customregs[BPL6DAT/2];
	}
	if ((BPLCON0_Val & 1<<11) != 0) {
		isHAMMode = true;
	}
	if ((BPLCON0_Val & 1<<10) != 0) {
		isDualPlayfield = true;
	}
	
}

function bitplanes_update() {
	if (AMIGA_Chunky8 != null) {
		AMIGA_Chunky8_update();
		return;
	}

	const monitor = document.getElementById("OCSMonitorImage");
	const monitor_w = 483;
	const monitor_h = 470;
	const monitor_left_border_w = 57;
	const monitor_top_border_h = 62;
	const first_visible_copper_y = 0x1b; // 27
	const last_visible_copper_y = 0x37; // 55 (+ 256 = 311 ==> so 312 high total)
	const first_visible_bitplane_y = 0x2c; // 44 ==> 44-27 = 17 lines before bitplanes start
	BACKBUF_CTX.imageSmoothingEnabled = false;
	BACKBUF_CTX.drawImage(monitor, 0, 0, monitor_w, monitor_h, 0, 0, monitor_w, monitor_h);
	BACKBUF_CTX.imageSmoothingEnabled = false;
	let imgdata = BACKBUF_CTX.getImageData(0, 0, monitor_w, monitor_h);
	const bplW = MACHINE.bitplaneWeight;
	PLATFORM_OFSX = (SIMU_DEFAULT_WIDTH - 320) / 2;
	PLATFORM_OFSY = (PAL_VIDEO_LINES_COUNT - 180) / 2;
	let data = imgdata.data;

	bitplanes_updateAllValues();
	let bplReadY = new Int32Array(6);
	for (let i = 0; i < 6; i++) {
		bplReadY[i] = 0;
	}
	copperExecMove = 0;
	const bitplanesStartY = DisplayWindowStart_y;
	DEBUGPRIM.startScreenX = DisplayDataFetchFirstPix + monitor_left_border_w;
	DEBUGPRIM.startScreenY = bitplanesStartY + monitor_top_border_h - first_visible_copper_y;
	DEBUGPRIM.screenW = 320;
	DEBUGPRIM.screenH = PLAYFIELD_LINES_COUNT;
	// DRAW COLOR00 FOR THE TOP BORDER (0 to DisplayWindowStart_y)
	let rasterY = first_visible_copper_y;
	let remainingLines = PAL_VIDEO_LINES_COUNT;
	let d = 4 * monitor_w * monitor_top_border_h + 4 * monitor_left_border_w;
	for (let y = 0; y < bitplanesStartY - first_visible_copper_y; y++, rasterY++, remainingLines--) {
		for (let rasterX = 0; rasterX < SIMU_DEFAULT_WIDTH; rasterX++, copperExecMove--) {
			if (DMA_Copper && (copperExecMove <= 0)) {
				if (copper_processOneInstr(rasterX, rasterY))
					bitplanes_updateAllValues(); // in case the just executed copper instruction modified some HW register
			}
			useColorIndex(0);	// write color00 outside of display window
			data[d++] = BPL_R;
			data[d++] = BPL_G;
			data[d++] = BPL_B;
			data[d++] = 255;
		}
		d += 4 * (monitor_w - SIMU_DEFAULT_WIDTH);
	}

	// DRAW PLAYFIELDS
	let bplY = 0;
	for (;bplY < PLAYFIELD_LINES_COUNT; bplY++, rasterY++, remainingLines--) {
		let bplReadX = 0;
		for (let rasterX = 0; rasterX < SIMU_DEFAULT_WIDTH; rasterX++, copperExecMove--) {
			let xmsk;
			if (MACHINE.stop) return;
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
				useColorIndex(0);	// write color00 outside of display window
				data[d++] = BPL_R;
				data[d++] = BPL_G;
				data[d++] = BPL_B;
				data[d++] = 255;
			}
			else { // update bitplanes
				let colorIndex = new Uint8Array(2);
				let pfIndex = 0; // playfieldIndex
				let colShift = 0;
				const readBplCnt = Math.min(6,bitpane_bplCount);
				for (let curBpl = 0; curBpl < readBplCnt; curBpl++) {
					let readx = bplReadX - bitplaneHScroll[curBpl];
					if (readx >= 0) {
						let pixindex = (readx >>> 3) + bplReadY[curBpl];
						let bitplane = bitplaneAdrs[curBpl];
						xmsk = 1 << (7 - (readx & 7));
						//if (pixindex >= 0 && pixindex < bplHorizByteCount*PLAYFIELD_LINES_COUNT) {
						const v = MACHINE.ram[bitplane + pixindex] & xmsk;
						if (v != 0) {
							if (isDualPlayfield) {
								pfIndex = curBpl & 1;
								colShift = curBpl >>> 1;
							} else colShift = curBpl;
							colorIndex[pfIndex] |= bplW[curBpl] * (1 << colShift);
						}
						//} else 
						//	debugger;
					}
				}	
				bplReadX++;

				if (isDualPlayfield) {
					if (PF2PRI) {
						if (colorIndex[1] > 0)
							useColorIndex(colorIndex[1]+8);
						else if (colorIndex[0] > 0)
							useColorIndex(colorIndex[0]);
						else
							useColorIndex(0);
					} else {
						if (colorIndex[0] > 0)
							useColorIndex(colorIndex[0]);
						else if (colorIndex[1] > 0)
							useColorIndex(colorIndex[1]+8);
						else
							useColorIndex(0);
					}
				} else if (isHAMMode) {
					const hamv = colorIndex[0] & 15; 
					let hamcode = 0;
					if (bitpane_bplCount == 6) {
						hamcode = (colorIndex[0]>>>4)&3;
					} else if (bitpane_bplCount == 7) {
						const BPL5DAT_val = AMIGA_customregs[BPL5DAT/2];
						const BPL6DAT_val = AMIGA_customregs[BPL6DAT/2];
						let v = BPL5DAT_val & xmsk;
						if (v != 0)
							hamcode = bplW[4];
						v = BPL6DAT_val & xmsk;
						if (v != 0)
							hamcode |= bplW[5] << 1;
					}
					if (hamcode == 0)
						useColorIndex(hamv);
					else {
						const c = hamv<<4;
						switch (hamcode) {
							case 1: BPL_B = c; break;
							case 2: BPL_R = c; break;
							case 3: BPL_G = c; break;
							default: runtimeError68k("bad HAM code"); return;
						}
					}
				}
				else 
					useColorIndex(colorIndex[0]);
				data[d++] = BPL_R;
				data[d++] = BPL_G;
				data[d++] = BPL_B;
				data[d++] = 255;
			}
		}
		for (let i = 0; i < 6; i++) {
			bplReadY[i] += bplHorizByteCount + bitplaneMod[i];
		}
		d += 4 * (monitor_w - SIMU_DEFAULT_WIDTH);
	}
	
	// DRAW COLOR00 FOR THE BOTTOM BORDER (PLAYFIELD_LINES_COUNT to PAL_VIDEO_LINES_COUNT)
	for (; remainingLines>0; bplY++, rasterY++, remainingLines--) {
		for (let rasterX = 0; rasterX < SIMU_DEFAULT_WIDTH; rasterX++, copperExecMove--) {
			if (DMA_Copper && (copperExecMove <= 0)) {
				if (copper_processOneInstr(rasterX, rasterY))
					bitplanes_updateAllValues(); // in case the just executed copper instruction modified some HW register
			}
			useColorIndex(0);	// write color00 outside of display window
			data[d++] = BPL_R;
			data[d++] = BPL_G;
			data[d++] = BPL_B;
			data[d++] = 255;
		}
		d += 4 * (monitor_w - SIMU_DEFAULT_WIDTH);
	}

	// update BPLxPT (should be done every 16 pix in theory, but no difference here as it's write only registers)
	for (let i = 0; i < 6; i++) {
		let bplAdrs = (bitplaneAdrs[i] + bplReadY[i] + bplHorizByteCount) & (~15);
		AMIGA_setCustom_L(BPL1PTH + 4 * i, bplAdrs);
	}

	BACKBUF_CTX.imageSmoothingEnabled = false;    
	BACKBUF_CTX.putImageData(imgdata,0,0);
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
			if (MACHINE.stop) return;
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

	BACKBUF_CTX.imageSmoothingEnabled = false;    
	BACKBUF_CTX.putImageData(imgdata,0,0);
}

