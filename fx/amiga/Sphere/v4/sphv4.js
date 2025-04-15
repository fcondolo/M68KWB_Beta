/*
V4: Serious as mconversion
*/

REGISTER_FX({
  classname:"FX_Spherev4", 
  platform:"OCS", 
  rootPath:"fx/amiga/Sphere/v4",
  source:"sphv4.asm",
});

class FX_Spherev4 {

  FX_Init() {
    let t = this;

    t.PRECALC_FRAMES_COUNT  = PARSER_getConstValue("PRECALC_FRAMES_COUNT");
    t.PRECALC_CIRCLES_COUNT = PARSER_getConstValue("PRECALC_CIRCLES_COUNT");
    t.ONE_FRAME_SIZE        = PARSER_getConstValue("ONE_FRAME_SIZE");
    t.FFT_POINTS_PER_CIRCLE = PARSER_getConstValue("FFT_POINTS_PER_CIRCLE"); 
    t.FFT_ALLFRAMES_BYTES   = PARSER_getConstValue("FFT_ALLFRAMES_BYTES"); // 4032
    t.PI                    = PARSER_getConstValue("MTHLIB_PI");
    t.SCR_W_PIX             = PARSER_getConstValue("SCR_W_PIX");
    t.SCR_H_LN              = PARSER_getConstValue("SCR_H_LN");
    t.ANGLE_STEP            = PARSER_getConstValue("ANGLE_STEP");
    t.ANGLE_COUNT           = PARSER_getConstValue("ANGLE_COUNT");
    t.FFT_ENTRIES_COUNT     = PARSER_getConstValue("FFT_ENTRIES_COUNT");
    t.FFT_HISTORY_SIZE      = PARSER_getConstValue("FFT_HISTORY_SIZE");
    t.REFX                  = PARSER_getConstValue("REFX");
    t.REFZ                  = PARSER_getConstValue("REFZ");

    t.fftData               = PARSER_getLabelAdrs("fftData");
    t.frames                = PARSER_getLabelAdrs("FX_Heap") + PARSER_getConstValue("precalc_frames");
    t.s_FFTFramesPtr        = PARSER_getLabelAdrs("FX_Heap") + PARSER_getConstValue("fft_frames");

    t.helper = AMIGA_GetScreenHelper({
      bplCount: 1,
      width: t.SCR_W_PIX,
      height: t.SCR_H_LN
    });

    t.s_curFramePtr         = t.frames;
    t.s_mode                = 0;  // 0 = precalc, 1 = replay    
    t.s_iter                = 0;
    
    t.fakeFFTTime           = 0;

    invoke68K("sph_init");
  }
  
  Plot(_bpl, _x,_y) {
    let t = this;
  
    t.toDataReg(_x,0);
    t.toDataReg(_y,1);
    regs.a[0] = _bpl;
    invoke68K("plot");
  }

  

  CopyBitplane(_from, _to) {
    regs.a[0] = _from;
    regs.a[1] = _to;
    invoke68K("bltCpy");
  }

  toDataReg(_v,_dn) {
    regs.d[_dn] = Math.floor(_v);
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
    const fftFrame = t.s_iter & msk;
    let r = t.fftData + t.FFT_ENTRIES_COUNT * fftFrame;
    for (let i  = 0; i < t.FFT_ENTRIES_COUNT; i++) {
      const fakeTestFFTValue = Math.floor(16 * Math.abs(Math.sin(i/4 + t.fakeFFTTime/10)));
      r = MACHINE.setRAMValue(fakeTestFFTValue, r, 1);
    }

    for (let iCircle = 0; iCircle < t.PRECALC_CIRCLES_COUNT; iCircle++) {
      for (let iPt = 0; iPt < t.FFT_POINTS_PER_CIRCLE; iPt++) {
        let x = MACHINE.getRAMValue(t.s_FFTFramesPtr, 2, true);
        t.s_FFTFramesPtr += 2;
        let y = MACHINE.getRAMValue(t.s_FFTFramesPtr, 2, true);
        t.s_FFTFramesPtr += 2;
        let h = MACHINE.getRAMValue(t.s_FFTFramesPtr, 2, true);
        t.s_FFTFramesPtr += 2;
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

    if (t.s_mode == 0) {
    } else { // play mode
      t.CopyBitplane(t.s_curFramePtr, t.helper.bitplanes);
      t.updateFFT(t.helper.bitplanes);
      AMIGA_updateScreenHelper(t.helper);
    }

    t.fakeFFTTime++;
    t.s_iter++;

    t.s_curFramePtr += t.ONE_FRAME_SIZE;
    if (t.s_iter >= t.PRECALC_FRAMES_COUNT) {
      t.s_mode = 1;  
      t.s_curFramePtr = t.frames;
      t.s_FFTFramesPtr = PARSER_getLabelAdrs("FX_Heap") + PARSER_getConstValue("fft_frames");
      t.s_iter = 0;
    }

    invoke68K("sph_update");
  }



}
