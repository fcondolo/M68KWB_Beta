       code_any

       include "../lib_math.asm"

SCR_W_PIX                   EQU    320
SCR_W_BYTES                 EQU    SCR_W_PIX/8
SCR_H_LN                    EQU    180
PRECALC_FRAMES_COUNT        EQU    8
PRECALC_CIRCLES_COUNT       EQU    7
FFT_POINTS_PER_CIRCLE       EQU    12
ONE_FRAME_SIZE              EQU    SCR_W_BYTES*SCR_H_LN
ANGLE_STEP                  EQU    16
ANGLE_COUNT                 EQU    (2*MTHLIB_PI)/ANGLE_STEP
FFT_ENTRIES_COUNT           EQU    16
FFT_HISTORY_SIZE            EQU    8
REFX                        EQU    32000
REFZ                        EQU    0

FFT_ONECIRLCE_BYTES         EQU    FFT_POINTS_PER_CIRCLE*6 ; 3 words per point (x,y,h)
FFT_ONEFRAME_BYTES          EQU    PRECALC_CIRCLES_COUNT*FFT_ONECIRLCE_BYTES
FFT_ALLFRAMES_BYTES         EQU    FFT_ONEFRAME_BYTES*PRECALC_FRAMES_COUNT

sph_init:
       move.l        #FX_Heap+sintable,a0
       bsr           lib_math_sin

       moveq         #0,d0
       move.l        #FX_Heap+mul40,a0
       move.w        #179,d7
.build40:
       move.w        d0,(a0)+
       add.w         #40,d0
       dbra          d7,.build40       
       
       bsr           setPalette

       lea           FX_Heap,a5
       move.l        #FX_Heap+fft_frames,s_FFTFramesPtr(a5)
       move.l        #FX_Heap+precalc_frames,s_curFramePtr(a5)
       move.w        #0,s_mode(a5)
       move.w        #0,s_iter(a5)
    
       rts

sph_update:
       lea           FX_Heap,a5
       cmp.w         #0,s_mode(a5)
       beq           sph_update_precalc
       bra           sph_update_replay

sph_endUpdate:
       add.w         #1,s_iter(a5)
       add.l         #ONE_FRAME_SIZE,s_curFramePtr(a5)
       cmp.w         #PRECALC_FRAMES_COUNT,s_iter(a5)
       bmi           .end
       move.w        #1,s_mode(a5)
       move.l        #FX_Heap+fft_frames,s_FFTFramesPtr(a5)
       move.l        #FX_Heap+precalc_frames,s_curFramePtr(a5)
       move.w        #0,s_iter(a5)
.end:       
       rts


sph_update_precalc:
       ;>JS console.log("sph_update_precalc");
       ;>JS DBGVAR.pts = 0;
       ;>JS DBGVAR.frames = label("FX_Heap") + fft_frames;
       move.l        s_curFramePtr(a5),a0
       bsr           bltClr
       move.w        #1,s_rad(a5)
.radLoop:
       move.w        #0,s_ptCounter(a5)
       move.w        s_rad(a5),d0
       ;>JS DBGVAR.s_rad = regs.d[0]&0xffff;
       ;>JS DBGVAR.xpectd_circleOfs = FFT_ONECIRLCE_BYTES*(DBGVAR.s_rad-1);
       ;>JS DBGVAR.actual_circleOfs = struct("FX_Heap", "s_FFTFramesPtr", 4, false)-DBGVAR.frames;
       ;>-JS if (DBGVAR.xpectd_circleOfs != DBGVAR.actual_circleOfs) debug("wrong circleOfs, actual: " + DBGVAR.actual_circleOfs + " ,expected: " + DBGVAR.xpectd_circleOfs + " circle index:" + (DBGVAR.s_rad-1));
       add.w         d0,d0
       add.w         d0,d0
       move.w        d0,s_scale(a5)
       move.w        #0,s_ang(a5)
