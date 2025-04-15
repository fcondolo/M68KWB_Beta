;       MOVEM.L D0-D7/A0-A6,$1234
;       MOVEM.L (A5),D0-D2/D5-D7/A0-A3/A6
;       MOVEM.W (A7)+,D0-D5/D7/A0-A6
;       MOVEM.W D0-D5/D7/A0-A6,-(A7)
;       MOVEM.L (A5),D0-D2/D5-D7/A0-A3/A6
;       MOVEM.W (A7)+,D0-D5/D7/A0-A6
;       MOVEM.W D0-D5/D7/A0-A6,-(A7)

; https://github.com/ianhan/BitmapFonts

FONT16_W EQU 320
FONT16_H EQU 48

FONT32_W EQU 320
FONT32_H EQU 192

_HRT     EQU 'Z'+1                                                                            ; HEART
_SPC     EQU ' '                                                                              ; SPACE
_NP_     EQU 0                                                                                ; NOP
_EOL     EQU -1                                                                               ; END OF LINE
_LOP     EQU -2                                                                               ; LOOP
_WAT     EQU -3                                                                               ; WAIT

DEBUG_copyBlit:
       lea       CUSTOM,a6
       move.w    #0,BLTAMOD(a6)
       move.w    #(320-FONT32_W)/8,BLTDMOD(a6)
       move.w    #$09f0,BLTCON0(a6)
       move.w    #$0000,BLTCON1(a6)
       move.l    a0,BLTAPTH(a6)
       move.l    a1,BLTDPTH(a6)
       move.w    #(FONT32_H<<6)+FONT32_W/16,BLTSIZE(a6)
       rts



; A2.L  : Destination
draw_SPC16:
       moveq     #0,d0
       move.l    #39,d2
       move.w    #18,d1
._SPC16line: ; byte copy to allow odd addresses
       move.b    d0,(a2)+
       move.b    d0,(a2)
       add.l     d2,a2
       dbra      d1,._SPC16line
       rts

; A2.L  : Destination
draw_SPC32:
       moveq     #0,d0
       move.l    #37,d2
       move.w    #31,d1
._SPC32line: ; byte copy to allow odd addresses
       move.b    d0,(a2)+
       move.b    d0,(a2)+
       move.b    d0,(a2)+
       move.b    d0,(a2)
       add.l     d2,a2
       dbra      d1,._SPC32line
       rts


; D0.B  : Letter
; A2.L  : Destination
drawLetter16CPU:
       lea       font16,a0
       lea       font16UV,a1
       and.w     #$ff,d0
; >JS if((regs.d[0] & 0xffff) < 65) debug(); 
; >JS if((regs.d[0] & 0xffff) > 91) debug(); 
       sub.w     #'A',d0                                                                      ; 'A'
       add.w     d0,d0
       move.w    (a1,d0.w),d0                                                                 ; UV
       add.w     d0,a0
       move.l    #39,d2
       move.w    #18,d1
.letter16line: ; byte copy to allow odd addresses
       move.b    (a0)+,(a2)+
       move.b    (a0),(a2)
       add.l     d2,a0
       add.l     d2,a2
       dbra      d1,.letter16line
       rts

; D0.B  : Letter
; A2.L  : Destination
drawLetter32CPU:
       lea       font32,a0
       lea       font32UV,a1
       and.w     #$ff,d0
       sub.w     #'A',d0                                                                      ; 'A'
       add.w     d0,d0
       move.w    (a1,d0.w),d0                                                                 ; UV
       add.w     d0,a0
       move.l    #37,d2
       move.w    #31,d1
.letter32line: ; byte copy to allow odd addresses
       move.b    (a0)+,(a2)+
       move.b    (a0)+,(a2)+
       move.b    (a0)+,(a2)+
       move.b    (a0),(a2)
       add.l     d2,a0
       add.l     d2,a2
       dbra      d1,.letter32line
       rts

; A2.L  : Destination
drawString:
       cmp.b     #0,heroes_WAT
       beq.b     .proceed
       sub.b     #1,heroes_WAT
       rts
.proceed:      
       lea       heroesList,a3
       move.w    (a3)+,d3                                                                     ; current word ofs      
       add.w     d3,a3                                                                        ; point to current word
       moveq     #0,d0
       move.b    (a3),d0                                                                      ; char index
       bne.b     .notFirstChar
       move.w    2(a3),saveScreenOfs                                                          ; screen ofs
