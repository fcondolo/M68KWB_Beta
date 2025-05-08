

REGISTER_FX({
  classname:"AtariSTe_BlitterFill", 
  platform:"STE", 
  source:"AtariSTe_BlitterFill.asm",
  rootPath:"fx/tutorials",
});

class AtariSTe_BlitterFill {
  FX_Init() {
      invoke68K("init");
      this.frame = 0;

  }


  FX_Update() {
    invoke68K("update");
    regs.d[4] = 160*(50+Math.floor(25*Math.sin(this.frame/10)))+48;
    this.frame++;
  }

}
