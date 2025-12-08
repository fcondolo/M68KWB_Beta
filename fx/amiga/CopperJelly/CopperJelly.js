class CopperJelly {
  FX_Init() {
    invoke68K("init");
  }

  FX_Update() {
    invoke68K("update");
  }

  FX_DrawDebug(_ctx) {
    _ctx.fillStyle = "blue";
    _ctx.font = "16px sans-serif";
    let y = Math.sin(performance.now()/100);
    _ctx.fillText("Original by CRADON / MATRIX", 60, 240 + 10*y);
  }
}
