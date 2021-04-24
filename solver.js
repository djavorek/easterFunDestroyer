import Grid from './grid.js';
import Expectimax from './expectimax.js';

const minSearchTime = 150;
const animationTime = 200
let moveToMoveTime = minSearchTime * 1.5 + animationTime;

class Solver {
  LEFT = 37;
  UP = 38;
  RIGHT = 39;
  DOWN = 40;

  DIRECTIONS = [
      this.LEFT, this.UP, this.RIGHT, this.DOWN,
  ];

  lineLookup;
  intval = null;

  init() {
    this.initLookup();
    this.start(); // Start right away
  };

  transformLineLeft(line) {
    let merged = [];
    for (let i = 1; i < 4; ++i) {
      let pos = i;
      while (line[pos] !== 0 && pos > 0) {
        if (line[pos - 1] === 0) {
          line[pos - 1] = line[pos];
          line[pos] = 0;
          --pos;
          continue;
        }
        if (!merged[pos - 1] && line[pos - 1] === line[pos]) {
          ++line[pos - 1];
          line[pos] = 0;
          merged[pos - 1] = true;
        }
        break;
      }
    }
  };

  getLookupIndex(a, b, c, d) { // DUPLICATED
      return 4096 * a + 256 * b + 16 * c + d;
  };

  initLookup() {
    this.lineLookup = [];
    for (let i = 0; i < (1 << 16); ++i) {
      const a = (i >> 12) & 0xF, b = (i >> 8) & 0xF,
          c = (i >> 4) & 0xF, d = i & 0xF;
      const line = [a, b, c, d];
      this.transformLineLeft(line);
      if (line[0] !== a || line[1] !== b || line[2] !== c || line[3] !== d) {
        const index = this.getLookupIndex(a, b, c, d);
        this.lineLookup[index] = line;
      }
    }
  };

  fireKeyboardEvent(type, code) {
    const evt = document.createEvent("KeyboardEvent");
    if (evt.initKeyEvent) {
      evt.initKeyEvent(type, true, true, document.defaultView,
        false, false, false, false, code, code);
    } else if (evt.initKeyboardEvent) {
      evt.initKeyboardEvent(type, true, true, document.defaultView,
        code, code, false, false, false, false, false);
    }
    Object.defineProperty(evt, "keyCode", {
      get: function() {
          return code;
      },
    });
    Object.defineProperty(evt, "which", {
      get: function() {
          return code;
      },
    });
    document.documentElement.dispatchEvent(evt);
  }

  move(dir) {
    this.fireKeyboardEvent("keydown", dir);
    this.fireKeyboardEvent("keyup", dir);
  };

  next() {
    const startTime = new Date().getTime();

    // START
    const ai = new Expectimax(new Grid(), this.lineLookup); // This will read the current board;
    const result = ai.getMove(minSearchTime);

    this.move(result);
    // MOVED

    const lastCycleTime = new Date().getTime() - startTime;

    if (lastCycleTime > moveToMoveTime + 100) {
      moveToMoveTime += 50;
      changeMoveToMoveTime()
    } else if (lastCycleTime < moveToMoveTime - 100) {
      moveToMoveTime -= 50;
      changeMoveToMoveTime()
    }
  };

  changeMoveToMoveTime() {
    window.clearInterval(this.intval);
    this.intval = window.setInterval(this.next.bind(this), moveToMoveTime);
  }

  start() {
    if (!this.intval) {
      this.intval = window.setInterval(this.next.bind(this), moveToMoveTime);
    }
  };

  stop() {
    window.clearInterval(this.intval);
    this.intval = null;
  };
}

export default Solver;