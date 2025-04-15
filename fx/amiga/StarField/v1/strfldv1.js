/*
V1: roughly prototype the FX in Javascript with a bit of Amiga stuff also
*/
REGISTER_FX({
  classname:"FX_StarFieldv1", 
  platform:"OCS", 
  rootPath:"fx/amiga/StarField/v1",
  source:"strfldv1.asm",
});

class FX_StarFieldv1 {

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
    t.STARSCOUNT = 128;

    t.sintable = PARSER_getLabelAdrs("sintable");
    
    t.PI  = PARSER_getConstValue("MTHLIB_PI");
    t.msk = PARSER_getConstValue("MTHLIB_OFS_MSK");
    t.cosOfs = PARSER_getConstValue("MTHLIB_COS_OFS");
    t.iter = 0;
    t.bitplaneAdrs = t.helper.bitplanes;
    t.startZ = 256; // must be a power of 2
    t.endZ = 4096;
    t.curZ = t.startZ;

    t.stars = new Int16Array(t.STARSCOUNT*2); // angle,z
    let w = 0;
    let ang = 0;
    let angInc = Math.floor((2*t.PI)/t.STARSCOUNT);
    for (let i = 0; i < t.STARSCOUNT; i++) {
      t.stars[w++] = ang;
      invoke68K("MATH_random");
      t.stars[w++] = t.startZ + ((regs.d[0]&0xffff)&(t.endZ-1));
      ang += angInc;
    }

    invoke68K("init");
  }
  
  Plot(_x,_y) {
    let t = this;
    AMIGA_pix2Bitplane(_x,_y,t.bitplaneAdrs, {minx:0,miny:0,maxx:t.helper.width,maxy:t.helper.height});
  }

  Project(_x,_y,_z) {
    let retx = _x*_z;
    retx = Math.floor(retx/65536);
    let rety = _y*_z;
    rety = Math.floor(rety/65536);
    return {x: retx, y: rety};
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

  sin(_ofs) {
    return MACHINE.getRAMValue(this.sintable + (_ofs & this.msk), 2, true);
  }

  cos(_ofs) {
    return this.sin(_ofs + this.cosOfs);
  }

  rot(_angle) {
    const c = this.cos(_angle);
    const s = this.sin(_angle);
    return {a: ((c<<12)>>16), b: ((s<<12)>>16)};
  }


  FX_Update()
  {
    let t = this;
    t.cls();
    const scale = 1;
    let w = 0;
    for (let i = 0; i < t.STARSCOUNT; i++) {
      let ang = t.stars[w++];
      let rot = t.rot(ang + t.iter*2);
      let x3d = rot.a;
      let y3d = rot.b;
      let z = t.stars[w];
      let coord = t.Project(scale * x3d, scale * y3d, z);
      t.Plot(t.CENTER_X + coord.x, t.CENTER_Y + coord.y);
      z += z/32+t.ZSPD;
      if (z > t.endZ) z -= t.endZ;
      t.stars[w++] = z;
    }

    AMIGA_updateScreenHelper(t.helper);
    t.iter++;
  }

  FX_OnKey(keyCode) {
    let t = this;
    switch (keyCode) {
      case 49: // 1
        t.iter ++;
        console.log("iter: " + t.iter);
      break;
      case 50: // 2
        t.iter --;
        console.log("iter: " + t.iter);
      break;
    }
  }

}
