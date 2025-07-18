/* This file was inspired by the steem engine's implementation and the doc at:
http://beyondbrown.d-bug.me/post/blitter-faq/
- SrcBuffer is a 32 bit register that contains the next data to write
- when SrcXInc >= 0, SrcBuffer contains (prev<<16)|curRead
- when SrcXInc < 0, SrcBuffer contains (curRead<<16)|prev
- If NFSR (No Final Source Read) is ON, and we are on the last word of the blit width, then SrcBuffer is only shifted, not updated
- If FXSR (Force eXtra Source Read), soure will be read to SrcBuffer <t the beginning of each line
- FXSR is for left shifts. The number of effective left shifts is given by (16 - SKEW). However, FXSR also implies that the source address will be incremented once more than the destination address will be, so set up your Y increments accordingly.
- SKEW always shifts to the right from the SrcBuffer
- Written data is WORD(SrcBuffer>>SKEW)
*/


let Blit;

function ATARI_bltReset()
{
/*
struct _BLITTER_STRUCT{

  short SrcXInc,SrcYInc;
  short DestXInc,DestYInc;

  DWORD SrcBuffer;
  MEM_ADDRESS SrcAdr;
  MEM_ADDRESS DestAdr;


  char LineNumber;
  bool Smudge,Hog;//,Busy;
  bool NFSR,FXSR;

}Blit;*/  
    Blit = {
      U8Buf : new Uint8Array(3),
      U16Buf : new Uint16Array(3),
      S16Buf : new Int16Array(4),
      U32Buf : new Uint32Array(3),
      HalfToneRAM : new Uint16Array(16),
        SrcXInc : 0,
        SrcYInc : 0,
        SrcAdr : 0,
        EndMask : new Uint16Array(3),
        DestXInc : 0,
        DestYInc : 0,
        DestAdr : 0,
        LineNumber : 0,
        Smudge : false,
        Hog : false,
        NFSR : false,
        FXSR : false,
        Busy : false,
        XCounter : 0, // 32 bits
        YCounter : 0,
        Last : false,
        HasBus : true,
        TimeToSwapBus : 0,
        NeedDestRead : false,
        InBlitter_Draw : false,
        getHop() {
          return this.U8Buf[0];
        },
        setHop(_v) {
          if (_v<0 || _v>3)
            debug("blitter: bad HOP");
          this.U8Buf[0] = _v;
        },
        getOp() {
          return this.U8Buf[1];
        },
        setOp(_v) {
          if (_v<0 || _v>15)
            debug("blitter: bad Op");
          this.U8Buf[1] = _v;
        },
        getSkew() {
          return this.U8Buf[2];
        },
        setSkew(_v) {
          this.U8Buf[2] = _v;
        },
        getMask() {
          return this.U16Buf[0];
        },
        setMask(_v) {
          if (_v<0 || _v>65535)
            debugger;
          this.U16Buf[0] = _v;
        },
        getXCount() {
          return this.U16Buf[1];
        },
        setXCount(_v) {
          if (_v<0 || _v>65535)
            debugger;
          this.U16Buf[1] = _v;
        },
        getYCount() {
          return this.U16Buf[2];
        },
        setYCount(_v) {
          if (_v<0 || _v>65535)
            debugger;
          this.U16Buf[2] = _v;
        },
        getSrcBuffer() {
          return this.U32Buf[0];
        },
        setSrcBuffer(_v) {
          if (_v<0)
            debugger;
          this.U32Buf[0] = _v;
        },
        getHopString() {
          switch (this.getHop()) {
            case 0: return "All bits are generated as '1'";
            case 1: return "All bits taken from halftone patterns";
            case 2: return "All bits taken from source";
            case 3: return "Source and halftone are AND combined";
            default: return "unknown HOP";
          }
        },
        getOpString() {
          switch (this.getOp()) {
            case 0: return "Target Bits are all 0";
            case 1: return "Target Bits are Source AND Target";
            case 2: return "Target Bits are Source AND NOT Target";
            case 3: return "Target Bits are Source";
            case 4: return "Target Bits are NOT Source AND Target";
            case 5: return "Target Bits are Target";
            case 6: return "Target Bits are Source XOR Target";
            case 7: return "Target Bits are Source OR Target";
            case 8: return "Target Bits are NOT Source AND NOT Target";
            case 9: return "Target Bits are NOT Source XOR NOT Target";
            case 10: return "Target Bits are NOT Target";
            case 11: return "Target Bits are Source OR NOT Target";
            case 12: return "Target Bits are NOT Source";
            case 13: return "Target Bits are NOT Source OR Target";
            case 14: return "Target Bits are NOT Source OR NOT Target";
            case 15: return "Target Bits are all 1";
            default: return "unknown OP";
          }
        }
    };

    let adrs = BLT_HALFTONE_0;
    while (adrs <= BLT_MISC_2) {
      ST_setCustomFromPtr_B(adrs, 0);
      adrs++;
    }    
}


