REGISTER_FX({
  classname:"tut_Atari1", 
  platform:"STE",
  rootPath:"fx/tutorials",
  source:"Atari_1.asm"
});

class tut_Atari1 {
    FX_Init() {
      invoke68K("start");
    }


  FX_Update() {
  }
}
