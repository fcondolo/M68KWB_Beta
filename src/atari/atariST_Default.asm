M68KWB_TargetPlatformInit:
    ;>JS MACHINE.pauseMemCheck();
    clr.b       $fffffa07           ; M68KWB_NOERROR Clear Interrupt Enable for MFP's Timer A and Timer B
    clr.b       $fffffa13           ; M68KWB_NOERROR Clear Interrupt Mask for MFP's Timer A and Timer B
    clr.b       $fffffa09           ; M68KWB_NOERROR Clear Interrupt Enable for MFP's Timer C and Timer D
    clr.b       $fffffa15           ; M68KWB_NOERROR Clear Interrupt Mask for MFP's Timer C and Timer D
    clr.b       $fffffa1b           ; M68KWB_NOERROR Stop Timer B
    ; set null cllbacks to avoid unwanted calls
    move.l      #0,$70              ; M68KWB_NOERROR VBL
    move.l      #0,$68              ; M68KWB_NOERROR HBL
    move.l      #0,$134             ; M68KWB_NOERROR MFP's Timer A
    move.l      #0,$120             ; M68KWB_NOERROR MFP's Timer B
    move.l      #0,$114             ; M68KWB_NOERROR MFP's Timer C
    move.l      #0,$110             ; M68KWB_NOERROR MFP's Timer D
    move.l      #0,$118             ; M68KWB_NOERROR ACIA
    ;>JS MACHINE.unpauseMemCheck();
    rts