const BLITTER_START_WAIT = 8;
const BLITTER_END_WAIT = 0;


//---------------------------------------------------------------------------
function WORD(_v)
{
    if (_v<0 || _v > 65535) {
      debugger;
    }

    return _v&0xffff;
}
//---------------------------------------------------------------------------


function Blitter_DPeek(_a)
{
  _a &= 0xffffff;
  return MACHINE.getRAMValue(_a,2,false);
}
//---------------------------------------------------------------------------

function Blitter_DPoke(abus, x)
{
    if (x <0 || x>65535)
      debugger;
    abus &= 0xffffff;
    MACHINE.setRAMValue(x,abus,2);
}

//---------------------------------------------------------------------------
function Blitter_ReadSource(SrcAdr)
{
  if (Blit.SrcXInc>=0){
    Blit.U32Buf[0] <<= 16; // Blit.SrcBuffer<<=16;
    Blit.U32Buf[0] |= Blitter_DPeek(SrcAdr); // Blit.SrcBuffer|=Blitter_DPeek(SrcAdr);
  }else{
    Blit.U32Buf[0] >>>= 16 ; // Blit.SrcBuffer>>>=16;
    Blit.U32Buf[0] |= Blitter_DPeek(SrcAdr) << 16; // Blit.SrcBuffer|=Blitter_DPeek(SrcAdr) << 16;
  }
}
//---------------------------------------------------------------------------
function Blitter_Notify_Start(_debugMsg)
{
  MACHINE.lastBlitContext = _debugMsg;
  MACHINE.errorContext.blitter = _debugMsg;
	TIME_MACHINE.paused = true;
}
//---------------------------------------------------------------------------
function Blitter_Notify_Stop()
{
    MACHINE.errorContext.blitter = null;
	TIME_MACHINE.paused = false;
}
//---------------------------------------------------------------------------
function Blitter_Start_Line()
{
    if (Blit.YCounter<=0){ // Blit finished?
        Blit.Busy=false;
        Blit.HasBus=false;
    }
    else { //prepare next line
        Blit.setMask(Blit.EndMask[0]);
        Blit.Last=0;
        if (Blit.FXSR) {
            Blitter_ReadSource(Blit.SrcAdr);
            Blit.SrcAdr+=Blit.SrcXInc;
        }
    }
}

//---------------------------------------------------------------------------
function Blitter_Start_Now()
{
  Blit.Busy=true;

  Blit.XCounter=Blit.getXCount();
  if (Blit.XCounter==0) Blit.XCounter=65536;
  Blit.YCounter=Blit.getYCount();
  const op = Blit.getOp();
  Blit.NeedDestRead=(op && (op!=3) && (op!=12) && (op!=15));
  
  /*Only want to start the line if not in the middle of one.*/
  if (Blit.XCounter-Blit.getXCount() == 0) {
    Blitter_Notify_Start("blitter start");
    Blitter_Start_Line();
    Blitter_Notify_Stop();
  }
  Blitter_Draw();
}

