M68KWB_TargetPlatformInit:
    ;>JS MACHINE.pauseMemCheck();
    ; ...
    ;>JS MACHINE.unpauseMemCheck();
    rts

M68KWB_defaultMainLoop:
    nop
    rts

    IFD M68KWB
fx_canExit:
    dc.w    0
    ENDC