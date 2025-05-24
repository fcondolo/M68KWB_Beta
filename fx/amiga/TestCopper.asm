init:
       rts

update:
       rts


       data_c

cplist:
       dc.w   DIWSTRT,$2c81 ; PAL default window start
       dc.w   DIWSTOP,$2cc1 ; PAL default window stop
       dc.w   DDFSTRT,$0038
       dc.w   DDFSTOP,$00d0
       dc.w   DMACON, $83c0 ; blitter + copper + bitplane DMA
       dc.w   BPLCON0,$1200

       dc.w    $180,$000
       dc.w    $182,$f0    ; bitplane lines colors

       dc.w    $1b01,$ff00  ; first visible copepr line
       dc.w    $180,$800 
              
       dc.w    $2c01,$ff00  ; first visible bitplane line
       dc.w    $180,$008

       dc.w    $ffdf,$fffe  ; the worldwide famous and infamous copper line 255
       dc.w    $180,$567

       dc.w    $2c01,$ff00  ; last visible bitplane line
       dc.w    $180,$800

       dc.w    $ffff,$fffe

image:
       incbin "320x256_bitplanes.bin"