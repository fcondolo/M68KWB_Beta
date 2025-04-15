REGISTER_FX({
  classname:"FX_Heroes", 
  platform:"OCS", 
  source:"fx/amiga/heroes.asm",
});

class FX_Heroes {
  constructor() {
    let t = this;
  }

  FX_Init() {
    let t = this;

    t.helper = AMIGA_GetScreenHelper({
      bplCount: 1,
      width: 320,
      height: 180
    });

    AMIGA_setCustom(COLOR1, 0xfff);
  }

  FX_Update() {
    let t = this;
    //  AMIGA_updateScreenHelper(t.helper);
    regs.a[2] = t.helper.bitplanes;
    invoke68K("drawString");
  }

  FX_DrawDebug(_ctx) {
  }
}
