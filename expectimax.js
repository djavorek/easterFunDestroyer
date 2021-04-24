import Grid from './grid.js';

class Expectimax {
  constructor(grid, lineLookup) {
    this.grid = grid;
    this.lineLookup = lineLookup;
  }

  LEFT = 37;
  UP = 38;
  RIGHT = 39;
  DOWN = 40;

  DIRECTIONS = [
      this.LEFT, this.UP, this.RIGHT, this.DOWN,
  ];

  getLookupIndex(a, b, c, d) { // DUPLICATED
    return 4096 * a + 256 * b + 16 * c + d;
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
    const order = this.getTransformOrder(dir);
    let changed = false, src, dst;
    for (let i = 0; i < 16; i += 4) {
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


  evaluateGrid() {
    const smoothnessWeight = 0.2, // 0.1 - 0.3
        monotonicityWeight = 1.2 , // 0.6 - 1.5
        emptyCellsWeight = 2.8, // 2.5 - 3.5
        duplicationWeight = 0.2, // 0.5 - 1.0
        maxTileWeight = 1.1;// 0.5 - 1.5

    let score = this.grid.monotonicity() * monotonicityWeight
    + Math.log(this.grid.availableCells()) * emptyCellsWeight
    + this.grid.duplication() * duplicationWeight
    + this.grid.maxValue() * maxTileWeight
    + this.grid.smoothness() * smoothnessWeight;

    return score;
  };

  getMove(minSearchTime) {
    return this.iterativeDeep(minSearchTime);
  }

  // Iterative Deepening: Calls the expectimax search function with increasing depths.
  // The time of execution is limited to 100ms.
  iterativeDeep(minSearchTime) {
    let bestMove;
    
    const startTime = new Date().getTime();
    let iterationEndTime = 0;
    let depth = 1,
        alpha = -Infinity,
        beta = 10000;
    
    while(iterationEndTime < minSearchTime){
        let newResult = this.getNextMove(alpha, beta, depth);
        if (newResult.move == -1) {
          break;
        }
        else {
            bestMove = newResult.move;
        }
        depth++;
        iterationEndTime = new Date().getTime() - startTime;
    }
    
    return bestMove;
  }

  // Expectimax Function with alpha beta pruning for better efficiency.
  getNextMove = function(alpha, beta, depth) {
    let result;
    let maxScore;
    let nextMove;
    
    //Maximizer - AI Player that determines the direction(move) to be chosen next.
    maxScore = alpha;

    this.DIRECTIONS.forEach((dir) => {
      let board = this.grid.tiles.slice();
      let changed = this.transform(board, dir); // Try a move
      if (!changed) {
        return;
      }

      const newGrid = new Grid(board);

      if (newGrid.isWin()) {
        return { move: dir, score: 10000 };
      }

      const newAI = new Expectimax(newGrid, this.lineLookup);

      if (depth == 0){
        result = { move: dir, score: newAI.evaluateGrid() };
      }
      else {
        result = newAI.getNextMove(maxScore, beta, depth - 1);
        result.score *= 0.8;
      }  
      
      if (result.score > maxScore) {
        console.log('Found better with score: ' + result.score);
        maxScore = result.score;
        nextMove = dir;
      }
      if (maxScore > beta) {      // Cutoff
        return { move: nextMove, score: beta };
      }
    });

    // Return the best selected move.
    return {move: nextMove, score: maxScore};
  }
}

export default Expectimax;