       code_any


init:
       bsr           setPalette
       rts


setPalette:
       lea           CUSTOM,a6
       move.w        #$123,COLOR0(a6)
       move.w        #$ace,COLOR1(a6)
       rts


       bss_c

bitplane:
       ds.b   320/8*256

sintable:
       ds.w     32768

       
       data_c


; logo data posted on pouet by Korvkiosken here: https://www.pouet.net/topic.php?which=12770
; radial segments (radStart, thickness, angleStart, angleDistance) for a sine table of 32768 entries (well, actually 16384 16bit values)
logo:  
       DC.W	$0056,$0063,$85FC-10,$05E0+10
       DC.W	$004B,$0063,$7F40-10,$06A4+10
       DC.W	$0056,$006B,$6A88,$14A0
       DC.W	$004B,$0063,$6670,$0410
       DC.W	$0056,$0063,$5FE0,$065C+40
       DC.W	$004B,$0063,$574C,$08AC
       DC.W	$0056,$0063,$4200,$154C
       DC.W	$004B,$0063,$3000,$1270
       DC.W	75,$0068,$2C84,$0370
       DC.W	86,$0063,$22E0,$09D8
       DC.W	75,$0063,$1918,$09BC
       DC.W	86,$0063,$1008,$08DC+40
       DC.W	75,$0063,$0BD0,$0430

       DC.W	$002A,$003D,$79C4,$0F44
       DC.W	$0033,$003D,$752C,$0450+40
       DC.W	$002A,$003D,$6F14,$0644
       DC.W	$001E,$003D,$61F4,$0D48
       DC.W	$002A,$003D,$5504,$0CA0+60
       DC.W	$0033,$003D,$5004-60,$04F8+60
       DC.W	$002A,$003D,$4744-50,$0868+50

       DC.W	$001D,$003D,$417C-40,$0588+40
       DC.W	$002a,$003D,$3B04,$0584+180
       DC.W	$0032,$003D,$20EC,$1A24
       DC.W	$002A,$003D,$164C,$0AAC
       DC.W	$001D,$003D,$08DC,$0F84

       dc.w	10,21,0,32767

       dc.w	21,35,9000-36,5000+480
endLogo:       
       dc.w   -1     ; end marker, not in the original data
