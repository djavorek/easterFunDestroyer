'use strict';

class Solver {
    LEFT = 37;
    UP = 38;
    RIGHT = 39;
    DOWN = 40;

    DIRECTIONS = [
        this.LEFT, this.UP, this.RIGHT, this.DOWN,
    ];

    intval = null;

    init() {
        this.initLookup();
        this.start(); // Start right away
    };

    fireKeyboardEvent(type, code) {
        var evt = document.createEvent("KeyboardEvent");
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

    readTile(x, y) {
        var cls = ".tile-position-" + (x + 1) + "-" + (y + 1);
        var tile = document.querySelector(cls + ".tile-merged");
        if (!tile && !(tile = document.querySelector(cls))) {
            return 0;
        }
        var table = { 0: 0, 2: 1, 4: 2, 8: 3, 16: 4, 32: 5, 64: 6, 128: 7,
            256: 8, 512: 9, 1024: 10, 2048: 11, 4096: 12, 8192: 13, 16384: 14,
            32768: 15 };
        return table[parseInt(tile.querySelector(".tile-inner").innerHTML, 10)];
    };

    readBoard() {
        var tiles = [];
        for (var i = 0; i < 16; ++i) {
            tiles[i] = this.readTile(i % 4, Math.floor(i / 4));
        }
        return tiles;
    };

    transformLineLeft(line) {
        var merged = [];
        for (var i = 1; i < 4; ++i) {
            var pos = i;
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

    getLookupIndex(a, b, c, d) {
        return 4096 * a + 256 * b + 16 * c + d;
    };

    initLookup() {
        this.lineLookup = [];
        for (var i = 0; i < (1 << 16); ++i) {
            var a = (i >> 12) & 0xF, b = (i >> 8) & 0xF,
                c = (i >> 4) & 0xF, d = i & 0xF;
            var line = [a, b, c, d];
            this.transformLineLeft(line);
            if (line[0] !== a || line[1] !== b || line[2] !== c || line[3] !== d) {
                var index = this.getLookupIndex(a, b, c, d);
                this.lineLookup[index] = line;
            }
        }
    };

    getTransformOrder(dir) {
        switch (dir) {
            case this.LEFT:
                return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
            case this.RIGHT:
                return [3, 2, 1, 0, 7, 6, 5, 4, 11, 10, 9, 8, 15, 14, 13, 12];
            case this.UP:
                return [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15];
            case this.DOWN:
                return [12, 8, 4, 0, 13, 9, 5, 1, 14, 10, 6, 2, 15, 11, 7, 3];
        }
    };

    transform(board, dir) {
        var changed = false, src, dst;
        var order = this.getTransformOrder(dir);
        for (var i = 0; i < 16; i += 4) {
            src = this.getLookupIndex(board[order[i]], board[order[i + 1]],
                board[order[i + 2]], board[order[i + 3]]);
            dst = this.lineLookup[src];
            if (dst) {
                changed = true;
                board[order[i]] = dst[0];
                board[order[i + 1]] = dst[1];
                board[order[i + 2]] = dst[2];
                board[order[i + 3]] = dst[3];
            }
        }
        return changed;
    };

    calculateScore(board) {
        var distances = [0, 1, 1, 0, 1, 2, 2, 1, 1, 2, 2, 1, 0, 1, 1, 0];
        var score = 0;
        var max = Math.max.apply(null, board);
        for (var i = 0; i < board.length; ++i) {
            var scale = board[i] / max;
            score = score + (board[i] === 0 ? 1 : 0) - scale * distances[i];
        }
        // monotonicity
        function isMonotone(a, b, c, d) {
            return (a <= b && b <= c && c <= d) || (a >= b && b >= c && c >= d);
        }
        var mono = 0;
        for (var o = 0; o < 4; ++o) {
            if (isMonotone(board[o], board[o + 4], board[o + 8], board[o + 12])) {
                ++mono;
            }
            var y = o * 4;
            if (isMonotone(board[y], board[y + 1], board[y + 2], board[y + 3])) {
                ++mono;
            }
        }
        score += mono / 4;
        return score;
    };

    pickDirection(board, levels) {
        var result = { direction: this.LEFT, score: -Infinity };
        this.DIRECTIONS.forEach((dir) => {
            var b = board.slice();
            var changed = this.transform(b, dir);
            if (!changed) {
                return;
            }
            var score = this.calculateScore(b);
            if (levels > 0) {
                score += this.pickDirection(b, levels - 1).score * 0.8;
            }
            if (score > result.score) {
                result.direction = dir;
                result.score = score;
            }
        });
        return result;
    };

    next() {
        var result = this.pickDirection(this.readBoard(), 12); // Higher depth: better results, slower
        this.move(result.direction);
    };

    start() {
        if (!this.intval) {
            this.intval = window.setInterval(this.next.bind(this), 300);
        }
    };

    stop() {
        window.clearInterval(intval);
        this.intval = null;
    };

}

let solver = new Solver();
solver.init();
