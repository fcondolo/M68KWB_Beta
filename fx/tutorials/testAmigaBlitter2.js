class testAmigaBlitter2 {
    FX_Init() {
      let t = this;

      t.helper = AMIGA_GetScreenHelper({
        bplCount: 1,
        width: 320,
        height: 256
      });

      t.bitplaneAdrs = t.helper.bitplanes;

      AMIGA_SetPalette([0,0xace]);
    }


  cls() {
    let t = this;
    let startIndex = t.bitplaneAdrs;
    let size = t.helper.width/8*(t.helper.height);
    MACHINE.ram.fill(0, startIndex, startIndex + size);
  }

  FX_Update() {
    let t = this;

    t.cls();
    AMIGA_fillLine(t.helper,140,10,10,120,t.bitplaneAdrs);
    AMIGA_fillLine(t.helper,10,120,100,240,t.bitplaneAdrs);
    AMIGA_fillLine(t.helper,100,240,300,200,t.bitplaneAdrs);
    AMIGA_fillLine(t.helper,300,200,141,10,t.bitplaneAdrs);
    AMIGA_BLitterFillSW(t.helper,t.bitplaneAdrs);
    AMIGA_updateScreenHelper(t.helper);
  }
}
