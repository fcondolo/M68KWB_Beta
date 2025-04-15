REGISTER_FX({
  classname:"testSTEBlitter", 
  platform:"STE",
  rootPath:"fx/tutorials",
  source:"testSTEBlitter.asm"
});

class testSTEBlitter {
    FX_Init() {
      invoke68K("setPalette");
    }


  FX_Update() {
    invoke68K("update");
  }
}
