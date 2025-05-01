/*
V1: roughly prototype the FX in Javascript with a bit of Amiga stuff also
*/
REGISTER_FX({
  classname:"RevisionLogo_v1", 
  platform:"OCS", 
  rootPath:"fx/amiga/RevisionLogo/V1",
  source:"RevisionLogo_v1.asm",
});

class RevisionLogo_v1 {

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
    t.PI = 16384;

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
    return MACHINE.getRAMValue(this.sintable + (_ofs & 65535), 2, true);
  }
  cos(_ofs) {
    return this.sin(_ofs + 3*(this.PI/2));
  }

  rot(_a,_b,_angle) {
    _angle = Math.floor(_angle);
    _a = Math.floor(_a);
    _b = Math.floor(_b);
    const c = this.cos(_angle);
    const s = this.sin(_angle);
    return {x: Math.floor(((c*_a)/32768) - ((s*_b)/32768)), y: Math.floor(((s*_a)/32768)+((c*_b)/32768))};
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
        let inner = t.rot(radStart, 0, angle);
        let outer = t.rot(radEnd, 0, angle);
        AMIGA_line(t.CENTER_X + inner.x, t.CENTER_Y + inner.y, t.CENTER_X + outer.x, t.CENTER_Y + outer.y, t.bitplaneAdrs);
      }
      break;
    }


    AMIGA_updateScreenHelper(t.helper);
    t.iter++;
  }
}
