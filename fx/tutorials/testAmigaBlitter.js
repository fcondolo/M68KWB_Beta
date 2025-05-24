REGISTER_FX({
  classname:"testAmigaBlitter", 
  platform:"OCS",
  rootPath:"fx/tutorials",
  source:"testAmigaBlitter.asm"
});

class testAmigaBlitter {
    FX_Init() {
      let t = this;

      t.helper = AMIGA_GetScreenHelper({
        bplCount: 1,
        width: 320,
        height: 256
      });

      t.bitplaneAdrs = t.helper.bitplanes;

      invoke68K("init");
    }


  cls() {
    let t = this;
    let a = t.bitplaneAdrs;
    for (let i = 0; i < t.helper.width/8*(t.helper.height); i++, a++) {
      MACHINE.ram[a] = 0;
    }
  }

  FX_Update() {
    let t = this;

    t.cls();
    regs.a[5] = t.bitplaneAdrs;
    invoke68K("update");

    AMIGA_updateScreenHelper(t.helper);
  }
}
