    
font_init:
    rts

; IN: a0.l ==> destination bitplane
font_draw:
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

    ;>JS unlock('a2')
    ;>JS unlock('a3')
    ;>JS unlock('a4')
    rts