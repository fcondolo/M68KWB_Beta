  IFD DUMMY
DEF1  EQU 1
  ELSE  
DEF1  EQU 0
  ENDC

  IFEQ DEF1
  IFD DUMMY
DEF2  EQU 0
  ELSE
DEF2  EQU DEF1+1
  ENDC
  ELSE
DEF2  EQU 20
  ENDC

testIFD_init:
  ;>JS if(TOOLS.getConstValue("DEF1") != 0) debug();
  ;>JS if(TOOLS.getConstValue("DEF2") != 1) debug();
  rts
