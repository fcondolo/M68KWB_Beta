REGISTER_FX({
  classname:"AtariVBL", 
  platform:"STE",
  rootPath:"fx/tutorials",
  source:"AtariVBL.asm"
});

class AtariVBL {
    FX_Init() {
      invoke68K("DEFAULT_ENTRY_POINT");
    }


  FX_Update() {
    invoke68K("DEFAULT_MAIN_LOOP");
  }
}
