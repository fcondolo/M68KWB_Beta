       section code
init:
     lea       $FF8240,a0
     move.w    #$30,(a0)+
     move.w    #$777,d0
     move.w    #14,d7
.nextcol:
     move.w    d0,(a0)+
     dbra      d7,.nextcol    
     ; MODIFIED CODE HERE
     ;>JS DEBUGGER_paranoid = false   // allow overwriting of code section
     lea        .modify_me,a0
     move.w     #$4e75,2(a0)           ; insert RTS opcode instead of 0
     ; >JS reAssemble(regs.a[0],1)
     ; the above "reAssemble" instruction asks the system to update its "compiled code cache" as we modified already existing code.     
     ; this will also spot errors if the new opcode is invalid
     ;>JS DEBUGGER_paranoid = true  // set memory protection back

     ; GENERATED CODE HERE
     lea      autoCode,a0
     lea      auto_begin,a1
     lea      auto_end,a2
     sub.l    a1,a2         ; size of the code to copy
     move.w   a2,d6
     lsr.w    #1,d6         ; we are on 68K, always words
     subq.w   #1,d6
     move.w   #160/4-1,d7   ; a full line
.autogen_iter:
       move.w        d6,d5
       lea           auto_begin,a1
.autogen_copy:
       move.w        (a1)+,(a0)+
       dbra          d5,.autogen_copy
       dbra          d7,.autogen_iter
.modify_me:       
       move.w        #0,(a0)          ; will be modified to insert rts opcode instead of 0
       ; we do not need to call "reAssemble" here, as the code was "generated" (copied) over data (autoCode is a ds.b ), so no instruction was pre-compiled and cached here.
     rts


; The subroutine to plot a pixel at'x,y in low resolution
; Entry: x=d0.w,y=dl.w,colour=d2.w. Corrupted: d0,dl,d2,d3,d4,d7,a0.
set_pix:
     lea       ytable,a0
     add.w     d1,d1              ; y * 2
     move.w    (a0,d1.w),d2       ; y * 160 

     move.l    screens,a0
     add.l     #160*100,a0
     lea       autoCode,a1
     ;>JS DEBUGGER_paranoid = false   // allow jumping outside of code section
     jmp      (a1)
     ;>JS DEBUGGER_paranoid = true  // set memory protection back


auto_begin:
     move.l    #$f0f0f0f0,(a0)
     add.l     #4,a0               ; suboptimal, we don't care, this is an example
auto_end:


swapScreen:
 ; swap
     lea       screens,a0
     move.l    (a0),d0
     move.l    4(a0),d1
     move.l    d1,(a0)+
     move.l    d0,(a0)

; tell xbios
     move.w    #0,-(sp)
     move.l    d0,-(sp)           ; phys
     move.l    d1,-(sp)           ; log
     move.w    #5,-(sp)
     trap      #14
     add.l     #12,sp
     rts

       section data



screens:  
     dc.l      screen1,screen2

screen1:   
     ds.b      32000

screen2:   
     ds.b      32000

VAL  SET       0
ytable:
     REPT      200
     dc.w      VAL
VAL  SET       VAL+160
     ENDR

autoCode:
       ds.b   1024          ; can't do auto_end-auto_begin yet, sorry
