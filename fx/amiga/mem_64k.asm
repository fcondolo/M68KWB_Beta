           ;      section    mycode,code

                 rsreset
m64k_ptr         rs.l       1
m64k_remaining   rs.l       1
m64k_struct_len  rs.b       0

; INPUT
; D0.L : buffer address
; D2.L : buffer size (should be 2x the needed space)
m64k_init:
                 movem.l    d0-d2/a0,-(sp)
                 lea        m64k_lowPage(pc),a0
                 move.l     d0,m64k_ptr(a0)                              ; low page always starts with buffer
                 move.l     d0,d1
                 or.w       #$ffff,d1                                    ; last byte before crossing a 64k border
                 sub.l      d0,d1                                        ; bytes in buffer before 64k border
                 cmp.l      d2,d1                                        ; 64k border after the end of the buffer?
                 ble.b      .isCrossingBorder                            ; nope -> we can continue
                 move.l     d2,m64k_remaining(a0)                        ; low page takes the whole buffer
                 lea        m64k_highPage(pc),a0
                 move.l     #-1,m64k_ptr(a0)                             ; get ready for a nice crash if used
                 move.l     #0,m64k_remaining(a0)                        ; mark as empty
                 bra.b      .endInit
.isCrossingBorder:
                 move.l     d1,m64k_remaining(a0)                        ; low page size
                 sub.l      d1,d2                                        ; high page size
                 or.l       #$ffff,d0
                 addq.l     #1,d0
                 lea        m64k_highPage(pc),a0
                 move.l     d0,m64k_ptr(a0)                              ; high page start
                 move.l     d2,m64k_remaining(a0)                        ; high page size
.endInit:
                 lea        m64k_lowPage(pc),a0
                 move.w     m64k_ptr(a0),d0
                 move.w     m64k_remaining(a0),d1
              ; >JS console.log("low page: " + regs.d[0] + ", " + regs.d[1]); 
                 lea        m64k_highPage(pc),a0
                 move.w     m64k_ptr(a0),d0
                 move.w     m64k_remaining(a0),d1
              ; >JS console.log("high page: " + regs.d[0] + ", " + regs.d[1]); 
                     
                 movem.l    (sp)+,d0-d2/a0
                 rts

; [IN] d0.l : size (max 64k)
; [OUT] d1.l : address (or null)
m64k_alloc:
                 movem.l    d2/a0-a2,-(sp)
                 lea        m64k_lowPage(pc),a0
                 lea        m64k_highPage(pc),a1
                 move.l     m64k_remaining(a0),d1                        ; remaining in low buffer
                 move.l     m64k_remaining(a1),d2                        ; ramaining in high buffer
                 sub.l      d0,d1                                        ; enough space in low buffer?
                 bmi.b      .useHighBuffer                               ; nope ==> use high buffer
                 sub.l      d0,d2                                        ; enough space in high buffer?
                 bmi.b      .useLowBuffer                                ; nope ==> use low buffer
				 ; Here, both buffers can take the alloc. We want to pick the smallest buffer
                 cmp.l      d1,d2
                 ble.b      .useHighBuffer                               ; high < low? use high
.useLowBuffer:										 ; use low
                 move.l     a0,a2
                 bsr        m64k_bufferAlloc
                 bra.b      .done

.useHighBuffer:
                 move.l     a1,a2
                 bsr        m64k_bufferAlloc

.done:
                 movem.l    (sp)+,d2/a0-a2
                 rts


;  Private, do not call this one
; [IN] a2.l : buffer
; [IN] d0.l : size (max 64k)
; [OUT] d1.l : address (or null)
m64k_bufferAlloc:
                 cmp.l      m64k_remaining(a2),d0
                 bhi.b      .bufferTooSmall
                 move.l     m64k_ptr(a2),d1
                 add.l      d0,m64k_ptr(a2)
                 sub.l      d0,m64k_remaining(a2)
                 rts

.bufferTooSmall:
                 clr.w      $100
                 moveq      #0,d1
                 move.w     d0,-(a7)                                     ; push param to display (alloc size)
                 movea.l    a7,a1
                 lea        .errorMsg(pc),a0                             ; error message
                 trap       #0                                           ; assert
.errorMsg:   	 
                 dc.b       'm64k_alloc failed allocating %w bytes',0
                 even

m64k_lowPage:   
                 ds.b       m64k_struct_len
m64k_highPage:  
                 ds.b       m64k_struct_len

