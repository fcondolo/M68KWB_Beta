start_defines:                     ; keep it as first line 


SCR_W       EQU 320

    IFD TARGET_OCS
SCR_W_BYTES EQU SCR_W/8
SCR_H       EQU 256
    ELSE
SCR_W_BYTES EQU 160
SCR_H       EQU 200
    ENDC


MODE_OFF       EQU       0
MODE_BOT_TOP   EQU       1
COORD_SHIFT    EQU       4

; -----------------------------
; point struct
     rsreset
pt_x           rs.w      1
pt_y           rs.w      1
pt_spdx        rs.w      1
pt_lifeTime    rs.w      1
pt_targetOfs   rs.w      1
pt_targetMsk   rs.w      1
pt_structLen   rs.b      1

; -----------------------------
; main FX struct
     rsreset
readTextPtr    rs.l      1                             ; current text pointer
backBufPtr     rs.l      1                             ; backbuffer to render text
readBackbufPtr rs.l      1
showScreenPtr  rs.l      1
drawScreenPtr  rs.l      1
readxMsk       rs.w      1
readxByte      rs.w      1
readX          rs.w      1
readY          rs.w      1
readDirX       rs.w      1
mode           rs.w      1
points         rs.b      pt_structLen*PTS_MAXCOUNT
mulyTable      rs.w      SCR_H
structLen      rs.b      0



PTS_MAXCOUNT             EQU  320

; font related defines
FONT_IMG_W_BYTES         EQU  240/8
FONT_LETTERS_PER_LINE    EQU  30
FONT_CHAR_HEIGHT         EQU  8
ASCII_NEWLINE            EQU  255
ASCII_SPACE              EQU  32


; -----------------------------

end_defines:                       ; keep it as last line
