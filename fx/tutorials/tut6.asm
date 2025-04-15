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
;	palette for: Explora-ST
;	Thu Jan 04 2024 01:29:57 GMT+0100 (Central European Standard Time)
	dc.w	$0000
	dc.w	$0808
	dc.w	$0888
	dc.w	$0181
	dc.w	$0199
	dc.w	$0119
	dc.w	$0922
	dc.w	$0bb3
	dc.w	$0cc4
	dc.w	$0a3a
	dc.w	$044b
	dc.w	$02a2
	dc.w	$0ddc
	dc.w	$0665
	dc.w	$0ee6
	dc.w	$0ff7


image     incbin "SYSROOT/images/Explora-bitplanes-STE.bin"