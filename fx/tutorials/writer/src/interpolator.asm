interp_init:
    lea         xofsmsk,a0
    move.w      #SCR_W-1,d7
    moveq       #0,d0
    move.w      #%10000000,d2
.buildxtable:
    move.w      d0,d1
    lsr.w       #3,d1
    move.w      d1,(a0)+
    move.w      d2,(a0)+
    lsr.w       #1,d2
    bne.b       .noreset
    move.w      #%10000000,d2
.noreset:
    addq.w      #1,d0
    dbra        d7,.buildxtable

    lea         points(a5),a0
    move.w      #PTS_MAXCOUNT-1,d7
.initPt:
    move.w      #0,pt_lifeTime(a0)              ; set point as available
    lea         pt_structLen(a0),a0             ; go to next point
    dbra        d7,.initPt

    move.w      #MODE_BOT_TOP,mode(a5)          ; set mode to bottom-to-top (for later extensions)
    move.l      #backBuf+SCR_W_BYTES*(SCR_H-1),readBackbufPtr(a5)   ; draw from the bottom of the backbuffer
    move.w      #1<<7,readxMsk(a5)              ; draw left to right, leftmost bit in a byte is 7
    move.w      #0,readxByte(a5)                ; 1st byte to the left of current line
    move.w      #0,readX(a5)                    ; current X in 0..319 coord system
    move.w      #1,readDirX(a5)
    move.w      #SCR_H-1,readY(a5)              ; current Y in 0..255 coord system

    lea         mulyTable(a5),a0                ; *40 table
    move.w      #SCR_H-1,d7
    moveq       #0,d0
.mul:
    move.w      d0,(a0)+,
    add.w       #SCR_W_BYTES,d0
    dbra        d7,.mul
    rts

interp_spawn:
    cmp.w       #MODE_OFF,mode(a5)              ; check if spawner is active
    bne.b       .continue
    rts
.continue:    

    ; step 1 : find a free point
    lea         points(a5),a0
    move.w      #PTS_MAXCOUNT-1,d7
.searchPt:
    cmp.w       #0,pt_lifeTime(a0)
    beq.b       .ptFound
    lea         pt_structLen(a0),a0
    dbra        d7,.searchPt    
    ;>-JS debug("increase PTS_MAXCOUNT")
 
    ; step 2: find next lit pixel in backbuffer
.ptFound:
    move.l      readBackbufPtr(a5),a1               ; backbuffer et current Y
    move.w      readxByte(a5),d0                    ; current read X byte (0..SCR_W_BYTES-1)
    move.w      readxMsk(a5),d1                     ; current x mask
tryAgain:    
    move.b      (a1,d0.w),d2                        ; current byte
    and.w       d1,d2                               ; mask for current x
    move.l      a1,d6
    sub.l       #backBuf,d6
    add.w       d0,d6
    move.w      d6,pt_targetOfs(a0)
    move.w      d1,pt_targetMsk(a0)
    cmp.w       #-1,readDirX(a5)
    beq.b       rightToLeft
    add.w       #1,readX(a5)
    lsr.w       #1,d1
    bne         nowrapMsk1          ; next byte to the right?
    move.w      #1<<7,d1            ; new mask
    addq.w      #1,d0               ; update bitplane index
    cmp.w       #SCR_W_BYTES-1,d0   ; all horiz bytes done?
    ble.b       noWrapX             ; nope ==> continue on this line
    moveq       #1,d1               ; new mask (we're going right to left now)
    subq.w      #1,d0               ; update bitplane index
    move.w      #319,readX(a5)
    move.w      #-1,readDirX(a5)    ; yep ==> now go from right to left
    sub.l       #SCR_W_BYTES,a1     ; next line up
    move.l      a1,readBackbufPtr(a5)
    subq.w      #1,readY(a5)        ; new read y
    bgt.b       noWrapX            ; reached top of the screen?
    move.w      #MODE_OFF,mode(a5)  ; yep ==> stop the system
    rts    

