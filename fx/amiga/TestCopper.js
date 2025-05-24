REGISTER_FX({
  classname:"TestCopper", 
  platform:"OCS", 
  rootPath:"fx/amiga",
  source:"TestCopper.asm"
});

class TestCopper {
  constructor() {
    let t = this;
  }

  FX_Init() {
    let t = this;

    t.bitplanes = TOOLS.getLabelAdrs("image");
    t.copperList = TOOLS.getLabelAdrs("cplist");
    
    // set copperlist
    AMIGA_setCustom_L(COP1LCH,t.copperList);
    AMIGA_setCustom(DMACON, 0x83c0); // blitter + copper + bitplane DMA
  }

  FX_Update() {
    let t = this;

    // refresh bitplane pointers
    AMIGA_setCustom_L(BPL1PTH,t.bitplanes);

    DEBUGPRIM.addLine(0,0,319,0,0xff00ff);
    DEBUGPRIM.addLine(0,255,319,255,0xff00ff);
    DEBUGPRIM.addLine(0,0,319,255,0xff00ff);
    DEBUGPRIM.addLine(0,255,319,0,0xff00ff);
  }
}
