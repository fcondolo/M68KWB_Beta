/*
V1: roughly prototype the FX in Javascript with a bit of Amiga stuff also
*/
class FX_Spherev1 {

  FX_Init() {
    let t = this;

    t.helper = AMIGA_GetScreenHelper({
      bplCount: 1,
      width: 320,
      height: 180
    });

    t.CENTER_X              = t.helper.width / 2;
    t.CENTER_Y              = t.helper.height / 2;

    t.sintable = TOOLS.getLabelAdrs("sintable");
    
    t.PI  = TOOLS.getConstValue("MTHLIB_PI");
    t.msk = TOOLS.getConstValue("MTHLIB_OFS_MSK");
    t.cosOfs = TOOLS.getConstValue("MTHLIB_COS_OFS");
    t.iter = 0;
    t.bitplaneAdrs = t.helper.bitplanes;

    invoke68K("init");
  }
  
  Plot(_x,_y) {
    let t = this;
    AMIGA_pix2Bitplane(_x,_y,t.bitplaneAdrs, {minx:0,miny:0,maxx:t.helper.width,maxy:t.helper.height});
  }

  Project(_x,_y,_z) {
    let rety = _y/_z;
    rety = Math.floor(rety);
    return {x: Math.floor(_x/_z), y: rety};
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

  rot(_a,_b,_angle) {
    const c = this.cos(_angle);
    const s = this.sin(_angle);
    return {a: ((c*_a)>>16) - ((s*_b)>>16), b: ((s*_a)>>16)+((c*_b)>>16)};
  }


  voxelPlot(_x, _y, _h) {
    let t = this;
    _h = Math.floor(_h * Math.abs(Math.sin(_x/40 + t.iter/20)));
    _h >>= 9;
    for (let i = 0; i < _h; i++) {
      t.Plot(_x, _y - i);
      t.Plot(_x+1, _y - i);
    }
  }

  FX_Update()
  {
    let t = this;
    t.cls();

    let refX  = 32000;
    let refZ  = 0;
    for (let rad = 1; rad < 8; rad++) {
      const scale = rad * 4;
      for (let ang = 0; ang < 2*t.PI; ang+=16) {
        let rot = t.rot(refX, refZ, ang + t.iter * 2);
        let x3d = rot.a;
        let y3d = 0;
        let z3d = rot.b;
        rot = t.rot(y3d, z3d, t.PI/8);
        let coord = t.Project(scale * x3d, scale * rot.a, 2048+(rot.b>>3));
        z3d = -z3d;
        if (z3d > 1024*15)
          t.voxelPlot(t.CENTER_X + coord.x, t.CENTER_Y + coord.y, (z3d>>4)*scale);
        else
          t.Plot(t.CENTER_X + coord.x, t.CENTER_Y + coord.y);
      }  
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
