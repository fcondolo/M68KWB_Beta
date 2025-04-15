REGISTER_FX({
  classname:"tut5_AmigaImage", 
  platform:"OCS", 
  rootPath:"fx/tutorials",
  source:"tut5.asm"
});

class tut5_AmigaImage {
    FX_Init() {
      invoke68K("openScreen");
      invoke68K("setPalette");
    }


  FX_Update() {
    invoke68K("update");
  }
}
