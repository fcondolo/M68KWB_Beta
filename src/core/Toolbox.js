var TOOLBOX = null;

class Toolbox {
    constructor(
    ) {
        let t               =   this;
        TOOLBOX             =   t;
        t.data              =   [];
    }

    toggleShow() {
        let t = this;
        let elm = document.getElementById("draggable");
        if (elm.style.display == "none") {
            t.refresh();
            elm.style.display = null;
            $("#draggable").draggable();   
            $("#draggable").css({
            position: "absolute",
            top: GLOBAL_MOUSEY.toString()+"px",
            left: GLOBAL_MOUSEX.toString()+"px",
            width: "30%",
            height: "50%",
            overflowY: "auto",   // Scrollbar when needed
            overflowX: "hidden", // Optional
            padding: "10px",
            border: "1px solid #ccc",
            background: "rgba(130,130,150,0.9"
            });
            //$('body').scrollTo('#draggable');  
        }  
        else {
            elm.style.display = "none";
        }
    }

    onCheckBox(_id) {
        let t = this;
        const checked = document.getElementById(_id).checked;
        t.data[_id].checked = checked;
        if (t.data[_id].callback) {
            for (let i = 0; i < t.data[_id].callback.length; i++) {
                let evalMe = t.data[_id].callback[i];
                if (checked) evalMe += "(true,"+"'"+_id+"')";
                else evalMe += "(false,"+"'"+_id+"')";
                eval(evalMe);
            }
        }
    }

    addCheckbox(_title, _id, _click = null, _forceChecked = false, _style = null) {
        let t = this;
        let wasChecked = t.data[_id] && t.data[_id].checked;
        if (_forceChecked) wasChecked = true;
        if (!t.data[_id]) t.data[_id] = {};
        t.data[_id].checked = wasChecked;
        t.data[_id].callback = _click;
        let r = "<tr";
        if (_style) r += " style='" + _style + "'";
        r += "><td><input type='checkbox' id='" + _id + "'";
        r += "onclick=TOOLBOX.onCheckBox(\""+_id+"\")";
        if (wasChecked) r += " checked";
        r += "></td><td>"+_title+"</td></tr>";
        return r;
    }

    getCheckbox(_id) {
        let t = this;
        return t.data[_id] && t.data[_id].checked;
    }


    createBitplaneString() {
        let t = this;
        let checked = t.getCheckbox("tlbx_bpl");
        let col = checked ? "background-color: rgba(166, 221, 218, 0.8);" : null;
        t.bplContent = t.addCheckbox("Bitplanes", "tlbx_bpl", ["TOOLBOX.refresh"], checked, col);
        if (checked) {
            t.bplContent += t.addCheckbox("Bitplanes zone", "tlbx_bplzone", ["DEBUGGER_ToggleCard"]);
            for (let i = 0; i<t.bplCount; i++) {
                let bplCheck = false;
                if (MACHINE.getBitplaneWeight(i) != 0) bplCheck = true;
                if (!t.data["tlbx_bpl"+i])
                    t.data["tlbx_bpl"+i] = {bplIndex: i}
                t.data["tlbx_bpl"+i].checked = bplCheck;
                t.bplContent += t.addCheckbox("Bitplane " + (i+1).toString(), "tlbx_bpl"+i, ["TOOLBOX.showBitplane"]);
            }
        }
    }

    createPaletteString() {
        let t = this;
        let checked = t.getCheckbox("tlbx_pal");
        let col = checked ? "background-color: rgba(166, 221, 218, 0.8);" : null;
        t.palContent = t.addCheckbox("Palette", "tlbx_pal", ["TOOLBOX.refresh"], checked, col);
        if (checked) {
            const colCount = 1 << t.bplCount;
            for (let i = 0; i<colCount; i++) {
                let htmlCol = "#";
                let platformcol;
                switch (FX_INFO.platform) {
                case 'OCS': 
                {
                    platformcol = AMIGA_customregs[0x180/2 + i];
                    htmlCol += DEBUGGER_2digitHex(((platformcol >>> 8) & 15) * 16);
                    htmlCol += DEBUGGER_2digitHex(((platformcol >>> 4) & 15) * 16);
                    htmlCol += DEBUGGER_2digitHex((platformcol & 15) * 16);
                }
                break;
                case 'ST':
                {
                    platformcol = ST_getCustomFromPtr_W(ST_COLOR0 + 2 * i, 2, false);
                    const red = (platformcol>>8)&7;
                    const green = (platformcol>>4)&7;
                    const blue = platformcol&7;
                    htmlCol += DEBUGGER_2digitHex(ST_To_HTML[red]);
                    htmlCol += DEBUGGER_2digitHex(ST_To_HTML[green]);
                    htmlCol += DEBUGGER_2digitHex(ST_To_HTML[blue]);
                }
                break;
                case 'STE':
                {
                    platformcol = ST_getCustomFromPtr_W(ST_COLOR0 + 2 * i, 2, false);
                    const red = (platformcol>>8)&15;
                    const green = (platformcol>>4)&15;
                    const blue = platformcol&15;
                    htmlCol += DEBUGGER_2digitHex(STE_To_HTML[red]);
                    htmlCol += DEBUGGER_2digitHex(STE_To_HTML[green]);
                    htmlCol += DEBUGGER_2digitHex(STE_To_HTML[blue]);
                }
                break;
                default:
                    htmlCol += "000000";
                break;
                }
                let cname = "COLOR";
                if (i<10) cname += "0";
                cname += i.toString();
                let cval = wordToHexString(platformcol);
                t.palContent += "<tr><td>" + cname + "</td><td style='background-color:" +htmlCol+"'>"+cval+"</td></tr>";
            }
        }
    }