.notFirstChar:
       moveq     #0,d4      
       move.b    1(a3),d4                                                                     ; font width
       addq.w    #4,d0                                                                        ; skip offsets
       move.w    2(a3),d2                                                                     ; screen ofs
       add.w     d2,a2                                                                        ; update dest address
       move.b    (a3,d0.w),d1                                                                 ; current char
       cmp.b     #_EOL,d1
       beq.b     .endString
       cmp.b     #_LOP,d1
       beq.b     .endData
       add.b     #1,(a3)                                                                      ; update char index
       cmp.b     #_WAT,d1
       beq.b     ._WATfor
       cmp.b     #_NP_,d1
       beq.b     .letterDone
       cmp.b     #_SPC,d1
       beq.b     .is_SPC
       add.w     d4,2(a3)                                                                     ; update screen ofs
       move.w    d1,d0                                                                        ; letter
       move.b    #4,heroes_WAT
       cmp.w     #4,d4
       bne       drawLetter16CPU
       bra       drawLetter32CPU
.letterDone:      
       rts
.is_SPC:
       add.w     #2,2(a3)
       cmp.w     #4,d4
       beq       draw_SPC32
       bra       draw_SPC16
._WATfor:
       move.b    1(a3,d0.w),heroes_WAT
       add.b     #1,(a3)                                                                      ; skip wait amount
       rts      
.endString:
       move.w    saveScreenOfs,2(a3)
       addq.w    #1,d0                                                                        ; skip -1 (end string marker)
       subq.w    #2,d0                                                                        ; don't take current word ofs into account
       add.w     d0,a3
       move.b    #0,2(a3)                                                                     ; rewind 1st letter ofs
       sub.l     #heroesList,a3
       lea       heroesList,a0
       move.w    a3,(a0)                                                                      ; update current word ofs
       rts
.endData:
       move.w    saveScreenOfs,2(a3)
       lea       heroesList,a3
       move.w    #0,(a3)+                                                                     ; rewind current
       move.b    #0,(a3)                                                                      ; rewind 1st letter ofs
       rts

font16:
       incbin    "fx/data/font16x16.bin"
font32:
       incbin    "fx/data/rack32x32.bin"

font16UV:
; texture byte offset starting with A letter
UV     SET       26+40*19
       REPT      7
       dc.w      UV
UV     SET       UV+2
       ENDR
UV     SET       40*19*2
       REPT      20
       dc.w      UV
UV     SET       UV+2
       ENDR


font32UV:
; texture byte offset starting with A letter
UV     SET       12
       REPT      7
       dc.w      UV
UV     SET       UV+4
       ENDR
UV     SET       40*32
       REPT      10
       dc.w      UV
UV     SET       UV+4
       ENDR
UV     SET       40*32*2
       REPT      11
       dc.w      UV
UV     SET       UV+4
       ENDR

saveScreenOfs:
       dc.w      0

heroes_WAT:
       dc.b      0
       dc.b      0                                                                            ; FREE

heroesList:
       dc.w      0                                                                            ; current word ofs


; --------- PAGE 1

_CURY  SET       40*4
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      'VOYAGE',_SPC,'OVERDOSE',_SPC,'ARTE',_NP_,_EOL

_CURY  SET       _CURY+19*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      _SPC,_SPC,'HARDWIRED',_SPC,'ENIGMA',_SPC,_SPC,_NP_,_EOL


_CURY  SET       _CURY+19*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      'MINDRIOT',_SPC,'DREAMSCAPE',_EOL

_CURY  SET       _CURY+19*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      'SUBSTANCE',_SPC,'ANIMOTION',_EOL

_CURY  SET       _CURY+19*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      _SPC,'INTERFERENCE',_SPC,'ROOTS',_EOL

_CURY  SET       _CURY+19*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      _SPC,'HOT',_SPC,'DOTS',_SPC,'EXTENSION',_EOL

_CURY  SET       _CURY+19*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      'LETHAL',_SPC,'EXIT',_SPC,'DARKROOM',_NP_,_EOL

_CURY  SET       _CURY+19*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      'ODYSSEY',_SPC,'GLOBAL',_SPC,'TRASH',_NP_,_EOL

_CURY  SET       _CURY+19*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      _SPC,_SPC,'STATE',_SPC,'OF',_SPC,'THE',_SPC,'ART',_NP_,_EOL
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      0                                                                            ; word screen ofs
       dc.b      _WAT,150,_NP_,_EOL

; --------- PAGE 2

_CURY  SET       40*4
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      _SPC,'THE',_SPC,'GREATEST',_SPC,'MAGIC',_SPC,_NP_,_EOL

_CURY  SET       _CURY+19*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      _SPC,'IS',_SPC,'THE',_SPC,'ONE',_SPC,'WE',_SPC,'MAKE',_EOL


_CURY  SET       _CURY+19*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      _SPC,'OURSELVES',_SPC,_HRT,_SPC,'MAGIC',_SPC,_EOL

_CURY  SET       _CURY+19*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      _SPC,'IS',_SPC,'NOT',_SPC,'SOMETHING',_SPC,_SPC,_EOL

