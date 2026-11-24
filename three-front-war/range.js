// range.js
// Isolated Firing Range Environment — Map Layout, Distance Props, Moving Targets & Range Floor Paint

window.WW2 = window.WW2 || {};
WW2.LEVELS = WW2.LEVELS || {};

WW2.RangeEnvironment = class RangeEnvironment extends WW2.BaseLevel {
  constructor() {
    super({
      id: 'range',
      name: 'FIRING RANGE',
      theater: 'TRAINING GROUNDS',
      width: 36,
      depth: 62,
      spawn: { x: 14.0, z: 5.0, yaw: Math.PI / 2 },
      allowWeaponCycle: true,
      allowTargetReset: true,
      bannerHint: '<b>1/2/3</b> Slots &nbsp;|&nbsp; <b>V</b> Butt (Hold 0.5s Knife) &nbsp;|&nbsp; <b>[ / ]</b> Cycle Gun &nbsp;|&nbsp; <b>G/F</b> Equip &nbsp;|&nbsp; <b>T</b> Reset Range &nbsp;|&nbsp; <b>ESC</b> Pause',
      wallHeights: {
        1: 3.2,   // Concrete perimeter wall
        2: 2.3,   // Timber firing booth divider
        3: 1.15   // Vault-able sandbag barrier
      }
    });

    this.grid = this.buildRangeMap();
    this.props = this.buildEnvironmentProps();
    this.resetTargets();
  }

  buildRangeMap() {
    const map = [];
    for (let z = 0; z < this.depth; z++) {
      const row = new Array(this.width).fill(0);
      for (let x = 0; x < this.width; x++) {
        if (x === 0 || x === this.width - 1 || z === 0 || z === this.depth - 1) {
          row[x] = 1;
        }
      }
      map.push(row);
    }

    // Firing booth timber dividers
    for (let z = 7; z <= 9; z++) {
      map[z][8] = 2;
      map[z][16] = 2;
      map[z][24] = 2;
    }

    // Vault-able sandbag cover barriers
    map[12][10] = 3;
    map[12][11] = 3;

    map[18][6] = 3;
    map[18][7] = 3;
    map[18][13] = 3;
    map[18][14] = 3;
    map[18][28] = 3;
    map[18][29] = 3;

    // Mid-range concrete pillars
    map[32][12] = 1;
    map[32][23] = 1;

    // Long-range cover
    map[46][17] = 3;
    map[46][18] = 3;

    return map;
  }

  buildEnvironmentProps() {
    return [
      { type: 'SIGN', x: 3.0, z: 15.0, text: '10m', height: 1.5, width: 0.9, solid: true, radius: 0.32 },
      { type: 'SIGN', x: 3.0, z: 25.0, text: '20m', height: 1.5, width: 0.9, solid: true, radius: 0.32 },
      { type: 'SIGN', x: 3.0, z: 40.0, text: '35m', height: 1.5, width: 0.9, solid: true, radius: 0.32 },
      { type: 'SIGN', x: 3.0, z: 55.0, text: '50m', height: 1.5, width: 0.9, solid: true, radius: 0.32 },

      { type: 'CRATE', x: 10.5, z: 8.5, height: 0.95, width: 1.05, solid: true, radius: 0.55 },
      { type: 'CRATE', x: 11.6, z: 8.2, height: 0.65, width: 0.85, solid: true, radius: 0.45 },
      { type: 'CRATE', x: 21.5, z: 8.5, height: 0.95, width: 1.05, solid: true, radius: 0.55 },
      { type: 'CRATE', x: 14.0, z: 23.0, height: 1.05, width: 1.10, solid: true, radius: 0.55 },
      { type: 'CRATE', x: 22.0, z: 36.0, height: 1.05, width: 1.10, solid: true, radius: 0.55 },

      { type: 'TREE', x: 2.2, z: 12.0, height: 5.2, width: 2.2, solid: true, radius: 0.45 },
      { type: 'TREE', x: 2.5, z: 22.0, height: 5.8, width: 2.4, solid: true, radius: 0.45 },
      { type: 'TREE', x: 2.0, z: 33.0, height: 5.0, width: 2.1, solid: true, radius: 0.45 },
      { type: 'TREE', x: 2.4, z: 45.0, height: 6.0, width: 2.5, solid: true, radius: 0.45 },
      { type: 'TREE', x: 33.5, z: 14.0, height: 5.4, width: 2.3, solid: true, radius: 0.45 },
      { type: 'TREE', x: 33.2, z: 26.0, height: 5.9, width: 2.4, solid: true, radius: 0.45 },
      { type: 'TREE', x: 33.6, z: 38.0, height: 5.1, width: 2.1, solid: true, radius: 0.45 },
      { type: 'TREE', x: 33.0, z: 50.0, height: 5.7, width: 2.4, solid: true, radius: 0.45 },
      { type: 'TREE', x: 9.0, z: 59.5, height: 6.2, width: 2.6, solid: true, radius: 0.45 },
      { type: 'TREE', x: 18.0, z: 59.8, height: 5.8, width: 2.4, solid: true, radius: 0.45 },
      { type: 'TREE', x: 27.0, z: 59.4, height: 6.1, width: 2.5, solid: true, radius: 0.45 }
    ];
  }

  reset() {
    this.resetTargets();
  }

  resetTargets() {
    this.targets = [
      { id: 1, x: 11.0, z: 15.0, baseX: 11.0, moveAmp: 0, speed: 0, phase: 0, hp: 100, maxHp: 100, downTimer: 0, stunTimer: 0, stunType: null, label: '10m' },
      { id: 2, x: 19.0, z: 15.0, baseX: 19.0, moveAmp: 2.4, speed: 1.5, phase: 0, hp: 100, maxHp: 100, downTimer: 0, stunTimer: 0, stunType: null, label: '10m MOV' },
      { id: 3, x: 13.0, z: 25.0, baseX: 13.0, moveAmp: 3.0, speed: 1.8, phase: 0, hp: 120, maxHp: 120, downTimer: 0, stunTimer: 0, stunType: null, label: '20m MOV' },
      { id: 4, x: 25.0, z: 25.0, baseX: 25.0, moveAmp: 0, speed: 0, phase: 0, hp: 120, maxHp: 120, downTimer: 0, stunTimer: 0, stunType: null, label: '20m' },
      { id: 5, x: 16.0, z: 40.0, baseX: 16.0, moveAmp: 3.5, speed: 1.4, phase: 0, hp: 140, maxHp: 140, downTimer: 0, stunTimer: 0, stunType: null, label: '35m MOV' },
      { id: 6, x: 26.0, z: 40.0, baseX: 26.0, moveAmp: 0, speed: 0, phase: 0, hp: 140, maxHp: 140, downTimer: 0, stunTimer: 0, stunType: null, label: '35m' },
      { id: 7, x: 12.0, z: 55.0, baseX: 12.0, moveAmp: 4.0, speed: 1.2, phase: 0, hp: 150, maxHp: 150, downTimer: 0, stunTimer: 0, stunType: null, label: '50m SNIPER' },
      { id: 8, x: 24.0, z: 55.0, baseX: 24.0, moveAmp: 4.0, speed: 1.6, phase: 0, hp: 150, maxHp: 150, downTimer: 0, stunTimer: 0, stunType: null, label: '50m SNIPER' }
    ];
    this.clearDynamicEntities();
  }

  // Range-specific floor texture (concrete shooting bays, hazard line, dirt lanes & yard lines)
  buildFloorTexture(scale) {
    const tw = this.width * scale;
    const th = this.depth * scale;
    const tex = new Uint32Array(tw * th);
    const yardLines = [15.0, 25.0, 40.0, 55.0];

    for (let pz = 0; pz < th; pz++) {
      const wz = (pz + 0.5) / scale;
      const gz = Math.min(this.depth - 1, Math.floor(wz));

      for (let px = 0; px < tw; px++) {
        const wx = (px + 0.5) / scale;
        const gx = Math.min(this.width - 1, Math.floor(wx));

        const grain = this.hash2D(px, pz);
        const patch = this.smoothNoise(wx * 0.75, wz * 0.75);
        const finePatch = this.smoothNoise(wx * 3.2, wz * 3.2);

        let r = 82;
        let g = 74;
        let b = 58;

        if (wz < 10.2 && wx >= 3.5 && wx <= 32.5) {
          // Concrete firing booths
          const baseC = 116 + (patch - 0.5) * 14 + (grain - 0.5) * 10;
          r = baseC + 2;
          g = baseC + 3;
          b = baseC - 1;

          const jx = Math.abs((wx % 2.0) - 1.0);
          const jz = Math.abs((wz % 2.0) - 1.0);
          if (jx > 0.965 || jz > 0.965) {
            r *= 0.72;
            g *= 0.72;
            b *= 0.72;
          }

          // Brass shell casing glint near firing line
          if (wz > 8.6 && grain > 0.986) {
            r = 196;
            g = 165;
            b = 72;
          }
        } else if (wz >= 10.2 && wz <= 10.55 && wx >= 3.5 && wx <= 32.5) {
          // Red & white painted range safety line
          const stripe = Math.floor(wx * 2.0) % 2 === 0;
          const wear = 0.86 + 0.14 * finePatch;
          if (stripe) {
            r = 178 * wear;
            g = 48 * wear;
            b = 42 * wear;
          } else {
            r = 205 * wear;
            g = 202 * wear;
            b = 188 * wear;
          }
        } else if (wx < 4.2 || wx > 31.8 || wz > 57.5) {
          // Perimeter grass & scrub
          const turf = 0.78 + 0.34 * patch + (grain - 0.5) * 0.16;
          r = 54 * turf;
          g = 76 * turf;
          b = 42 * turf;

          if (finePatch < 0.32) {
            r = 76 * turf;
            g = 62 * turf;
            b = 44 * turf;
          }
        } else {
          // Downrange packed dirt & gravel
          const soilMix = patch * 0.65 + finePatch * 0.35;
          r = 88 + soilMix * 26 + (grain - 0.5) * 14;
          g = 78 + soilMix * 22 + (grain - 0.5) * 12;
          b = 58 + soilMix * 16 + (grain - 0.5) * 10;

          const laneDist = Math.min(
            Math.abs(wx - 11.5),
            Math.abs(wx - 19.5),
            Math.abs(wx - 27.5)
          );
          if (laneDist < 1.35) {
            const trackFactor = (1 - laneDist / 1.35) * 0.12;
            r *= (1 - trackFactor);
            g *= (1 - trackFactor);
            b *= (1 - trackFactor);
          }

          const edgeDist = Math.min(wx - 4.2, 31.8 - wx);
          if (edgeDist < 1.6 && finePatch > 0.58) {
            r = 62 + grain * 14;
            g = 82 + grain * 16;
            b = 46 + grain * 10;
          }

          if (grain > 0.945) {
            r += 22;
            g += 21;
            b += 19;
          } else if (grain < 0.045) {
            r -= 16;
            g -= 15;
            b -= 13;
          }

          // Painted 10m / 20m / 35m / 50m yard lines
          for (let yIdx = 0; yIdx < yardLines.length; yIdx++) {
            const dLine = Math.abs(wz - yardLines[yIdx]);
            if (dLine < 0.085) {
              const paintFade = (1 - dLine / 0.085) * (0.55 + 0.35 * finePatch);
              r = r * (1 - paintFade) + 215 * paintFade;
              g = g * (1 - paintFade) + 210 * paintFade;
              b = b * (1 - paintFade) + 192 * paintFade;
            }
          }
        }

        const shadow = this.computeGroundShadow(wx, wz, gx, gz);
        const cr = Math.max(0, Math.min(255, (r * shadow) | 0));
        const cg = Math.max(0, Math.min(255, (g * shadow) | 0));
        const cb = Math.max(0, Math.min(255, (b * shadow) | 0));
        tex[pz * tw + px] = (0xff000000 | (cb << 16) | (cg << 8) | cr) >>> 0;
      }
    }

    return tex;
  }
};

WW2.LEVELS.range = WW2.RangeEnvironment;