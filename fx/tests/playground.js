REGISTER_FX({
  classname:"FX_Playground", 
  platform:"STE", 
  rootPath:"fx/tests",
  source:"playground.asm",
});

class FX_Playground {
  constructor() {
    let t = this;
  }

  FX_Init() {
    let t = this;    
    debugger;
    if (I_DIVS(1000, 200000) != 200) alert("chiure 1");
    if (toInt16(I_DIVS(1000, -300000)) != -300) alert("chiure 2");
    if (toInt16(I_DIVS(-100, 100000)) != -1000) alert("chiure 3");
    if (I_DIVS(-100, -100000) != 1000) alert("chiure 4");
    invoke68K("init", false);
  }

  

  FX_Update()
  {
    invoke68K("update", false);
    let t = this;
  }

  FX_DrawDebug(_ctx)
  {
    let t = this;
  }
}
