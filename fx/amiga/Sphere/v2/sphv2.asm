       code_any

       include "../lib_math.asm"

PRECALC_FRAMES_COUNT        EQU    8
PRECALC_CIRCLES_COUNT       EQU    7
FFT_POINTS_PER_CIRCLE       EQU    12
ONE_FRAME_SIZE              EQU    (320/8)*180

FFT_ONECIRLCE_BYTES         EQU    FFT_POINTS_PER_CIRCLE*6 ; 3 words per point (x,y,h)
FFT_ONEFRAME_BYTES          EQU    PRECALC_CIRCLES_COUNT*FFT_ONECIRLCE_BYTES
FFT_ALLFRAMES_BYTES         EQU    FFT_ONEFRAME_BYTES*PRECALC_FRAMES_COUNT

init:
       lea           sintable,a0
       bsr           lib_math_sin
       bsr           setPalette
       rts


setPalette:
       lea           CUSTOM,a6
       move.w        #$123,COLOR0(a6)
       move.w        #$ace,COLOR1(a6)
       rts

; IN : A0 ==> bitplane to clear
bltClr:
	lea		$dff000,a6
	btst		#6,DMACONR(a6)
.wcblt:	
       btst		#6,DMACONR(a6)
	bne.s   	.wcblt
	move.l 	#%00000001000000000000000000000000,BLTCON0(a6)   ;(BLTCON0 & 1) : Must be done first before setting any other blitter register
	move.l        #-1,$dff044					       ;(BLTAFWM & BLTALWM) masking of first/last word
	move.w        #0,BLTDMOD(a6)
	move.l        a0,BLTDPTH(a6)
	move.w		#(180<<6)+(320/16),BLTSIZE(a6)
       rts

; IN : A0 ==> src
; IN : A1 ==> dst
bltCpy:
	lea		$dff000,a6
	btst		#6,DMACONR(a6)
.wcblt:	
       btst		#6,DMACONR(a6)
	bne.s   	.wcblt
	move.l        #$09f00000,BLTCON0(a6)	;A->D copy, no shifts, ascending mode
	move.l        #$ffffffff,BLTAFWM(a6)	;no masking of first/last word
	move.w        #0,BLTAMOD(a6)		;A modulo=bytes to skip between lines
	move.w        #0,BLTDMOD(a6)	       ;D modulo
	move.l        a0,BLTAPTH(a6)	       ;source graphic top left corner
	move.l        a1,BLTDPTH(a6)	       ;destination top left corner
	move.w		#(180<<6)+(320/16),BLTSIZE(a6)
       rts

       bss_c

bitplane:
       ds.b   320/8*180

precalc_frames:
       ds.b   ONE_FRAME_SIZE*PRECALC_FRAMES_COUNT

       bss_any

sintable:
       ds.b   2048

fft_frames:
       ds.b   FFT_ALLFRAMES_BYTES


       