REGISTER_FX({
  classname:"tut_Atari_HBL", 
  platform:"STE",
  rootPath:"fx/tutorials",
  source:"tut_Atari_HBL.asm"
});

class tut_Atari_HBL {
    FX_Init() {
      invoke68K("start");
    }


  FX_Update() {
    invoke68K("update");
  }
}
