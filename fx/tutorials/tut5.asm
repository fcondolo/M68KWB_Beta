; this is the main asm file. You may include other asm files here using the include "xxx.asm" directive

openScreen    
       lea           CUSTOM,a6
       move.w        #$5200,BPLCON0(a6)
       move.w        #$4c81,DIWSTRT(a6)
       move.w        #$00c1,DIWSTOP(a6)
       move.w        #$0038,DDFSTRT(a6)
       move.w        #$00d0,DDFSTOP(a6)
       move.w        #$83c0,DMACON(a6)
       rts

setPalette
       lea           CUSTOM+COLOR0,a6
       lea           palette,a0
       REPT          32
       move.w        (a0)+,(a6)+
       ENDR
       rts

update:
       lea           CUSTOM,a6
       lea           image,a0
       move.l        a0,BPL1PTH(a6)
       add.l         #320/8*180,a0
       move.l        a0,BPL2PTH(a6)
       add.l         #320/8*180,a0
       move.l        a0,BPL3PTH(a6)
       add.l         #320/8*180,a0
       move.l        a0,BPL4PTH(a6)
       add.l         #320/8*180,a0
       move.l        a0,BPL5PTH(a6)
       rts

palette
;	palette for: testImg
;	Thu Jan 04 2024 17:11:43 GMT+0100 (Central European Standard Time)
	dc.w	$0003
	dc.w	$0603
	dc.w	$0923
	dc.w	$0524
	dc.w	$0777
	dc.w	$0600
	dc.w	$0103
	dc.w	$0203
	dc.w	$0403
	dc.w	$0baa
	dc.w	$0814
	dc.w	$0fe6
	dc.w	$0fc5
	dc.w	$0d85
	dc.w	$0c65
	dc.w	$0945
	dc.w	$0858
	dc.w	$0f95
	dc.w	$0ea7
	dc.w	$0988
	dc.w	$0000
	dc.w	$0001
	dc.w	$0302
	dc.w	$0102
	dc.w	$0d44
	dc.w	$0ffe
	dc.w	$0e8d
	dc.w	$0fdc
	dc.w	$0fbe
	dc.w	$0fff
	dc.w	$0e20
	dc.w	$0b10



image     incbin "SYSROOT/images/testimg_bitplanes.bin"