_CURY  SET       _CURY+19*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      'YOU',_SPC,'POSSESS',_SPC,_HRT,_SPC,'IT',_SPC,'IS',_EOL

_CURY  SET       _CURY+19*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      _SPC,_SPC,'SOMETHING',_SPC,'YOU',_SPC,'DO',_SPC,_EOL

_CURY  SET       _CURY+19*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      _SPC,_SPC,_SPC,'NOW',_SPC,'GO',_SPC,'USE',_SPC,'YOUR',_SPC,_SPC,_NP_,_EOL

_CURY  SET       _CURY+19*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      _SPC,_SPC,'MAGIC',_SPC,'AND',_SPC,'MAKE',_SPC,'A',_SPC,_SPC,_NP_,_EOL

_CURY  SET       _CURY+19*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      _CURY
       dc.b      _SPC,_SPC,_SPC,'DEMO',_SPC,'ABOUT',_SPC,'IT',_SPC,_SPC,_SPC,_EOL
       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      0                                                                            ; word screen ofs
       dc.b      _WAT,150,_NP_,_EOL

; --------- PAGE 3 & 4

_CURY  SET       12*40 
       dc.b      0                                                                            ; current letter ofs
       dc.b      4                                                                            ; font width
       dc.w      _CURY                                                                        ; word screen ofs
       dc.b      _SPC,_SPC,_SPC,_SPC,'VOYAGE',_SPC,_EOL

_CURY  SET       _CURY+32*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      4                                                                            ; font width
       dc.w      _CURY+1
       dc.b      'HARDWIRED',_EOL

_CURY  SET       _CURY+32*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      4                                                                            ; font width
       dc.w      _CURY+1
       dc.b      _SPC,'OVERDOSE',_EOL

_CURY  SET       _CURY+32*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      4                                                                            ; font width
       dc.w      _CURY+1
       dc.b      'SUBSTANCE',_EOL

_CURY  SET       _CURY+32*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      4                                                                            ; font width
       dc.w      _CURY+1
       dc.b      'ANIMOTION',_EOL

       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      0                                                                            ; word screen ofs
       dc.b      _WAT,150,_NP_,_EOL

_CURY  SET       12*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      4                                                                            ; font width
       dc.w      _CURY                                                                        ; word screen ofs
       dc.b      _HRT,_SPC,'ENIGMA',_SPC,_HRT,_SPC,_EOL


_CURY  SET       _CURY+32*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      4                                                                            ; font width
       dc.w      _CURY                                                                        ; word screen ofs
       dc.b      _SPC,'ODYSSEY',_SPC,_EOL

_CURY  SET       _CURY+32*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      4                                                                            ; font width
       dc.w      _CURY                                                                        ; word screen ofs
       dc.b      _SPC,'MINDRIOT',_SPC,_SPC,_EOL

_CURY  SET       _CURY+32*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      4                                                                            ; font width
       dc.w      _CURY                                                                        ; word screen ofs
       dc.b      _SPC,_SPC,'ELYSIUM',_SPC,_SPC,_EOL

_CURY  SET       _CURY+32*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      4                                                                            ; font width
       dc.w      _CURY                                                                        ; word screen ofs
       dc.b      _SPC,_SPC,'IMPULSE',_SPC,_NP_,_EOL

       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      0                                                                            ; word screen ofs
       dc.b      _WAT,150,_NP_,_EOL


; --------- PAGE 5

_CURY  SET       12*40 
       dc.b      0                                                                            ; current letter ofs
       dc.b      4                                                                            ; font width
       dc.w      _CURY+4
       dc.b      'ROOTS',_SPC,'II',_SPC,_EOL

_CURY  SET       _CURY+32*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      4                                                                            ; font width
       dc.w      _CURY
       dc.b      _SPC,_SPC,'HOT',_SPC,'DOTS',_SPC,_EOL

_CURY  SET       _CURY+32*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      4                                                                            ; font width
       dc.w      _CURY+1
       dc.b      'EXTENSION',_EOL

_CURY  SET       _CURY+32*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      4                                                                            ; font width
       dc.w      _CURY+1
       dc.b      'ZYCLONIUM',_EOL

_CURY  SET       _CURY+32*40
       dc.b      0                                                                            ; current letter ofs
       dc.b      4                                                                            ; font width
       dc.w      _CURY
       dc.b      _SPC,_SPC,'DARKROOM',_SPC,_EOL


       dc.b      0                                                                            ; current letter ofs
       dc.b      2                                                                            ; font width
       dc.w      0                                                                            ; word screen ofs
       dc.b      _WAT,255,_WAT,255,_WAT,255,_WAT,255,_NP_,_LOP

endScript:
       dc.w      0