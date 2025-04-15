       code_any

       include "../lib_math.asm"

init:
       lea           sintable,a0
       bsr           lib_math_sin
       bsr           setPalette
       rts


setPalette:
       lea           CUSTOM,a6
       move.w        #$123,COLOR0(a6)
       move.w        #$ace,COLOR1(a6)
       rts


       bss_c

bitplane:
       ds.b   320/8*180

       bss_any

sintable:
       ds.b   2048
       