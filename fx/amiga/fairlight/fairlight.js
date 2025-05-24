REGISTER_FX({
  classname:"Fairlight", 
  platform:"OCS", 
  rootPath:"fx/amiga/fairlight",
  source:"fairlight.asm"
});

class Fairlight {
  FX_Init() {
    invoke68K("init");
  }

  FX_Update() {
    invoke68K("update");
  }
}
