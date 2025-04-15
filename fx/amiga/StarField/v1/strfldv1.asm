       code_any

       include "../lib_math.asm"

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

MATH_random:		; RETURN D0 = rnd number ; USE D1
	move.l		MATH_RandomSeed(pc),d0
	move.l		d0,d1
	swap		d0
	add.w		d0,d1
	roxr.l		#3,d1
	eor.l		d1,d0
	not.l		d1
	move.l		d1,MATH_RandomSeed
	rts

MATH_RandomSeed:	
       dc.l	$deffac1e


       bss_c

bitplane:
       ds.b   320/8*180

       bss_any

sintable:
       ds.b   2048
       