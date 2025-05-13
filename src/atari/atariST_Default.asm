M68KWB_TargetPlatformInit:
    move.l #M68KWB_defaultRTE,$70    ; VBL
    move.l #M68KWB_defaultRTE,$68    ; HBL
    move.l #M68KWB_defaultRTE,$134   ; MFP's Timer A
    move.l #M68KWB_defaultRTE,$120   ; MFP's Timer B
    move.l #M68KWB_defaultRTE,$114   ; MFP's Timer C
    move.l #M68KWB_defaultRTE,$110   ; MFP's Timer D
    move.l #M68KWB_defaultRTE,$118   ; ACIA
    rts

M68KWB_defaultRTE:
    nop
    rte
