
testBranches_init:
  move.w    #10,d0
  cmp.w     #10,d0
  bhs       .ww
  ;>JS debug();
.ww:  
  move.w    #11,d0
  cmp.w     #10,d0
  bhs       .ww2
  ;>JS debug();
.ww2:
  move.w    #9,d0
  cmp.w     #10,d0
  bhs       .ww3
  bra     .ww4
.ww3:
  ;>JS debug();
.ww4:
  move.w    #10,d0
  cmp.w     #11,d0
  blo       .ww5
  ;>JS debug();
.ww5:  
  move.w    #10,d0
  cmp.w     #9,d0
  blo       .ww6
  bra     .ww7
.ww6:  
  ;>JS debug();
.ww7:  

  rts



