**	COPPER-GELLY
**	CODED BY CRADON/MATRIX
**	ASM-ONE FORMAT

*******************************************************************************

	SECTION	MAIN,CODE_C

init:
	MOVE.W	#%0111111111111111,$DFF096
	MOVE.W	#%0111111111111111,$DFF09A
	MOVE.W	#%0111111111111111,$DFF09C

	JSR	TABINIT		; PREPARE "COPPER-GELLY" RUTINE
	JSR	COPINIT		; ACTIVATE COPPERLIST

	MOVE.W	#%1000001111000000,$DFF096
	MOVE.W 	#%1100000000110000,$DFF09A
	rts

** COPPER-GELLY BY CRADON/MATRIX PRODUCTIONS 1993 *****************************

SIZE    = 27	; CHECKER HIGHT
CONVERT = 20	; COLOUR ADJUSTMENT
SPEED1	= 2	; SINE TABLE 1
SPEED2  = 12	; SINE TABLE 2

NTSC_LINES	EQU 221
PAL_LINES	EQU	52

COLOUR1 DC.W	$00EE
COLOUR2 DC.W	$00FF

COPFILL	
	; *********
	; NTSC LOOP
	; *********
	LEA.L	NTSC,A0
	LEA.L	SINUS,A1
	LEA.L	SINUS2,A2
	ADD.W	SINOFF(PC),A1
	ADD.W	SIN2OFF(PC),A2
	ADD.W	#SPEED1,SINOFF
	ADD.W	#SPEED2,SIN2OFF
	MOVE.W	#$2301,D1
	MOVE.W	#NTSC_LINES-1,D2
	MOVE.W	COLOUR1(PC),COL1
	MOVE.W	COLOUR2(PC),COL2

	MOVE.W	#SIZE,CCOUNT
	MOVE.W	CCOFF(PC),D0
	EXT.L	D0
	MOVE.W	#SIZE,D3
	LSL.W	#1,D3
	CMP.W	D3,D0
	BNE.B	NORESET
	MOVE.W	#0,CCOFF
NORESET	
	ADDQ.W	#2,CCOFF
	LEA.L	CCNEW(PC),A3
	ADD.W	CCOFF(PC),A3
	MOVE.W	(A3),D0
	SUB.W	D0,CCOUNT

	CMP.W	#SIZE,CCOUNT

	BNE.B	COPLOP1
	MOVE.W	COLOUR1(PC),D3
	MOVE.W	COLOUR2(PC),COLOUR1
	MOVE.W	D3,COLOUR2

COPLOP1	
	MOVE.L	#TERN,D0	; bitplane pattern
	MOVE.W	(A1)+,D4	; next sin table entry
	CMP.W	#$FFFF,D4	; end of table reached?
	BNE.B	NOPROB1		; nope ==> continue
	LEA.L	SINUS,A1	; yep ==> rewind
	MOVE.W	#0,SINOFF
	MOVE.W	(A1)+,D4
NOPROB1
	MOVE.W	(A2)+,D5	; next sin table2 entry
	CMP.W	#$FFFF,D5	; end of table reached?
	BNE.B	NOPROBA		; nope ==> continue
	LEA.L	SINUS2,A2	; yep ==> rewind
	MOVE.W	#0,SIN2OFF
	ADD.W	SIN2OFF(PC),A2
	MOVE.W	(A2)+,D5
NOPROBA	
	ADD.W	D5,D4		; OFFSET IN GRAPHICS
	MOVE.W	D4,D5		; (FOR LATER USE IN COLOUR ADJUSTMENT)
	MULU	#44,D4		; width of a line in bitplane pattern data
	ADD.L	D4,D0		; ADD OFFSET TO ADDRESS FOR BITPLANE POINTER
	MOVE.W	D1,(A0)+	; copper wait value
	SUBQ.W	#1,CCOUNT
	TST.W	CCOUNT		; IS IT TIME TO CHANGE COLOURS? (MAKE CHECKERS)
	BNE.B	SETCOP1
	MOVE.W	COL1(PC),D3
	MOVE.W	COL2(PC),COL1
	MOVE.W	D3,COL2
	MOVE.W	#SIZE,CCOUNT
SETCOP1	
	EXT.L	D5
	DIVU	#CONVERT,D5	; ADJUST COLOURS
	MOVE.W	COL1(PC),D3
	MOVE.W	COL2(PC),D4
	SUB.W	D5,D3
	SUB.W	D5,D4
	MOVE.W	#$FFFE,(A0)+	; WRITE CHANGES TO COPPERLIST
	MOVE.W	#$0180,(A0)+
	MOVE.W	D3,(A0)+
	MOVE.W	#$0182,(A0)+
	MOVE.W	D4,(A0)+

	;MOVE.L	#TERN,D0
	
	MOVE.W	#$00E0,(A0)+
	SWAP	D0
	MOVE.W	D0,(A0)+
	MOVE.W	#$00E2,(A0)+
	SWAP	D0
	MOVE.W	D0,(A0)+

	ADD.L	#$100,D1
	DBRA	D2,COPLOP1	


	; **************
	; PAL LINES LOOP
	; **************
	LEA.L	PAL,A0
	MOVE.W	#$0001,D1
	MOVE.W	#PAL_LINES-1,D2

