class Draw2Buffer {
    FX_Init() {
      let t = this;
      t.CHUNKY_WIDTH  = TOOLS.getConstValue('PATH_W');
      t.CHUNKY_HEIGHT  = TOOLS.getConstValue('PATH_H');
      invoke68K("d2b_init");
      t.chunkyBuffer = regs.a[0];

      AMIGA_drawChunky8(t.chunkyBuffer, t.CHUNKY_WIDTH, t.CHUNKY_HEIGHT, 320, 180);

      /*
      for (let y = 0; y < t.CHUNKY_HEIGHT; y++) {
        for (let x = 0; x < t.CHUNKY_WIDTH; x++) {
          t.plot(x,y,x^y);
        }  
      }*/

    }

  plot(x,y,v) {
    let t = this;
    MACHINE.setRAMValue(v, t.chunkyBuffer + t.CHUNKY_WIDTH * y + x, 1);
  }

  FX_OnKey(keyCode) {
    let t = this;
    switch (keyCode) {
      case 49: // 1
      break;
      case 50: // 2
    break;
    }
  }


  FX_Update() {
    let t = this;
    invoke68K("d2b_update");
  }
}