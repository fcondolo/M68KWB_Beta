class tut4_self_modified {
  FX_Init() {
    invoke68K("init");
  }

  FX_Update() {
    let t = this;
    regs.d[0] = 160;
    regs.d[1] = 0xa;
    invoke68K("set_pix");
    invoke68K("swapScreen");
  }
}
