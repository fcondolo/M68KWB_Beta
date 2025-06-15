INTERLEAVED = 0         ; Interleaved bitplanes?

        ifne    INTERLEAVED
SCREEN_MOD = 12 ; modulo (interleaved)
        else
SCREEN_MOD = 0          ; modulo (non-interleaved)
        endc

init:
  lea       blip,a0
  ;>JS WATCHES.add("test1", a0.ul, WATCH_WORD, WATCH_HEX);
  ;>JS WATCHES.add("frame", label("frame"), WATCH_WORD, WATCH_HEX);
  move.w    #2,d0
	lea	      (a0,d0),a3
  ;>JS if (a3.ul != a0.ul+2) debug();
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

  moveq     #0,d0
  moveq     #0,d1
  moveq     #0,d2
  lea       blop,a0
  movem.w   (a0),d0-d2
  ;>JS if (a0.ul != label("blop")) debug("should not increment a0")
  ;>JS if (d0.uw != 1) debug("movem wrong value")
  ;>JS if (d1.uw != 2) debug("movem wrong value")
  ;>JS if (d2.uw != 3) debug("movem wrong value")
  move.w #4,d0
  move.w #5,d1
  move.w #6,d2
  movem.w d0-d2,(a0)
  ;>JS if (a0.ul != label("blop")) debug("should not increment a0")
  moveq     #0,d0
  moveq     #0,d1
  moveq     #0,d2
  movem.w   (a0),d0-d2
  ;>JS if (a0.ul != label("blop")) debug("should not increment a0")
  ;>JS if (d0.uw != 4) debug("movem wrong value")
  ;>JS if (d1.uw != 5) debug("movem wrong value")
  ;>JS if (d2.uw != 6) debug("movem wrong value")
  rts

blip:
  dc.b "ABCD"

blop:
  dc.w 1,2,3
  REPT 4
  dc.w  2*REPTN
  dc.w  REPTN*4+1
  ENDR
  
update:
  add.w #1,frame
  rts

frame: dc.w 0
