class AtariVBL {
    FX_Init() {
      invoke68K("DEFAULT_ENTRY_POINT");
    }


  FX_Update() {
    invoke68K("DEFAULT_MAIN_LOOP");
  }
}
