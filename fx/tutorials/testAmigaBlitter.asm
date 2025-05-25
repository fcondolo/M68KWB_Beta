       include "Amiga_Slowline.asm"
       
init
       move.w        #$000,$dff180
       move.w        #$fff,$dff182
       rts

v2d_blitwidth	       = 320
v2d_blitheight	= 255
v2d_blitlinemod	= v2d_blitwidth/8
v2d_blitmod          = (320-v2d_blitwidth)/8
bplSizeInBytes       = 10240

Wblit:	macro
.wb\@:	
	btst	#6,$2(a6)
	bne.s	.wb\@
	endm

v2d_fillBitplane:
       lea		$dff000,a6
	adda.l        #bplSizeInBytes-40-2-v2d_blitmod/2,a5		; planemod is the size of a screen in bytes (width/8*height) --> end of 3rd screen´s address
										; BLTSIZE is in words = 2 bytes (= 16 pixels). The -2 here deceases the pointer by 2 bytes to compensate
		
       move.w	       #v2d_blitmod,BLTAMOD(a6)		              ;  Blitter modulo for source A
       move.w	       #v2d_blitmod,BLTDMOD(a6)		              ;  Blitter modulo for destination D
       move.w	       #$09f0,BLTCON0(a6)			              ; see http://wiki.amigaos.net/wiki/Graphics_Minterms. 
											; $f0 = %11110000, so the 4 last lines of the truth table are selected: the lines for which A=1.
											; this means only source A is selected (minterm $f0 = A)
											; channels $9 = %1001 ==> a,d. This means source A will be copied to destination D
	move.w        #$0012,BLTCON1(a6)          			; descending and fill mode (descending is compulsolry for fill mode)
										       ; $12 = %10010
										       ; 1 : bit 4 --> exclusive fill enable (XOR). ON
										       ; 0 : bit 3 --> inclusive fill enable (OR). OFF
										       ; 0 : bit 2 --> fill carry input. OFF
										       ; 1 : bit 1 --> descending mode. ON
										       ; 0 : bit 0 --> line. OFF
	move.l	       a5,BLTAPTR(a6)                      		; src address = end of 3rd screen´s address
       move.l	       a5,BLTDPTR(a6)               	              ; dst address = same as source (fill)
       move.w       #v2d_blitheight*64+v2d_blitlinemod/2,BLTSIZE(a6)  ; M68KWB_NOERROR) (height << 6) | linemod >> 1). lower 6 bits are width (in words), the rest is height (in lines count)
											; linemod is the screen width in bytes, so we divide by 2 to convert to words
											; this instruction also triggers the blitter
	rts
       
       
update:
       move.l        a5,a0
       add.l         #40*50+10,a0
       move.w        #140,d7
.next:
       move.b        #1,(a0)
       move.b        #1,10(a0)
       add.l         #40,a0
       dbra          d7,.next

       Wblit

       move.w        #10,d0
       move.w        #10,d1
       move.w        #100,d2
       move.w        #100,d3
       bsr           INITLINE

       bsr           DRAWLINE

       Wblit
       bsr           v2d_fillBitplane

       rts

screenBuf
    ds.b    10240
