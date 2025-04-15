/* STEP 1 - Create your Javscript file and include it
Create a new javascript file and add it to "index.html" so that it gets loaded by the system.
In "index.html", look for "START FX BLOCK" and include your .js file there
Note: If you are a js pro, you know that there are more sophisticated ways to include js files in a page. If chose this prehistoric way for the sake of simplicity, and also because browsers debuggers are more complicated to use (for me) when files are dynamicaly loaded
*/

/* STEP 2 - Register your FX in the system
First we need to talk a bit about what a FX is. A FX is a Javascript class. The reason is mainly for scoping/namespace to avoid errors when multiple fx share similar variable/function names.
At the top of you .js file, BEFORE declaring your class (so outside of the class), you need to call "REGISTER_FX" (see below).
It gives the system all the needed info to instanciate the class and the emulated machine.
REGISTER_FX takes a single parameter, which is a structure containing the following info:
{
    classname:"FX_tut1"       --> name of the class to instanciate to create this FX
    platform:"OCS"            --> "OCS", "ST" or "STE"
}
Note 1: Default functions names for init and update are FX_Init and FX_Udate (see below)
Note 2: Platform emulation is very limited, after all, we are in a M68K Workbench, not an emulator.
Still, some features are emulated (such as bitplane and palette, and some copper for the Amiga). 
Note 3: More params can be passed through the structure, but they are optional and we don't need them for the moment.
*/

REGISTER_FX({
  classname:"FX_tut1", 
  platform:"OCS"
});


/* STEP 3 - The class itself
Make sure the class name is the same as the one you declared in step 2 when calling REGISTER_FX */
class FX_tut1 {

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
    // Note: for the moment, max 5 bitplanes are supported, and only 320x256 and 320x180 resolutions are supported.

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
