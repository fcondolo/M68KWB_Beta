class tut5_AmigaImage {
    FX_Init() {
      invoke68K("openScreen");
      invoke68K("setPalette");
    }


  FX_Update() {
    invoke68K("update");
  }
}
