
class StringParser {
  constructor() {
    let t = this;
    t.lines = [];
    t.original = [];
  }
  
  insertTextFile(_path, _index) {
    let t = this;
    const d = new Date();
    let ms = d.getMilliseconds();
    const file = _path + "?v="+ms;
    let rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    PARSER_WAIT_FILE = _path;
    rawFile.onreadystatechange = function () {
      if (rawFile.readyState === 4) {
        if (rawFile.status === 200 || rawFile.status == 0) {
          const lines = rawFile.responseText.split('\n');
          const len = lines.length
          let insertIndex = 0;
          for (let i = 0; i < len; i++) {
            let addLine = false;
            const txt = lines[i];
            const llen = txt.length;
            for (let it = 0; it < llen; it++) {
              const c = txt[it];
              if ((c != '\r') || (c != '\t') || (c != '\n') || (c != ' ')) {
                addLine = true; // just avoid empty lines
                break;
              }
            }
            if (addLine) {
              t.lines.splice(_index + insertIndex, 0, new LineParser(_path, i, lines[i], t.original.length));
              insertIndex++;
              t.original.push(lines[i]);
            }
          }
          PARSER_WAIT_FILE = null;
          return true;
        } else switch (rawFile.status) {
          case 403: main_Alert("can't load file: " + _path + " : error 403 (forbidden)"); STOP_GLOBAL_COMPILATION = true; PARSER_WAIT_FILE = null; return false;
          case 404:
            main_Alert("can't load file: " + _path + " : error 404 (not found)");
            STOP_GLOBAL_COMPILATION = true;
            PARSER_WAIT_FILE = null;
          return false;
          default:
            if (rawFile.status >= 400) main_Alert("can't load " + _path + " : error #" + rawFile.status);
            PARSER_WAIT_FILE = null;
            break;
        }
      }
    }
    try {
      rawFile.send(null);
    } catch (e) {
      main_Alert(e);
      PARSER_WAIT_FILE = null;
    }
    return !STOP_GLOBAL_COMPILATION;
  }
}
