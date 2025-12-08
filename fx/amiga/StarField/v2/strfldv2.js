/*
v2: roughly prototype the FX in Javascript with a bit of Amiga stuff also
*/
class FX_StarFieldv2 {

  FX_Init() {
    let t = this;

    t.helper = AMIGA_GetScreenHelper({
      bplCount: 1,
      width: 320,
      height: 180
    });

    t.CENTER_X              = t.helper.width / 2;
    t.CENTER_Y              = t.helper.height / 2;
    t.ZSPD = 6;

    t.sintable = TOOLS.getLabelAdrs("sintable");
    
    t.PI  = TOOLS.getConstValue("MTHLIB_PI");
    t.msk = TOOLS.getConstValue("MTHLIB_OFS_MSK");
    t.cosOfs = TOOLS.getConstValue("MTHLIB_COS_OFS");
    t.startZ = TOOLS.getConstValue("STARTZ");
    t.endZ = TOOLS.getConstValue("ENDZ");
    t.STARSCOUNT = TOOLS.getConstValue("STARSCOUNT");
    t.stars = TOOLS.getLabelAdrs("stars");

    t.bitplaneAdrs = t.helper.bitplanes;
    MACHINE.setRAMValue(t.bitplaneAdrs, TOOLS.getLabelAdrs("bplPtr"), 4);
    
    invoke68K("init");
  }
  
  cls() {
    let t = this;
    let a = t.bitplaneAdrs;
    for (let i = 0; i < t.helper.width/8; i++, a++) {
      MACHINE.ram[a] = 255;
    }
    for (let i = 0; i < t.helper.width/8*(t.helper.height-2); i++, a++) {
      MACHINE.ram[a] = 0;
    }
    for (let i = 0; i < t.helper.width/8; i++, a++) {
      MACHINE.ram[a] = 255;
    }
  }


  FX_Update()
  {
    let t = this;
    t.cls();
    invoke68K("drawStars");
    AMIGA_updateScreenHelper(t.helper);
  }
}
