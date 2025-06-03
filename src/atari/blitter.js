function ATARI_bltReset()
{
}


function ATARI_bltStart() {
	TIME_MACHINE.paused = true;

	/*
	This sets up everything related to source addressing. 
	It sets the 24-Bit base address where to read data from, 
	how many bytes to add after each word copied (X Increment) 
	and how many bytes to add after each line copied (Y Increment) to the source address.
	*/
	const SRCXINCR 		= TOOLS.toInt16(ST_getCustomFromPtr_W(BLT_SRC_XINCR) & 0xfffe); // Source X Increment (15 Bit - Bit 0 is unused) - signed
	const SRCYINCR 		= TOOLS.toInt16(ST_getCustomFromPtr_W(BLT_SRC_YINCR) & 0xfffe); // Source Y Increment (15 Bit - Bit 0 is unused) - signed
	const SRCADRS		= ST_getCustomFromPtr_L(BLT_SRC_ADRS) & 0x7ffffe; // Source Address (23 Bit - Bit 31..24, Bit 0 unused)
	/*
	These masks are overlaid with the destination words and only bits that feature a “1” are actually manipulated by the BLiTTER.
	All bits containing a “0” will be left untouched. 
	ENDMASK 1 refers to the first word per line being copied, 
	ENDMASK 3 to the last word in each line being copied 
	while ENDMASK 2 affects all copies in between.
	*/
	const ENDMASK_1		= ST_getCustomFromPtr_W(BLT_ENDMASK_1); // ENDMASK 1 (16 Bits)
	const ENDMASK_2		= ST_getCustomFromPtr_W(BLT_ENDMASK_2); // ENDMASK 2 (16 Bits)
	const ENDMASK_3		= ST_getCustomFromPtr_W(BLT_ENDMASK_3); // ENDMASK 3 (16 Bits)
	/*
	Much like the source address generation, this covers the target or destination addressing,
	containing increment per word being copied (X), per line (Y) 
	and the target address to start with.
	*/
	const DSTXINCR 		= TOOLS.toInt16(ST_getCustomFromPtr_W(BLT_DST_XINCR) & 0xfffe); // Destination X Increment (15 Bit - Bit 0 is unused) - signed
	const DSTYINCR 		= TOOLS.toInt16(ST_getCustomFromPtr_W(BLT_DST_YINCR) & 0xfffe); // Destination Y Increment (15 Bit - Bit 0 is unused) - signed
	const DSTADRS		= ST_getCustomFromPtr_L(BLT_DST_ADRS) & 0x7ffffe; // Destination Address (23 Bit - Bit 31..24, Bit 0 unused)
	/*
	These two registers configure how many words (!) to copy per line (X) 
	and how many lines to copy in total (Y).
	Please note that these values are 16 Bits wide and unsigned.
	*/
	const COUNTX		= ST_getCustomFromPtr_W(BLT_COUNT_X); // X Count (16 Bits)
	const COUNTY		= ST_getCustomFromPtr_W(BLT_COUNT_Y); // Y Count (16 Bits)
	/*
	HOP stands for “Halftone OPeration” mode and configures in what way halftone and data read from memory using source addressing are being overlaid. It contains values 0..3:
	0 = All bits are generated as “1”
	1 = All bits taken from halftone patterns
	2 = All bits taken from source
	3 = Source and halftone are AND combined
	*/
	const HOP			= ST_getCustomFromPtr_B(BLT_HOP);
	/*
	The OP Register stands for “OPeration” mode and configures how destination and source data are being overlaid. It contains values 0..15:
	0 = Target Bits are all “0”
	1 = Target Bits are Source AND Target
	2 = Target Bits are Source AND NOT Target
	3 = Target Bits are Source
	4 = Target Bits are NOT Source AND Target
	5 = Target Bits are Target
	6 = Target Bits are Source XOR Target
	7 = Target Bits are Source OR Target
	8 = Target Bits are NOT Source AND NOT Target
	9 = Target Bits are NOT Source XOR NOT Target
	10 = Target Bits are NOT Target
	11 = Target Bits are Source OR NOT Target
	12 = Target Bits are NOT Source
	13 = Target Bits are NOT Source OR Target
	14 = Target Bits are NOT Source OR NOT Target
	15 = Target Bits are all “1”
	*/
	const OP			= ST_getCustomFromPtr_B(BLT_OP);
	/*
	This register is a bit structure of the following content:
	Bit 7 = BUSY Bit (Write: Start/Stop, Read: Status Busy/Idle)
	Bit 6 = HOG Mode (Write: HOG/BLiT mode, Read: Status)
	Bit 5 = Smudge Mode (Write: Smudge/Clean mode: Read Status)
	Bit 3..0 = Line number of Halftone Pattern to start with
	*/
	const MISC_1		= ST_getCustomFromPtr_B(BLT_MISC_1);
	/*
	This register is a bit structure of the following content:
	Bit 7 = Force eXtra Source Read (FXSR)
	Bit 6 = No Final Source Read (NFSR)
	Bit 3..0 = Skew (Number of right shifts per copy)
	*/
	const MISC_2		= ST_getCustomFromPtr_B(BLT_MISC_2);

	const skew	= MISC_2&15;
	let srcAdrs = SRCADRS;
	let dstAdrs = DSTADRS;
	let prefetch = 0;
	for (let y = 0; y < COUNTY; y++) {
		MACHINE.errorContext.blitter = "Blitter op, line " + (y+1) + "/" + COUNTY;
		for (let x = 0; x < COUNTX; x++) {
			let src = 0;
			let dst = 0;
			/*
			switch(OP) {
				case 1: // Target Bits are Source AND Target
				case 2: // Target Bits are Source AND NOT Target
				case 3: // Target Bits are Source
				case 4: // Target Bits are NOT Source AND Target
				case 6: // Target Bits are Source XOR Target
				case 7: // Target Bits are Source OR Target
				case 8: // Target Bits are NOT Source AND NOT Target
				case 9: // Target Bits are NOT Source XOR NOT Target
				case 11: // Target Bits are Source OR NOT Target
				case 12: // Target Bits are NOT Source
				case 13: // Target Bits are NOT Source OR Target
				case 14: // Target Bits are NOT Source OR NOT Target
				break;
			}*/
			src = MACHINE.getRAMValue(srcAdrs,2,false);
			if (SRCXINCR >= 0) {
				prefetch <<= 16;
				prefetch |= src;
				prefetch >>>= skew;
				src = prefetch & 0xffff;	
			} else {
				prefetch >>>= 16;
				prefectch |= src << 16;
				prefetch <<= skew;
				src = prefetch >>> 16;	
			}
			switch(OP) {
				case 0: // Target Bits are all “0”
					dst = 0;
				break;
				case 1: // Target Bits are Source AND Target
					dst = MACHINE.getRAMValue(dstAdrs,2,false);
					dst &= src; 
				break;
				case 2: // Target Bits are Source AND NOT Target
					dst = MACHINE.getRAMValue(dstAdrs,2,false);
					dst = src & (~dst); 
				break;
				case 3: // Target Bits are Source
					dst = src;
				break;
				case 4: // Target Bits are NOT Source AND Target
					dst = MACHINE.getRAMValue(dstAdrs,2,false);
					dst &= ~src; 
				break;
				case 5: // Target Bits are Target
					dst = MACHINE.getRAMValue(dstAdrs,2,false);
				break;
				case 6: // Target Bits are Source XOR Target
					dst = MACHINE.getRAMValue(dstAdrs,2,false);
					dst ^= src; 
				break;
				case 7: // Target Bits are Source OR Target
					dst = MACHINE.getRAMValue(dstAdrs,2,false);
					dst |= src; 
				break;
				case 8: // Target Bits are NOT Source AND NOT Target
					dst = MACHINE.getRAMValue(dstAdrs,2,false);
					dst = (~src) & (~dst); 
				break;
				case 9: // Target Bits are NOT Source XOR NOT Target
					dst = MACHINE.getRAMValue(dstAdrs,2,false);
					dst = (~src) ^ (~dst); 
				break;
				case 10: // Target Bits are NOT Target
					dst = MACHINE.getRAMValue(dstAdrs,2,false);
					dst = ~dst; 
				break;
				case 11: // Target Bits are Source OR NOT Target
					dst = MACHINE.getRAMValue(dstAdrs,2,false);
					dst = src | (~dst); 
				break;
				case 12: // Target Bits are NOT Source
					dst = ~src; 
				break;
				case 13: // Target Bits are NOT Source OR Target
					dst = MACHINE.getRAMValue(dstAdrs,2,false);
					dst = dst | (~src); 
				break;
				case 14: // Target Bits are NOT Source OR NOT Target
					dst = MACHINE.getRAMValue(dstAdrs,2,false);
					dst = (~dst) | (~src); 
				break;
				case 15: // Target Bits are all “1”
					dst = 1;
				break;
				default:
					debug("wrong value for blitter op ($FFFF8A3B)");
					TIME_MACHINE.paused = false;
				return;
			}
			if (x == 0) dst &= ENDMASK_1;
			else if (x == COUNTX-1) dst &= ENDMASK_3;
			else dst &= ENDMASK_2;
			MACHINE.setRAMValue(dst,dstAdrs,2);
			srcAdrs += SRCXINCR;
			dstAdrs += DSTXINCR;
		}
		srcAdrs += SRCYINCR;
		dstAdrs += DSTYINCR;
	}
	ST_setCustomFromPtr_B(BLT_MISC_1, MISC_1 &(~128)); // clear blitter busy bit
	TIME_MACHINE.paused = false;
	MACHINE.errorContext.blitter = null; // finished
}



