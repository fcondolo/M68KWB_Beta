REGISTER_FX({
  classname:"Non_Regression_Tests", 
  platform:"STE", 
  rootPath:"fx/tests",
  source:"Non_Regression_Tests.asm",
});

class Non_Regression_Tests {
  constructor() {
    let t = this;
    t.curTestIndex = 0;
    t.executedUpdates = 0;
    t.msg = "Running non-regression tests...<br>";
    /*
    tests table entries format:
    {
      jsInit:"methodName"   ==> name of the JS method within the "Non_Regressin_Tests" class to execute before asm init. Name must be between quotes, without parenthesis
      asmInit:"asmLabel"    ==> name of the asm lablel to call at init
      jsUpdate:"methodName" ==> name of the JS method within the "Non_Regressin_Tests" class to execute before asm update. Name must be between quotes, without parenthesis
      asmUpdate:"asmLabel"  ==> name of the asm lablel to call at update
      updatesToExecute:10   ==> number of times (frames) the JS and asm updates should be called before passing to next test
      msg:"Test something"  ==> info message displayed while running test
      }
    */
    t.tests = [      
      {jsInit:"test_Tools", msg:"Test TOOLS"},
      {asmInit:"testBranches_init", msg:"Test Branches"},
      {asmInit:"testMovem_init", msg:"Test movem"},
      {asmInit:"testLabels_init", msg:"Test Labels"},
    ];
  }

  FX_Update()
  {
    let t = this;
    if (t.curTestIndex == -1)
      return;
    if (t.curTestIndex >= t.tests.length) {
      alert("all non-regression tests executed, that's over");
      t.curTestIndex = -1;
      t.msg += "<br>OVER!";
      ShowDebugLog(t.msg);
      return;
    }
    const curTest = t.tests[t.curTestIndex];
    if (curTest.msg) t.msg += "<br>" + curTest.msg + " ... ";
    ShowDebugLog(t.msg);
    if (t.executedUpdates == 0) {
      if (curTest.jsInit) eval("t." + curTest.jsInit + "()");
      if (curTest.asmInit) invoke68K(curTest.asmInit);
    }
    if (curTest.updatesToExecute > 0) {
      if (curTest.jsUpdate) eval("t." + curTest.jsUpdate + "()");
      if (curTest.asmUpdate) invoke68K(curTest.asmUpdate);
      t.executedUpdates++;
      curTest.updatesToExecute--;
    } else {
      if (curTest.msg) t.msg += "DONE";
      ShowDebugLog(t.msg);
      t.executedUpdates = 0;
      t.curTestIndex++;
    }
  }

  test_Tools() {
    if (I_DIVS(1000, 200000) != 200) alert("chiure 1");
    if (TOOLS.toInt16(I_DIVS(1000, -300000)) != -300) alert("chiure 2");
    if (TOOLS.toInt16(I_DIVS(-100, 100000)) != -1000) alert("chiure 3");
    if (I_DIVS(-100, -100000) != 1000) alert("chiure 4");  
  }

}