COPLOP2	
	MOVE.L	#TERN,D0
	MOVE.W	(A1)+,D4
	CMP.W	#$FFFF,D4
	BNE.B	NOPROB2
	LEA.L	SINUS,A1
	MOVE.W	#0,SINOFF
	MOVE.W	(A1)+,D4
NOPROB2	
	MOVE.W	(A2)+,D5
	CMP.W	#$FFFF,D5
	BNE.B	NOPROBB
	LEA.L	SINUS2,A2
	MOVE.W	#0,SIN2OFF
	ADD.W	SIN2OFF(PC),A2
	MOVE.W	(A2)+,D5
NOPROBB	
	ADD.W	D5,D4
	MOVE.W	D4,D5
	MULU	#44,D4
	ADD.L	D4,D0
	MOVE.W	D1,(A0)+
	SUBQ.W	#1,CCOUNT
	TST.W	CCOUNT
	BNE.B	SETCOP2
	MOVE.W	COL1(PC),D3
	MOVE.W	COL2(PC),COL1
	MOVE.W	D3,COL2
	MOVE.W	#SIZE,CCOUNT
SETCOP2	
	EXT.L	D5
	DIVU	#CONVERT,D5
	MOVE.W	COL1(PC),D3
	MOVE.W	COL2(PC),D4
	SUB.W	D5,D3
	SUB.W	D5,D4
	MOVE.W	#$FFFE,(A0)+
	MOVE.W	#$0180,(A0)+
	MOVE.W	D3,(A0)+
	MOVE.W	#$0182,(A0)+
	MOVE.W	D4,(A0)+

;	MOVE.L	#TERN,D0

	MOVE.W	#$00E0,(A0)+
	SWAP	D0
	MOVE.W	D0,(A0)+
	MOVE.W	#$00E2,(A0)+
	SWAP	D0
	MOVE.W	D0,(A0)+

	ADD.L	#$100,D1
	DBRA	D2,COPLOP2	
	RTS

TABINIT	MOVE.W	#SIZE,D0
	LEA.L	CCNEW,A0
TABLOOP	MOVE.W	D0,(A0)+
	SUBQ.W	#1,D0
	BNE	TABLOOP
	RTS

** ACTIVATE COPPERLIST ********************************************************

COPINIT:
	MOVE.L	#COPPER,D0
;	LEA.L	ADDRESS,A0
;	MOVE.W	D0,6(A0)
;	SWAP	D0
;	MOVE.W	D0,2(A0)
	MOVE.L	#COPPER,$DFF084
	MOVE.B	#$00,$DFF08A
	RTS
	
*******************************************************************************

update:
	MOVEM.L	D0-A6,-(A7)

	JSR	COPFILL

	MOVEM.L	(A7)+,D0-A6 		
	rts

** ABSOLUTES ******************************************************************

	EVEN

OLDIRQ	DC.L	0

TCOUNT	DC.W	0
CHECKER	DC.W	0
CCOUNT	DC.W	0
COL1	DC.W	0
COL2	DC.W	0
SINOFF	DC.W	0
SIN2OFF	DC.W	0
CCOFF	DC.W	0
CCNEW	BLK.W	50,0

** COPPERLIST *****************************************************************

	SECTION	B,DATA_C

COPPER	DC.W    $008E,115+(35*256)		; WINDOW START (115,35)
	DC.W	$0090,(467-256)+(305-256)*256	; WINDOW STOP (467,305)
	DC.W    $0092,(115/2-8)			; 8:LOWRES (4:HIGHRES)
	DC.W	$0094,(115/2-8)+(8*(22-1))	; 22:HORIZONTAL WORD COUNT
	DC.W    $0102,$0000			; HORIZONTAL SCROLL
	DC.W	$0104,$0000			; VIDIO PRIORITY
	DC.W	$0108,-44			; MODULO FOR ODD PLANES
	DC.W	$010A,-44			; MODULO FOR EVEN PLANES
	DC.W    $0100,$1200			; NUMBER OF BITPLANES

NTSC	
	BLK.W	(10*NTSC_LINES),$0000
	DC.W	$FFE1,$FFFE			; JUMP TO PAL
PAL	
	BLK.W	(10*PAL_LINES),$0000

	DC.W	$0180,$000
	DC.W	$0100,$0200
	DC.W	$FFFF,$FFFE

** SCREEN *********************************************************************

TERN	incbin "PATTERN4-352.BIT"

	SECTION	PURE_DATA,DATA_F