//---------------------------------------------------------------------------
function Blitter_Blit_Word()
{
  if (!Blit.Busy) return;

  let dat = new Uint16Array(3); // src, dest, new
  // The modes 0,3,12,15 are source only
  if (Blit.XCounter==1){
    Blit.Last=true;
    if (Blit.getXCount()>1) 
      Blit.setMask(Blit.EndMask[2]);
  }

  //won't read source for 0,5,10,15 or Hop=0,1 (unless 1 and smudge on)
  if ((Blit.getOp() % 5)!=0 && (Blit.getHop()>1 || (Blit.getHop()==1 && Blit.Smudge))){
    if (Blit.NFSR && Blit.Last){
      if (Blit.SrcXInc>=0){
        Blit.U32Buf[0] <<= 16; // Blit.SrcBuffer<<=16;
      }else{
        Blit.U32Buf[0] >>>= 16; // Blit.SrcBuffer>>>=16;
      }
    }else{
      Blitter_ReadSource(Blit.SrcAdr);
    }
    if (Blit.Last){
      Blit.SrcAdr+=Blit.SrcYInc;
    }else{
      if (!(Blit.NFSR && (Blit.XCounter==2))){
        Blit.SrcAdr+=Blit.SrcXInc;
      }
    }
  }

  switch (Blit.getHop()){
    case 0:
      dat[0]=0xffff;
      break;
    case 1:
      if (Blit.Smudge){
        dat[0]=Blit.HalfToneRAM[(Blit.U32Buf[0] >>> Blit.getSkew()) & 15];
      }else{
        dat[0]=Blit.HalfToneRAM[Blit.LineNumber];
      }
      break;
    default:
      dat[0]=(Blit.U32Buf[0] >>> Blit.getSkew()) & 0xffff;
      if (Blit.getHop()==3){
        if (Blit.Smudge==0){
          dat[0]&=Blit.HalfToneRAM[Blit.LineNumber];
        }else{
          dat[0]&=Blit.HalfToneRAM[dat[0] & 15];
        }
      }
  }
  if (Blit.NeedDestRead || (Blit.getMask()!=0xffff)){
    dat[1]=Blitter_DPeek(Blit.DestAdr);
    dat[2]=dat[1] & (~Blit.U16Buf[0]);//WORD(~(Blit.getMask()));
  }else{
    dat[2]=0; //Blit.Mask is FFFF and we're in a source-only mode
  }

  switch (Blit.getOp()){
    case 0:
    break;
    case 1:
      dat[2]|= (dat[0] & dat[1]) & Blit.getMask(); break;
    case 2:
      dat[2]|= (dat[0] & ~dat[1]) & Blit.getMask(); break;
    case 3:
      dat[2]|= dat[0] & Blit.getMask(); break;
    case 4:
      dat[2]|= (~dat[0] & dat[1]) & Blit.getMask(); break;
    case 5:
      dat[2]|= dat[1] & Blit.getMask(); break;
    case 6:
      dat[2]|= (dat[0] ^ dat[1]) & Blit.getMask(); break;
    case 7:
      dat[2]|= (dat[0] | dat[1]) & Blit.getMask(); break;
    case 8:
      dat[2]|= (~dat[0] & ~dat[1]) & Blit.getMask(); break;
    case 9:
      dat[2]|= (~dat[0] ^ dat[1]) & Blit.getMask(); break;
    case 10:
      dat[2]= dat[1]^Blit.getMask(); break;  // ~DestAdr & Blit.Mask
    case 11:
      dat[2]|=(dat[0] | ~dat[1]) & Blit.getMask(); break;
    case 12:
      dat[2]|=(~dat[0]) & Blit.getMask(); break;
    case 13:
      dat[2]|=(~dat[0] | dat[1]) & Blit.getMask(); break;
    case 14:
      dat[2]|=(~dat[0] | ~dat[1]) & Blit.getMask(); break;
    case 15:
      dat[2]|=(0xffff) & Blit.getMask(); break;
  }

  Blitter_DPoke(Blit.DestAdr,dat[2]);
  if (Blit.Last){
    Blit.DestAdr+=Blit.DestYInc;
  }else{
    Blit.DestAdr+=Blit.DestXInc;
  }
  Blit.setMask(Blit.EndMask[1]);
  if((--Blit.XCounter) <= 0){
    Blit.LineNumber+=(Blit.DestYInc>=0) ? 1:-1;
    Blit.LineNumber&=15;
    Blit.YCounter--;
    Blit.setYCount(Blit.YCounter);
    if (Blit.getXCount() == 0) Blit.XCounter = 65536; else Blit.XCounter = Blit.getXCount();  //init blitter for line
    Blitter_Start_Line();
  }
}

