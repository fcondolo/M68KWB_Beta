REGISTER_FX({
  classname:"BlitterTornado", 
  platform:"OCS", 
  rootPath:"fx/amiga/BlitterTornado",
  source:"blitter_tornado.asm"
});

class BlitterTornado {
  FX_Init() {
    invoke68K("init");
  }

  FX_Update() {
    invoke68K("update");
  }

  FX_DrawDebug(_ctx) {
    _ctx.fillStyle = "white";
    _ctx.font = "bold 20px serif";
    let y = Math.sin(performance.now()/100);
    _ctx.fillText("Tsunami", 250, 240 + 10*y);
  }
}
