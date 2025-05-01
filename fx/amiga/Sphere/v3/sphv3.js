/*
V3: Start being serious about asm conversion
*/

REGISTER_FX({
  classname:"FX_Spherev3", 
  platform:"OCS", 
  rootPath:"fx/amiga/Sphere/v3",
  startPaused:false,
  source:"sphv3.asm",
});

class FX_Spherev3 {

  FX_Init() {
    let t = this;

    t.PRECALC_FRAMES_COUNT  = TOOLS.getConstValue("PRECALC_FRAMES_COUNT");
    t.PRECALC_CIRCLES_COUNT = TOOLS.getConstValue("PRECALC_CIRCLES_COUNT");
    t.ONE_FRAME_SIZE        = TOOLS.getConstValue("ONE_FRAME_SIZE");
    t.FFT_POINTS_PER_CIRCLE = TOOLS.getConstValue("FFT_POINTS_PER_CIRCLE"); 
    t.FFT_ALLFRAMES_BYTES   = TOOLS.getConstValue("FFT_ALLFRAMES_BYTES");
    t.PI                    = TOOLS.getConstValue("MTHLIB_PI");
    t.SCR_W_PIX             = TOOLS.getConstValue("SCR_W_PIX");
    t.SCR_H_LN              = TOOLS.getConstValue("SCR_H_LN");
    t.ANGLE_STEP            = TOOLS.getConstValue("ANGLE_STEP");
    t.ANGLE_COUNT           = TOOLS.getConstValue("ANGLE_COUNT");
    t.FFT_ENTRIES_COUNT     = TOOLS.getConstValue("FFT_ENTRIES_COUNT");
    t.FFT_HISTORY_SIZE      = TOOLS.getConstValue("FFT_HISTORY_SIZE");

    t.fftData               = TOOLS.getLabelAdrs("fftData");
    t.frames                = TOOLS.getLabelAdrs("precalc_frames");
    t.FFTFramesPtr          = TOOLS.getLabelAdrs("fft_frames");

    t.helper = AMIGA_GetScreenHelper({
      bplCount: 1,
      width: t.SCR_W_PIX,
      height: t.SCR_H_LN
    });

    t.curFramePtr           = t.frames;
    t.mode                  = 0;  // 0 = precalc, 1 = replay    
    t.iter                  = 0;
    t.bitplaneAdrs          = t.helper.bitplanes;

    t.fakeFFTTime           = 0;

    invoke68K("init");
  }
  
  Plot(_bpl, _x,_y) {
    let t = this;
  
    t.toDataReg(_x,0);
    t.toDataReg(_y,1);
    regs.a[0] = _bpl;
    invoke68K("plot");
  }

