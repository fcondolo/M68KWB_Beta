OFFSET EQU 4

init:
  lea     myroutine,a0
  ;>JS if (a0.ul != label("myroutine")) debug("FAILED: lea     myroutine,a0")
  lea     mylabel+OFFSET,a1
  move.l  (a1),d0
  ;>JS if (d0.ul != 0xbadc0fee) debug("FAILED: lea     mylabel+OFFSET,a1")
  move.l  #mylabel,a2
  move.l  (a2),d0
  ;>JS if (d0.ul != 0xdeadbeef) debug("FAILED: move.l  #mylabel,a2")
  move.l  #mylabel+OFFSET,a3
  move.l  (a3),d0
  ;>JS if (d0.ul != 0xbadc0fee) debug("FAILED: move.l  #mylabel+OFFSET,a3")
  move.l  #myroutine,a4
  ;>JS if (a4.ul != label("myroutine")) debug("FAILED: move.l  #myroutine,a4")
;  move.l  #myroutine+OFFSET,a5
  ;>-JS if (a5.ul != label("myroutine")+4) debug("FAILED: move.l  #myroutine+OFFSET,a5")
  jmp   (a4)
  rts

myroutine:
  ;>JS alert("1st jump success")
  move.l  #myroutine2,d0
  move.l  d0,a0
  jmp   (a0)
  rts

myroutine2:
  ;>JS alert("2nd jump success, all good if no previous FAILED messages!")
  nop
  nop
  rts

update:
  rts

mylabel:
  dc.l  $deadbeef  
  dc.l  $badc0fee