ASCII_NEWLINE   EQU 255
ASCII_SPACE     EQU 32

text:
        dc.b    ASCII_NEWLINE,ASCII_NEWLINE,ASCII_NEWLINE
        dc.b    ASCII_NEWLINE,'             M68KWB RULEZ!            '
        dc.b    ASCII_NEWLINE,'         KEEP CODING THE 68000        '
        dc.b	ASCII_NEWLINE,"  5 FINGER PUNCH,ALCATRAZ,DESIRE,DHS  "
        dc.b	ASCII_NEWLINE,"    AMIGA SKOOL,ANARCHY,ANDROMEDA     "
        dc.b	ASCII_NEWLINE,"  BATMAN GROUP,BONZAI,CENSOR DESIGN   "
        dc.b	ASCII_NEWLINE," CEREBRAL VORTEX,COMPLEX,COSMIC ORBS  "
        dc.b	ASCII_NEWLINE,"     DARKAGE,DEADLINERS,DEKADENCE     "
        dc.b	ASCII_NEWLINE,"  EXTREAM,FAIRLIGHT,FNUQUE,HAUBJOB,HMD"
        dc.b	ASCII_NEWLINE,"    INSANE,LEMON.,LOONIES,MEGASTYLE   "
        dc.b	ASCII_NEWLINE,"    NAH-KOLOR,NOICE,NUMPTIES,OFFENCE  "
        dc.b	ASCII_NEWLINE,"    OUTSIDERS,OXYGENE,PACIFIC,REBELS  "
        dc.b	ASCII_NEWLINE," RUSSIAN PRESTIGE,SCOOPEX,SECTOR ONE  "
        dc.b	ASCII_NEWLINE,"   SMFX,SOFTWARE FAILURE,SPACEBALLS   "
        dc.b	ASCII_NEWLINE,"    SLIDE,SPREADPOINT,TALENT,TRSI     "
        dc.b	ASCII_NEWLINE,"       EPHIDRENA,MELON DEZIGN         "
        dc.b    0

        even

fontData:
    incbin "data/font8x8_bitplanes.bin"

cplist:
       dc.w   DIWSTRT,$2c81 ; PAL default window start
       dc.w   DIWSTOP,$2cc1 ; PAL default window stop
       dc.w   DDFSTRT,$0038
       dc.w   DDFSTOP,$00d0
       dc.w   DMACON, $83c0 ; blitter + copper + bitplane DMA
       dc.w   BPLCON0,$1200  ;1 bitplane
       dc.w   $ffff,$fffe

FONT_LETTERS_PER_LINE   EQU 30
FONT_IMG_W_BYTES        EQU 240/8
FONT_CHAR_HEIGHT        EQU 8

fontUV:
    ; line 1
FNT_U SET 0
FNT_V SET 0
    REPT FONT_LETTERS_PER_LINE
    dc.w    FNT_U+FNT_V
FNT_U SET FNT_U+1
    ENDR

    ; line 2
FNT_U SET 0
FNT_V SET FNT_V+FONT_IMG_W_BYTES*FONT_CHAR_HEIGHT
    REPT FONT_LETTERS_PER_LINE
    dc.w    FNT_U+FNT_V
FNT_U SET FNT_U+1
    ENDR

    ; line 3
FNT_U SET 0
FNT_V SET FNT_V+FONT_IMG_W_BYTES*FONT_CHAR_HEIGHT
    REPT FONT_LETTERS_PER_LINE
    dc.w    FNT_U+FNT_V
FNT_U SET FNT_U+1
    ENDR    

    ; line 4
FNT_U SET 0
FNT_V SET FNT_V+FONT_IMG_W_BYTES*FONT_CHAR_HEIGHT
    REPT 3
    dc.w    FNT_U+FNT_V
FNT_U SET FNT_U+1
    ENDR    