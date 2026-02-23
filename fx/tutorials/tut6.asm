; this is the main asm file. You may include other asm files here using the include "xxx.asm" directive


setPalette
       lea           $ff8240,a0
       lea           palette,a1
       move.w        #15,d7
.pal:
       move.w        (a1)+,(a0)+
       dbra          d7,.pal
       rts

update:
       ; tell xbios the screen address
       move.l    #image,d0
       move.l    d0,d1
       move.w    #0,-(sp)
       move.l    d0,-(sp)           ; phys
       move.l    d1,-(sp)           ; log
       move.w    #5,-(sp)
       trap      #14
       add.l     #12,sp

       rts

palette
	dc.w	$0881
	dc.w	$0280
	dc.w	$0811
	dc.w	$0199
	dc.w	$0a90
	dc.w	$0922
	dc.w	$02aa
	dc.w	$0ba0
	dc.w	$0a3b
	dc.w	$0b33
	dc.w	$05b0
	dc.w	$0bcb
	dc.w	$0d58
	dc.w	$0553
	dc.w	$0663
	dc.w	$07fd


image     incbin "SYSROOT/images/alone-bitplanes-STE.bin"

