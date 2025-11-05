// Реализация логики 2048-подобной игры.
// Методы: reset(), move(direction), canMove(), spawnRandomTile(), applyItemEffect(item)
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface ItemEffect {
  type: string;
  // example: { type: 'spawnBoost', values: [2,2,4,4] }
  [key: string]: any;
}

export class Board {
  rows: number;
  cols: number;
  grid: number[][];
  score: number;
  spawnValues: number[];
  // флаг для того, чтобы гарантировать одно слияние в ход (реализовано в compress+merge)
  constructor(rows = 4, cols = 4, spawnValues = [2, 2, 4]) {
    this.rows = rows;
    this.cols = cols;
    this.spawnValues = spawnValues.slice();
    this.grid = this._emptyGrid();
    this.score = 0;
    this.reset();
  }

  _emptyGrid(): number[][] {
    return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
  }

  cloneGrid() {
    return this.grid.map(row => row.slice());
  }

  reset() {
    this.grid = this._emptyGrid();
    this.score = 0;
    // стандартный старт: 2 плитки
    this.spawnRandomTile();
    this.spawnRandomTile();
  }

  spawnRandomTile(): boolean {
    const empty: [number, number][] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return false;
    const idx = Math.floor(Math.random() * empty.length);
    const [r, c] = empty[idx];
    const val = this.spawnValues[Math.floor(Math.random() * this.spawnValues.length)];
    this.grid[r][c] = val;
    return true;
  }

  canMove(): boolean {
    // есть пустая клетка?
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === 0) return true;
      }
    }
    // есть одинаковые соседние?
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        for (const [dr, dc] of dirs) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
            if (this.grid[r][c] === this.grid[nr][nc]) return true;
          }
        }
      }
    }
    return false;
  }

  // Основной API: move('left'|'right'|'up'|'down') => возвращает { moved: boolean, scoreDelta: number }
  move(direction: Direction) {
    const prev = this.cloneGrid();
    let moved = false;
    let scoreBefore = this.score;

    if (direction === 'left' || direction === 'right') {
      for (let r = 0; r < this.rows; r++) {
        const line = this.grid[r].slice();
        const newLine = this._compressAndMerge(line, direction === 'right');
        this.grid[r] = newLine;
        if (!moved && !this._arraysEqual(line, newLine)) moved = true;
      }
    } else {
      for (let c = 0; c < this.cols; c++) {
        const col = [];
        for (let r = 0; r < this.rows; r++) col.push(this.grid[r][c]);
        const newCol = this._compressAndMerge(col, direction === 'down');
        for (let r = 0; r < this.rows; r++) this.grid[r][c] = newCol[r];
        if (!moved && !this._arraysEqual(col, newCol)) moved = true;
      }
    }

    if (moved) {
      this.spawnRandomTile();
    }

    return { moved, scoreDelta: this.score - scoreBefore };
  }

  _compressAndMerge(arr: number[], reverse = false): number[] {
    const a = reverse ? arr.slice().reverse() : arr.slice();
    const filtered = a.filter(v => v !== 0);
    const result: number[] = [];
    for (let i = 0; i < filtered.length; i++) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const merged = filtered[i] + filtered[i + 1];
        result.push(merged);
        this.score += merged;
        i++; // пропускаем следующий — одно слияние на пару
      } else {
        result.push(filtered[i]);
      }
    }
    while (result.length < a.length) result.push(0);
    return reverse ? result.reverse() : result;
  }

  _arraysEqual(a: number[], b: number[]) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  applyItemEffect(item: ItemEffect | null) {
    if (!item) return;
    if (item.type === 'spawnBoost' && Array.isArray(item.values)) {
      // заменяем распределение спавна — можно вернуть в default через inventory removal
      this.spawnValues = item.values.slice();
      return;
    }
    if (item.type === 'scoreMultiplier' && typeof item.multiplier === 'number') {
      // временно множитель очков — применяются в месте начисления (в движке)
      // для простоты сохраняем в поле
      (this as any).scoreMultiplier = item.multiplier;
      return;
    }
    // можно расширять другие эффекты
  }

  serialize() {
    return {
      grid: this.grid,
      score: this.score,
      spawnValues: this.spawnValues
    };
  }

  load(state: any) {
    if (!state) return;
    this.grid = state.grid || this._emptyGrid();
    this.score = state.score || 0;
    this.spawnValues = state.spawnValues || this.spawnValues;
  }
}