PATH_MIN_X	EQU	120
PATH_MAX_X	EQU	210
PATH_W	EQU	128
PATH_MIN_Y	EQU	154
PATH_MAX_Y	EQU	200
PATH_H	EQU	46


groundRoots_bobs:
	dc.w	$a; list #0 (default) 1st pt offset in bytes
	dc.w	$66; list #1 (l2) 1st pt offset in bytes
	dc.w	$c0; list #2 (l3) 1st pt offset in bytes
	dc.w	$11c; list #3 (l4) 1st pt offset in bytes
	dc.w	$ffff	; terminator
	; DATA FORMAT: 4bit dx | 4bit dy, sizer

	; list #0 data offset = 0
	dc.w	$1680	; initial ofs x = 0, y = 45
	dc.b	$0,$8
	dc.b	$19,$8
	dc.b	$29,$8
	dc.b	$29,$8
	dc.b	$29,$8
	dc.b	$29,$8
	dc.b	$19,$8
	dc.b	$29,$8
	dc.b	$9,$8
	dc.b	$19,$8
	dc.b	$9,$6
	dc.b	$19,$6
	dc.b	$9,$6
	dc.b	$19,$6
	dc.b	$9,$6
	dc.b	$19,$6
	dc.b	$9,$6
	dc.b	$19,$6
	dc.b	$9,$6
	dc.b	$19,$6
	dc.b	$9,$6
	dc.b	$19,$6
	dc.b	$29,$6
	dc.b	$29,$4
	dc.b	$19,$4
	dc.b	$29,$4
	dc.b	$9,$4
	dc.b	$19,$4
	dc.b	$19,$4
	dc.b	$9,$4
	dc.b	$9,$4
	dc.b	$19,$4
	dc.b	$9,$3
	dc.b	$9,$3
	dc.b	$9,$3
	dc.b	$9,$3
	dc.b	$9,$3
	dc.b	$19,$3
	dc.b	$9,$2
	dc.b	$9,$2
	dc.b	$9,$2
	dc.b	$19,$2
	dc.b	$19,$1
	dc.b	$9,$1
	dc.b	$19,$1
	dc.b	$ff,$ff	; terminator

	; list #1 data offset = 188
	dc.w	$1632	; initial ofs x = 50, y = 44
	dc.b	$0,$4
	dc.b	$9,$4
	dc.b	$99,$4
	dc.b	$9,$4
	dc.b	$9,$4
	dc.b	$99,$4
	dc.b	$9,$4
	dc.b	$9,$4
	dc.b	$99,$4
	dc.b	$99,$4
	dc.b	$a9,$4
	dc.b	$99,$4
	dc.b	$a9,$4
	dc.b	$a9,$4
	dc.b	$a9,$4
	dc.b	$a9,$4
	dc.b	$a9,$4
	dc.b	$b9,$3
	dc.b	$b9,$3
	dc.b	$a9,$3
	dc.b	$a9,$3
	dc.b	$99,$3
	dc.b	$a9,$3
	dc.b	$99,$3
	dc.b	$99,$3
	dc.b	$9,$3
	dc.b	$9,$3
	dc.b	$99,$3
	dc.b	$9,$3
	dc.b	$19,$3
	dc.b	$9,$3
	dc.b	$9,$3
	dc.b	$19,$3
	dc.b	$9,$3
	dc.b	$9,$3
	dc.b	$19,$3
	dc.b	$9,$3
	dc.b	$19,$3
	dc.b	$9,$2
	dc.b	$19,$2
	dc.b	$9,$2
	dc.b	$9,$2
	dc.b	$19,$2
	dc.b	$9,$2
	dc.b	$ff,$ff	; terminator

	; list #2 data offset = 372
	dc.w	$1613	; initial ofs x = 19, y = 44
	dc.b	$0,$6
	dc.b	$19,$6
	dc.b	$9,$6
	dc.b	$19,$6
	dc.b	$9,$6
	dc.b	$19,$6
	dc.b	$9,$6
	dc.b	$19,$6
	dc.b	$9,$6
	dc.b	$19,$6
	dc.b	$19,$6
	dc.b	$19,$6
	dc.b	$19,$6
	dc.b	$19,$6
	dc.b	$29,$6
	dc.b	$19,$6
	dc.b	$19,$6
	dc.b	$19,$6
	dc.b	$29,$6
	dc.b	$19,$6
	dc.b	$29,$6
	dc.b	$19,$6
	dc.b	$29,$6
	dc.b	$29,$6
	dc.b	$19,$6
	dc.b	$19,$6
	dc.b	$19,$4
	dc.b	$19,$4
	dc.b	$19,$4
	dc.b	$19,$4
	dc.b	$19,$3
	dc.b	$29,$3
	dc.b	$9,$3
	dc.b	$9,$3
	dc.b	$19,$3
	dc.b	$9,$3
	dc.b	$9,$3
	dc.b	$19,$3
	dc.b	$9,$3
	dc.b	$9,$3
	dc.b	$9,$3
	dc.b	$9,$3
	dc.b	$99,$2
	dc.b	$9,$2
	dc.b	$9,$2
	dc.b	$ff,$ff	; terminator

	; list #3 data offset = 560
	dc.w	$175a	; initial ofs x = 90, y = 46
	dc.b	$0,$8
	dc.b	$99,$8
	dc.b	$9,$8
	dc.b	$99,$8
	dc.b	$99,$8
	dc.b	$9,$8
	dc.b	$99,$8
	dc.b	$9,$8
	dc.b	$99,$8
	dc.b	$99,$8
	dc.b	$9,$8
	dc.b	$99,$8
	dc.b	$99,$8
	dc.b	$9,$8
	dc.b	$99,$8
	dc.b	$9,$8
	dc.b	$99,$8
	dc.b	$99,$8
	dc.b	$9,$8
	dc.b	$99,$8
	dc.b	$99,$8
	dc.b	$9,$8
	dc.b	$99,$8
	dc.b	$9,$8
	dc.b	$99,$8
	dc.b	$99,$8
	dc.b	$9,$8
	dc.b	$a9,$8
	dc.b	$b9,$8
	dc.b	$c9,$8
	dc.b	$b9,$8
	dc.b	$b9,$8
	dc.b	$a9,$8
	dc.b	$b9,$6
	dc.b	$b9,$6
	dc.b	$99,$6
	dc.b	$99,$6
	dc.b	$99,$6
	dc.b	$9,$4
	dc.b	$99,$4
	dc.b	$99,$4
	dc.b	$a9,$4
	dc.b	$99,$4
	dc.b	$a9,$3
	dc.b	$a9,$3
	dc.b	$99,$3
	dc.b	$9,$2
	dc.b	$ff,$ff	; terminator
	dc.w	0,0	; terminating zeroes
