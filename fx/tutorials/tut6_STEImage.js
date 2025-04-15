REGISTER_FX({
  classname:"tut6_STEImage", 
  platform:"STE", 
  rootPath:"fx/tutorials",
  source:"tut6.asm"
});

class tut6_STEImage {
    FX_Init() {
      invoke68K("setPalette");
    }


  FX_Update() {
    invoke68K("update");
  }
}
