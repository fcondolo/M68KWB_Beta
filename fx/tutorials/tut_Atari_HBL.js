class tut_Atari_HBL {
    FX_Init() {
      invoke68K("start");
    }


  FX_Update() {
    invoke68K("update");
  }
}
