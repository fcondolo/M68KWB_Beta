/*
v2: roughly prototype the FX in Javascript with a bit of Amiga stuff also
*/
REGISTER_FX({
  classname:"FX_StarFieldv2", 
  platform:"OCS", 
  rootPath:"fx/amiga/StarField/v2",
  source:"strfldv2.asm",
});

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

    t.sintable = PARSER_getLabelAdrs("sintable");
    
    t.PI  = PARSER_getConstValue("MTHLIB_PI");
    t.msk = PARSER_getConstValue("MTHLIB_OFS_MSK");
    t.cosOfs = PARSER_getConstValue("MTHLIB_COS_OFS");
    t.startZ = PARSER_getConstValue("STARTZ");
    t.endZ = PARSER_getConstValue("ENDZ");
    t.STARSCOUNT = PARSER_getConstValue("STARSCOUNT");
    t.stars = PARSER_getLabelAdrs("stars");

    t.bitplaneAdrs = t.helper.bitplanes;
    MACHINE.setRAMValue(t.bitplaneAdrs, PARSER_getLabelAdrs("bplPtr"), 4);
    
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
