; THIS ROUTINE WAS FOUND HERE: https://forum.amiga.org/index.php?topic=23972.0
; AUTHOR: balrogsoft - Balrog Software · http://www.amigaskool.net
; Thank you balrogsoft!


SINGLE = 0      ; 2 = SINGLE BIT WIDTH
BYTEWIDTH = 40

INITLINE:
   LEA.L   $DFF000,A6

.WAIT:   
   BTST   #$6,$2(A6)
   BNE.S   .WAIT

   MOVEQ   #-1,D1
   MOVE.L   D1,$44(A6)      ; FirstLastMask
   MOVE.W   #$8000,$74(A6)      ; BLT data A
   MOVE.W   #BYTEWIDTH,$60(A6)   ; Tot.Screen Width
   MOVE.W   #$FFFF,$72(A6)
   RTS

;*****************
;*   DRAW LINE   *
;*****************

; USES D0/D1/D2/D3/D4/D7/A5/A6
; A5: SCREEN PTR
DRAWLINE:
   SUB.W   D3,D1
   MULU   #40,D3      ; ScreenWidth * D3

   MOVEQ   #$F,D4
   AND.W   D2,D4      ; Get lowest bits from D2

;--------- SELECT OCTANT ---------

   SUB.W   D2,D0
   BLT.S   DRAW_DONT0146
   TST.W   D1
   BLT.S   DRAW_DONT04

   CMP.W   D0,D1
   BGE.S   DRAW_SELECT0
   MOVEQ   #$11+SINGLE,D7      ; Select Oct 4
   BRA.S   DRAW_OCTSELECTED
DRAW_SELECT0:
   MOVEQ   #1+SINGLE,D7      ; Select Oct 0
   EXG   D0,D1
   BRA.S   DRAW_OCTSELECTED

DRAW_DONT04:
   NEG.W   D1
   CMP.W   D0,D1
   BGE.S   DRAW_SELECT1
   MOVEQ   #$19+SINGLE,D7      ; Select Oct 6
   BRA.S   DRAW_OCTSELECTED
DRAW_SELECT1:
   MOVEQ   #5+SINGLE,D7      ; Select Oct 1
   EXG   D0,D1
   BRA.S   DRAW_OCTSELECTED


DRAW_DONT0146:
   NEG.W   D0
   TST.W   D1
   BLT.S   DRAW_DONT25
   CMP.W   D0,D1
   BGE.S   DRAW_SELECT2
   MOVEQ   #$15+SINGLE,D7      ; Select Oct 5
   BRA.S   DRAW_OCTSELECTED
DRAW_SELECT2:
   MOVEQ   #9+SINGLE,D7      ; Select Oct 2
   EXG   D0,D1
   BRA.S   DRAW_OCTSELECTED
DRAW_DONT25:
   NEG.W   D1
   CMP.W   D0,D1
   BGE.S   DRAW_SELECT3
   MOVEQ   #$1D+SINGLE,D7      ; Select Oct 7
   BRA.S   DRAW_OCTSELECTED
DRAW_SELECT3:
   MOVEQ   #$D+SINGLE,D7      ; Select Oct 3
   EXG   D0,D1

;---------   CALCULATE START   ---------

DRAW_OCTSELECTED:
   ADD.W   D1,D1         ; 2*dy
   ASR.W   #3,D2         ; x=x/8
   EXT.L   D2
   ADD.L   D2,D3         ; d3 = x+y*40 = screen pos
   MOVE.W   D1,D2         ; d2 = 2*dy
   SUB.W   D0,D2         ; d2 = 2*dy-dx
   BGE.S   DRAW_DONTSETSIGN
   ORI.W   #$40,D7         ; dx < 2*dy
DRAW_DONTSETSIGN:

;---------   SET BLITTER   ---------

.WAIT:
   BTST.B   #$6,$2(A6)      ; Wait on the blitter
   BNE.S   .WAIT

   MOVE.W   D2,$52(A6)      ; 2*dy-dx
   MOVE.W   D1,$62(A6)      ; 2*d2
   SUB.W   D0,D2         ; d2 = 2*dy-dx-dx
   MOVE.W   D2,$64(A6)      ; 2*dy-2*dx

;---------   MAKE LENGTH   ---------

   ASL.W   #6,D0         ; d0 = 64*dx
   ADD.W   #$0042,D0      ; d0 = 64*(dx+1)+2

;---------   MAKE CONTROL 0+1   ---------

   ROR.W   #4,D4
   ORI.W   #$BEA,D4      ; $B4A - DMA + Minterm
   SWAP   D7
   MOVE.W   D4,D7
   SWAP   D7
   ADD.L   A5,D3      ; SCREEN PTR

   MOVE.L   D7,$40(A6)      ; BLTCON0 + BLTCON1
   MOVE.L   D3,$48(A6)      ; Source C
   MOVE.L   D3,$54(A6)      ; Destination D
   MOVE.W   D0,$58(A6)      ; Size M68KWB_NOERROR
   RTS