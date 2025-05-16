OFFSET EQU 4

testLabels_init:
  lea     testLabels_myroutine,a0
  ;>JS if (a0.ul != label("testLabels_myroutine")) debug("FAILED: lea     testLabels_myroutine,a0")
  lea     testLabels_mylabel+OFFSET,a1
  move.l  (a1),d0
  ;>JS if (d0.ul != 0xbadc0fee) debug("FAILED: lea     testLabels_mylabel+OFFSET,a1")
  move.l  #testLabels_mylabel,a2
  move.l  (a2),d0
  ;>JS if (d0.ul != 0xdeadbeef) debug("FAILED: move.l  #testLabels_mylabel,a2")
  move.l  #testLabels_mylabel+OFFSET,a3
  move.l  (a3),d0
  ;>JS if (d0.ul != 0xbadc0fee) debug("FAILED: move.l  #testLabels_mylabel+OFFSET,a3")
  move.l  #testLabels_myroutine,a4
  ;>JS if (a4.ul != label("testLabels_myroutine")) debug("FAILED: move.l  #testLabels_myroutine,a4")
;  move.l  #testLabels_myroutine+OFFSET,a5
  ;>-JS if (a5.ul != label("testLabels_myroutine")+4) debug("FAILED: move.l  #testLabels_myroutine+OFFSET,a5")
  jmp   (a4)
  rts

testLabels_myroutine:
  ;>JS alert("1st jump success")
  move.l  #testLabels_myroutine2,d0
  move.l  d0,a0
  jmp   (a0)
  rts

testLabels_myroutine2:
  ;>JS alert("2nd jump success, all good if no previous FAILED messages!")
  nop
  nop
  rts


testLabels_mylabel:
  dc.l  $deadbeef  
  dc.l  $badc0fee