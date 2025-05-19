    section bss

old_resolution:
        ds.w    1
old_stack:
        ds.l    1
old_screen:
        ds.l    1
old_palette:
    ds.l        8
ints_backup:
    ds.b	    30
; vbl counting heuristic:
; in main loop : build a frame to show and timestamp it with lastUpdateFrameIndex = VBLCounter
; in VBL interrupt: VBLCounter++, and if (lastShownFrameIndex < lastUpdateFrameIndex) { show lastUpdateFrameIndex screen; lastShownFrameIndex = lastUpdateFrameIndex}
VBLCounter:             ; used as timestamp
    ds.l        1
lastUpdateFrameIndex:          ; timestamp of the latest built frame
    ds.l        1
lastShownFrameIndex:           ; timestamp of the latest frame shown on screen
    ds.l        1

    section code


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

DEFAULT_ENTRY_POINT:	
    ;SHOW_FPS EQU 1

    bsr     backupSystem
    move.l  #0,VBLCounter
    move.l  #0,lastUpdateFrameIndex
    move.l  #0,lastShownFrameIndex
    
    jsr     FX_INIT
    IFD M68KWB
    rts
    ENDC

DEFAULT_MAIN_LOOP:
    move.l  lastShownFrameIndex,d0
    cmp.l   lastUpdateFrameIndex,d0
    blo.b   DEFAULT_MAIN_LOOP

    ifd SHOW_FPS
    move.w  #$f00,$ff8240
    endc
    jsr     FX_UPDATE
    ifd SHOW_FPS
    move.w  #$000,$ff8240
    endc

    add.l   #1,lastUpdateFrameIndex

    cmp.b   #$39,$fffffc02.w                ;check for space key
    beq.w   DEFUALT_EXIT                    ;exit    

    IFD M68KWB
    rts
    ELSE
    bra     DEFAULT_MAIN_LOOP
    ENDC

DEFUALT_EXIT:    
    jsr     FX_END

    bsr     restoreSystem
    
    clr     -(a7)
    trap    #1
    rts


backupSystem:
    ; enter supervisor
    clr.l   -(a7)                   ; clear stack
    move.w  #32,-(a7)               ; supervisor
    trap    #1                      ; call gemdos
    addq.l  #6,a7                   ; clean up stack
    move.l  d0,old_stack            ; backup old stack pointer

    ; save the old palette
    lea     old_palette,a0          ; put backup address in a0
    movem.l $ffff8240,d0-d7         ; all palettes in d0-d7
    movem.l d0-d7,(a0)              ; move data into old_palette

    ; save the old screen adress
    move.w  #2,-(a7)                ; get physbase
    trap    #14
    addq.l  #2,a7
    move.l  d0,old_screen           ; save old screen address

    ; save the old resolution and change resolution to low (0)
    move.w  #4,-(a7)                ; get resolution
    trap    #14
    addq.l  #2,a7
    move.w  d0,old_resolution       ; save resolution
    
    move.w  #0,-(a7)                ; low resolution
    move.l  #-1,-(a7)               ; keep physbase
    move.l  #-1,-(a7)               ; keep logbase
    move.w  #5,-(a7)                ; change screen
    trap    #14
    add.l   #12,a7

    ; backup Interruptions
	move.w	#$2700,sr
	lea	    ints_backup,a0
	move.l	$68.w,(a0)+             ; M68KWB_NOERROR
	move.l	$70.w,(a0)+             ; M68KWB_NOERROR
	move.l	$118.w,(a0)+             ; M68KWB_NOERROR
	move.l	$120.w,(a0)+             ; M68KWB_NOERROR
	move.l	$134.w,(a0)+             ; M68KWB_NOERROR
	move.b	$fffffa07.w,(a0)+
	move.b	$fffffa09.w,(a0)+
	move.b	$fffffa0f.w,(a0)+
	move.b	$fffffa13.w,(a0)+
	move.b	$fffffa15.w,(a0)+
	move.b	$fffffa17.w,(a0)+
	move.b	$fffffa19.w,(a0)+
	move.b	$fffffa1b.w,(a0)+
	move.b	$fffffa1f.w,(a0)+
	move.b	$fffffa21.w,(a0)+
	move.w	#$2300,sr
    rts

restoreSystem:
    ; restore interruptions
	move.w	#$2700,sr
	lea	    ints_backup,a0
	move.l	(a0)+,$68.w
	move.l	(a0)+,$70.w
	move.l	(a0)+,$118.w
	move.l	(a0)+,$120.w
	move.l	(a0)+,$134.w
	move.b	(a0)+,$fffffa07.w
	move.b	(a0)+,$fffffa09.w
	move.b	(a0)+,$fffffa0f.w
	move.b	(a0)+,$fffffa13.w
	move.b	(a0)+,$fffffa15.w
	move.b	(a0)+,$fffffa17.w
	move.b	(a0)+,$fffffa19.w
	move.b	(a0)+,$fffffa1b.w
	move.b	(a0)+,$fffffa1f.w
	move.b	(a0)+,$fffffa21.w
	move.w	#$2300,sr


    ; restores the old resolution and screen adress
    move.b	#0,$FFFF8265            ; STE_PIXOFFSET
    move.b  #0,$FFFF820F            ; STE_LINEOFFSET
    move.w  old_resolution,d0       ; res in d0
    move.w  d0,-(a7)                ; push resolution
    move.l  old_screen,d0           ; screen in d0
    move.l  d0,-(a7)                ; push physbase
    move.l  d0,-(a7)                ; push logbase
    move.w  #5,-(a7)                ; change screen
    trap    #14
    add.l   #12,a7

    ; restores the old palette
    move.l  #old_palette,a0         ; palette pointer in a0
    movem.l (a0),d0-d7              ; move palette data
    movem.l d0-d7,$ffff8240         ; smack palette in

    ; set user mode again
    move.l  old_stack,-(a7)         ; restore old stack pointer
    move.w  #32,-(a7)               ; back to user mode
    trap    #1                       ; call gemdos
    addq.l  #6,a7                   ; clear stack
    
    rts

