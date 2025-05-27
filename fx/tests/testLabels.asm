OFFSET EQU 4

testLabels_init:
  ; TEST DCB.x, BLK.w
  ;
  lea     dcbdata,a0
  move.w  -2(a0),d0
  ;>JS if (d0.uw != 42) debug();
  move.l  (a0)+,d0
  ;>JS if (d0.ul != 0xfffffffe) debug();
  move.l  (a0)+,d0
  ;>JS if (d0.ul != 0xfffffffe) debug();
  move.l  (a0)+,d0
  ;>JS if (d0.ul != 0xfffffffe) debug();
  move.l  (a0)+,d0
  ;>JS if (d0.ul != 0xfffffffe) debug();
  move.b  (a0)+,d0
  ;>JS if (d0.ub != 0x42) debug();
  move.b  (a0)+,d0
  ;>JS if (d0.ub != 0x42) debug();
  move.b  (a0)+,d0
  ;>JS if (d0.ub != 0x42) debug();
  move.b  (a0)+,d0
  ;>JS if (d0.ub != 0x42) debug();
  move.w  (a0)+,d0
  ;>JS if (d0.uw != 0) debug();
  move.w  (a0)+,d0
  ;>JS if (d0.uw != 0) debug();
  move.w  (a0)+,d0
  ;>JS if (d0.uw != 52) debug();
  
  ; TEST LABELS
  ;
  lea       testLabels_mylabel,a0
  move.w    #2,d0
	lea	      (a0,d0),a3
  ;>JS if (a3.ul != a0.ul+2) debug();
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

  dc.w    42    ; before dcb data
dcbdata:
  dcb.l   4,-2
  blk.b   4,$42
  dcb.w   2
  dc.w    52    ; after dcb data
