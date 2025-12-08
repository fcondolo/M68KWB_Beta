M68KWB is an Amiga and Atari ST/STe development tool that allows you to smoothly go from javascript prototyping to asm implementation.
It’s also useful if you only need to develop in pure assembly from scratch.
It features:
- An assembler, to assemble the source code you typed to actual opcodes in memory. The assembled instructions remain in RAM, you can’t save them to disk or produce an executable for your final platform with it, so to produce your final demo’s exe, you’ll still need vasm (or any similar tool) in the end.
- A disassembler, because you may have used auto-modified code so the debugger must show you the proper instructions.
- A debugger, with classic and advanced features to trace your code, trigger breakpoints, etc.
- Rudimentary emulation of target platforms (Amiga OCS, Atari ST/STe for the moment), providing bitplane emulation, and a few extra hardware features. Note this tool is meant to make your m68k coding easier only. It does not emulate CPU cycles, DMA cycles, nor is it a full emulator for the Amiga or the ST.
