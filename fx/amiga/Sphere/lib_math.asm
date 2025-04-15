MTHLIB_PI       EQU 1024
MTHLIB_SIN_OFS  EQU 0
MTHLIB_COS_OFS  EQU 512
MTHLIB_OFS_MSK  EQU 2046


; *****************************************************************************
; lib_math_sin
; Generates a sinus table:
;	--> 1024 entries (words), covering 2xPI. 
;   =====> total table size is 2048 bytes (1024 words)
;   =====> PI is at offset 1024 (512th value)
;	--> values are between -32768 and 32767
;   --> sin(0) = 0, sin(512) = 32767, sin(1024) = 0, sin(1536) = -32767, sin(2046) = 0
;   --> cos(a) = sin(a+512)
; [in]  a0.l : address of the destination table (2048 bytes)
lib_math_sin:
    movem.l			d0-d1/a0,-(sp)
    moveq           #0,d0
.sinloop:
    move.w          d0,d1
    sub.w           #256,d1
    muls.w          d1,d1
    sub.l           #65534,d1
    asr.l           #1,d1
    move.w          d1,1024(a0)
    neg.w           d1
    move.w          d1,(a0)+
    addq.w          #1,d0
    cmp.w           #511,d0
    ble.b           .sinloop 
    movem.l			(sp)+,d0-d1/a0
	rts

lib_math_random:		; RETURN D0 = rnd number ; USE D1
	move.l		lib_math_RandomSeed,d0
	move.l		d0,d1
	swap		d0
	add.w		d0,d1
	roxr.l		#3,d1
	eor.l		d1,d0
	not.l		d1
	move.l		d1,lib_math_RandomSeed
	rts


lib_math_RandomSeed:	
	dc.l	$deffac1e

