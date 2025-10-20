
testshifts_init:

  lea     shiftbuf,a0

  move.w  #2,(a0)
  lsl.w   (a0)
  move.w  (a0),d0
  ;>JS if(d0.uw != 4) debug("lsl.w (a0) failed");

  move.w  #2,(a0)
  lsr.w   (a0)
  move.w  (a0),d0
  ;>JS if(d0.uw != 1) debug("lsr.w (a0) failed");

  move.w  #-2,(a0)
  asl.w   (a0)
  move.w  (a0),d0
  ;>JS if(d0.iw != -4) debug("asl.w (a0) failed");

  move.w  #-2,(a0)
  asr.w   (a0)
  move.w  (a0),d0
  ;>JS if(d0.iw != -1) debug("asr.w (a0) failed");

  move.w  #$AAAA,(a0)
  rol.w   shiftbuf
  move.w  (a0),d0
  ;>JS if(d0.uw != 0x5555) debug("rol.w (a0) failed");

  move.w  #$AAAA,(a0)
  ror.w   shiftbuf
  move.w  (a0),d0
  ;>JS if(d0.uw != 0x5555) debug("ror.w (a0) failed");

  move.w  #2,d0
  lsl.w   #1,d0
  ;>JS if(d0.uw != 4) debug("lsl.w d0 failed");

  move.w  #2,d0
  lsr.w   #1,d0
  ;>JS if(d0.uw != 1) debug("lsr.w d0 failed");

  move.w  #-2,d0
  asl.w   #1,d0
  ;>JS if(d0.iw != -4) debug("asl.w d0 failed");

  move.w  #-2,d0
  asr.w   #1,d0
  ;>JS if(d0.iw != -1) debug("asr.w d0 failed");

  move.w  #$AAAA,d0
  rol.w   #1,d0
  ;>JS if(d0.uw != 0x5555) debug("rol.w d0 failed");

  move.w  #%1100110011001100,d0
  ror.w   #1,d0
  ;>JS if(d0.uw != 0b0110011001100110) debug("ror.w d0 failed");
  rts

shiftbuf:
  ds.w    1