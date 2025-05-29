; SCANDAL, SCANDAL!!!! STOLEN CODE!
; This was originally coded by TSUNAMI (I believe)
; Source code found in this archive : https://aminet.net/package/demo/intro/Gemanix

	code_c
	
aika	EQU	440
xsize	EQU	24					; size in words of a blit ==> 24*16 = 384
ysize	EQU	50
ysize2	EQU	40
ysize3	EQU	30
logoaika	EQU	1*50			; time during which logo is shown

LINES_COUNT			EQU	288
HALF_LINES_COUNT	EQU	LINES_COUNT/2

DUR_1	EQU 75
DUR_2	EQU 100

Wblit	macro
.wb\@:	
	btst	#6,$2(a6)
	bne.s	.wb\@
	endm

init:
	lea		buffers,a0
	lea		endBuf,a1
	moveq	#0,d0
.clr:
	move.l	d0,(a0)+
	cmp.l	a1,a0
	ble		.clr

	lea	$dff000,a6
	move.w #$83c0,DMACON(a6)	; // blitter + copper + bitplane DMA

	; copying some seed in buffers to reproduce the shape of the logo
	move.l	#$-1,d0
	Wblit
	move.l	#$01f00000,$40(a6)							   ; USE D, copy A, but don't use A
	move.l	d0,$44(a6)									   ; No masking (-1)
	move.w	#96-2*xsize,$66(a6)							   ; BLTDMOD --> 96 seems to be the width (96*4 = 384)
	move.w	#%1010101010101010,$74(a6)									   ; BLITTER SOURCE A - BLTADAT ==> pre-fills with -1 : Trick to copy D0.w to the whole zone
	move.l	#screen2+((HALF_LINES_COUNT-ysize/2)*96)+(24-xsize),$54(a6) ; Blitter pointer to destination D
	move.w	#ysize*64+xsize,$58(a6) ; BLTSIZE. 

	moveq	#0,d0
	Wblit
	move.l	#$01f00000,$40(a6)
	move.w	#96-2*xsize,$66(a6)
	move.w	#%1010101010101010,$74(a6)
	move.l	#screen2+((HALF_LINES_COUNT-ysize2/2)*96)+(24-xsize),$54(a6)
	move.w	#ysize2*64+xsize,$58(a6)
	
	moveq	#-1,d0
	Wblit
	move.l	#$01f00000,$40(a6)
	move.w	#96-2*xsize,$66(a6)
	move.w	#%1010101010101010,$74(a6)
	move.l	#screen2+((HALF_LINES_COUNT-ysize3/2)*96)+(24-xsize),$54(a6)
	move.w	#ysize3*64+xsize,$58(a6)

	Wblit	
	move.l	#$002a002a,$64(a6)				; BLTMOD for A and D (=42)
	
	move.w	#0,timer
	move.l	#copper,COP1LCH(a6)

update:	
	bsr	show
	bsr	flex
	bsr	rotate
	addq	#1,timer

	lea	drawplane,a0
	move.l	(a0),d0
	move.l	4(a0),(a0)
	move.l	d0,4(a0)
	rts
;-----------------------------------

quit:
	rts

;------------------------------------------
		
;------------------------------------------
;------------------------------------------
timer:		
	dc.w	0
npos:		
	dc.b	0
opos:		
	dc.b	0
;------------------------------------
;------------------------------------

at:	
	dc.w	0
mpoint:	
	dc.w	0
motab:	
	dc.b	1,15,7,22,3,19,17,5,11,2,21,4,16,6,20
	dc.b	5,10,8,14,9,18,12,13,0
	dc.b	-1
	even
;------------------------------------
;------------------------------------
fadetest:	
	dc.w	0
fader:	
	addq.w	#1,fadetest
	cmp.w	fadetest,d0
	bge.w	.out
	move.w	#0,fadetest

.loop:	
	move.w	(a0)+,d0
	move.w	(a1),d1
	cmp.w	d0,d1
	beq.s	.next

	move.w	d0,d2
	move.w	d1,d4
	and.w	#$f00,d2
	and.w	#$f00,d4
	cmp.w	d2,d4
	beq.s	.1b
	bgt.s	.1
	add.w	#$200,d4
.1:	
	sub.w	#$100,d4
.1b:	
	move.w	d0,d2
	move.w	d1,d3
	and.w	#$0f0,d2
	and.w	#$0f0,d3
	cmp.w	d2,d3
	beq.s	.2b
	bgt.s	.2
	add.w	#$020,d3
.2:	
	sub.w	#$010,d3
.2b:	
	or.w	d3,d4
	move.w	d0,d2
	move.w	d1,d3
	and.w	#$00f,d2
	and.w	#$00f,d3
	cmp.w	d2,d3
	beq.s	.3b
	bgt.s	.3
	addq.w	#2,d3
.3:	
	subq.w	#1,d3
.3b:	
	or.w	d3,d4
	move.w	d4,(a1)
.next:	
	lea	4(a1),a1
	dbf	d7,.loop
.out:	
	rts
