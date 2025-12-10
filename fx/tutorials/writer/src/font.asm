    IFD TARGET_OCS
SCR_W_BYTES EQU 320/8
SCR_H       EQU 256
    ELSE
SCR_W_BYTES EQU 160
SCR_H       EQU 200
    ENDC

font_init:
    rts

; IN: a0.l ==> destination bitplane
font_draw:
    ;>JS limitWrite(a0.ul, a0.ul+SCR_W_BYTES*SCR_H)

    lea         text,a1
    lea         fontUV,a2
    lea         fontData,a3
    move.l      a0,a4
    ;>JS lock('a2', 0xffffffff, "font UV")
    ;>JS lock('a3', 0xffffffff, "font data")
    ;>JS lock('a4', 0xffffffff, "destination bitplane copy")

    moveq       #0,d2           ; char index in line
.lp:    
    moveq       #0,d0
    move.b      (a1)+,d0        ; fetch next ascii code M68KWB_NOERROR
    beq.b       .endLp
    cmp.b       #ASCII_NEWLINE,d0
    bne.b       .notNewLine
    add.l       #SCR_W_BYTES*(FONT_CHAR_HEIGHT+2),a4    ; M68KWB_NOERROR
    move.l      a4,a0
    bra.b       .lp
.notNewLine:
    sub.w       #ASCII_SPACE,d0     ; 1st char in font
    add.w       d0,d0               ; UV table offset (words)
    move.w      (a2,d0.w),d0        ; UV
    moveq       #0,d1               ; bitplane offset
    move.w      #FONT_CHAR_HEIGHT-1,d7
    ;>JS limitRead(label("fontData"), label("fontData")+TOOLS.getFileSizeFromURL("data/font8x8_bitplanes.bin"))
.drwChar:
    move.b      (a3,d0.w),(a0,d1.w) ; copy char line
    add.w       #FONT_IMG_W_BYTES,d0
    add.w       #SCR_W_BYTES,d1
    dbra        d7,.drwChar
    addq.l      #1,a0
    IFD TARGET_STE
    eor.w       #1,d2
    bne.b       .doneChar
    addq.l      #6,a0
.doneChar:
    ENDC
    ;>JS freeRead()
    bra         .lp
.endLp:
    ;>JS unlock('a2')
    ;>JS unlock('a3')
    ;>JS unlock('a4')
    rts