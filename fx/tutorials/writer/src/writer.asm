    section code

init:
    bsr         font_init

    IFD TARGET_OCS
    lea         $dff000,a6
    ;>JS lock('a6', 0xffffffff, "custom regs")
    move.l      #cplist,COP1LCH(a6)
    move.w      $83c0,DMACON(a6)         ;  blitter + copper + bitplane DMA
    move.w      #$000,COLOR0(a6)
    move.w      #$fff,COLOR1(a6)
    ELSE
    lea         $ffff8000,a6
    ;>JS lock('a6', 0xffffffff, "custom regs")
    move.w      #$000,$240(a6)
    move.w      #$fff,$242(a6)    
    ENDC
    rts

showA0  MACRO
    IFD TARGET_OCS
    move.l      a0,BPL1PTH(a6)
    ELSE
    move.l      a0,d0
    swap        d0
    move.b      d0,$201(a6) ; SCREEN HI
    move.l      a0,d0
    lsr.w       #8,d0
    move.b      d0,$203(a6) ; SCREEN MID
    move.l      a0,d0
    move.b      d0,$20d(a6) ; SCREEN LOW
    ENDC
    ENDM

update:
    lea         backBuf,a0
    bsr         font_draw
    lea         backBuf,a0
    showA0
    rts    

    include "src/font.asm"

    section data_c
    include "src/data.asm"

    section bss_c
    include "src/bss.asm"
