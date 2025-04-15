
d2b_init:
    lea         d2b_struct,a0
    lea         groundRoots_bobs,a1
    move.l      a1,D2B_HEADER_PTR(a0)
    move.w      (a1),d0
    add.w       d0,a1                   ; start of 1st list
    move.w      (a1)+,d0                ; output ofs
    move.l      a1,D2B_POINT_PTR(a0)
    lea         chunkyBuffer,a3
    move.l      a3,d3
    add.l       #127,d3
    and.l       #-128,d3                ; 128 bytes aligned
    move.l      d3,a3
    move.l      d3,D2B_CHUNKYBUFFER(a0)
    add.w       d0,a3                   ; output adrs
    move.l      a3,D2B_OUT_PTR(a0)

    ; initialize height buffer with 0
    move.l      D2B_CHUNKYBUFFER(a0),a0
    moveq       #0,d0
    move.w      #(PATH_W*PATH_H+3)/4-1,d7
.clrBuf:
    move.l      d0,(a0)+
    dbra        d7,.clrBuf    

    ; return value: aligned chunkybuffer
    lea         d2b_struct,a0
    move.l      D2B_CHUNKYBUFFER(a0),a0
    rts

d2b_update:
    lea         d2b_struct,a0
    move.l      D2B_POINT_PTR(a0),a1
    cmp.w       #$ffff,(a1)             ; list last point reached?
    bne.b       .doOnePoint
    addq.l      #2,a1                   ; next list
    move.w      (a1)+,d0                ; output ofs
    cmp.w       #0,d0                   ; end lists?
    bne.b       .updateOutAdrs
    rts
.updateOutAdrs:
    move.l      a1,D2B_POINT_PTR(a0)
    move.l      D2B_CHUNKYBUFFER(a0),a2
    add.w       d0,a2                   ; output adrs
    move.l      a2,D2B_OUT_PTR(a0)
.doOnePoint:
    move.l      D2B_OUT_PTR(a0),a3
    move.w      (a1)+,d0                ; point data
    move.l      a1,D2B_POINT_PTR(a0)    ; update struct
    move.w      d0,d1
    and.w       #$ff,d1                 ; size
    lsr.w       #8,d0                   ; deltas
    move.w      d0,d2
    and.w       #%1111,d2               ; y delta
    btst         #3,d2
    beq.b       .positivey
    and.w       #%111,d2
    neg.w       d2
    bra.b       .conty
.positivey:
    and.w       #%111,d2
.conty:
    asl.w       #7,d2   ; muls        #PATH_W,d2
    lsr.w       #4,d0
    btst        #3,d0
    beq.b       .positivex
    and.w       #%111,d0
    neg.w       d0
    bra.b       .contx
.positivex:
    and.w       #%111,d0
.contx:
    add.w       d2,d0
    add.w       d0,a3
    move.l      a3,D2B_OUT_PTR(a0)
    move.l      a3,d6
.pix:
    moveq       #0,d0
    move.b      (a3),d0
    add.w       #200,d0
    cmp.w       #255,d0
    ble.b       .noclamp
    move.w      #255,d0
.noclamp:
    move.b      d0,(a3)+
    dbra        d1,.pix
; blur
    and.l       #-128,d6    ; beginning of the line
    move.l      d6,a3
    move.w      #126,d7
    moveq       #0,d1
.blur:
    moveq       #0,d0
    move.b      (a3),d0
    add.w       d0,d0
    move.b      -1(a3),d1
    add.w       d1,d0
    move.b      1(a3),d1
    add.w       d1,d0
    lsr.w       #2,d0
    move.b      d0,(a3)+
    dbra        d7,.blur
    rts

    rsreset
D2B_HEADER_PTR      rs.l    1
D2B_POINT_PTR       rs.l    1
D2B_OUT_PTR         rs.l    1
D2B_CHUNKYBUFFER    rs.l    1
D2B_STRUCT_SIZE     rs.w    1

d2b_struct:         ds.b    D2B_STRUCT_SIZE

chunkyBuffer:
    ds.b    PATH_W*(PATH_H+1)+128       ; must be 128 bytes aligned
    even

    include "fx/amiga/Draw2Buffer/groundRootsData.asm"