;------------------------------------
;------------------------------------
flex:	
	move.b	npos,opos
	moveq	#$1f,d0
	and	timer,d0
	lea		mtab,a0
	move.b	(a0,d0.w),npos
	rts

mtab:	
	dc.b	0,16
	dc.b	8,16+8
	dc.b	4,16+4
	dc.b	12,16+12
	dc.b	2,16+2
	dc.b	10,16+10
	dc.b	6,16+6
	dc.b	14,16+14
	dc.b	1,16+1
	dc.b	9,16+9
	dc.b	5,16+5
	dc.b	13,16+13
	dc.b	3,16+3
	dc.b	11,16+11
	dc.b	7,16+7
	dc.b	15,16+15
;--------------------------------------
;--------------------------------------
show:	
	moveq	#0,d0
	move.b	npos,d0
	move.l	d0,d1
	asr		#3,d0
	muls	#96,d1
	add		d1,d0
	add		#20*96+2,d0
	add.l	showplane,d0	;buf 2 = $58000

	lea	planes,a0
.lp:	
	move.w	d0,6(a0)
	swap	d0
	move.w	d0,2(a0)

	moveq	#$f,d1
	and.b	npos,d1
	lea		sfttab,a0
	;move.b	(a0,d1.w),$102(a6)	;shift value
	rts

sfttab:	
	dc.b	$ff,$ee,$dd,$cc,$bb,$aa,$99,$88
	dc.b	$77,$66,$55,$44,$33,$22,$11,$00
;-----------------------------------------------
rotate:	
	move.l  showplane,a0	;s
	move.l	drawplane,a4	;d
	move.l	#16*96+44,d0
	add.l	d0,a4
	add.l	d0,a0
	lea		places,a1
	lea		spintab,a2

	moveq	#0,d5
	move.b	opos,d5
	sub.b	npos,d5
	ext	d5
	muls	#8*96+1,d5
	add	#15,d5
	move	#$1003,d3	;size
	move.l	#32*96+12*4,d4

	moveq	#10-1,d7
.lp:	
	move	(a1)+,d1
	add	d5,d1
	moveq	#12-1,d6

.lp2:	
	move	(a2)+,d0
	add	d1,d0
	moveq	#$f,d2
	and	d0,d2
	add	d2,d2
	lea	 minterm,a5
	move	(a5,d2.w),d2
	asr	#3,d0
	lea	(a0,d0),a3

	Wblit
	move	d2,$40(a6)
	movem.l	a3/a4,$50(a6)
	move	d3,$58(a6)
	subq.l	#4,a0
	subq.l	#4,a4
	dbf	d6,.lp2

	add.l	d4,a0
	add.l	d4,a4
	lea	-2*12(a2),a2
	dbf	d7,.lp
	rts
;-------------------------------------------------
minterm:	
		dc.w	$f9f0,$e9f0,$d9f0,$c9f0,$b9f0,$a9f0,$99f0,$89f0
		dc.w	$79f0,$69f0,$59f0,$49f0,$39f0,$29f0,$19f0,$09f0
;-------------------------------------------------
;-------------------------------------------------

places:	
		dc.w	32*96-4
		dc.w	24*96-3
		dc.w	16*96-2
		dc.w	8*96-1
		dc.w	0
		dc.w	-8*96+1
		dc.w	-16*96+2
		dc.w	-24*96+3
		dc.w	-32*96+4
		dc.w	-40*96+5

spintab:	
		dc.w	-5*768-5
		dc.w	-4*768-4
		dc.w	-3*768-3
		dc.w	-2*768-2
		dc.w	-1*768-1
		dc.w	0
		dc.w	1*768+1
		dc.w	2*768+2
		dc.w	3*768+3
		dc.w	4*768+4
		dc.w	5*768+5
		dc.w	6*768+6
		
		
;------------------------------------------
dmacon:		
	dc.w	0
intena:		
	dc.l	0
level3:		
	dc.l	0
;-------------------------------------------

;-------------------------------------------
copper:		
		dc.w	$108,48+4,$10a,48+4
		dc.w	$8e,$2c81,$90,$2cc1
		dc.w	$92,$0028,$94,$d0
		dc.w	$120,0,$122,0

;		dc.w   DIWSTRT,$2c81 ; PAL default window start
;		dc.w   DIWSTOP,$2cc1 ; PAL default window stop
;		dc.w   DDFSTRT,$0038
;		dc.w   DDFSTOP,$00d0


planes:		
		dc.w	$e0,0,$e2,0
		dc.w	$e4,0,$e6,0
		dc.w	$100,$1200

chaoscols:	
		dc.w	$180,$0123
		dc.w	$182,$0446
		dc.w	$184,$0f00
		dc.w	$186,$00f0
		dc.l	-2
;-------------------------------------

drawplane:	
	dc.l	screen1
showplane:	
	dc.l	screen2


	bss_c

buffers:
	ds.b	32*96
screen1:	
	ds.b	LINES_COUNT*96
screen2:	
	ds.b	LINES_COUNT*96
	ds.b	32*96
endBuf:
	ds.l	1
