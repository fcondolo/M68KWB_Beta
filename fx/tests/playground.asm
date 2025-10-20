  IFND included
included EQU 1
    IFD deb
val EQU 10
      IFD included
val2 EQU 30
      ENDC  
    ELSE
val EQU 20
      IFD included
val2 EQU 40
      ENDC  
    ENDC
  ENDC


init:
  ;>JS if (TOOLS.getConstValue("val") != 20) debug();
  ;>JS if (TOOLS.getConstValue("val2") != 40) debug();
  rts

update:
  add.w #1,frame
  rts

frame: dc.w 0
