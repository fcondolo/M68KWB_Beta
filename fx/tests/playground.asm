DIV_RANGE = 3072

  macro   DELTA_PAIR_LUT
  sub.l   \1,\2
  and.l   d7,\2
  move.w  (a4,\2),\2
  swap    \2
  move.w  (a4,\2),\2
  swap    \2
  endm

init:
  DELTA_PAIR_LUT d0,d2
  move.l  #$1000,a0
  lea     DivLut+DIV_RANGE*2-Vars(a5),a0
  rts

  
update:
  rts


Vars:


frame: dc.w 0

DivLut:
        ds.w    16
