REGISTER_FX({
  classname:"FX_tut2", 
  platform:"OCS", 
  rootPath:"fx/tutorials",
  source:"tut2.asm"
});
/*
As you can guess, the "source" field is used to indicate the .asm source to bind to your FX.
Note that if your code is pread across several .asm files, just include them from your main .asm file.
The asm "include" directive is fully supported.
*/

class FX_tut2 {
    /*
    Finally some asm! open tut2.asm, and note the following:
    - You may call any asm label from JS by typing invoke68K("labelname")
    - The classic amiga constants names can be used (CUSTOM, BPL1PTH, etc.). See file src/amiga/Amiga_Constants.js for a full list
    - You may also use the direct value for custom registers (e.g. $dff000 instead of CUSTOM)
    - Some custom registers are taken into account: DIWSTRT/STOP, DDFSTRT/STOP, BPLxPTH/PTL, BPLxMOD, BPLCON0/1, COLORx
    - Supported custom registers can be chnaged at runtime, including within a copperlist
    */
    FX_Init() {
      console.log("A1");  
      invoke68K("openScreen");
      console.log("A2");  
      invoke68K("setPalette");
      console.log("A3");  
    }


  FX_Update() {
    /* let's draw a 16x16 pix square!
    First, you can get the address of any label in your asm source code using TOOLS.getLabelAdrs
    */
    let bitplaneAdrs = TOOLS.getLabelAdrs("bitplane");
    AMIGA_setCustom_L(BPL1PTH, bitplaneAdrs); // needs to be done every frame on Amiga

    // let's skip 82 lines and x-center a bit
    bitplaneAdrs += 82 * 40 + 20;
    for (let i = 0; i < 16; i++) {
      // write 1 word in the bitplane
      MACHINE.setRAMValue(0xffff, bitplaneAdrs, 2); // arguments: value,address,bytes (1,2 or 4)
      // next line (width = 320 pix, so 320/8 = 40 bytes per line)
      bitplaneAdrs += 40;
    }

    // now, let's draw another 16x16 square, but in asm this time, and with a pattern
    bitplaneAdrs += 40 * 10; // skip 10 lines
    regs.a[0] = bitplaneAdrs;
    regs.d[0] = 0xaaaa; // pattern
    // So you got it: you may read/write any CPU register from javascript using regs.a[n] and regs.d[n]  
    console.log("before");  
    invoke68K("drawSquare");
    console.log("after");  
  }
}
/*
Last but not least: You can now see the asm code in the debugger!
We'll play with it in the next tutorial
*/
