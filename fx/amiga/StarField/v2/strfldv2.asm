       code_f

       include "../lib_math.asm"

STARTZ EQU    256   ; must be power of 2
ENDZ   EQU    4096
STARSCOUNT EQU 128
;SLOW EQU 128

init:
       lea           sintable,a0
       bsr           lib_math_sin
       lea           stars,a0
       moveq         #0,d6         ; angle
       move.w        #(2*MTHLIB_PI)/STARSCOUNT,d5       ; angle incr
       move.w        #STARSCOUNT-1,d7
.initStars:
       move.w        d6,(a0)+             ; angle
       bsr           MATH_random
       lsl.w         #3,d0
       and.w         #ENDZ-1,d0
       add.w         #STARTZ,d0
       move.w        d0,(a0)+             ; z
       add.w         d5,d6                ; incr angle
       dbra          d7,.initStars       

       moveq         #0,d0
       lea           mul40,a0
       move.w        #179,d7
.build40:
       move.w        d0,(a0)+
       add.w         #40,d0
       dbra          d7,.build40       

       bsr           setPalette
       rts

; plot : draw a 2d point in a bitplane
; [IN] D0.W :      x
; [IN] D1.W :      y
; [IN] A0.L :      bitplane
plot:
       add.w         #160,d0
       cmp.w         #320,d0
       bcc           .done
       add.w         #90,d1
       cmp.w         #180,d1
       bcc           .done
       lea           mul40,a1
       add.w         d1,d1
       move.w        (a1,d1.w),d1
       move.w        d0,d2
       lsr.w         #3,d0
       add.w         d0,d1
       and.w         #7,d2
       lea           xmsk,a1
       move.b        (a1,d2.w),d0
       or.b          d0,(a0,d1.w)
.done:       
       rts

xmsk:
       dc.b          128,64,32,16,8,4,2,1

; project : 3d to 2d projection
; [IN] D0.W :      x3d
; [IN] D1.W :      y3d
; [IN] D2.W :      z
; [OUT] D0.W :     x2d
; [OUT] D1.W :     y2d
project:
       muls          d2,d0
       muls          d2,d1
       swap          d0
       swap          d1
       rts

; rot : 2d rotation of (a,b)
; [IN] D2.W :      angle
; [OUT] D0.W :     rotated a
; [OUT] D1.W :     rotated b
rot:
       move.l        #sintable,a0
       move.w        d2,d3                       ; angle
       add.w         #MTHLIB_COS_OFS,d3
       and.w         #MTHLIB_OFS_MSK,d3
       move.w        (a0,d3.w),d0                ; d3 = cos(angle)
       move.w        d2,d4                       ; angle
       and.w         #MTHLIB_OFS_MSK,d4
       move.w        (a0,d4.w),d1                ; d4 = sin(angle)
       ;  return {a: ((c<<12)>>16), b: ((s<<12)>>16)};
       moveq         #12,d2
       ext.l         d0
       asl.l         d2,d0                       ; for education purposes only! kids, never do that in real life, just pre-shift your sin() table instad
       swap          d0
       ext.l         d1
       asl.l         d2,d1
       swap          d1
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

drawStars:
       move.w #0,d0
       move.w #0,d1
       move.w #319,d2
       move.w #179,d3
       lea           stars,a5
       move.w        #STARSCOUNT-1,d7
.nextStar:
;       add.w         #1,(a5)            ; incr angle
       move.w        (a5)+,d2             ; ang
       bsr           rot
       move.w        (a5),d2              ; z
       IFND SLOW
       move.w        d2,d3
       lsr.w         #5,d3
       add.w         d3,d2
       ENDC
       addq.w        #4,d2         ; ZSPD
       cmp.w         #ENDZ,d2
       ble.b         .zok
       move.w         #STARTZ,d2
.zok:
       move.w        d2,(a5)+
       bsr           project
       move.l        bplPtr,a0
       bsr           plot
       dbra          d7,.nextStar
       rts

MATH_RandomSeed:	
       dc.l	$deffac1e




       bss_any

bplPtr:
       ds.l   1

sintable:
       ds.b   2048
       
stars:
       ds.w   STARSCOUNT*2  ; ang,z
mul40:
       ds.w   180
