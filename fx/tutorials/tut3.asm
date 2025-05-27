; this is the main asm file. You may include other asm files here using the include "xxx.asm" directive

       code_f

openScreen:
       lea           CUSTOM,a6
       lea           bitplane,a0
       move.l        a0,BPL1PTH(a6)
       move.w        #$1200,BPLCON0(a6)
       move.w        #$4c81,DIWSTRT(a6)
       move.w        #$00c1,DIWSTOP(a6)
       move.w        #$0038,DDFSTRT(a6)
       move.w        #$00d0,DDFSTOP(a6)
       move.w        #$83c0,DMACON(a6)

       lea           CUSTOM,a6
       move.w        #$123,COLOR0(a6)
       move.w        #$ace,COLOR1(a6)
       rts

; a0 : destination bitplane
; d0 : pattern
drawSquare:
       move.w        #15,d7
.loopY:
       ; >JS print("d7 value =" + d7.uw) 
       move.w        d0,(a0)
       add.l         #40,a0
       ; >JS if (d7.uw == 12) debug("d7 equals 12: " + d7.uw) 
       dbra          d7,.loopY
       rts
       

       bss_c

bitplane:
       ds.b   320/8*180