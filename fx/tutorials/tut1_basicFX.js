/* STEP 1 - Create your Javscript file and register it into the system -
In that configuration, the root of a FX is a Javascript class.
Methods names for init and update are FX_Init and FX_Udate (see below)
Your FX is registers into the system by appending M68KWB_BETA/user_fx.js
Open M68KWB_BETA/user_fx.js and search for "tut1_basicFX"
*/

// Make sure the below class name is the same as the one you declared in M68KWB_BETA/user_fx.js
class tut1_basicFX {

  // called only once before the first update.
  FX_Init()
  {
    // When you want to quickly test an algorithm, you don't want to waste time to allocate bitplanes, set bitplanes pointers and misc values.
    // The below "AMIGA_GetScreenHelper" function does that for you. 
    // A default copperlist is also created. While the FX is running, try pressing "shift" and "c" at the same time. If will show you the instructions contained in the current copperlist (created by the below function).
    // But if you want to do everything by yourself, you can! We'll see that in later tutorials
    this.helper = AMIGA_GetScreenHelper({
      bplCount: 2,
      width: 320,
      height:256});

    // Let's assign some colors
    // Set COLOR0 using helper function "AMIGA_setCustom". The list of supported constants is in src/amiga/customReg.js
    AMIGA_setCustom(COLOR0,0x123);
    // Set COLOR1 tapping directly into RAM
    MACHINE.setRAMValue(0x0a00,0xdff182,2); // value, address, size in bytes (1,2, or 4)
    // Set COLOR2 tapping directly into RAM, using constants this time
    MACHINE.setRAMValue(0x000a,CUSTOM + COLOR2,2);
    // set color 3
    AMIGA_setCustom(COLOR3,0x0a0a);
  }


  //  Called every frame BEFORE the bitplanes are trandsferred to screen.
  FX_Update()
  {
    const h = this.helper;
    let bitplane1Adrs = h.bitplanes;

    // let's draw a square
    const sqareHeight = 16;
    bitplane1Adrs += (h.height-sqareHeight)/2*h.lineBytes+16;
    let bitplane2Adrs = bitplane1Adrs +  h.bplSize + 2;
     for (let i = 0; i < sqareHeight; i++) {
      // write 1 word in the bitplane
      MACHINE.setRAMValue(0xffffffff, bitplane1Adrs, 4); // arguments: value,address,bytes (1,2 or 4)
      // next line
      bitplane1Adrs += h.lineBytes;
      // same for bitplane 2
      MACHINE.setRAMValue(0xffffffff, bitplane2Adrs, 4);
      bitplane2Adrs += h.lineBytes;
    }
  }
}