.angLoop:
       ;>JS DBGVAR.s_ang = struct("FX_Heap", "s_ang", 2, false);
       move.w        #REFX,d0
       move.w        #REFZ,d1
       move.w        s_iter(a5),d2
       ;>JS DBGVAR.s_iter = regs.d[2]&0xffff;
       ;>-JS DBGVAR.expected = 6*(DBGVAR.s_rad-1)*FFT_ONECIRLCE_BYTES+;
       add.w         d2,d2
       add.w         s_ang(a5),d2
       bsr           rot
       move.w        d2,s_x3d(a5)
       move.w        d6,s_z3d(a5)
       move.w        #0,d0
       move.w        s_z3d(a5),d1
       move.w        #MTHLIB_PI/8,d2
       bsr           rot
       move.w        s_scale(a5),d4
       move.w        s_x3d(a5),d0
       muls          d4,d0
       move.w        d2,d1
       muls          d4,d1
       move.w        d6,d2
       asr.w         #3,d2
       add.w         #2048,d2
       bsr           project
       neg.w         s_z3d(a5)
       cmp.w         #1024*15,s_z3d(a5)
       ble.b         .donotstore
       cmp.w         #FFT_POINTS_PER_CIRCLE,s_ptCounter(a5)
       bge.b         .donotstore
       add.w         #1,s_ptCounter(a5)
       move.l        s_FFTFramesPtr(a5),a2
       ;>JS if (regs.a[2] > DBGVAR.frames+FFT_ALLFRAMES_BYTES) debug("overflow. rad:" + DBGVAR.s_rad + ", ang:" + DBGVAR.s_ang + ", iter:" + DBGVAR.s_iter);
       move.w        d0,(a2)+
       ;>JS if (regs.a[2] > DBGVAR.frames+FFT_ALLFRAMES_BYTES) debug("overflow. rad:" + DBGVAR.s_rad + ", ang:" + DBGVAR.s_ang + ", iter:" + DBGVAR.s_iter);
       move.w        d1,(a2)+
       ;>JS if (regs.a[2] > DBGVAR.frames+FFT_ALLFRAMES_BYTES) debug("overflow. rad:" + DBGVAR.s_rad + ", ang:" + DBGVAR.s_ang + ", iter:" + DBGVAR.s_iter);
       move.w        s_z3d(a5),d2
       asr.w         #4,d2
       muls          s_scale(a5),d2
       move.w        d2,(a2)+
       ;>JS if (regs.a[2] > DBGVAR.frames+FFT_ALLFRAMES_BYTES) debug("overflow. rad:" + DBGVAR.s_rad + ", ang:" + DBGVAR.s_ang + ", iter:" + DBGVAR.s_iter);
       move.l        a2,s_FFTFramesPtr(a5)
.donotstore:       
       move.l        s_curFramePtr(a5),a0
       move.w        d0,d6
       move.w        d1,d7
       ;>JS DBGVAR.pts++;
       bsr           plot
       cmp.w         #5,s_rad(a5)
       ble.b         .plotdone
       move.w        d6,d0
       addq.w        #1,d0
       move.w        d7,d1
       bsr           plot
.plotdone:

       add.w         #ANGLE_STEP,s_ang(a5)
       cmp.w         #2*MTHLIB_PI,s_ang(a5)
       bmi           .angLoop

       add.w         #1,s_rad(a5)
       cmp.w         #PRECALC_CIRCLES_COUNT,s_rad(a5)
       ble           .radLoop   
       ;>JS console.log("pts: " + DBGVAR.pts);
       bra           sph_endUpdate

sph_update_replay:
       bra           sph_endUpdate

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
       move.l        #FX_Heap+mul40,a1
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

; project : 3d to 2d projection
; [IN] D0.W :      x3d
; [IN] D1.W :      y3d
; [IN] D2.W :      z
; [OUT] D0.W :     x2d
; [OUT] D1.W :     y2d
project:
       divs          d2,d0
       divs          d2,d1
       rts

; rot : 2d rotation of (a,b)
; [IN] D0.W :      a
; [IN] D1.W :      b
; [IN] D2.W :      angle
; [OUT] D2.W :     rotated a
; [OUT] D6.W :     rotated b
rot:
       move.l        #FX_Heap+sintable,a0
       move.w        d2,d3                       ; angle
       add.w         #MTHLIB_COS_OFS,d3
       and.w         #MTHLIB_OFS_MSK,d3
       move.w        (a0,d3.w),d3                ; d3 = cos(angle)
       move.w        d2,d4                       ; angle
       and.w         #MTHLIB_OFS_MSK,d4
       move.w        (a0,d4.w),d4                ; d4 = sin(angle)
       move.w        d3,d2                       ; d2 = c
       muls          d0,d2                       ; d2 = c*a
       swap          d2                          ; d2 = (c*a)>>16
       move.w        d4,d5                       ; d5 = s
       muls          d1,d5                       ; d5 = s*b
       swap          d5                          ; d5 = (s*b)>>16
       move.w        d4,d6                       ; d6 = s
       muls          d0,d6                       ; d6 = s*a
       swap          d6                          ; d6 = (s*_a)>>16
       move.w        d3,d7                       ; d7 = c
       muls          d1,d7                       ; d7 = c*b
       swap          d7                          ; d7 = (c*b)>>16
       sub.w         d5,d2                       ; d2 = c*a - s*b
       add.w         d7,d6                       ; d6 = s*a + c*b
       rts

xmsk:
       dc.b          128,64,32,16,8,4,2,1

       bss_c

bitplane:
       ds.b   320/8*180


       bss_any


fftData:
       ds.b   FFT_ENTRIES_COUNT*FFT_HISTORY_SIZE

       rsreset
s_FFTFramesPtr       rs.l   1
s_curFramePtr        rs.l   1
s_mode               rs.w   1
s_iter               rs.w   1
s_ptIndex            rs.w   1
s_rad                rs.w   1
s_ptCounter          rs.w   1
s_scale              rs.w   1
s_ang                rs.w   1
s_x3d                rs.w   1
s_z3d                rs.w   1
fft_frames           rs.b   FFT_ALLFRAMES_BYTES
precalc_frames       rs.b   ONE_FRAME_SIZE*PRECALC_FRAMES_COUNT
sintable             rs.b   2048
mul40                rs.w   180
s_fxsize             rs.w   1
    
FX_Heap:
       ds.b          s_fxsize