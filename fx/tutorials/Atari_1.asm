; from: https://nguillaumin.github.io/perihelion-m68k-tutorials/_of_the_workings_of_the_graphics_memory_and_minor_skills_in_branching.html

start
       move.l    #my_phybase,d0
       move.w    #0,-(sp)
       move.l    d0,-(sp)           ; phys
       move.l    d0,-(sp)           ; log
       move.w    #5,-(sp)
       trap      #14
       add.l     #12,sp


   
                move.l  d0,a0                   ; a0 points to screen

; clears the screen to colour 0,background
                move.l  #7999,d1                ; size of screen memory
clrscr
                clr.l  (a0)+                     ; all 0 means colour 0 :)
                dbf    d1,clrscr      

                move.l  d0,a0                   ; a0 points to screen

* fills screen with colours,ok 180 scanlines :)
                move.l  #1199,d0                ; 60 scanlines
fill1  
                move.w  #%1111111111111111,(a0)+
                move.w  #%0000000000000000,(a0)+
                move.w  #%0000000000000000,(a0)+
                move.w  #%0000000000000000,(a0)+
                dbf     d0,fill1                ; filled with colour 1

                move.l  #1199,d0                ; 60 scanlines
fill2  
                move.w  #%0000000000000000,(a0)+
                move.w  #%1111111111111111,(a0)+
                move.w  #%0000000000000000,(a0)+
                move.w  #%0000000000000000,(a0)+
                dbf     d0,fill2                ; filled with colour 2

                move.l  #1199,d0                ; 60 scanlines
fill3  
                move.w  #%1111111111111111,(a0)+
                move.w  #%1111111111111111,(a0)+
                move.w  #%0000000000000000,(a0)+
                move.w  #%0000000000000000,(a0)+
                dbf     d0,fill3                ; filled with colour 3

                move.w  #$000,$ff8240           ; black background
                move.w  #$700,$ff8242           ; red colour 1
                move.w  #$070,$ff8244           ; green colour 2
                move.w  #$007,$ff8246           ; blue colour 3
                
                move.l  #24,d5                  ; 25 VBL's per loop
                move.w  #6,d6                   ; make 7 loops
                rts

                section data

old_resolution  dc.w    0
old_stack       dc.l    0
old_screen      dc.l    0


                section bss

my_phybase  ds.b     32000
old_palette     ds.l    8
