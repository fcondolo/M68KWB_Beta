REGISTER_FX({
  classname:"FX_tut3", 
  platform:"OCS", 
  rootPath:"fx/tutorials",
  source:"tut3.asm",
});

/*
For this tutorial, the JavaScript piece is exactly the same. The new stuff is in "tut3.asm":
There are 2 new instructions within   a ">JS" "" tag. Everything in-between can be any valid
javascript code. In this example, 2 instructions are used:
- the 1st one just logs the value of d7 in the debug console (your browser's one)
- the 2nd one triggers a breakpoint if d7 equals 12. This is useful to break your code's execution when some specific condition is met
Actually, you can do anything the javascript language allows you, you have the power of the eval() function here.

Now, for more classical features, run FX_tut3, and look at the debugger:
- Click on the left "ofs" column to toggle a breakpoint on/off. A red rectangle should appear.
Note that brakpoints are kept in localStorage, if you refresh your HTML page to relaunch your FX,
breakpoints will be restored

- Check the doc to get all the keyboard shortcuts to navigate the code

Finally,some more toys to play with:
- relaunch (use shift+r) to execute until the "if (regs.d[7] == 12) debug()" pauses execution
- in the "command" text box, type d7=4*5 and press enter. Note that now d7 equals $14 (so 20). Press the 'r' key twice. You shoud notice that the stripped bar in now longer.
Actually, you can update any value in the "command" text box:
    * a0 = 0 ==> set a0 to 0
    * a0 = d0 ==> copies d0's value to a0
    * a0 = d2*5 ==> copies 5 x d2's value to a0
    * d0 = $ff ==> set d0 to 255
    * d0 = %111 ==> set d0 to 7
- you can press the 'j' key to toggle inline Javascript commands on/off
*/

class FX_tut3 {
  constructor() {
  }

  FX_Init() {
    invoke68K("openScreen");
  }

  FX_Update()
  {
    let bitplaneAdrs = PARSER_getLabelAdrs("bitplane");
    AMIGA_setCustom_L(BPL1PTH, bitplaneAdrs); // needs to be done every frame on Amiga
    bitplaneAdrs += 82*40+20;
     for (let i = 0; i < 16; i++) {
      MACHINE.setRAMValue(0xffff, bitplaneAdrs, 2); // arguments: value,address,bytes (1,2 or 4)
      bitplaneAdrs += 40;
    }

    bitplaneAdrs += 40*10; // skip 10 lines
    regs.a[0] = bitplaneAdrs;
    regs.d[0] = 0xaaaa; // pattern
    invoke68K("drawSquare");
  }
}
