BLT_SRC_XINCR         EQU   $FF8A20; // Source X Increment (15 Bit - Bit 0 is unused) - signed
BLT_SRC_YINCR         EQU   $FF8A22; // Source Y Increment (15 Bit - Bit 0 is unused) - signed
BLT_SRC_ADRS          EQU   $FF8A24; // Source Address (23 Bit - Bit 31..24, Bit 0 unused)
BLT_ENDMASK_1         EQU   $FF8A28; // ENDMASK 1 (16 Bits)
BLT_ENDMASK_2         EQU   $FF8A2A; // ENDMASK 2 (16 Bits)
BLT_ENDMASK_3         EQU   $FF8A2C; // ENDMASK 3 (16 Bits)
BLT_DST_XINCR         EQU   $FF8A2E; // Destination X Increment (15 Bit - Bit 0 is unused)
BLT_DST_YINCR         EQU   $FF8A30; // Destination Y Increment (15 Bit - Bit 0 is unused)
BLT_DST_ADRS          EQU   $FF8A32; // Destination Address (23 Bit - Bit 31..24, Bit 0 unused)
BLT_COUNT_X           EQU   $FF8A36; // X Count (16 Bits)
BLT_COUNT_Y           EQU   $FF8A38; // Y Count (16 Bits)
BLT_HOP               EQU   $FF8A3A; // HOP (8 Bits)
BLT_OP                EQU   $FF8A3B; // OP (8 Bits)
BLT_MISC_1            EQU   $FF8A3C; // (8 Bits)
BLT_MISC_2            EQU   $FF8A3D; // (8 Bits)
SCREEN_HI             EQU   $ff8201
SCREEN_MID            EQU   $ff8203
SCREEN_LOW            EQU   $ff820d

WAIT_BLITTER: macro
Loop\@:
       btst.b #7,BLT_MISC_1  ;test and set Busy-Bit
       nop                  ;do a NOP in any case
       bne.s Loop\@           ;if Busy-Bit was "1", go to Loop
endm



setPalette
       lea           $ff8240,a0
       lea           palette,a1
       move.w        #15,d7
.pal:
       move.w        (a1)+,(a0)+
       dbra          d7,.pal
       rts

       
       
update:
       ; move to next x
       move.w        bltx,d0
       addq.w        #1,d0
       cmp.w         #319,d0
       ble.b         .noLoop
       moveq         #0,d0
.noLoop:
       move.w        d0,bltx
       ; determine screen x offset
       move.w        d0,d1
       and.w         #$fff0,d1
       lsr.w         #1,d1
       move.l        #screenBuf,a0
       add.w         d1,a0
       move.l        #image,a1
       add.w         d1,a1
       ; determine shift
       and.w         #15,d0
       move.w        #1<<15,d1
       lsr.w         d0,d1

       ; blit bitplane 1
        move.w       #0,BLT_SRC_XINCR
        move.w       #160,BLT_SRC_YINCR

        move.w       #0,BLT_DST_XINCR
        move.w       #160,BLT_DST_YINCR

        move.l       a1,BLT_SRC_ADRS
        move.l       a0,BLT_DST_ADRS

        move.w       d1,BLT_ENDMASK_1
        move.w       d1,BLT_ENDMASK_2
        move.w       d1,BLT_ENDMASK_3

        move.w       #1,BLT_COUNT_X
        move.w       #200,BLT_COUNT_Y

        move.l       #$0203c000,BLT_HOP

       WAIT_BLITTER
        
       ; blit bitplane 2
        move.w       #1,BLT_COUNT_X
        move.w       #200,BLT_COUNT_Y
        addq.l       #2,a0
        addq.l       #2,a1
        move.l       a1,BLT_SRC_ADRS
        move.l       a0,BLT_DST_ADRS
        move.l       #$0203c000,BLT_HOP

       WAIT_BLITTER

       ; blit bitplane 3
        move.w       #1,BLT_COUNT_X
        move.w       #200,BLT_COUNT_Y
        addq.l       #2,a0
        addq.l       #2,a1
        move.l       a1,BLT_SRC_ADRS
        move.l       a0,BLT_DST_ADRS
        move.l       #$0203c000,BLT_HOP

       WAIT_BLITTER

       ; blit bitplane 4
        move.w       #1,BLT_COUNT_X
        move.w       #200,BLT_COUNT_Y
        addq.l       #2,a0
        addq.l       #2,a1
        move.l       a1,BLT_SRC_ADRS
        move.l       a0,BLT_DST_ADRS
        move.l       #$0203c000,BLT_HOP

       WAIT_BLITTER

       move.l        #screenBuf,a0
       move.l        a0,d0
       swap          d0
       move.b        d0,SCREEN_HI
       move.l        a0,d0
       lsr.w         #8,d0
       move.b        d0,SCREEN_MID
       move.l        a0,d0
       move.b        d0,SCREEN_LOW
       rts


palette
;	palette for: Explora-ST
;	Thu Jan 04 2024 01:29:57 GMT+0100 (Central European Standard Time)
	dc.w	$0000
	dc.w	$0808
	dc.w	$0888
	dc.w	$0181
	dc.w	$0199
	dc.w	$0119
	dc.w	$0922
	dc.w	$0bb3
	dc.w	$0cc4
	dc.w	$0a3a
	dc.w	$044b
	dc.w	$02a2
	dc.w	$0ddc
	dc.w	$0665
	dc.w	$0ee6
	dc.w	$0ff7


screenBuf
    ds.b    32000

bltx:
       dc.w 0

image     incbin "SYSROOT/images/Explora-bitplanes-STE.bin"