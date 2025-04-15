/*
V2: Calculate the animation for the concentric circles
*/

REGISTER_FX({
  classname:"FX_Spherev2", 
  platform:"OCS", 
  rootPath:"fx/amiga/Sphere/v2",
  source:"sphv2.asm",
});

class FX_Spherev2 {

  FX_Init() {
    let t = this;

    t.helper = AMIGA_GetScreenHelper({
      bplCount: 1,
      width: 320,
      height: 180
    });

    t.PRECALC_FRAMES_COUNT  = PARSER_getConstValue("PRECALC_FRAMES_COUNT");
    t.PRECALC_CIRCLES_COUNT = PARSER_getConstValue("PRECALC_CIRCLES_COUNT");
    t.ONE_FRAME_SIZE        = PARSER_getConstValue("ONE_FRAME_SIZE");
    t.FFT_POINTS_PER_CIRCLE = PARSER_getConstValue("FFT_POINTS_PER_CIRCLE"); 
    t.CENTER_X              = t.helper.width / 2;
    t.CENTER_Y              = t.helper.height / 2;
    t.MAXRAD                = t.PRECALC_CIRCLES_COUNT + 1;
    t.minY                  = 1000;
    t.maxY                  = -1000;
    t.frames                = PARSER_getLabelAdrs("precalc_frames");
    t.FFTFramesPtr          = PARSER_getLabelAdrs("fft_frames");
    t.curFramePtr           = t.frames;
    t.mode                  = 0;  // 0 = precalc, 1 = replay
    t.FFTEntriesCount       = 16; // 16 entries per frames
    t.FFTHistorySize        = 8;  // number of frames in history
    t.FFTPoints             = [];
    t.fftData               = new Uint8Array(t.FFTEntriesCount * t.FFTHistorySize);

    t.sintable = PARSER_getLabelAdrs("sintable");

    
    t.PI                    = PARSER_getConstValue("MTHLIB_PI");
    t.ANGLE_STEP            = 16;
    t.ANGLE_COUNT           = (2 * t.PI) / t.ANGLE_STEP;
    t.msk = PARSER_getConstValue("MTHLIB_OFS_MSK");
    t.cosOfs = PARSER_getConstValue("MTHLIB_COS_OFS");
    t.iter = 0;
    t.time = 0;
    t.bitplaneAdrs = t.helper.bitplanes;

    invoke68K("init");
  }
  
  Plot(_bpl, _x,_y) {
    let t = this;
    if (_y < t.minY) {
      t.minY = _y;
    }
    if (_y > t.maxY) {
      t.maxY = _y;
    }
    AMIGA_pix2Bitplane(_x, _y, _bpl, {minx:0,miny:0,maxx:t.helper.width,maxy:t.helper.height});
  }

  Project(_x,_y,_z) {
    let rety = _y/_z;
    rety = Math.floor(rety);
    return {x: Math.floor(_x/_z), y: rety};
  }

  cls(_bpl) {
    regs.a[0] = _bpl;
    invoke68K("bltClr");
  }
  

  CopyBitplane(_from, _to) {
    regs.a[0] = _from;
    regs.a[1] = _to;
    invoke68K("bltCpy");
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


  voxelPlot(_bpl, _x, _y, _h) {
    let t = this;
    for (let i = 0; i < _h; i++) {
      t.Plot(_bpl, _x, _y - i);
      t.Plot(_bpl, _x+1, _y - i);
    }
  }

  updateFFT(_bpl) {
    let t = this;
    t.FFTEntriesCount       = 16; // 16 entries per frames
    t.FFTHistorySize        = 8;  // number of frames in history

    const msk = t.FFTHistorySize-1;
    const fftFrame = t.iter & msk;
    let r = t.FFTEntriesCount * fftFrame;
    for (let i  = 0; i < t.FFTEntriesCount; i++) {
      t.fftData[r++] = Math.floor(16 * Math.abs(Math.sin(i/4 + t.time/10)));
    }

    if (t.FFTPoints.length != t.PRECALC_FRAMES_COUNT) {
      alert("expectd " + t.PRECALC_FRAMES_COUNT + " frames for asm conversion");
      debugger;
    }

    let curFFTFrame = t.FFTPoints[t.iter];
    if (curFFTFrame.length != t.PRECALC_CIRCLES_COUNT) {
      alert("expectd " + t.PRECALC_CIRCLES_COUNT + " circles frames for asm conversion");
      debugger;
    }
    for (let iCircle = 0; iCircle < curFFTFrame.length; iCircle++) {
      let circle = curFFTFrame[iCircle];
      if (circle.points.length != t.FFT_POINTS_PER_CIRCLE) {
        alert("expectd " + t.FFT_POINTS_PER_CIRCLE + " FFT points per circle");
        debugger;
      }
      for (let iPt = 0; iPt < circle.points.length; iPt++) {
        let pt = circle.points[iPt];
        let h, fftIndex;
        if (iCircle == curFFTFrame.length-1) {
          h = pt.h;
          fftIndex = t.FFTEntriesCount * fftFrame + iPt;
        } else {
          h = pt.h;
          fftIndex = t.FFTEntriesCount * ((fftFrame + msk) & msk) + iPt;
        }
        h *= t.fftData[fftIndex];
        h >>= 13;
        t.voxelPlot(_bpl, t.CENTER_X + pt.x, t.CENTER_Y + pt.y, h);
      }  
    }
  }


  FX_Update()
  {
    let t = this;

    if (t.mode == 0) {
      t.cls(t.curFramePtr);
      let refX  = 32000;  // shifted radius
      let refZ  = 0;
      let ptIndex = 0;
      let fftCircles = [];
      for (let rad = 1; rad < t.MAXRAD; rad++) {
        let fftCircle = {};
        fftCircle.points = [];
        const scale = rad * 4;
        for (let ang = 0; ang < 2*t.PI; ang += t.ANGLE_STEP) {
          let rot = t.rot(refX, refZ, ang + t.iter * 2);
          let x3d = rot.a;
          let y3d = 0;
          let z3d = rot.b;
          rot = t.rot(y3d, z3d, t.PI/8);
          let coord = t.Project(scale * x3d, scale * rot.a, 2048+(rot.b>>3));
          z3d = -z3d;
          let fftAngleData = {x : coord.x, y : coord.y, h:(z3d>>4)*scale};
          t.Plot(t.curFramePtr, t.CENTER_X + coord.x, t.CENTER_Y + coord.y);
          if (z3d > 1024*15) {
            if (fftCircle.points.length < t.FFT_POINTS_PER_CIRCLE) {
              fftCircle.points.push(fftAngleData);
            }
          }          
          ptIndex++;          
        }  
        fftCircles.push(fftCircle);
      } 
      t.FFTPoints.push(fftCircles); 
    } else { // play mode
      t.CopyBitplane(t.curFramePtr, t.helper.bitplanes);
      t.updateFFT(t.helper.bitplanes);
      AMIGA_updateScreenHelper(t.helper);
    }

    t.time++;
    t.iter++;

    t.curFramePtr += t.ONE_FRAME_SIZE;
    if (t.iter >= t.PRECALC_FRAMES_COUNT) {
      if (t.mode == 0) {
        if (t.iter == t.PRECALC_FRAMES_COUNT) {
          console.log("minY = " + t.minY + ", maxY = " + t.maxY);
        }
        t.mode = 1;  
      }
      t.curFramePtr = t.frames;
      t.FFTFramesPtr = PARSER_getLabelAdrs("fft_frames");
      t.iter = 0;
    }
  }



}
