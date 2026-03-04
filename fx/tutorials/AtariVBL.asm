    jmp     DEFAULT_ENTRY_POINT
    rts

    include "atari_default_main.asm"


FX_INIT:
       move.l        #screen1,screens
       move.l        #screen2,screens+4
       move.l        screens,a0
       bsr           ShowScreen

       lea           $ff8240,a0
       lea           palette,a1
       move.w        #15,d7
.pal:
       move.w        (a1)+,(a0)+
       dbra          d7,.pal

       ; INSTALL THE VBL INTERRUPT
       move          #$2700,sr
	move.l 	#myVBL,$70.w
	move    	#$2300,sr
       rts


myVBL:
    movem.l      d0-d7/a0-a6,-(sp)


.endVbl:
    movem.l      (sp)+,d0-d7/a0-a6
    rte

  

; IN: a2 = bitplane to clear
clearBpl:
	lea		$ffff8a28.w,a1			; First register needed
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



FX_UPDATE:
; compute ofs in d4
  move.w        lastUpdateFrameIndex,d4
  and.w         #63,d4
  add.w         #16,d4
  muls          #160,d4
  add.w         #48,d4
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
	move.l		a0,BLT_TGT_ADRS
	move.w		#2,BLT_SRC_XINCR
	move.w		#2,BLT_TGT_XINCR
	move.w		#8,BLT_SRC_YINCR
	move.w		#8,BLT_TGT_YINCR
	move.w		#1,BLT_COUNT_X
	move.w        #20*199,BLT_COUNT_Y
       move.b        #2,BLT_HOP
       move.b        #6,BLT_OP
       move.b        #0,BLT_MISC_2
       move.b        #1<<7,BLT_MISC_1
.waitBlt2:
	btst.b		#7,BLT_MISC_1
	nop
	bne.s		.waitBlt2

  add.w   #1,lastUpdateFrameIndex
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


FX_END:
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

lastUpdateFrameIndex:
  ds.w  1