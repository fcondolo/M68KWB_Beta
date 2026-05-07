M68KWB_TargetPlatformInit:
    ;>JS MACHINE.pauseMemCheck();
    clr.b       $fffffa07           ; M68KWB_NOERROR Clear Interrupt Enable for MFP's Timer A and Timer B
    clr.b       $fffffa13           ; M68KWB_NOERROR Clear Interrupt Mask for MFP's Timer A and Timer B
    clr.b       $fffffa09           ; M68KWB_NOERROR Clear Interrupt Enable for MFP's Timer C and Timer D
    clr.b       $fffffa15           ; M68KWB_NOERROR Clear Interrupt Mask for MFP's Timer C and Timer D
    clr.b       $fffffa1b           ; M68KWB_NOERROR Stop Timer B
    move.l #M68KWB_defaultRTE,$70   ; M68KWB_NOERROR VBL
    move.l #M68KWB_defaultRTE,$68   ; M68KWB_NOERROR HBL
    move.l #M68KWB_defaultRTE,$134  ; M68KWB_NOERROR MFP's Timer A
    move.l #M68KWB_defaultRTE,$120  ; M68KWB_NOERROR MFP's Timer B
    move.l #M68KWB_defaultRTE,$114  ; M68KWB_NOERROR MFP's Timer C
    move.l #M68KWB_defaultRTE,$110  ; M68KWB_NOERROR MFP's Timer D
    move.l #M68KWB_defaultRTE,$118  ; M68KWB_NOERROR ACIA
    ;>JS MACHINE.unpauseMemCheck();
    rts

M68KWB_defaultRTE:
    nop
    rte

M68KWB_defaultMainLoop:
    nop
    rts


