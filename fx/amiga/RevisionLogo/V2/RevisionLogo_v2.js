class RevisionLogo_v2 {

  FX_Init() {
    let t = this;

    t.helper = AMIGA_GetScreenHelper({
      bplCount: 1,
      width: 320,
      height: 256
    });

    t.CENTER_X  = t.helper.width / 2;
    t.CENTER_Y  = t.helper.height / 2;

    t.sintable = TOOLS.getLabelAdrs("sintable");    
    t.iter = 0;
    t.bitplaneAdrs = t.helper.bitplanes;
    t.PI = TOOLS.getConstValue("PI");

    let sinadrs = t.sintable;
    for (let i = 0; i < 2 * t.PI; i++) {
      const angle = 2 * i * Math.PI / t.PI;
      const value = Math.floor(32768*Math.sin(angle));
      sinadrs = MACHINE.setRAMValue(TOOLS.JSInt16ToAsm(value), sinadrs, 2);
    }

    invoke68K("init");
    t.cls();
  }
  
  Plot(_x,_y) {
    let t = this;
    AMIGA_pix2Bitplane(_x,_y,t.bitplaneAdrs, {minx:0,miny:0,maxx:t.helper.width,maxy:t.helper.height});
  }

  cls() {
    let t = this;
    let a = t.bitplaneAdrs;
    for (let i = 0; i < t.helper.width/8*(t.helper.height); i++, a++) {
      MACHINE.ram[a] = 0;
    }
  }

  sin(_ofs) {
    regs.d[0] = _ofs;
    invoke68K("sin");
    return TOOLS.toInt16(regs.d[0]);
  }

  cos(_ofs) {
    regs.d[0] = _ofs;
    invoke68K("cos");
    return TOOLS.toInt16(regs.d[0]);
  }

  rot(_len,_angle) {
    regs.d[0] = Math.floor(_angle);
    regs.d[1] = Math.floor(_len);
    invoke68K("rot");   
    return {x: TOOLS.toInt16(regs.d[2]), y: TOOLS.toInt16(regs.d[0])};
  }


  FX_Update()
  {
    let t = this;
 
    let adrs = TOOLS.getLabelAdrs("logo");
    adrs += t.iter * 8;
    if (adrs > TOOLS.getLabelAdrs("endLogo")) return;
    while(true) {
      let radStart = MACHINE.getRAMValue(adrs, 2, false);
      if (radStart == 0xffff) 
        break;
      adrs += 2;
      let thickness = MACHINE.getRAMValue(adrs, 2, false);
      adrs += 2;
      let angleStart = MACHINE.getRAMValue(adrs, 2, false);
      adrs += 2;
      let angleEnd = angleStart + MACHINE.getRAMValue(adrs, 2, false);
      adrs += 2;
      thickness /= 8;
      let radEnd = radStart + thickness;
      radStart -= thickness;
      for (let angle = angleStart; angle < angleEnd; angle += 2) {
        let inner = t.rot(radStart, angle);
        let outer = t.rot(radEnd, angle);
        AMIGA_line(t.CENTER_X + inner.x, t.CENTER_Y + inner.y, t.CENTER_X + outer.x, t.CENTER_Y + outer.y, t.bitplaneAdrs);
      }
      break;
    }


    AMIGA_updateScreenHelper(t.helper);
    t.iter++;
  }
}
