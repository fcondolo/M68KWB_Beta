const LOCALSTORAGE_CHAININDEX = "chain_index";

var CHAIN_MODE = false;
const chain_fx = [
  "Non-Regression Tests",
  "TestParser",
  "Draw2Buffer",
  "Blitter Tornado",
  "Copper Jelly",
  "Revision Logo V1",
  "Revision Logo V2",
  "Disk V1",
  "Disk V2",
  "Disk V3",
  "Disk V4",
  "Starfield V1",
  "Starfield V2",
  "Heroes",
  "Test Copper",
  "STE Blitter Fill",
  "Tut: Atari HBL",
  "OCS Blitter",
  "STE Blitter",
  "Tut: Atari1",
  "Tut4: self-modified",
  "Tut5: OCS image",
  "Tut6: STE image",
  "Tut6: STE image",
  "HAM6 image"
];


function Check_Chain() {
  let index = localStorage.getItem(LOCALSTORAGE_CHAININDEX);
  if (!index)
    return false;
  index = parseInt(index);
  if (!isNaN(index)) {
    const arrayIndex = index - 1;
    if (arrayIndex >= 0 && arrayIndex < chain_fx.length) {
      const fxName = chain_fx[arrayIndex];
      main_startChosenFx(fxName);
      CHAIN_MODE = true;
      localStorage.setItem(LOCALSTORAGE_CHAININDEX, index + 1);
      return true;
    } else  {
      localStorage.setItem(LOCALSTORAGE_CHAININDEX, null);
      localStorage.clear();
      main_Info("CHAIN DONE!");
      window.location.reload(true);
    }
  }
  return false;
}