  Project(_x,_y,_z) {
    let t = this;
    t.toDataReg(_x,0);
    t.toDataReg(_y,1);
    t.toDataReg(_z,2);
    invoke68K("project");
    const a = TOOLS.toInt16(regs.d[0]);
    const b = TOOLS.toInt16(regs.d[1]);
    return {x: a, y: b};
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

  toDataReg(_v,_dn) {
    regs.d[_dn] = Math.floor(_v);
  }

  rot(_a,_b,_angle) {
    let t = this;
    t.toDataReg(_a,0);
    t.toDataReg(_b,1);
    t.toDataReg(_angle,2);
    invoke68K("rot");
    const a = TOOLS.toInt16(regs.d[2]);
    const b = TOOLS.toInt16(regs.d[6]);
    return {a: a, b: b};
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
    t.FFT_ENTRIES_COUNT       = 16; // 16 entries per frames
    t.FFT_HISTORY_SIZE        = 8;  // number of frames in history

    const msk = t.FFT_HISTORY_SIZE-1;
    const fftFrame = t.iter & msk;
    let r = t.fftData + t.FFT_ENTRIES_COUNT * fftFrame;
    for (let i  = 0; i < t.FFT_ENTRIES_COUNT; i++) {
      const fakeTestFFTValue = Math.floor(16 * Math.abs(Math.sin(i/4 + t.fakeFFTTime/10)));
      r = MACHINE.setRAMValue(fakeTestFFTValue, r, 1);
    }

    for (let iCircle = 0; iCircle < t.PRECALC_CIRCLES_COUNT; iCircle++) {
      for (let iPt = 0; iPt < t.FFT_POINTS_PER_CIRCLE; iPt++) {
        let x = MACHINE.getRAMValue(t.FFTFramesPtr, 2, true);
        t.FFTFramesPtr += 2;
        let y = MACHINE.getRAMValue(t.FFTFramesPtr, 2, true);
        t.FFTFramesPtr += 2;
        let h = MACHINE.getRAMValue(t.FFTFramesPtr, 2, true);
        t.FFTFramesPtr += 2;
        let fftIndex;
        if (iCircle == t.PRECALC_CIRCLES_COUNT-1) {
          fftIndex = t.FFT_ENTRIES_COUNT * fftFrame + iPt;
        } else {
          fftIndex = t.FFT_ENTRIES_COUNT * ((fftFrame + msk) & msk) + iPt;
        }
        h *= MACHINE.getRAMValue(t.fftData + fftIndex, 1, false);
        h >>= 13;
        t.voxelPlot(_bpl, (t.SCR_W_PIX/2) + x, (t.SCR_H_LN/2) + y, h);
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
      for (let rad = 1; rad < t.PRECALC_CIRCLES_COUNT+1; rad++) {
        let ptCounter = 0;
        const scale = rad * 4;
        for (let ang = 0; ang < 2*t.PI; ang += t.ANGLE_STEP) {
          let rot = t.rot(refX, refZ, ang + t.iter * 2);
          let x3d = rot.a;
          let y3d = 0;
          let z3d = rot.b;
          rot = t.rot(y3d, z3d, t.PI/8);
          let coord = t.Project(scale * x3d, scale * rot.a, 2048+(rot.b>>3));
          z3d = -z3d;
          t.Plot(t.curFramePtr, (t.SCR_W_PIX/2) + coord.x, (t.SCR_H_LN/2) + coord.y);
          if (z3d > 1024*15) {
            if (ptCounter < t.FFT_POINTS_PER_CIRCLE) {
              t.FFTFramesPtr = MACHINE.setRAMValue(coord.x, t.FFTFramesPtr, 2);
              t.FFTFramesPtr = MACHINE.setRAMValue(coord.y, t.FFTFramesPtr, 2);
              t.FFTFramesPtr = MACHINE.setRAMValue((z3d>>4)*scale, t.FFTFramesPtr, 2);
              if (t.FFTFramesPtr > TOOLS.getLabelAdrs("fft_frames") + t.FFT_ALLFRAMES_BYTES) {
                alert("overflow");
                debugger;
              }
              ptCounter++;
            }
          }          
          ptIndex++;          
        }  
      } 
    } else { // play mode
      t.CopyBitplane(t.curFramePtr, t.helper.bitplanes);
      t.updateFFT(t.helper.bitplanes);
      AMIGA_updateScreenHelper(t.helper);
    }

    t.fakeFFTTime++;
    t.iter++;

    t.curFramePtr += t.ONE_FRAME_SIZE;
    if (t.iter >= t.PRECALC_FRAMES_COUNT) {
      if (t.mode == 0) {
        if (t.iter == t.PRECALC_FRAMES_COUNT) {
          if (t.FFTFramesPtr != TOOLS.getLabelAdrs("fft_frames") + t.FFT_ALLFRAMES_BYTES) {
            let delta1 = t.FFTFramesPtr - TOOLS.getLabelAdrs("fft_frames");
            let delta2 = delta1 - t.ONE_FRAME_SIZE*t.PRECALC_FRAMES_COUNT;
            alert("written: " + delta1 + " missing: " + delta2);
            debugger;
          }
        }
        t.mode = 1;  
      }
      t.curFramePtr = t.frames;
      t.FFTFramesPtr = TOOLS.getLabelAdrs("fft_frames");
      t.iter = 0;
    }
  }



}
