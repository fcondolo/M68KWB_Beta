REGISTER_FX({
  classname:"tributic", 
  platform:"OCS", 
  rootPath:"fx/amiga/tributic",
  source:"effect.asm"
});

class tributic {
  FX_Init() {
    invoke68K("Entrypoint");
  }

  FX_Update() {
    invoke68K("MainLoop");
  }

  FX_DrawDebug(_ctx) {
    _ctx.fillStyle = "white";
    _ctx.font = "16px sans-serif";
    let y = Math.sin(performance.now()/100);
    _ctx.fillText("butchered from GIGABATES's code", 60, 240 + 10*y);
  }
}
