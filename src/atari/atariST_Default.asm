M68KWB_TargetPlatformInit:
    clr.b       $fffffa07           ; Clear Interrupt Enable for MFP's Timer A and Timer B
    clr.b       $fffffa13           ; Clear Interrupt Mask for MFP's Timer A and Timer B
    clr.b       $fffffa09           ; Clear Interrupt Enable for MFP's Timer C and Timer D
    clr.b       $fffffa15           ; Clear Interrupt Mask for MFP's Timer C and Timer D
    clr.b       $fffffa1b           ; Stop Timer B
    move.l #M68KWB_defaultRTE,$70   ; VBL
    move.l #M68KWB_defaultRTE,$68   ; HBL
    move.l #M68KWB_defaultRTE,$134  ; MFP's Timer A
    move.l #M68KWB_defaultRTE,$120  ; MFP's Timer B
    move.l #M68KWB_defaultRTE,$114  ; MFP's Timer C
    move.l #M68KWB_defaultRTE,$110  ; MFP's Timer D
    move.l #M68KWB_defaultRTE,$118  ; ACIA
    rts

M68KWB_defaultRTE:
    nop
    rte

M68KWB_defaultMainLoop:
    nop
    rts

    IFD M68KWB
fx_canExit:
    dc.w    0
    ENDC