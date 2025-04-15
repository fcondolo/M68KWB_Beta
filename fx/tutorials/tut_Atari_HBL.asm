SCREEN_HI             EQU   $ff8201
SCREEN_MID            EQU   $ff8203
SCREEN_LOW            EQU   $ff820d

start:
    ;set screen pointer
    move.l        #screenBuf,a0
    move.l        a0,d0
    swap          d0
    move.b        d0,SCREEN_HI
    move.l        a0,d0
    lsr.w         #8,d0
    move.b        d0,SCREEN_MID
    move.l        a0,d0
    move.b        d0,SCREEN_LOW

    ; insall timer b
    clr.b   $fffffa1b                ; disable timer b
    move.l  #timer_b,$120           ; move in my timer b address
    bset    #0,$fffffa07            ; turn on timer b in enable a
    bset    #0,$fffffa13            ; turn on timer b in mask a
    move.b  #1,$fffffa21            ; number of counts, every scan line
    move.b  #8,$fffffa1b            ; set timer b to event count mode
    rts

timer_b:
    move.w  frame,d0
    move.w  frame,$ff8240
    add.w   #7,frame
    bclr    #0,$fffffa0f 
    rte


update:
    nop
    rts

frame:
    dc.w    0    

screenBuf:
    ds.b    32000
