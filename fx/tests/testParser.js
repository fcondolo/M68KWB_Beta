REGISTER_FX({
  classname:"FX_TestParser", 
  platform:"ST", 
});


class FX_TestParser {
  constructor() {
    let t = this;
  }

  
  FX_Init() {
    let t = this;
    const tests = test_opcodes;

    let l = tests.length;
    let lastError = null;

    if (CODERPARSER_SINGLETON == null) CODERPARSER_SINGLETON = new CodeParser();
    // TEST DISASEMBLY
    console.log("Test disassembly...");
    for (let i = 0; i < l ; i+=2) {
      const opcodes = tests[i];
      let byteCode = new Uint8Array(opcodes.length*2);
      let w = 0;
      for (let k = 0; k < opcodes.length; k++) {
        const code = opcodes[k];
        byteCode[w++] = (code>>8)&255;
        byteCode[w++] = code&255;
      }
      let r = decode_instruction_generated(byteCode,0);
      let str = InstructionToString(r.instruction).fullString;
//      console.log(str);
      if (!tests[i+1].toUpperCase().includes(str)) {
        lastError = "expected: " + tests[i+1].toUpperCase() + ", got: " + str;
        console.error(lastError);
        debugger;
        return;
      }
    }
    console.log("disassembled " + l/2 + " instructions.");



    // TEST ASSEMBLY
    console.log("Test assembly...");

    let codeSectionOfs = 0;
    for (let i = 0; i < l ; i+=2) {
      const opcodes = tests[i];
      let opcodes_string = '';
      for (let j = 0; j < opcodes.length; j++) {
        opcodes_string += wordToHexString(opcodes[j]);
        if (j < opcodes.length-1) opcodes_string += '.';
      }

      const ascii = "\t" + tests[i+1].toUpperCase(); // add \t at the beginning to avoid confusion with a label
      const expected = opcodes_string;

      // ASSEMBLE
      const compiled = asciiToBinary(ascii, codeSectionOfs); 
      if (!compiled) {
        lastError = "tst assembly failed for " + ascii + ": compilation returned null";
        alert(lastError);
        debugger;
        return;
      } 
      let found = '';
      for (let j = 0; j<compiled.ofs; j+=2) {
        found += wordToHexString((compiled.tab[j]<<8)|(compiled.tab[j+1]));
        if (j < compiled.ofs-1) found += '.';
      }
    
      if (compiled.ofs != opcodes.length*2) {
        lastError = "tst assembly failed for " + ascii + ": size does not match. Expected: " + expected + ", found: " + found;
        console.error(lastError);
        debugger;
      }
      for (let j = 0; j<opcodes.length; j++) {
        if (((compiled.tab[j*2]<<8)|(compiled.tab[j*2+1])) != opcodes[j]) {
          lastError = "tst assembly failed for " + ascii + ": Expected: " + expected + ", found: " + found;
          console.error(lastError);
          debugger;
        }
      }

      for (let j = 0; j<compiled.ofs; j++) {
        CPU_CODE_SECTION[codeSectionOfs++] = compiled.tab[j];
      }
      
   //   console.log("passed " + ascii);
    
    }
    if (lastError) {
      alert(lastError);
    } else{
      alert("all passed.");
    }
}

}
