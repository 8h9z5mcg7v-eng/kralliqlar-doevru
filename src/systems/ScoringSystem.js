// ============================================================
// ScoringSystem — evaluates every placement:
//   +10 per matching edge
//   cluster multipliers: x1 / x1.5 / x2 / x3 (perfect alignment)
//   region growth bonus, chain reaction bonus for consecutive
//   good placements.
// ============================================================
import { events } from '../core/Events.js';

export class ScoringSystem {
  constructor(grid) {
    this.grid = grid;
    this.total = 0;
    this.chain = 0;         // consecutive placements with ≥2 matches
  }

  /**
   * Score the placement of `cell` (already inserted into grid).
   * @param evalResult output of grid.evaluateEdges (pre-insert)
   * @returns {delta, multiplier, matches, region, chain, perfect}
   */
  scorePlacement(cell, evalResult) {
    const { matches, total } = evalResult;
    let base = matches * 10;

    // region size after insertion
    const region = this.grid.regionSize(cell.q, cell.r);
    if (region >= 3) base += (region - 2) * 5;

    // perfect alignment: every touched edge matches and ≥3 neighbors
    const perfect = total >= 3 && matches === total;

    // multiplier from cluster size / perfection
    let multiplier = 1.0;
    if (perfect) multiplier = 3.0;
    else if (region >= 6) multiplier = 2.0;
    else if (region >= 3) multiplier = 1.5;

    // chain reactions: consecutive placements with ≥2 matches
    if (matches >= 2) this.chain++;
    else this.chain = 0;
    const chainBonus = this.chain >= 2 ? this.chain * 5 : 0;

    const delta = Math.round(base * multiplier) + chainBonus;
    this.total += delta;

    const result = { delta, multiplier, matches, region, chain: this.chain, perfect };
    events.emit('score:changed', { total: this.total, ...result });
    return result;
  }

  /** completed structure bonus (castle, town upgrade…) */
  addBonus(points, label) {
    this.total += points;
    events.emit('score:changed', { total: this.total, delta: points, multiplier: 1, bonusLabel: label });
  }

  reset() {
    this.total = 0;
    this.chain = 0;
    events.emit('score:changed', { total: 0, delta: 0, multiplier: 1 });
  }
}
