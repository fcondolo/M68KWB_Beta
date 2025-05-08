; Demonstrates STe blitter fill using source XOR dest on a single bitplane
; Absolutely not optimized, for educational purpose

  section code

; replicate M68KWB's defines if you want to run this code on an actual emulator
  IFND M68KWB
SCREEN_HI      EQU $ffff8201
SCREEN_MID     EQU $ffff8203
SCREEN_LOW     EQU $ffff820d
STE_LINEOFFSET EQU $FFFF820F
STE_PIXOFFSET  EQU $FFFF8265
BLT_SRC_XINCR  EQU $FF8A20; // Source X Increment (15 Bit - Bit 0 is unused) - signed
BLT_SRC_YINCR  EQU $FF8A22; // Source Y Increment (15 Bit - Bit 0 is unused) - signed
BLT_SRC_ADRS   EQU $FF8A24; // Source Address (23 Bit - Bit 31..24, Bit 0 unused)
BLT_ENDMASK_1  EQU $FF8A28; // ENDMASK 1 (16 Bits)
BLT_ENDMASK_2  EQU $FF8A2A; // ENDMASK 2 (16 Bits)
BLT_ENDMASK_3  EQU $FF8A2C; // ENDMASK 3 (16 Bits)
BLT_DST_XINCR  EQU $FF8A2E; // Destination X Increment (15 Bit - Bit 0 is unused)
BLT_DST_YINCR  EQU $FF8A30; // Destination Y Increment (15 Bit - Bit 0 is unused)
BLT_DST_ADRS   EQU $FF8A32; // Destination Address (23 Bit - Bit 31..24, Bit 0 unused)
BLT_COUNT_X    EQU $FF8A36; // X Count (16 Bits)
BLT_COUNT_Y    EQU $FF8A38; // Y Count (16 Bits)
BLT_HOP        EQU $FF8A3A; // HOP (8 Bits)
BLT_OP         EQU $FF8A3B; // OP (8 Bits)
BLT_MISC_1     EQU $FF8A3C; // (8 Bits)
BLT_MISC_2     EQU $FF8A3D; // (8 Bits)
  ENDC

init:
  move.l        #screen1,screens
  move.l        #screen2,screens+4
  lea           $ff8240,a0
  lea           palette,a1
  move.w        #15,d7
.pal:
  move.w        (a1)+,(a0)+
  dbra          d7,.pal
  rts

; IN: a2 = bitplane to clear
clearBpl:
	lea			$ffff8a28.w,a1			; First register needed
	moveq		#-1,d1
	move.l		d1,(a1)+
	move.w		d1,(a1)+
	move.l		#2,(a1)+			; DstXinc.DstYinc
	move.l		a2,(a1)+			; DstPtr
	move.l		#(1<<16)+200*80,(a1)+		; Width.Height
	move.l		#$0000c000,(a1)			; Hop 
.waitBlt1:
	btst.b		#7,BLT_MISC_1
	nop
	bne.s		.waitBlt1
	rts

; d4: ofs
update:
  ; cls
	move.l		screens,a2
  bsr     clearBpl

  ; draw 2 horiz lines
	move.l		screens,a0
  add.l     d4,a0
  moveq     #-1,d0
  moveq     #0,d1
  REPT 6
  move.w    d0,(a0)+
  move.l    d1,(a0)+
  move.w    d1,(a0)+
  ENDR
	move.l		screens,a0
  add.l     d4,a0
  add.l     #100*160,a0
  REPT 6
  move.w    d0,(a0)+
  move.l    d1,(a0)+
  move.w    d1,(a0)+
  ENDR

  ; blitter fill
  move.l    screens,a0
	move.l		a0,BLT_SRC_ADRS
  add.l     #160,a0
	move.l		a0,BLT_DST_ADRS
	move.w		#2,BLT_SRC_XINCR
	move.w		#2,BLT_DST_XINCR
	move.w		#8,BLT_SRC_YINCR
	move.w		#8,BLT_DST_YINCR
	move.w		#1,BLT_COUNT_X
	move.w		#20*199,BLT_COUNT_Y
  move.b    #2,BLT_HOP
  move.b    #6,BLT_OP
  move.b    #0,BLT_MISC_2
  move.b    #1<<7,BLT_MISC_1
.waitBlt2:
	btst.b		#7,BLT_MISC_1
	nop
	bne.s		.waitBlt2

  move.l    screens,a0
  bsr       ShowScreen
  move.l    screens,d0
  move.l    screens+4,d1
  move.l    d0,screens+4
  move.l    d1,screens
  rts


; IN A0.l --> ptr to the screen buffer to set	 
ShowScreen:
     move.l    a0,d0
     swap      d0
     move.b    d0,SCREEN_HI
     move.l    a0,d0
     lsr.w     #8,d0
     move.b    d0,SCREEN_MID
     move.l    a0,d0
     move.b    d0,SCREEN_LOW
     rts


  section data


palette:
	dc.w		$000,$fff,$f00,$f00,$f00,$f00,$f00,$f00
	dc.w		$f00,$f00,$f00,$f00,$f00,$f00,$f00,$f00

screens:
  ds.l  2

  section bss

screen1:
  ds.b  32000
screen2:
  ds.b  32000
