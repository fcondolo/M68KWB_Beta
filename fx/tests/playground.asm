OFFSET EQU 4


init:
  rts

update:
  lea   mylabel,a0
  lea   mylabel+OFFSET,a1
  ;>JS debug();
  rts

mylabel:
  dc.l  $deadbeef  
  dc.l  $badc0fee