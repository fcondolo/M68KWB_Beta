// maybe try https://github.com/PSP-Archive/PSPUAE/blob/main/blitter.c to be closer to the actual machine, especially for line draw

function AMIGA_bltStart() {
	const old_dmacon = AMIGA_customregs[DMACONR];
	if ((old_dmacon & (1<<6)) != 0) {
		runtimeError68k("blitter is already working");
		return;
	}
	TIME_MACHINE.paused = true;

	AMIGA_customregs[DMACONR/2] |= 1<<6; // set blitter busy

	const AMOD = AMIGA_getCustom(BLTAMOD);
	const BMOD = AMIGA_getCustom(BLTBMOD);
	const CMOD = AMIGA_getCustom(BLTCMOD);
	const DMOD = AMIGA_getCustom(BLTDMOD);
	const CON0 = AMIGA_getCustom(BLTCON0);
	const CON1 = AMIGA_getCustom(BLTCON1);
	const AFWM = AMIGA_getCustom(BLTAFWM);
	const APT = AMIGA_getCustom_L(BLTAPTH);
	const BPT = AMIGA_getCustom_L(BLTBPTH);
	const CPT = AMIGA_getCustom_L(BLTCPTH);
	const DPT = AMIGA_getCustom_L(BLTDPTH);
	const SIZE = AMIGA_getCustom(BLTSIZE);

	let wordCount = SIZE & 63;
	let height = SIZE >> 6;

	let MINTERM = CON0 & 255;
	let ASHIFT = CON0 >> 12;
	let BSHIFT = CON1 >> 12;

	let useA = false;
	let useB = false;
	let useC = false;
	let useD = false;
	if ((CON0 & (1 << 11)) !== 0) useA = true;
	if ((CON0 & (1 << 10)) !== 0) useB = true;
	if ((CON0 & (1 << 9)) !== 0) useC = true;
	if ((CON0 & (1 << 8)) !== 0) useD = true;

	let ofsA = APT;
	let ofsB = BPT;
	let ofsC = CPT;
	let ofsD = DPT;

	if (CON0 == 0x100) { // clear
		for (let y = 0; y < height; y++) {
			MACHINE.errorContext = "Blitter Clear, line " + (y+1) + "/" + height;
			MACHINE.lastBlitContext = "Blitter Clear, line " + (y+1) + "/" + height;
			for (let x = 0; x < wordCount; x++) {
				MACHINE.setRAMValue(0, ofsD, 2);
				ofsD += 2;
			}
			ofsD += DMOD;
		
		}
		AMIGA_customregs[DMACONR/2] = old_dmacon;
		MACHINE.errorContext = null;
		TIME_MACHINE.paused = false;
		return;
	}

	if (useD) {
		for (let y = 0; y < height; y++) {
			MACHINE.errorContext = "Blitter copy, line " + (y+1) + "/" + height;
			MACHINE.lastBlitContext = "Blitter copy, line " + (y+1) + "/" + height;
			for (let x = 0; x < wordCount; x++) {
				let word = 0;
				let aOfs = Math.max(0, ofsA - 4 * ASHIFT);
				let bOfs = Math.max(0, ofsB - 4 * BSHIFT);
				aOfs &= 0xfffffffe;
				bOfs &= 0xfffffffe;
				let wA, wB, wC;
				if (useA) wA = MACHINE.getRAMValue(aOfs, 2, false); else wA = AMIGA_getCustom(BLTADAT);
				if (useB) wB = MACHINE.getRAMValue(bOfs, 2, false); else wB = AMIGA_getCustom(BLTBDAT);
				if (useC) wC = MACHINE.getRAMValue(ofsC, 2, false); else wC = AMIGA_getCustom(BLTCDAT);
				for (let bit = 0; bit < 16; bit++) {
					const shft = 15 - bit;
					let val = 0;
					let A = ((wA >> shft) & 1) == 1;
					let B = ((wB >> shft) & 1) == 1;
					let C = ((wC >> shft) & 1) == 1;
					if (MINTERM & 1) {
						if (!A && !B && !C) val = 1;
					}
					if (MINTERM & 2) {
						if (!A && !B && C) val = 1;
					}
					if (MINTERM & 4) {
						if (!A && B && !C) val = 1;
					}
					if (MINTERM & 8) {
						if (!A && B && C) val = 1;
					}
					if (MINTERM & 16) {
						if (A && !B && !C) val = 1;
					}
					if (MINTERM & 32) {
						if (A && !B && C) val = 1;
					}
					if (MINTERM & 64) {
						if (A && B && !C) val = 1;
					}
					if (MINTERM & 128) {
						if (A && B && C) val = 1;
					}
					word |= val << shft;
				}
				MACHINE.setRAMValue(word, ofsD, 2);
				ofsA += 2;
				ofsB += 2;
				ofsC += 2;
				ofsD += 2;
			}
			ofsA += AMOD;
			ofsB += BMOD;
			ofsC += CMOD;
			ofsD += DMOD;
		}
	}
	AMIGA_customregs[DMACONR/2] = old_dmacon;
	MACHINE.errorContext = null;
	TIME_MACHINE.paused = false;
}



/*
BLITTER COPY
blitw	=Spritewidth/16			;sprite width in words
blith	=Spriteheight			;sprite height in lines

	lea $dff000,a6
	bsr BlitWait
	move.l #$09f00000,BLTCON0(a6)	;A->D copy, no shifts, ascending mode
	move.l #$ffffffff,BLTAFWM(a6)	;no masking of first/last word
	move.w #0,BLTAMOD(a6)		;A modulo=bytes to skip between lines
	move.w #Screenwidth/8-blitw*2,BLTDMOD(a6)	;D modulo
	move.l #Sprite,BLTAPTH(a6)	;source graphic top left corner
	move.l #Screen+byteoffset,BLTDPTH(a6)	;destination top left corner
	move.w #blith*64+blitw,BLTSIZE(a6)	;rectangle size, starts blit

BLITTER CLEAR
	move.l 	#%00000001000000000000000000000000,$dff040 ;(BLTCON0 & 1) : Must be done first before setting any other blitter register
	move.l #-1,$dff044						;(BLTAFWM & BLTALWM) masking of first/last word
	move.w #(320-clrZoneWidth)/8,$dff066   ;(BLTDMOD) D modulo
	move.l anim_bitplanes+4*1,d0
	add.l	#clrZoneXStart/8,d0
	move.l d0,$dff054    		;(BLTDPTH) destination top left corner
	move.w #clrZoneHeight*64+clrZoneWidth/16,$dff058    		;(BLTSIZE) rectangle size, starts blit

*/