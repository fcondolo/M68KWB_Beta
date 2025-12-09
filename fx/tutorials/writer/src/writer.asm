    section code

init:
    bsr         font_init

    lea         $dff000,a6
    ;>JS lock('a6', 0xffffffff, "custom regs")
    move.l      #cplist,COP1LCH(a6)
    move.w      $83c0,DMACON(a6)         ;  blitter + copper + bitplane DMA
    move.w      #$000,COLOR0(a6)
    move.w      #$fff,COLOR1(a6)
    rts

update:
    bsr         font_draw
    move.l      #backBuf,BPL1PTH(a6)
    rts    

    include "src/font.asm"

    section data_c
    include "src/data.asm"

    section bss_c
    include "src/bss.asm"
