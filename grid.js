import Expectimax from './expectimax.js';

class Grid {
    tiles = [];
  
    vectors = {
      0: { x: 0,  y: -1 }, // Up
      1: { x: 1,  y: 0 },  // Right
      2: { x: 0,  y: 1 },  // Down
      3: { x: -1, y: 0 }   // Left
    }
  
    constructor(initialTiles) {
      if (initialTiles) {
        this.tiles = initialTiles;
      } else {
        this.readBoard();
      }
    }
  
    availableCells() {
      return this.tiles.filter(val => val === 0).length;
    }
  
    isTileOccupied(tile) {
      return !!tile;
    };
  
    isTileAvailable(tile) {
      return !tile;
    };
  
    readBoard() {
      const readTile = function(x, y) {
          let cls = ".tile-position-" + (x + 1) + "-" + (y + 1);
          let tile = document.querySelector(cls + ".tile-merged");
          let table = { 0: 0, 2: 1, 4: 2, 8: 3, 16: 4, 32: 5, 64: 6, 128: 7,
            256: 8, 512: 9, 1024: 10, 2048: 11, 4096: 12, 8192: 13, 16384: 14,
            32768: 15 };
  
          if (!tile && !(tile = document.querySelector(cls))) {
              return 0;
          }
  
          return table[parseInt(tile.querySelector(".tile-inner").innerHTML, 10)];
      }
  
      for (var i = 0; i < 16; ++i) {
          this.tiles[i] = readTile(i % 4, Math.floor(i / 4));
      }
  
      return this.tiles;
    };
  
    findFarthestPosition(tile, vector) {
        let previous;
  
        // Progress towards the vector direction until an obstacle is found
        do {
          previous = tile;
          tile = previous + vector.y * 4 + vector.x;
        } while (0 <= tile && tile < 16 && this.isTileAvailable(this.tiles[tile]));
  
        return {
          farthest: previous,
          next: tile // Used to check if a merge is required
        };
      };
  
    // measures how smooth the grid is (as if the values of the pieces
    // were interpreted as elevations). Sums of the pairwise difference
    // between neighboring tiles (in log space, so it represents the
    // number of merges that need to happen before they can merge).
    // Note that the pieces can be distant
    smoothness() {
      let smoothness = 0;
      for (let x = 0; x < 16; x++) {
        if (this.isTileOccupied(this.tiles[x])) {
          let value = Math.log(this.tiles[x]) / Math.log(2);
  
          for (let direction = 1; direction <= 2; direction++) {
            let vector = this.vectors[direction];
            let target = this.findFarthestPosition(x, vector).next;
  
            if (this.isTileOccupied(this.tiles[target])) {
              const targetValue = Math.log(this.tiles[target]) / Math.log(2);
              smoothness -= Math.abs(value - targetValue);
            }
          }
        }
      }
      return smoothness;
    }
  
    monotonicity() {
      const board = this.tiles.slice();
  
      var realValue = function(nthTile) {
        return Math.pow(2, nthTile);
      }
  
      // scores for all four directions
      let totals = [0, 0, 0, 0]; // From: UP, DOWN, LEFT, RIGHT
  
      // UP and DOWN
      for (let x = 0; x < 4; x++) { 
        let current = 0;
        let next = current+1;
        while (next < 4) {
          while (next < 4 && !this.isTileOccupied(board[x + next * 4])) {
            next++;
          }
          if (next>=4) { 
            next--;
          }
          const currentValue = this.isTileOccupied(board[x + current * 4]) ?
            Math.log(realValue(board[x + current * 4])) / Math.log(2) : 0;
          const nextValue = this.isTileOccupied(board[x + next * 4]) ?
            Math.log(realValue(board[x + next * 4])) / Math.log(2) : 0;
          if (currentValue > nextValue) {
            totals[0] += nextValue - currentValue;
          } else if (nextValue > currentValue) {
            totals[1] += currentValue - nextValue;
          }
          current = next;
          next++;
        }
      }
  
      // left/right direction
      for (let y = 0; y < 4; y++) {
        let current = 0;
        let next = current+1;
        while ( next<4 ) {
          while ( next<4 && !this.isTileOccupied(board[next + y * 4])) {
            next++;
          }
          if (next>=4) { next--; }
          const currentValue = this.isTileOccupied(board[current + y * 4]) ?
            Math.log(realValue(board[current + y * 4])) / Math.log(2) : 0;
          const nextValue = this.isTileOccupied(board[next + y * 4]) ?
            Math.log(realValue(board[next + y * 4])) / Math.log(2) : 0;
          if (currentValue > nextValue) {
            totals[2] += nextValue - currentValue;
          } else if (nextValue > currentValue) {
            totals[3] += currentValue - nextValue;
          }
          current = next;
          next++;
        }
      }
  
      return Math.max(totals[0], totals[1]) + Math.max(totals[2], totals[3]);
    }
  
    duplication() {
      let penalty = 0;
      const max = Math.max.apply(null, this.tiles);
  
      if (max < 5) { // Skip early game
        return 0;
      }
  
      for (let i = 0; i < 3; i++) {
        const searchValue = max - i;
        let count = 0;
  
        for (var j = 0; j < 16; j++) {
          if (this.tiles[j] === searchValue) {
            count++;
          } 
        }
  
        if (count > 1) {
          penalty += count * (-0.5 / i);
        }
      }
  
      return penalty; 
    }
  
    maxValue() {
      const max = Math.pow(2, Math.max.apply(null, this.tiles)); // Changing back to value
      return Math.log(max) / Math.log(2);
    }
  
    isWin() {
      for (var i = 0; i < 16; i++) {
        if (this.isTileOccupied(this.tiles[i])) {
          if (this.tiles[i] == 11) { // 11th tile is 2048
            return true;
          }
        }
      }
      return false;
    }
}

export default Grid;