SINUS	DC.W	 85 
	DC.W	 87 
	DC.W	 90 
	DC.W	 93 
	DC.W	 96 
	DC.W	 98 
	DC.W	 101 
	DC.W	 104 
	DC.W	 107 
	DC.W	 109 
	DC.W	 112 
	DC.W	 115 
	DC.W	 117 
	DC.W	 120 
	DC.W	 122 
	DC.W	 125 
	DC.W	 127 
	DC.W	 130 
	DC.W	 132 
	DC.W	 134 
	DC.W	 137 
	DC.W	 139 
	DC.W	 141 
	DC.W	 143 
	DC.W	 145 
	DC.W	 147 
	DC.W	 149 
	DC.W	 151 
	DC.W	 152 
	DC.W	 154 
	DC.W	 156 
	DC.W	 157 
	DC.W	 159 
	DC.W	 160 
	DC.W	 161 
	DC.W	 162 
	DC.W	 163 
	DC.W	 164 
	DC.W	 165 
	DC.W	 166 
	DC.W	 167 
	DC.W	 168 
	DC.W	 168 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 168 
	DC.W	 168 
	DC.W	 167 
	DC.W	 166 
	DC.W	 165 
	DC.W	 164 
	DC.W	 163 
	DC.W	 162 
	DC.W	 161 
	DC.W	 160 
	DC.W	 159 
	DC.W	 157 
	DC.W	 156 
	DC.W	 154 
	DC.W	 152 
	DC.W	 151 
	DC.W	 149 
	DC.W	 147 
	DC.W	 145 
	DC.W	 143 
	DC.W	 141 
	DC.W	 139 
	DC.W	 137 
	DC.W	 134 
	DC.W	 132 
	DC.W	 130 
	DC.W	 127 
	DC.W	 125 
	DC.W	 122 
	DC.W	 120 
	DC.W	 117 
	DC.W	 115 
	DC.W	 112 
	DC.W	 109 
	DC.W	 107 
	DC.W	 104 
	DC.W	 101 
	DC.W	 98 
	DC.W	 96 
	DC.W	 93 
	DC.W	 90 
	DC.W	 87 
	DC.W	 85 
	DC.W	 82 
	DC.W	 79 
	DC.W	 76 
	DC.W	 73 
	DC.W	 71 
	DC.W	 68 
	DC.W	 65 
	DC.W	 62 
	DC.W	 60 
	DC.W	 57 
	DC.W	 54 
	DC.W	 52 
	DC.W	 49 
	DC.W	 47 
	DC.W	 44 
	DC.W	 42 
	DC.W	 39 
	DC.W	 37 
	DC.W	 35 
	DC.W	 32 
	DC.W	 30 
	DC.W	 28 
	DC.W	 26 
	DC.W	 24 
	DC.W	 22 
	DC.W	 20 
	DC.W	 18 
	DC.W	 17 
	DC.W	 15 
	DC.W	 13 
	DC.W	 12 
	DC.W	 10 
	DC.W	 9 
	DC.W	 8 
	DC.W	 7 
	DC.W	 6 
	DC.W	 5 
	DC.W	 4 
	DC.W	 3 
	DC.W	 2 
	DC.W	 1 
	DC.W	 1 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 1 
	DC.W	 1 
	DC.W	 2 
	DC.W	 3 
	DC.W	 4 
	DC.W	 5 
	DC.W	 6 
	DC.W	 7 
	DC.W	 8 
	DC.W	 9 
	DC.W	 10 
	DC.W	 12 
	DC.W	 13 
	DC.W	 15 
	DC.W	 17 
	DC.W	 18 
	DC.W	 20 
	DC.W	 22 
	DC.W	 24 
	DC.W	 26 
	DC.W	 28 
	DC.W	 30 
	DC.W	 32 
	DC.W	 35 
	DC.W	 37 
	DC.W	 39 
	DC.W	 42 
	DC.W	 44 
	DC.W	 47 
	DC.W	 49 
	DC.W	 52 
	DC.W	 54 
	DC.W	 57 
	DC.W	 60 
	DC.W	 62 
	DC.W	 65 
	DC.W	 68 
	DC.W	 71 
	DC.W	 73 
	DC.W	 76 
	DC.W	 79 
	DC.W	 82 
	DC.W	 84 
	DC.W	 87 
	DC.W	 90 
	DC.W	 93 
	DC.W	 96 
	DC.W	 98 
	DC.W	 101 
	DC.W	 104 
	DC.W	 107 
	DC.W	 109 
	DC.W	 112 
	DC.W	 115 
	DC.W	 117 
	DC.W	 120 
	DC.W	 122 
	DC.W	 125 
	DC.W	 127 
	DC.W	 130 
	DC.W	 132 
	DC.W	 134 
	DC.W	 137 
	DC.W	 139 
	DC.W	 141 
	DC.W	 143 
	DC.W	 145 
	DC.W	 147 
	DC.W	 149 
	DC.W	 151 
	DC.W	 152 
	DC.W	 154 
	DC.W	 156 
	DC.W	 157 
	DC.W	 159 
	DC.W	 160 
	DC.W	 161 
	DC.W	 162 
	DC.W	 163 
	DC.W	 164 
	DC.W	 165 
	DC.W	 166 
	DC.W	 167 
	DC.W	 168 
	DC.W	 168 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 168 
	DC.W	 168 
	DC.W	 167 
	DC.W	 166 
	DC.W	 165 
	DC.W	 164 
	DC.W	 163 
	DC.W	 162 
	DC.W	 161 
	DC.W	 160 
	DC.W	 159 
	DC.W	 157 
	DC.W	 156 
	DC.W	 154 
	DC.W	 152 
	DC.W	 151 
	DC.W	 149 
	DC.W	 147 
	DC.W	 145 
	DC.W	 143 
	DC.W	 141 
	DC.W	 139 
	DC.W	 137 
	DC.W	 134 
	DC.W	 132 
	DC.W	 130 
	DC.W	 127 
	DC.W	 125 
	DC.W	 122 
	DC.W	 120 
	DC.W	 117 
	DC.W	 115 
	DC.W	 112 
	DC.W	 109 
	DC.W	 107 
	DC.W	 104 
	DC.W	 101 
	DC.W	 98 
	DC.W	 96 
	DC.W	 93 
	DC.W	 90 
	DC.W	 87 
	DC.W	 84 
	DC.W	 82 
	DC.W	 79 
	DC.W	 76 
	DC.W	 73 
	DC.W	 71 
	DC.W	 68 
	DC.W	 65 
	DC.W	 62 
	DC.W	 60 
	DC.W	 57 
	DC.W	 54 
	DC.W	 52 
	DC.W	 49 
	DC.W	 47 
	DC.W	 44 
	DC.W	 42 
	DC.W	 39 
	DC.W	 37 
	DC.W	 35 
	DC.W	 32 
	DC.W	 30 
	DC.W	 28 
	DC.W	 26 
	DC.W	 24 
	DC.W	 22 
	DC.W	 20 
	DC.W	 18 
	DC.W	 17 
	DC.W	 15 
	DC.W	 13 
	DC.W	 12 
	DC.W	 10 
	DC.W	 9 
	DC.W	 8 
	DC.W	 7 
	DC.W	 6 
	DC.W	 5 
	DC.W	 4 
	DC.W	 3 
	DC.W	 2 
	DC.W	 1 
	DC.W	 1 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 1 
	DC.W	 1 
	DC.W	 2 
	DC.W	 3 
	DC.W	 4 
	DC.W	 5 
	DC.W	 6 
	DC.W	 7 
	DC.W	 8 
	DC.W	 9 
	DC.W	 10 
	DC.W	 12 
	DC.W	 13 
	DC.W	 15 
	DC.W	 17 
	DC.W	 18 
	DC.W	 20 
	DC.W	 22 
	DC.W	 24 
	DC.W	 26 
	DC.W	 28 
	DC.W	 30 
	DC.W	 32 
	DC.W	 35 
	DC.W	 37 
	DC.W	 39 
	DC.W	 42 
	DC.W	 44 
	DC.W	 47 
	DC.W	 49 
	DC.W	 52 
	DC.W	 54 
	DC.W	 57 
	DC.W	 60 
	DC.W	 62 
	DC.W	 65 
	DC.W	 68 
	DC.W	 71 
	DC.W	 73 
	DC.W	 76 
	DC.W	 79 
	DC.W	 82 
	DC.W	 84 
	DC.W	 87 
	DC.W	 90 
	DC.W	 93 
	DC.W	 96 
	DC.W	 98 
	DC.W	 101 
	DC.W	 104 
	DC.W	 107 
	DC.W	 109 
	DC.W	 112 
	DC.W	 115 
	DC.W	 117 
	DC.W	 120 
	DC.W	 122 
	DC.W	 125 
	DC.W	 127 
	DC.W	 130 
	DC.W	 132 
	DC.W	 134 
	DC.W	 137 
	DC.W	 139 
	DC.W	 141 
	DC.W	 143 
	DC.W	 145 
	DC.W	 147 
	DC.W	 149 
	DC.W	 151 
	DC.W	 152 
	DC.W	 154 
	DC.W	 156 
	DC.W	 157 
	DC.W	 159 
	DC.W	 160 
	DC.W	 161 
	DC.W	 162 
	DC.W	 163 
	DC.W	 164 
	DC.W	 165 
	DC.W	 166 
	DC.W	 167 
	DC.W	 168 
	DC.W	 168 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 169 
	DC.W	 168 
	DC.W	 168 
	DC.W	 167 
	DC.W	 166 
	DC.W	 165 
	DC.W	 164 
	DC.W	 163 
	DC.W	 162 
	DC.W	 161 
	DC.W	 160 
	DC.W	 159 
	DC.W	 157 
	DC.W	 156 
	DC.W	 154 
	DC.W	 152 
	DC.W	 151 
	DC.W	 149 
	DC.W	 147 
	DC.W	 145 
	DC.W	 143 
	DC.W	 141 
	DC.W	 139 
	DC.W	 137 
	DC.W	 134 
	DC.W	 132 
	DC.W	 130 
	DC.W	 127 
	DC.W	 125 
	DC.W	$FFFF
	DC.W	 122 
	DC.W	 120 
	DC.W	 117 
	DC.W	 115 
	DC.W	 112 
	DC.W	 109 
	DC.W	 107 
	DC.W	 104 
	DC.W	 101 
	DC.W	 98 
	DC.W	 96 
	DC.W	 93 
	DC.W	 90 
	DC.W	 87 
	DC.W	 85 
	DC.W	 82 
	DC.W	 79 
	DC.W	 76 
	DC.W	 73 
	DC.W	 71 
	DC.W	 68 
	DC.W	 65 
	DC.W	 62 
	DC.W	 60 
	DC.W	 57 
	DC.W	 54 
	DC.W	 52 
	DC.W	 49 
	DC.W	 47 
	DC.W	 44 
	DC.W	 42 
	DC.W	 39 
	DC.W	 37 
	DC.W	 35 
	DC.W	 32 
	DC.W	 30 
	DC.W	 28 
	DC.W	 26 
	DC.W	 24 
	DC.W	 22 
	DC.W	 20 
	DC.W	 18 
	DC.W	 17 
	DC.W	 15 
	DC.W	 13 
	DC.W	 12 
	DC.W	 10 
	DC.W	 9 
	DC.W	 8 
	DC.W	 7 
	DC.W	 6 
	DC.W	 5 
	DC.W	 4 
	DC.W	 3 
	DC.W	 2 
	DC.W	 1 
	DC.W	 1 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 1 
	DC.W	 1 
	DC.W	 2 
	DC.W	 3 
	DC.W	 4 
	DC.W	 5 
	DC.W	 6 
	DC.W	 7 
	DC.W	 8 
	DC.W	 9 
	DC.W	 10 
	DC.W	 12 
	DC.W	 13 
	DC.W	 15 
	DC.W	 17 
	DC.W	 18 
	DC.W	 20 
	DC.W	 22 
	DC.W	 24 
	DC.W	 26 
	DC.W	 28 
	DC.W	 30 
	DC.W	 32 
	DC.W	 35 
	DC.W	 37 
	DC.W	 39 
	DC.W	 42 
	DC.W	 44 
	DC.W	 47 
	DC.W	 49 
	DC.W	 52 
	DC.W	 54 
	DC.W	 57 

