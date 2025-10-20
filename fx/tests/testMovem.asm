
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

  move.l  a7,testMovem_sp
  lea     testMovem_all,a7
  movem.l (a7),d0-a6
  lea     testMovem_all2,a7
  movem.l d0-a6,(a7)
  lea     testMovem_all,a0
  move.w  #14,d7
.testNext:
  move.l  (a0)+,d0
  move.l  (a7)+,d1
  ;>JS if (d0.ul != d1.ul) debug("value differ");
  dbra    d7,.testNext
  move.l  testMovem_sp,a7

  move.l  a7,a0
  move.b  #42,-(sp)
  ;>JS if (a0.ul != a7.ul+2) debug("stack must remain on even address even for bygte operations");
  moveq   #0,d0
  move.b  (sp)+,d0
  ;>JS if (d0.ul != 42) debug("wrong stack behavior");
  ;>JS if (a0.ul != a7.ul) debug("stack must remain on even address even for bygte operations");
  rts

testMovem_blop:
  dc.w 1,2,3


testMovem_all:
  dc.l  1,2,3,4,5,6,7,8
  dc.l  1<<16,2<<16,3<<16,4<<16,5<<16,6<<16,7<<16,8<<16

testMovem_sp:
  dc.l  0

testMovem_all2:
  dcb.l 15,0
