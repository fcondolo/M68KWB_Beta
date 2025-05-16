
testMovem_init:
  moveq     #0,d0
  moveq     #0,d1
  moveq     #0,d2
  lea       testMovem_blop,a0
  movem.w   (a0),d0-d2
  ;>JS if (a0.ul != label("testMovem_blop")) debug("should not increment a0")
  ;>JS if (d0.uw != 1) debug("movem wrong value")
  ;>JS if (d1.uw != 2) debug("movem wrong value")
  ;>JS if (d2.uw != 3) debug("movem wrong value")
  move.w #4,d0
  move.w #5,d1
  move.w #6,d2
  movem.w d0-d2,(a0)
  ;>JS if (a0.ul != label("testMovem_blop")) debug("should not increment a0")
  moveq     #0,d0
  moveq     #0,d1
  moveq     #0,d2
  movem.w   (a0),d0-d2
  ;>JS if (a0.ul != label("testMovem_blop")) debug("should not increment a0")
  ;>JS if (d0.uw != 4) debug("movem wrong value")
  ;>JS if (d1.uw != 5) debug("movem wrong value")
  ;>JS if (d2.uw != 6) debug("movem wrong value")
  rts

testMovem_blop:
  dc.w 1,2,3