rightToLeft:
    sub.w       #1,readX(a5)
    add.b       d1,d1
    bne         nowrapMsk1          ; next byte to the right?
    move.w      #1,d1               ; new mask
    subq.w      #1,d0               ; next x
    cmp.w       #0,d0   ; all horiz bytes done?
    bge.b       noWrapX            ; nope ==> continue on this line
    addq.w      #1,d0               ; start X
    move.w      #0,readX(a5)
    move.w      #1,readDirX(a5)    ; yep ==> now go from right to left
    move.w      #1<<7,d1
    sub.l       #SCR_W_BYTES,a1     ; next line up
    move.l      a1,readBackbufPtr(a5)
    subq.w      #1,readY(a5)        ; new read y
    bgt.b       noWrapX            ; reached top of the screen?
    move.w      #MODE_OFF,mode(a5)  ; yep ==> stop the system
    rts    

noWrapX:    
    move.w      d0,readxByte(a5)
nowrapMsk1:
    move.w      d1,readxMsk(a5)
    tst.b       d2
    beq         tryAgain

    ; step 3: compute slope & fill point data
    moveq       #0,d0
    move.w      readX(a5),d0
    move.w      readY(a5),d1
    ; demo here how to check that texture read is ok
    ;>-JS DEBUGPRIM.addPoint(d0.w, d1.w, 0xff00ff, 1, 1000); // x,y,HTML color,radius
    lsl.l       #COORD_SHIFT,d0
    move.w      #0,pt_x(a0)
    move.w      #0,pt_y(a0)
    divs        d1,d0
    move.w      d0,pt_spdx(a0)
    move.w      d1,pt_lifeTime(a0)
    rts


interp_update:
    ;rts
    move.l      drawScreenPtr(a5),a1
    move.l      a1,a0
    add.l       #SCR_W_BYTES*SCR_H,a0
    move.w      #PTS_MAXCOUNT-1,d7
.clr:
    move.w      (a0),d0
    clr.b       (a1,d0.w)
    clr.w       (a0)+
    dbra        d7,.clr

    move.w      #SCR_W_BYTES*SCR_H,d3                       ; clr data index   
    lea         points(a5),a0
    lea         xofsmsk,a3
    move.w      #PTS_MAXCOUNT-1,d7
.draw:
    tst.w       pt_lifeTime(a0)
    ble.b       .ptDone
    move.w      pt_spdx(a0),d0
    add.w       pt_x(a0),d0
    move.w      d0,pt_x(a0)
    lsr.w       #COORD_SHIFT,d0
    move.w      pt_y(a0),d1
    add.w       #SCR_W_BYTES,d1
    move.w      d1,pt_y(a0)
    ;>-JS AMIGA_pix2Bitplane(d0.iw,d1.iw/40,a1.ul);
    sub.w       #1,pt_lifeTime(a0)
    ble.b       .reached
    add.w       d0,d0
    add.w       d0,d0
    move.l      (a3,d0.w),d0
    move.w      d0,d2
    swap        d0
    add.w       d0,d1
    or.b        d2,(a1,d1.w)
    move.w      d1,(a1,d3.w)
    addq.w      #2,d3
.ptDone: 
    lea         pt_structLen(a0),a0
    dbra        d7,.draw
    rts
.reached:
    move.w      #0,pt_lifeTime(a0)
    move.w      pt_targetOfs(a0),d0
    move.w      pt_targetMsk(a0),d1
    move.l      #screen1,a4
;    move.w      #0,(a4,d3.w)
    or.b        d1,(a4,d0.w)
    move.l      #screen2,a4
 ;   move.w      #0,(a4,d3.w)
    or.b        d1,(a4,d0.w)
    addq.w      #2,d3
    lea         pt_structLen(a0),a0
    dbra        d7,.draw
    rts