    createCPUString() {
        let t = this;
        let checked = t.getCheckbox("tlbx_cpu");
        let col = checked ? "background-color: rgba(166, 221, 218, 0.8);" : null;
        t.cpuContent = t.addCheckbox("CPU", "tlbx_cpu", ["TOOLBOX.refresh"], checked, col);
        if (checked) {
            t.cpuContent += t.addCheckbox("Show Cycles", "tlbx_showcycles", ["DEBUGGER_ToggleCycles"]);
            if (!t.data["tlbx_inlineJS"])
                t.data["tlbx_inlineJS"] = {};
            t.data["tlbx_inlineJS"].checked = DEBUGGER_AllowJS;
            t.cpuContent += t.addCheckbox("Allow inline JS", "tlbx_inlineJS", ["DEBUGGER_AllowJSCommands"]);
        }
    }

    createBlitterString() {
        let t = this;
        let checked = t.getCheckbox("tlbx_blter");
        let col = checked ? "background-color: rgba(166, 221, 218, 0.8);" : null;
        t.blitterContent = t.addCheckbox("Blitter", "tlbx_blter", ["TOOLBOX.refresh"], checked, col);
        if (checked) {
            if (!t.data["tlbx_blterglbl"]) t.data["tlbx_blterglbl"] = {};
            t.data["tlbx_blterglbl"].checked = MACHINE.allowBlitter;
            if (!t.data["tlbx_blterclr"]) t.data["tlbx_blterclr"] = {};
            t.data["tlbx_blterclr"].checked = MACHINE.allowBlitterClearOnly;
            t.blitterContent += t.addCheckbox("Allow Blitter", "tlbx_blterglbl", ["MACHINE.allowBlt"], t.data["tlbx_blterglbl"].checked);
            t.blitterContent += t.addCheckbox("Blitter clear only", "tlbx_blterclr", ["MACHINE.allowBltClr"], t.data["tlbx_blterclr"].checked);
        }
    }

    createWatchesString() {
        let t = this;
        if (!t.data["tlbx_tglWatch"]) t.data["tlbx_tglWatch"] = {checked:false};
        let checked = t.getCheckbox("tlbx_tglWatch");
        let col = checked ? "background-color: rgba(166, 221, 218, 0.8);" : null;
        t.watchContent = t.addCheckbox("Watches", "tlbx_tglWatch", ["TOOLBOX.toggleWatches","TOOLBOX.refresh"], checked, col);
    }

    toggleWatches(_toggle) {
        if (_toggle)
            document.getElementById('tbox_watches').style.display = null; 
        else 
            document.getElementById('tbox_watches').style.display = 'none';
    }

    refresh() {
        let t = this;

        // fetch bitplanes count
        t.bplCount = bitpane_bplCount;
        let amigaonly = document.getElementById("amigaonly");
        switch (FX_INFO.platform) {
            case "OCS" : 
            t.bplCount = bitpane_bplCount;
            amigaonly.style.display = null;
            break;
            case "ST" :
            case "STE" : 
            t.bplCount = 4;
            amigaonly.style.display = "none";
            break;
        }

        t.createBitplaneString();
        t.createPaletteString();
        t.createCPUString();
        switch (FX_INFO.platform) {
            case "OCS" : 
            case "STE" : 
                t.createBlitterString();
            break;
            default:
                t.blitterContent = "";
            break;
        }
        t.createWatchesString();

        document.getElementById("toolbox_contents").innerHTML = t.bplContent + t.palContent + t.cpuContent + t.blitterContent + t.watchContent;
    }

    showBitplane(_s, _id) {
        let t = this;        
        let index = t.data[_id].bplIndex;
        MACHINE.setBitplaneWeight(index,_s);
    }

}
  