SINUS2	DC.W	 43 
	DC.W	 43 
	DC.W	 44 
	DC.W	 45 
	DC.W	 46 
	DC.W	 47 
	DC.W	 48 
	DC.W	 49 
	DC.W	 50 
	DC.W	 51 
	DC.W	 51 
	DC.W	 52 
	DC.W	 53 
	DC.W	 54 
	DC.W	 55 
	DC.W	 56 
	DC.W	 57 
	DC.W	 57 
	DC.W	 58 
	DC.W	 59 
	DC.W	 60 
	DC.W	 61 
	DC.W	 62 
	DC.W	 62 
	DC.W	 63 
	DC.W	 64 
	DC.W	 65 
	DC.W	 66 
	DC.W	 66 
	DC.W	 67 
	DC.W	 68 
	DC.W	 68 
	DC.W	 69 
	DC.W	 70 
	DC.W	 71 
	DC.W	 71 
	DC.W	 72 
	DC.W	 73 
	DC.W	 73 
	DC.W	 74 
	DC.W	 74 
	DC.W	 75 
	DC.W	 76 
	DC.W	 76 
	DC.W	 77 
	DC.W	 77 
	DC.W	 78 
	DC.W	 78 
	DC.W	 79 
	DC.W	 79 
	DC.W	 80 
	DC.W	 80 
	DC.W	 81 
	DC.W	 81 
	DC.W	 81 
	DC.W	 82 
	DC.W	 82 
	DC.W	 82 
	DC.W	 83 
	DC.W	 83 
	DC.W	 83 
	DC.W	 84 
	DC.W	 84 
	DC.W	 84 
	DC.W	 84 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 86 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 84 
	DC.W	 84 
	DC.W	 84 
	DC.W	 84 
	DC.W	 83 
	DC.W	 83 
	DC.W	 83 
	DC.W	 82 
	DC.W	 82 
	DC.W	 82 
	DC.W	 81 
	DC.W	 81 
	DC.W	 81 
	DC.W	 80 
	DC.W	 80 
	DC.W	 79 
	DC.W	 79 
	DC.W	 78 
	DC.W	 78 
	DC.W	 77 
	DC.W	 77 
	DC.W	 76 
	DC.W	 76 
	DC.W	 75 
	DC.W	 74 
	DC.W	 74 
	DC.W	 73 
	DC.W	 73 
	DC.W	 72 
	DC.W	 71 
	DC.W	 71 
	DC.W	 70 
	DC.W	 69 
	DC.W	 68 
	DC.W	 68 
	DC.W	 67 
	DC.W	 66 
	DC.W	 66 
	DC.W	 65 
	DC.W	 64 
	DC.W	 63 
	DC.W	 62 
	DC.W	 62 
	DC.W	 61 
	DC.W	 60 
	DC.W	 59 
	DC.W	 58 
	DC.W	 57 
	DC.W	 57 
	DC.W	 56 
	DC.W	 55 
	DC.W	 54 
	DC.W	 53 
	DC.W	 52 
	DC.W	 51 
	DC.W	 51 
	DC.W	 50 
	DC.W	 49 
	DC.W	 48 
	DC.W	 47 
	DC.W	 46 
	DC.W	 45 
	DC.W	 44 
	DC.W	 43 
	DC.W	 43 
	DC.W	 42 
	DC.W	 41 
	DC.W	 40 
	DC.W	 39 
	DC.W	 38 
	DC.W	 37 
	DC.W	 36 
	DC.W	 35 
	DC.W	 34 
	DC.W	 34 
	DC.W	 33 
	DC.W	 32 
	DC.W	 31 
	DC.W	 30 
	DC.W	 29 
	DC.W	 28 
	DC.W	 28 
	DC.W	 27 
	DC.W	 26 
	DC.W	 25 
	DC.W	 24 
	DC.W	 23 
	DC.W	 23 
	DC.W	 22 
	DC.W	 21 
	DC.W	 20 
	DC.W	 19 
	DC.W	 19 
	DC.W	 18 
	DC.W	 17 
	DC.W	 17 
	DC.W	 16 
	DC.W	 15 
	DC.W	 14 
	DC.W	 14 
	DC.W	 13 
	DC.W	 12 
	DC.W	 12 
	DC.W	 11 
	DC.W	 11 
	DC.W	 10 
	DC.W	 9 
	DC.W	 9 
	DC.W	 8 
	DC.W	 8 
	DC.W	 7 
	DC.W	 7 
	DC.W	 6 
	DC.W	 6 
	DC.W	 5 
	DC.W	 5 
	DC.W	 4 
	DC.W	 4 
	DC.W	 4 
	DC.W	 3 
	DC.W	 3 
	DC.W	 3 
	DC.W	 2 
	DC.W	 2 
	DC.W	 2 
	DC.W	 1 
	DC.W	 1 
	DC.W	 1 
	DC.W	 1 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 1 
	DC.W	 1 
	DC.W	 1 
	DC.W	 1 
	DC.W	 2 
	DC.W	 2 
	DC.W	 2 
	DC.W	 3 
	DC.W	 3 
	DC.W	 3 
	DC.W	 4 
	DC.W	 4 
	DC.W	 4 
	DC.W	 5 
	DC.W	 5 
	DC.W	 6 
	DC.W	 6 
	DC.W	 7 
	DC.W	 7 
	DC.W	 8 
	DC.W	 8 
	DC.W	 9 
	DC.W	 9 
	DC.W	 10 
	DC.W	 11 
	DC.W	 11 
	DC.W	 12 
	DC.W	 12 
	DC.W	 13 
	DC.W	 14 
	DC.W	 14 
	DC.W	 15 
	DC.W	 16 
	DC.W	 17 
	DC.W	 17 
	DC.W	 18 
	DC.W	 19 
	DC.W	 19 
	DC.W	 20 
	DC.W	 21 
	DC.W	 22 
	DC.W	 23 
	DC.W	 23 
	DC.W	 24 
	DC.W	 25 
	DC.W	 26 
	DC.W	 27 
	DC.W	 28 
	DC.W	 28 
	DC.W	 29 
	DC.W	 30 
	DC.W	 31 
	DC.W	 32 
	DC.W	 33 
	DC.W	 34 
	DC.W	 34 
	DC.W	 35 
	DC.W	 36 
	DC.W	 37 
	DC.W	 38 
	DC.W	 39 
	DC.W	 40 
	DC.W	 41 
	DC.W	 42 
	DC.W	 43 
	DC.W	 43 
	DC.W	 44 
	DC.W	 45 
	DC.W	 46 
	DC.W	 47 
	DC.W	 48 
	DC.W	 49 
	DC.W	 50 
	DC.W	 51 
	DC.W	 51 
	DC.W	 52 
	DC.W	 53 
	DC.W	 54 
	DC.W	 55 
	DC.W	 56 
	DC.W	 57 
	DC.W	 57 
	DC.W	 58 
	DC.W	 59 
	DC.W	 60 
	DC.W	 61 
	DC.W	 62 
	DC.W	 62 
	DC.W	 63 
	DC.W	 64 
	DC.W	 65 
	DC.W	 66 
	DC.W	 66 
	DC.W	 67 
	DC.W	 68 
	DC.W	 68 
	DC.W	 69 
	DC.W	 70 
	DC.W	 71 
	DC.W	 71 
	DC.W	 72 
	DC.W	 73 
	DC.W	 73 
	DC.W	 74 
	DC.W	 74 
	DC.W	 75 
	DC.W	 76 
	DC.W	 76 
	DC.W	 77 
	DC.W	 77 
	DC.W	 78 
	DC.W	 78 
	DC.W	 79 
	DC.W	 79 
	DC.W	 80 
	DC.W	 80 
	DC.W	 81 
	DC.W	 81 
	DC.W	 81 
	DC.W	 82 
	DC.W	 82 
	DC.W	 82 
	DC.W	 83 
	DC.W	 83 
	DC.W	 83 
	DC.W	 84 
	DC.W	 84 
	DC.W	 84 
	DC.W	 84 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 86 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 85 
	DC.W	 84 
	DC.W	 84 
	DC.W	 84 
	DC.W	 84 
	DC.W	 83 
	DC.W	 83 
	DC.W	 83 
	DC.W	 82 
	DC.W	 82 
	DC.W	 82 
	DC.W	 81 
	DC.W	 81 
	DC.W	 81 
	DC.W	 80 
	DC.W	 80 
	DC.W	 79 
	DC.W	 79 
	DC.W	 78 
	DC.W	 78 
	DC.W	 77 
	DC.W	 77 
	DC.W	 76 
	DC.W	 76 
	DC.W	 75 
	DC.W	 74 
	DC.W	 74 
	DC.W	 73 
	DC.W	 73 
	DC.W	 72 
	DC.W	 71 
	DC.W	 71 
	DC.W	 70 
	DC.W	 69 
	DC.W	 68 
	DC.W	 68 
	DC.W	 67 
	DC.W	 66 
	DC.W	 66 
	DC.W	 65 
	DC.W	 64 
	DC.W	 63 
	DC.W	 62 
	DC.W	 62 
	DC.W	 61 
	DC.W	 60 
	DC.W	 59 
	DC.W	 58 
	DC.W	 57 
	DC.W	 57 
	DC.W	 56 
	DC.W	 55 
	DC.W	 54 
	DC.W	 53 
	DC.W	 52 
	DC.W	 51 
	DC.W	 51 
	DC.W	 50 
	DC.W	 49 
	DC.W	 48 
	DC.W	 47 
	DC.W	 46 
	DC.W	 45 
	DC.W	 44 
	DC.W	 43 
	DC.W	 42 
	DC.W	 42 
	DC.W	 41 
	DC.W	 40 
	DC.W	 39 
	DC.W	 38 
	DC.W	 37 
	DC.W	 36 
	DC.W	 35 
	DC.W	 34 
	DC.W	 34 
	DC.W	 33 
	DC.W	 32 
	DC.W	 31 
	DC.W	 30 
	DC.W	 29 
	DC.W	 28 
	DC.W	 28 
	DC.W	 27 
	DC.W	 26 
	DC.W	 25 
	DC.W	 24 
	DC.W	 23 
	DC.W	 23 
	DC.W	 22 
	DC.W	 21 
	DC.W	 20 
	DC.W	 19 
	DC.W	 19 
	DC.W	 18 
	DC.W	 17 
	DC.W	 17 
	DC.W	 16 
	DC.W	 15 
	DC.W	 14 
	DC.W	 14 
	DC.W	 13 
	DC.W	 12 
	DC.W	 12 
	DC.W	 11 
	DC.W	 11 
	DC.W	 10 
	DC.W	 9 
	DC.W	 9 
	DC.W	 8 
	DC.W	 8 
	DC.W	 7 
	DC.W	 7 
	DC.W	 6 
	DC.W	 6 
	DC.W	 5 
	DC.W	 5 
	DC.W	 4 
	DC.W	 4 
	DC.W	 4 
	DC.W	 3 
	DC.W	 3 
	DC.W	 3 
	DC.W	 2 
	DC.W	 2 
	DC.W	 2 
	DC.W	 1 
	DC.W	 1 
	DC.W	 1 
	DC.W	 1 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 0 
	DC.W	 1 
	DC.W	 1 
	DC.W	 1 
	DC.W	 1 
	DC.W	 2 
	DC.W	 2 
	DC.W	 2 
	DC.W	 3 
	DC.W	 3 
	DC.W	 3 
	DC.W	 4 
	DC.W	 4 
	DC.W	 4 
	DC.W	 5 
	DC.W	 5 
	DC.W	 6 
	DC.W	 6 
	DC.W	 7 
	DC.W	 7 
	DC.W	 8 
	DC.W	 8 
	DC.W	 9 
	DC.W	 9 
	DC.W	 10 
	DC.W	 11 
	DC.W	 11 
	DC.W	 12 
	DC.W	 12 
	DC.W	 13 
	DC.W	$FFFF
	DC.W	 14 
	DC.W	 14 
	DC.W	 15 
	DC.W	 16 
	DC.W	 17 
	DC.W	 17 
	DC.W	 18 
	DC.W	 19 
	DC.W	 19 
	DC.W	 20 
	DC.W	 21 
	DC.W	 22 
	DC.W	 23 
	DC.W	 23 
	DC.W	 24 
	DC.W	 25 
	DC.W	 26 
	DC.W	 27 
	DC.W	 28 
	DC.W	 28 
	DC.W	 29 
	DC.W	 30 
	DC.W	 31 
	DC.W	 32 
	DC.W	 33 
	DC.W	 34 
	DC.W	 34 
	DC.W	 35 
	DC.W	 36 
	DC.W	 37 
	DC.W	 38 
	DC.W	 39 
	DC.W	 40 
	DC.W	 41 
	DC.W	 42 
	DC.W	 43 
	DC.W	 43 
	DC.W	 44 
	DC.W	 45 
	DC.W	 46 
	DC.W	 47 
	DC.W	 48 
	DC.W	 49 
	DC.W	 50 
	DC.W	 51 
	DC.W	 51 
	DC.W	 52 
	DC.W	 53 
	DC.W	 54 
	DC.W	 55 
	DC.W	 56 
	DC.W	 57 
	DC.W	 57 
	DC.W	 58 
	DC.W	 59 
	DC.W	 60 
	DC.W	 61 
	DC.W	 62 
	DC.W	 62 
	DC.W	 63 
	DC.W	 64 
	DC.W	 65 
	DC.W	 66 
	DC.W	 66 
	DC.W	 67 
	DC.W	 68 
	DC.W	 69 
	DC.W	 69 
	DC.W	 70 
	DC.W	 71 
	DC.W	 71 
	DC.W	 72 
	DC.W	 73 
	DC.W	 73 
	DC.W	 74 
	DC.W	 74 
	DC.W	 75 
	DC.W	 76 
	DC.W	 76 
