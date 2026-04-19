init:
  IFD TOTO
  nop
  ;>JS alert("nope")
  ENDC
  rts

update:
  NOP
  ;>JS debug("pouet")
  rts