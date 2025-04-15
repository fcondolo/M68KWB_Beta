REGISTER_FX({
  classname:"FX_mem64k", 
  platform:"OCS", 
  source:"fx/amiga/mem_64k.asm",
});

class FX_mem64k {
  constructor() {
    let t = this;
  }


  FX_Init() {
    let t = this;
    
    t.helper = AMIGA_GetScreenHelper({
      bplCount: 1,
      width: 320,
      height:180});

      //for (let i  = 65536-8; i<65536+8; i++) {
      let i  = 65536-8;
      regs.d[0] = i;
      regs.d[2] = 4;
    //}
    invoke68K("m64k_init");
}

  FX_Update() {
    AMIGA_updateScreenHelper(this.helper);
  }

  FX_DrawDebug(_ctx) {
  }

}