function Blitter_Draw()
{
    if (Blit.getYCount()==0){
        Blit.Busy=false;
        return;
    }else{
        Blit.YCounter=Blit.getYCount();
    }


    let dbgStr = "Blitter op, draw. SrcAdr=$" + Blit.SrcAdr.toString(16);
    dbgStr += "\nSrcXInc="+Blit.SrcXInc+", SrcYInc="+Blit.SrcYInc;
    dbgStr += "\nDestAdr=$"+Blit.DestAdr.toString(16);
    dbgStr += "\nDestXInc="+Blit.DestXInc+", DestYInc="+Blit.DestYInc;
    dbgStr += "\nXCount="+Blit.getXCount()+", YCount="+Blit.getYCount();
    dbgStr += "\nSkew="+Blit.getSkew()+", NFSR="+Blit.NFSR+", FXSR="+Blit.FXSR;
    dbgStr += "\nHog="+Blit.Hog;
    dbgStr += "\nOp="+Blit.getOp() +": " + Blit.getOpString();
    dbgStr += "\nHop="+Blit.getHop()+": " + Blit.getHopString() + "\n";
    if (DEBUGGER_tracing && Blit.getXCount()>0) alert("This is NOT an error, this is info as you are tracing:\n" + dbgStr);
    dbgStr = dbgStr.replaceAll("\n", "<br>");
    Blitter_Notify_Start(dbgStr);

    while(true) {
        if (MACHINE.stop)
          break;
        Blit.HasBus=true;
        Blitter_Blit_Word();
        Blit.HasBus=false;
        if (Blit.Busy==0) 
            break;
    }

    Blitter_Notify_Stop();
}



