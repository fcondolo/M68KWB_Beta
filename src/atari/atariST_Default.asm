M68KWB_TargetPlatformInit:
    move.l  #M68KWB_default70,$70   ; set default vbl interrupt routine (simulate OS)
    rts

M68KWB_default70: ; default vbl interrupt routine
    nop
    rte
