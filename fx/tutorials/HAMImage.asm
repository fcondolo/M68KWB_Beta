; Image by MON/OXYGENE, taken from the CYCLE-OP demo

init:
       lea           CUSTOM,a6
       move.w        #$6200|(1<<11),BPLCON0(a6)
       move.w        #$2c81,DIWSTRT(a6)
       move.w        #$2cc1,DIWSTOP(a6)
       move.w        #$0038,DDFSTRT(a6)
       move.w        #$00d0,DDFSTOP(a6)
       move.w        #$83c0,DMACON(a6)
       lea           CUSTOM+COLOR0,a6
       lea           palette,a0
       REPT          8
       move.l        (a0)+,(a6)+
       ENDR
       rts

update:
       lea           CUSTOM,a6
       lea           image,a0
       move.l        #(320/8)*256,d0
       move.l        a0,BPL1PTH(a6)
       add.l         d0,a0
       move.l        a0,BPL2PTH(a6)
       add.l         d0,a0
       move.l        a0,BPL3PTH(a6)
       add.l         d0,a0
       move.l        a0,BPL4PTH(a6)
       add.l         d0,a0
       move.l        a0,BPL5PTH(a6)
       add.l         d0,a0
       move.l        a0,BPL6PTH(a6)
       rts

palette     
            incbin "data/cycle-op.pal"

image     
            incbin "data/cycle-op.raw"