text:		
	dc.b	'SIMPLE',1 ;       * simple textroutine *",1
	dc.b	1
	dc.b	'flashtro rulez!!',0

chartab: 	
	dc.b 	'abcdefghijklmnopqrstuvwxyz!'	; chars as they appear
	dc.b 	'0123456789*-. '		; in our char table

chars:		dc.b	$00,$7C,$E6,$E6,$FE,$E6,$E6,$06	;"A"
		dc.b	$00,$FC,$E6,$FC,$E6,$E6,$FC,$00	;"B"
		dc.b	$00,$7E,$E6,$E0,$E0,$E6,$7E,$00	;"C"
		dc.b	$00,$FC,$E6,$E6,$E6,$E6,$FC,$00	;"D"
		dc.b	$00,$FE,$E6,$F8,$E0,$E6,$FE,$00	;"E"
		dc.b	$00,$FE,$E6,$F8,$E0,$E0,$E0,$E0	;"F"
		dc.b	$00,$7C,$E0,$EE,$E6,$E6,$7E,$00	;"G"
		dc.b	$E0,$E6,$E6,$FE,$E6,$E6,$E6,$06	;"H"
		dc.b	$00,$FE,$38,$38,$38,$38,$FE,$00	;"I"
		dc.b	$0E,$0E,$0E,$0E,$0E,$CE,$7C,$00	;"J"
		dc.b	$E0,$EE,$FC,$F8,$FC,$EE,$E6,$06	;"K"
		dc.b	$E0,$E0,$E0,$E0,$E0,$E6,$FE,$00	;"L"
		dc.b	$00,$C6,$EE,$FE,$F6,$E6,$E6,$06	;"M"
		dc.b	$06,$C6,$E6,$F6,$FE,$EE,$E6,$E0	;"N"
		dc.b	$00,$7C,$E6,$E6,$E6,$E6,$7C,$00	;"O"
		dc.b	$00,$FC,$E6,$E6,$FC,$E0,$E0,$E0	;"P"
		dc.b	$00,$7C,$E6,$E6,$FA,$EC,$76,$06	;"Q"
		dc.b	$00,$FC,$E6,$E6,$FC,$E6,$E6,$06	;"R"
		dc.b	$00,$3C,$70,$3C,$0E,$CE,$FC,$00	;"S"
		dc.b	$00,$FE,$38,$38,$38,$38,$38,$38	;"T"
		dc.b	$E0,$E6,$E6,$E6,$E6,$E6,$7C,$00	;"U"
		dc.b	$E0,$E6,$E6,$E6,$6C,$38,$10,$00	;"V"
		dc.b	$E0,$E6,$E6,$F6,$FE,$EE,$44,$00	;"W"
		dc.b	$C0,$EE,$7C,$38,$7C,$E6,$E6,$06	;"X"
		dc.b	$E0,$E6,$E6,$7C,$38,$38,$38,$38	;"Y"
		dc.b	$00,$FE,$CE,$1C,$70,$E6,$FE,$00	;"Z"
		dc.b	$38,$38,$38,$38,$38,$00,$38,$00	;"!"
		dc.b	$00,$7C,$E6,$EE,$F6,$E6,$7C,$00	;"0"
		dc.b	$00,$F8,$38,$38,$38,$38,$FE,$00	;"1"
		dc.b	$00,$7C,$0E,$7C,$E0,$E6,$FE,$00	;"2"
		dc.b	$00,$FC,$CE,$3C,$0E,$CE,$FC,$00	;"3"
		dc.b	$00,$0E,$1E,$3E,$6E,$FE,$0E,$0E	;"4"
		dc.b	$00,$FC,$E0,$FC,$0E,$CE,$FC,$00	;"5"
		dc.b	$00,$7C,$E0,$FC,$E6,$E6,$7C,$00	;"6"
		dc.b	$00,$FE,$CE,$1C,$38,$38,$38,$38	;"7"
		dc.b	$00,$7C,$E6,$7C,$E6,$E6,$7C,$00	;"8"
		dc.b	$00,$7C,$CE,$CE,$7E,$0E,$7C,$00	;"9"
		dc.b	$00,$66,$FF,$FF,$7E,$3C,$18,$00	;"*"
		dc.b	$00,$00,$00,$00,$FE,$00,$00,$00	;"-"
		dc.b	$00,$00,$00,$00,$00,$38,$38,$00	;"."
		dc.b	$00,$00,$00,$00,$00,$00,$00,$00 ;" "

bitplane:	blk.b	10240,0				; Space for one
							; 320x256 bitplane
							; 40 bytes each row
							; (320 bits/pixels)