function ATARI_bltStart() {
  if (!MACHINE.allowBlitter) {
    MACHINE.errorContext.blitter = null;
    ST_setCustomFromPtr_B(BLT_MISC_1, 0);
    return;
  }

  /* Half Tone Patterns 0..15 */
  for (let i = 0; i < 16; i++) {
      Blit.HalfToneRAM[i] = ST_getCustomFromPtr_W(BLT_HALFTONE_0 + 2 * i);
  }

  /*
	This sets up everything related to source addressing. 
	It sets the 24-Bit base address where to read data from, 
	how many bytes to add after each word copied (X Increment) 
	and how many bytes to add after each line copied (Y Increment) to the source address.
	*/
  Blit.SrcXInc        = TOOLS.toInt16(ST_getCustomFromPtr_W(BLT_SRC_XINCR) & 0xfffe); // Source X Increment (15 Bit - Bit 0 is unused) - signed
	Blit.SrcYInc        = TOOLS.toInt16(ST_getCustomFromPtr_W(BLT_SRC_YINCR) & 0xfffe); // Source Y Increment (15 Bit - Bit 0 is unused) - signed
	Blit.SrcAdr         = ST_getCustomFromPtr_L(BLT_SRC_ADRS) & 0x7ffffe; // Source Address (23 Bit - Bit 31..24, Bit 0 unused)

  /*
	These masks are overlaid with the destination words and only bits that feature a “1” are actually manipulated by the BLiTTER.
	All bits containing a “0” will be left untouched. 
	ENDMASK 1 refers to the first word per line being copied, 
	ENDMASK 3 to the last word in each line being copied 
	while ENDMASK 2 affects all copies in between.
	*/
  Blit.EndMask[0]     = ST_getCustomFromPtr_W(BLT_ENDMASK_1); // ENDMASK 1 (16 Bits)
	Blit.EndMask[1]     = ST_getCustomFromPtr_W(BLT_ENDMASK_2); // ENDMASK 2 (16 Bits)
	Blit.EndMask[2]     = ST_getCustomFromPtr_W(BLT_ENDMASK_3); // ENDMASK 3 (16 Bits)
  Blit.setMask(Blit.EndMask[0]);

  /*
	Much like the source address generation, this covers the target or destination addressing,
	containing increment per word being copied (X), per line (Y) 
	and the target address to start with.
	*/
  Blit.DestXInc 		  = TOOLS.toInt16(ST_getCustomFromPtr_W(BLT_TGT_XINCR) & 0xfffe); // Destination X Increment (15 Bit - Bit 0 is unused) - signed
  Blit.DestYInc 		  = TOOLS.toInt16(ST_getCustomFromPtr_W(BLT_TGT_YINCR) & 0xfffe); // Destination Y Increment (15 Bit - Bit 0 is unused) - signed
  Blit.DestAdr		    = ST_getCustomFromPtr_L(BLT_TGT_ADRS) & 0x7ffffe; // Destination Address (23 Bit - Bit 31..24, Bit 0 unused)

	/*
	These two registers configure how many words (!) to copy per line (X) 
	and how many lines to copy in total (Y).
	Please note that these values are 16 Bits wide and unsigned.
	*/
  Blit.setXCount(ST_getCustomFromPtr_W(BLT_COUNT_X)); // X Count (16 Bits)
  Blit.setYCount(ST_getCustomFromPtr_W(BLT_COUNT_Y)); // Y Count (16 Bits)

	/*
	HOP stands for “Halftone OPeration” mode and configures in what way halftone and data read from memory using source addressing are being overlaid. It contains values 0..3:
	0 = All bits are generated as “1”
	1 = All bits taken from halftone patterns
	2 = All bits taken from source
	3 = Source and halftone are AND combined
	*/
	Blit.setHop(ST_getCustomFromPtr_B(BLT_HOP));

	/*
	The OP Register stands for “OPeration” mode and configures how destination and source data are being overlaid. It contains values 0..15:
	0 = Target Bits are all “0”
	1 = Target Bits are Source AND Target
	2 = Target Bits are Source AND NOT Target
	3 = Target Bits are Source
	4 = Target Bits are NOT Source AND Target
	5 = Target Bits are Target
	6 = Target Bits are Source XOR Target
	7 = Target Bits are Source OR Target
	8 = Target Bits are NOT Source AND NOT Target
	9 = Target Bits are NOT Source XOR NOT Target
	10 = Target Bits are NOT Target
	11 = Target Bits are Source OR NOT Target
	12 = Target Bits are NOT Source
	13 = Target Bits are NOT Source OR Target
	14 = Target Bits are NOT Source OR NOT Target
	15 = Target Bits are all “1”
	*/
  let op = ST_getCustomFromPtr_B(BLT_OP);
  if (MACHINE.allowBlitterClearOnly && op != 0) {
    MACHINE.errorContext.blitter = null;
    ST_setCustomFromPtr_B(BLT_MISC_1, 0);
    return;
  }
  Blit.setOp(op);
 
	/*
	This register is a bit structure of the following content:
	Bit 7 = BUSY Bit (Write: Start/Stop, Read: Status Busy/Idle)
	Bit 6 = HOG Mode (Write: HOG/BLiT mode, Read: Status)
	Bit 5 = Smudge Mode (Write: Smudge/Clean mode: Read Status)
	Bit 3..0 = Line number of Halftone Pattern to start with
	*/
	const MISC_1		      = ST_getCustomFromPtr_B(BLT_MISC_1);
  if ((MISC_1 & (1<<6)) != 0) Blit.Hog = true; else Blit.Hog = false;
  if ((MISC_1 & (1<<5)) != 0) Blit.Smudge = true; else Blit.Smudge = false;
  Blit.LineNumber     = MISC_1 & 15;
    
	/*
	This register is a bit structure of the following content:
	Bit 7 = Force eXtra Source Read (FXSR)
	Bit 6 = No Final Source Read (NFSR)
	Bit 3..0 = Skew (Number of right shifts per copy)
	*/
	const MISC_2		      = ST_getCustomFromPtr_B(BLT_MISC_2);
  if ((MISC_2 & (1<<7)) != 0) Blit.FXSR = true; else Blit.FXSR = false;
  if ((MISC_2 & (1<<6)) != 0) Blit.NFSR = true; else Blit.NFSR = false;
  Blit.setSkew(MISC_2 & 15);

  
  Blitter_Start_Now();

  MACHINE.errorContext.blitter = null; // finished

//    ATARI_bltReset();

    ST_setCustomFromPtr_B(BLT_MISC_1, MISC_1 &(~128)); // clear blitter busy bit
}



