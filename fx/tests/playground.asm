init:
  moveq #0,d0
  rts

update:
  addq.l #1,d0
  ;>JS ShowDebugLog("d0: " + regs.d[0]); 
  rts