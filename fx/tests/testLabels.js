REGISTER_FX({
  classname:"testLabels", 
  platform:"STE", 
  rootPath:"fx/tests",
  source:"testLabels.asm",
});

class testLabels {
  constructor() {
    let t = this;
  }

  FX_Init() {
    invoke68K("init", false);
  }

  

  FX_Update()
  {
    invoke68K("update", false);
    let t = this;
  }

}
