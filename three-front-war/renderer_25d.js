// renderer_25d.js
// True 1:1 Metric 3D-Pitched Engine (+/- 90 deg) + Reusable WW2.BaseLevel for Range & Campaign Missions

window.WW2 = window.WW2 || {};

WW2.BaseLevel = class BaseLevel {
  constructor(config = {}) {
    this.id = config.id || 'base_level';
    this.name = config.name || 'MISSION';
    this.theater = config.theater || 'EUROPEAN THEATER';
    this.width = config.width || 36;
    this.depth = config.depth || 36;
    this.spawn = config.spawn || { x: 4.0, z: 4.0, yaw: 0 };

    this.allowWeaponCycle = Boolean(config.allowWeaponCycle);
    this.allowTargetReset = Boolean(config.allowTargetReset);
    this.bannerHint = config.bannerHint || '<b>1/2/3</b> Slots &nbsp;|&nbsp; <b>V</b> Butt (Hold 0.5s Knife) &nbsp;|&nbsp; <b>G/F</b> Equip &nbsp;|&nbsp; <b>ESC</b> Pause';

    this.wallHeights = config.wallHeights || {
      1: 3.2,
      2: 2.3,
      3: 1.15
    };

    this.wallColors = config.wallColors || {
      1: [128, 133, 129],
      2: [130, 92, 54],
      3: [164, 146, 104]
    };

    this.wallTopColors = config.wallTopColors || {
      1: [148, 152, 148],
      2: [148, 108, 68],
      3: [184, 166, 122]
    };

    this.skyColors = config.skyColors || ['#2c3a47', '#4b5f6e', '#7c8e99'];
    this.fogColor = config.fogColor || [116, 130, 138];
    this.groundPalette = config.groundPalette || {
      base: [86, 78, 58],
      alt: [64, 82, 48]
    };

    this.grid = [];
    this.props = [];
    this.targets = [];
    this.tracers = [];
    this.damagePopups = [];
    this.projectiles = [];
    this.smokeClouds = [];
    this.explosions = [];
  }

  clearDynamicEntities() {
    this.tracers = [];
    this.damagePopups = [];
    this.projectiles = [];
    this.smokeClouds = [];
    this.explosions = [];
  }

  reset() {
    this.clearDynamicEntities();
  }

  hash2D(ix, iz) {
    let n = Math.imul(ix, 374761393) + Math.imul(iz, 668265263);
    n = (n ^ (n >> 13)) >>> 0;
    n = Math.imul(n, 1274126177) >>> 0;
    return ((n ^ (n >> 16)) >>> 0) / 4294967295;
  }

  smoothNoise(x, z) {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const fx = x - ix;
    const fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx);
    const uz = fz * fz * (3 - 2 * fz);
    const a = this.hash2D(ix, iz);
    const b = this.hash2D(ix + 1, iz);
    const c = this.hash2D(ix, iz + 1);
    const d = this.hash2D(ix + 1, iz + 1);
    return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
  }

  computeGroundShadow(wx, wz, gx, gz) {
    let shadow = 1.0;
    const cellHere = (this.grid[gz] && this.grid[gz][gx]) || 0;
    if (cellHere > 0) {
      shadow *= 0.45;
    } else {
      const fracX = wx - gx;
      const fracZ = wz - gz;
      if (fracX < 0.35 && gx > 0 && this.grid[gz][gx - 1] > 0) shadow *= (0.68 + 0.32 * (fracX / 0.35));
      if (fracX > 0.65 && gx + 1 < this.width && this.grid[gz][gx + 1] > 0) shadow *= (0.68 + 0.32 * ((1 - fracX) / 0.35));
      if (fracZ < 0.35 && gz > 0 && this.grid[gz - 1][gx] > 0) shadow *= (0.68 + 0.32 * (fracZ / 0.35));
      if (fracZ > 0.65 && gz + 1 < this.depth && this.grid[gz + 1][gx] > 0) shadow *= (0.68 + 0.32 * ((1 - fracZ) / 0.35));
    }

    for (let pIdx = 0; pIdx < this.props.length; pIdx++) {
      const p = this.props[pIdx];
      if (p.type === 'CRATE') {
        const hw = p.width * 0.5 + 0.16;
        const dx = Math.abs(wx - p.x);
        const dz = Math.abs(wz - p.z);
        if (dx < hw && dz < hw) {
          const edge = Math.max(dx / hw, dz / hw);
          shadow *= (0.48 + 0.52 * edge * edge);
        }
      } else if (p.type === 'TREE') {
        const d = Math.hypot(wx - p.x, wz - p.z);
        const canopyR = p.width * 0.52;
        if (d < canopyR) {
          shadow *= (0.46 + 0.54 * (d / canopyR));
        }
      } else if (p.type === 'SIGN') {
        const d = Math.hypot(wx - p.x, wz - p.z);
        if (d < 0.42) {
          shadow *= (0.60 + 0.40 * (d / 0.42));
        }
      }
    }

    return shadow;
  }

  buildFloorTexture(scale) {
    const tw = this.width * scale;
    const th = this.depth * scale;
    const tex = new Uint32Array(tw * th);
    const base = this.groundPalette.base;
    const alt = this.groundPalette.alt;

    for (let pz = 0; pz < th; pz++) {
      const wz = (pz + 0.5) / scale;
      const gz = Math.min(this.depth - 1, Math.floor(wz));

      for (let px = 0; px < tw; px++) {
        const wx = (px + 0.5) / scale;
        const gx = Math.min(this.width - 1, Math.floor(wx));

        const grain = this.hash2D(px, pz);
        const patch = this.smoothNoise(wx * 0.75, wz * 0.75);
        const finePatch = this.smoothNoise(wx * 3.0, wz * 3.0);
        const blend = patch * 0.65 + finePatch * 0.35;

        const r = base[0] + (alt[0] - base[0]) * blend + (grain - 0.5) * 14;
        const g = base[1] + (alt[1] - base[1]) * blend + (grain - 0.5) * 12;
        const b = base[2] + (alt[2] - base[2]) * blend + (grain - 0.5) * 10;

        const shadow = this.computeGroundShadow(wx, wz, gx, gz);
        const cr = Math.max(0, Math.min(255, (r * shadow) | 0));
        const cg = Math.max(0, Math.min(255, (g * shadow) | 0));
        const cb = Math.max(0, Math.min(255, (b * shadow) | 0));
        tex[pz * tw + px] = (0xff000000 | (cb << 16) | (cg << 8) | cr) >>> 0;
      }
    }

    return tex;
  }

  getSupportHeight(x, z, currentAltitude = 0) {
    let highest = 0;

    for (const p of this.props) {
      if (p.type === 'CRATE' && p.solid) {
        const dist = Math.hypot(x - p.x, z - p.z);
        if (dist < p.radius + 0.25 && currentAltitude >= p.height - 0.16) {
          highest = Math.max(highest, p.height);
        }
      }
    }

    const r = 0.24;
    const minX = Math.floor(x - r);
    const maxX = Math.floor(x + r);
    const minZ = Math.floor(z - r);
    const maxZ = Math.floor(z + r);
    for (let gz = minZ; gz <= maxZ; gz++) {
      for (let gx = minX; gx <= maxX; gx++) {
        if (gz >= 0 && gz < this.depth && gx >= 0 && gx < this.width) {
          if (this.grid[gz][gx] === 3) {
            const wallH = this.wallHeights[3] || 1.15;
            if (currentAltitude >= wallH - 0.16) {
              highest = Math.max(highest, wallH);
            }
          }
        }
      }
    }

    return highest;
  }

  getMantleTarget(x, z, yaw, altitude, isSprinting = false) {
    const M = WW2.MOVEMENT;
    const dirX = Math.cos(yaw);
    const dirZ = Math.sin(yaw);

    for (let d = 0.35; d <= M.MANTLE_REACH; d += 0.15) {
      const px = x + dirX * d;
      const pz = z + dirZ * d;
      const gx = Math.floor(px);
      const gz = Math.floor(pz);

      if (gz >= 0 && gz < this.depth && gx >= 0 && gx < this.width && this.grid[gz][gx] === 3) {
        const obsH = this.wallHeights[3];
        if (obsH > altitude + 0.15 && (obsH - altitude) <= M.MANTLE_MAX_HEIGHT) {
          if (isSprinting) {
            const landX = x + dirX * (d + 1.40);
            const landZ = z + dirZ * (d + 1.40);
            if (!this.isBlocked(landX, landZ, M.PLAYER_RADIUS, 0)) {
              return { mode: 'VAULT', landX, landZ, landAlt: 0 };
            }
          } else {
            const topX = gx + 0.5;
            const topZ = gz + 0.5;
            if (!this.isBlocked(topX, topZ, M.PLAYER_RADIUS, obsH)) {
              return { mode: 'MANTLE', landX: topX, landZ: topZ, landAlt: obsH };
            }
          }
        }
      }

      for (const p of this.props) {
        if (p.type === 'CRATE' && p.solid) {
          const dist = Math.hypot(px - p.x, pz - p.z);
          if (dist <= p.radius + 0.25 && p.height > altitude + 0.15 && (p.height - altitude) <= M.MANTLE_MAX_HEIGHT) {
            return { mode: 'MANTLE', landX: p.x, landZ: p.z, landAlt: p.height };
          }
        }
      }
    }

    return null;
  }

  isBlocked(x, z, radius = 0.35, altitude = 0) {
    const minX = Math.floor(x - radius);
    const maxX = Math.floor(x + radius);
    const minZ = Math.floor(z - radius);
    const maxZ = Math.floor(z + radius);

    for (let gz = minZ; gz <= maxZ; gz++) {
      for (let gx = minX; gx <= maxX; gx++) {
        if (gz < 0 || gz >= this.depth || gx < 0 || gx >= this.width) return true;
        const cell = this.grid[gz][gx];
        if (cell !== 0) {
          const wallH = this.wallHeights[cell] || 3.0;
          if (altitude < wallH - 0.12) return true;
        }
      }
    }

    for (const p of this.props) {
      if (!p.solid) continue;
      if (altitude >= p.height - 0.14) continue;
      const dist = Math.hypot(x - p.x, z - p.z);
      if (dist < radius + p.radius) return true;
    }

    return false;
  }

  // True 3D Melee Ray & Cone Hit Detection (+/- 90 deg)
  performMeleeAttack(meleeData) {
    const pitchAngle = meleeData.pitchAngle || 0;
    const cosP = Math.cos(pitchAngle);
    const sinP = Math.sin(pitchAngle);
    const fwdX = Math.cos(meleeData.yaw) * cosP;
    const fwdY = sinP;
    const fwdZ = Math.sin(meleeData.yaw) * cosP;
    const maxRange = meleeData.range || 2.15;

    let bestTarget = null;
    let bestDist = maxRange;
    let bestStrikeY = 1.1;

    for (const t of this.targets) {
      if (t.downTimer > 0) continue;
      const dx = t.x - meleeData.originX;
      const dz = t.z - meleeData.originZ;
      const clampedY = Math.max(0.15, Math.min(1.68, meleeData.originEyeHeight + sinP * Math.hypot(dx, dz)));
      const dy = clampedY - meleeData.originEyeHeight;
      const dist3D = Math.hypot(dx, dy, dz);
      if (dist3D > maxRange) continue;

      const dot = dist3D > 0.01 ? (dx * fwdX + dy * fwdY + dz * fwdZ) / dist3D : 1.0;
      if (dot >= 0.70 || dist3D <= 0.95) {
        let blockedByWall = false;
        const horizDist = Math.hypot(dx, dz);
        const hDirX = horizDist > 0.001 ? dx / horizDist : 0;
        const hDirZ = horizDist > 0.001 ? dz / horizDist : 0;

        for (let stepD = 0.25; stepD < horizDist; stepD += 0.15) {
          const wx = meleeData.originX + hDirX * stepD;
          const wz = meleeData.originZ + hDirZ * stepD;
          const gx = Math.floor(wx);
          const gz = Math.floor(wz);
          if (gz >= 0 && gz < this.depth && gx >= 0 && gx < this.width) {
            const cell = this.grid[gz][gx];
            const rayYAtStep = meleeData.originEyeHeight + (dy / Math.max(0.01, horizDist)) * stepD;
            if (cell !== 0 && (this.wallHeights[cell] || 3.0) > rayYAtStep) {
              blockedByWall = true;
              break;
            }
          }
        }

        if (!blockedByWall && dist3D < bestDist) {
          bestDist = dist3D;
          bestTarget = t;
          bestStrikeY = clampedY;
        }
      }
    }

    if (bestTarget) {
      const isHeadshot = bestStrikeY >= 1.38;
      const dmg = Math.round(meleeData.damage * (isHeadshot ? meleeData.headshotMult : 1.0));
      bestTarget.hp -= dmg;
      const killed = bestTarget.hp <= 0;
      if (killed) {
        bestTarget.hp = 0;
        bestTarget.downTimer = bestTarget.noRespawn ? 999999 : 2.5;
      }

      this.damagePopups.push({
        x: bestTarget.x,
        z: bestTarget.z,
        yOffset: Math.max(0.8, Math.min(1.65, bestStrikeY)),
        damage: dmg,
        headshot: isHeadshot,
        life: 0.70
      });

      return { hit: true, killed, headshot: isHeadshot, damage: dmg, distance: bestDist.toFixed(1) };
    }

    return { hit: false, killed: false, headshot: false, damage: 0, distance: maxRange.toFixed(1) };
  }

  spawnEquipmentAction(action, player, onEvent) {
    const spec = action.spec;
    if (!spec) return;

    if (action.type === 'OVERCOOK') {
      this.detonateProjectile(
        { spec, x: action.x, y: action.altitude + 0.8, z: action.z },
        player,
        onEvent
      );
      return;
    }

    if (action.type === 'DEPLOY') {
      const placeX = action.x + Math.cos(action.yaw) * 0.75;
      const placeZ = action.z + Math.sin(action.yaw) * 0.75;
      if (!this.isBlocked(placeX, placeZ, 0.20, action.altitude)) {
        this.projectiles.push({
          spec,
          x: placeX,
          y: action.altitude,
          z: placeZ,
          vx: 0,
          vy: 0,
          vz: 0,
          yaw: action.yaw,
          spinX: 0,
          spinZ: 0,
          fuse: spec.fuse,
          armed: false,
          stuck: true,
          stuckTargetId: null
        });
      }
      return;
    }

    if (action.type === 'THROW') {
      const cosY = Math.cos(action.yaw);
      const sinY = Math.sin(action.yaw);
      const cosP = Math.cos(action.pitch);
      const sinP = Math.sin(action.pitch);
      const speed = spec.throwSpeed;

      this.projectiles.push({
        spec,
        x: action.x + cosY * cosP * 0.45,
        y: Math.max(0.35, action.eyeHeight - 0.12 + sinP * 0.25),
        z: action.z + sinY * cosP * 0.45,
        vx: cosY * speed * cosP + action.vx * 0.35,
        vy: speed * sinP + 2.4 * Math.max(0, cosP),
        vz: sinY * speed * cosP + action.vz * 0.35,
        yaw: action.yaw,
        spinX: 0,
        spinZ: 0,
        fuse: action.fuse,
        armed: true,
        stuck: false,
        stuckTargetId: null
      });
    }
  }

  detonateProjectile(proj, player, onEvent) {
    const spec = proj.spec;
    const x = proj.x;
    const z = proj.z;

    if (spec.id === 'smoke') {
      this.smokeClouds.push({
        x,
        z,
        life: spec.duration,
        maxLife: spec.duration,
        radius: spec.radius * 1.25
      });
      if (onEvent) onEvent({ kind: 'SMOKE_POP' });
      return;
    }

    if (spec.id === 'flashbang') {
      this.explosions.push({ x, z, radius: 2.5, life: 0.25, maxLife: 0.25, color: '255, 255, 255' });
      if (onEvent) onEvent({ kind: 'FLASHBANG' });

      for (const t of this.targets) {
        if (t.downTimer > 0) continue;
        const dist = Math.hypot(t.x - x, t.z - z);
        if (dist <= spec.radius) {
          t.stunTimer = spec.stunDuration;
          t.stunType = 'FLASHED';
        }
      }

      const toFlashX = x - player.x;
      const toFlashZ = z - player.z;
      const distPlayer = Math.hypot(toFlashX, toFlashZ);
      if (distPlayer <= 15.0) {
        const forwardX = Math.cos(player.yaw);
        const forwardZ = Math.sin(player.yaw);
        const dot = distPlayer > 0.01 ? (toFlashX * forwardX + toFlashZ * forwardZ) / distPlayer : 1.0;
        const facingMult = dot > 0.2 ? 1.0 : 0.35;
        const distMult = Math.max(0.25, 1.0 - distPlayer / 16.0);
        const blindDuration = 3.6 * facingMult * distMult;
        player.flashBlindTimer = Math.max(player.flashBlindTimer, blindDuration);
        player.flashBlindPeak = Math.max(player.flashBlindPeak, Math.min(1.0, facingMult * distMult * 1.15));
      }
      return;
    }

    if (spec.id === 'concussion') {
      this.explosions.push({ x, z, radius: 4.5, life: 0.35, maxLife: 0.35, color: '185, 220, 255' });
      if (onEvent) onEvent({ kind: 'EXPLOSION' });

      for (const t of this.targets) {
        if (t.downTimer > 0) continue;
        const dist = Math.hypot(t.x - x, t.z - z);
        if (dist <= spec.radius) {
          t.stunTimer = spec.stunDuration;
          t.stunType = 'CONCUSSED';
        }
      }

      const distPlayer = Math.hypot(x - player.x, z - player.z);
      if (distPlayer <= spec.radius) {
        player.concussTimer = 3.2;
        player.viewKickPitch += (Math.random() - 0.5) * 0.18;
        player.viewKickYaw += (Math.random() - 0.5) * 0.24;
      }
      return;
    }

    this.explosions.push({ x, z, radius: spec.radius * 0.75, life: 0.42, maxLife: 0.42, color: '255, 165, 55' });
    if (onEvent) onEvent({ kind: 'EXPLOSION' });

    let hitAny = false;
    let killedAny = false;
    let totalDamage = 0;
    let closestDist = spec.radius;

    for (const t of this.targets) {
      if (t.downTimer > 0) continue;
      const dist = Math.hypot(t.x - x, t.z - z);
      if (dist <= spec.radius) {
        const falloff = 1.0 - (dist / spec.radius) * 0.75;
        const dmg = Math.round(spec.maxDamage * falloff);
        t.hp -= dmg;
        hitAny = true;
        totalDamage += dmg;
        closestDist = Math.min(closestDist, dist);

        if (t.hp <= 0) {
          t.hp = 0;
          t.downTimer = t.noRespawn ? 999999 : 2.5;
          killedAny = true;
        }

        this.damagePopups.push({
          x: t.x,
          z: t.z,
          yOffset: 1.25,
          damage: dmg,
          headshot: false,
          life: 0.75
        });
      }
    }

    if (hitAny && onEvent) {
      onEvent({
        kind: 'HITMARKER',
        result: {
          hit: true,
          killed: killedAny,
          headshot: false,
          damage: totalDamage,
          distance: closestDist.toFixed(1)
        }
      });
    }

    const distPlayer = Math.hypot(x - player.x, z - player.z);
    if (distPlayer <= spec.radius * 0.85) {
      player.concussTimer = Math.max(player.concussTimer, 1.8);
      player.viewKickPitch += (Math.random() - 0.3) * 0.16;
      player.viewKickYaw += (Math.random() - 0.5) * 0.20;
    }
  }

  update(dt, timeSec, player, onEvent) {
    for (const t of this.targets) {
      if (t.downTimer > 0 && !t.noRespawn) {
        t.downTimer -= dt;
        if (t.downTimer <= 0) {
          t.hp = t.maxHp;
          t.stunTimer = 0;
          t.stunType = null;
        }
      }

      if (t.stunTimer > 0) {
        t.stunTimer -= dt;
        if (t.stunTimer <= 0) t.stunType = null;
      }

      if (t.moveAmp > 0 && t.downTimer <= 0) {
        let speedMult = 1.0;
        if (t.stunTimer > 0) {
          speedMult = (t.stunType === 'FLASHED') ? 0.0 : 0.25;
        }
        t.phase += dt * t.speed * speedMult;
        t.x = t.baseX + Math.sin(t.phase) * t.moveAmp;
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      if (p.spec.deployable) {
        if (!p.armed) {
          p.fuse -= dt;
          if (p.fuse <= 0) p.armed = true;
          continue;
        }

        const dirX = Math.cos(p.yaw);
        const dirZ = Math.sin(p.yaw);
        let triggered = false;
        for (const t of this.targets) {
          if (t.downTimer > 0) continue;
          const dx = t.x - p.x;
          const dz = t.z - p.z;
          const dist = Math.hypot(dx, dz);
          if (dist <= p.spec.triggerRange) {
            const dot = dist > 0.01 ? (dx * dirX + dz * dirZ) / dist : 1.0;
            if (dot >= Math.cos(p.spec.triggerHalfAngle)) {
              triggered = true;
              break;
            }
          }
        }

        if (triggered) {
          this.detonateProjectile(p, player, onEvent);
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      p.fuse -= dt;
      if (p.fuse <= 0) {
        this.detonateProjectile(p, player, onEvent);
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.stuck) {
        if (p.stuckTargetId !== null) {
          const attached = this.targets.find(t => t.id === p.stuckTargetId);
          if (attached && attached.downTimer <= 0) {
            p.x = attached.x;
            p.z = attached.z;
          }
        }
        continue;
      }

      const speedMag = Math.hypot(p.vx, p.vy, p.vz);
      if (speedMag > 0.25) {
        p.spinX = (p.spinX || 0) + speedMag * dt * 2.1;
        p.spinZ = (p.spinZ || 0) + speedMag * dt * 1.3;
      }

      p.vy -= WW2.MOVEMENT.GRAVITY * dt;
      const nextX = p.x + p.vx * dt;
      const nextY = p.y + p.vy * dt;
      const nextZ = p.z + p.vz * dt;

      if (p.spec.sticky) {
        for (const t of this.targets) {
          if (t.downTimer > 0) continue;
          if (Math.hypot(nextX - t.x, nextZ - t.z) <= 0.55 && nextY <= 1.75) {
            p.x = t.x;
            p.y = Math.max(0.5, nextY);
            p.z = t.z;
            p.vx = p.vy = p.vz = 0;
            p.stuck = true;
            p.stuckTargetId = t.id;
            break;
          }
        }
        if (p.stuck) continue;
      }

      if (this.isBlocked(nextX, p.z, 0.12, p.y)) {
        if (p.spec.sticky) {
          p.vx = p.vy = p.vz = 0;
          p.stuck = true;
          continue;
        } else {
          p.vx = -p.vx * 0.45;
        }
      } else {
        p.x = nextX;
      }

      if (this.isBlocked(p.x, nextZ, 0.12, p.y)) {
        if (p.spec.sticky) {
          p.vx = p.vy = p.vz = 0;
          p.stuck = true;
          continue;
        } else {
          p.vz = -p.vz * 0.45;
        }
      } else {
        p.z = nextZ;
      }

      const floorY = Math.max(0.0, this.getSupportHeight(p.x, p.z, p.y + 0.1));
      if (nextY <= floorY) {
        p.y = floorY;
        if (p.spec.sticky) {
          p.vx = p.vy = p.vz = 0;
          p.stuck = true;
        } else {
          if (Math.abs(p.vy) > 1.2) {
            p.vy = -p.vy * 0.36;
          } else {
            p.vy = 0;
            p.spinX = 0;
          }
          p.vx *= 0.76;
          p.vz *= 0.76;
        }
      } else {
        p.y = nextY;
      }
    }

    for (let i = this.smokeClouds.length - 1; i >= 0; i--) {
      this.smokeClouds[i].life -= dt;
      if (this.smokeClouds[i].life <= 0) this.smokeClouds.splice(i, 1);
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].life -= dt;
      if (this.explosions[i].life <= 0) this.explosions.splice(i, 1);
    }

    for (let i = this.tracers.length - 1; i >= 0; i--) {
      this.tracers[i].life -= dt;
      if (this.tracers[i].life <= 0) this.tracers.splice(i, 1);
    }

    for (let i = this.damagePopups.length - 1; i >= 0; i--) {
      this.damagePopups[i].life -= dt;
      this.damagePopups[i].yOffset += dt * 0.55;
      if (this.damagePopups[i].life <= 0) this.damagePopups.splice(i, 1);
    }
  }

  // True 3D Ray Ballistics (supports full +/- 90 degree vertical angles)
  fireHitscan(shotData) {
    const yaw = shotData.shotYaw;
    const pitchAngle = shotData.shotPitchAngle || 0;
    const cosP = Math.cos(pitchAngle);
    const sinP = Math.sin(pitchAngle);
    const dirX = Math.cos(yaw) * cosP;
    const dirY = sinP;
    const dirZ = Math.sin(yaw) * cosP;
    const originEye = shotData.originEyeHeight || 1.70;
    const maxDist = shotData.weapon.rangeMax;

    let wallDist3D = maxDist;
    const step = 0.08;
    for (let s = 0.2; s < maxDist; s += step) {
      const rayY = originEye + dirY * s;
      if (rayY <= 0) {
        wallDist3D = s;
        break;
      }
      const rx = shotData.originX + dirX * s;
      const rz = shotData.originZ + dirZ * s;
      const gx = Math.floor(rx);
      const gz = Math.floor(rz);
      if (gz < 0 || gz >= this.depth || gx < 0 || gx >= this.width) {
        wallDist3D = s;
        break;
      }
      const cell = this.grid[gz][gx];
      if (cell !== 0) {
        const wallH = this.wallHeights[cell] || 3.0;
        if (rayY <= wallH) {
          wallDist3D = s;
          break;
        }
      }
    }

    let hitTarget = null;
    let closestTargetDist3D = wallDist3D;
    let hitHeightY = 0;
    const targetRadius = 0.38;
    const targetHeight = 1.75;
    const hDirX = Math.cos(yaw);
    const hDirZ = Math.sin(yaw);

    for (const t of this.targets) {
      if (t.downTimer > 0) continue;
      const toX = t.x - shotData.originX;
      const toZ = t.z - shotData.originZ;
      const horizDistSq = toX * toX + toZ * toZ;

      if (cosP > 0.01) {
        const projH = toX * hDirX + toZ * hDirZ;
        if (projH <= 0) continue;
        const perpSq = horizDistSq - projH * projH;
        if (perpSq <= targetRadius * targetRadius) {
          const dist3D = projH / cosP;
          if (dist3D < closestTargetDist3D) {
            const rayY = originEye + dirY * dist3D;
            if (rayY >= 0.05 && rayY <= targetHeight) {
              closestTargetDist3D = dist3D;
              hitTarget = t;
              hitHeightY = rayY;
            }
          }
        }
      } else if (horizDistSq <= targetRadius * targetRadius) {
        if (dirY < 0 && originEye > targetHeight) {
          const dist3D = originEye - targetHeight;
          if (dist3D < closestTargetDist3D) {
            closestTargetDist3D = dist3D;
            hitTarget = t;
            hitHeightY = targetHeight;
          }
        } else if (dirY > 0 && originEye < 0.05) {
          const dist3D = 0.05 - originEye;
          if (dist3D < closestTargetDist3D) {
            closestTargetDist3D = dist3D;
            hitTarget = t;
            hitHeightY = 0.05;
          }
        }
      }
    }

    this.tracers.push({
      x1: shotData.originX,
      z1: shotData.originZ,
      x2: shotData.originX + dirX * closestTargetDist3D,
      z2: shotData.originZ + dirZ * closestTargetDist3D,
      life: 0.12
    });

    if (hitTarget) {
      const isHeadshot = hitHeightY >= 1.38;
      const dmg = Math.round(shotData.weapon.damage * (isHeadshot ? shotData.weapon.headshotMult : 1.0));
      hitTarget.hp -= dmg;
      const killed = hitTarget.hp <= 0;
      if (killed) {
        hitTarget.hp = 0;
        hitTarget.downTimer = hitTarget.noRespawn ? 999999 : 2.5;
      }

      this.damagePopups.push({
        x: hitTarget.x,
        z: hitTarget.z,
        yOffset: hitHeightY,
        damage: dmg,
        headshot: isHeadshot,
        life: 0.65
      });

      return { hit: true, killed, headshot: isHeadshot, damage: dmg, distance: closestTargetDist3D.toFixed(1) };
    }

    return { hit: false, killed: false, headshot: false, damage: 0, distance: wallDist3D.toFixed(1) };
  }
};

WW2.Renderer25D = class Renderer25D {
  constructor(canvas, assetManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assets = assetManager;
    this.hitMarkerTimer = 0;
    this.hitMarkerKill = false;
    this.hitMarkerHeadshot = false;
    this.muzzleFlashTimer = 0;
    this.lastHitInfo = '';

    this.floorTexScale = 16;
    this.floorTexW = 0;
    this.floorTexH = 0;
    this.floorTexData = null;
    this.floorTexEnv = null;

    this.floorCanvas = document.createElement('canvas');
    this.floorCtx = this.floorCanvas.getContext('2d');
    this.floorImgData = null;
    this.floorBuf32 = null;

    // Precomputed 20-gon unit circle tables for true 3D planar bullseye projection
    this.circleCos = new Float32Array(20);
    this.circleSin = new Float32Array(20);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      this.circleCos[i] = Math.cos(a);
      this.circleSin[i] = Math.sin(a);
    }

    this.apply3DOccluderClip = this.apply3DOccluderClip.bind(this);
  }

  triggerHitMarker(result) {
    this.hitMarkerTimer = 0.24;
    this.hitMarkerKill = result.killed;
    this.hitMarkerHeadshot = result.headshot;
    const tag = result.killed ? 'TARGET DOWN' : (result.headshot ? 'HEADSHOT' : 'HIT');
    this.lastHitInfo = `${tag} -${result.damage} (${result.distance}m)`;
  }

  triggerMuzzleFlash() {
    this.muzzleFlashTimer = 0.055;
  }

  ensureFloorTexture(env) {
    if (this.floorTexData && this.floorTexEnv === env) return;

    this.floorTexEnv = env;
    this.floorTexW = env.width * this.floorTexScale;
    this.floorTexH = env.depth * this.floorTexScale;
    this.floorTexData = env.buildFloorTexture(this.floorTexScale);
  }

  // True 3D Pitched Floorcaster: exact ray-plane intersection on Y = 0 up to +/- 90 degrees
  renderTexturedFloor(ctx, w, h, stepPx, player, env, fov, effectivePitch, totalEyeHeight) {
    this.ensureFloorTexture(env);

    const fw = Math.max(1, Math.floor(w / stepPx));
    const fh = Math.max(1, Math.floor(h / stepPx));

    if (this.floorCanvas.width !== fw || this.floorCanvas.height !== fh) {
      this.floorCanvas.width = fw;
      this.floorCanvas.height = fh;
      this.floorImgData = this.floorCtx.createImageData(fw, fh);
      this.floorBuf32 = new Uint32Array(this.floorImgData.data.buffer);
    }

    const buf32 = this.floorBuf32;
    buf32.fill(0);

    const tanHalfFov = Math.tan(fov * 0.5);
    const projDistF = (fw * 0.5) / tanHalfFov;
    const invProjDistF = 1.0 / projDistF;

    const cosYaw = Math.cos(player.yaw);
    const sinYaw = Math.sin(player.yaw);
    const rightX = -sinYaw;
    const rightZ = cosYaw;

    const cosPitch = Math.cos(effectivePitch);
    const sinPitch = Math.sin(effectivePitch);

    const eyeH = Math.max(0.05, totalEyeHeight);

    const tex = this.floorTexData;
    const tw = this.floorTexW;
    const th = this.floorTexH;
    const scale = this.floorTexScale;
    const fogRgb = env.fogColor || [116, 130, 138];

    const halfFw = fw * 0.5;
    const halfFh = fh * 0.5;

    for (let y = 0; y < fh; y++) {
      const v = (halfFh - (y + 0.5)) * invProjDistF;
      const dirY = v * cosPitch + sinPitch;
      if (dirY >= -0.0005) continue;

      const s = -eyeH / dirY;
      if (s > 115.0) continue;

      const dirFwd = cosPitch - v * sinPitch;
      const distFwd = s * dirFwd;

      const centerWorldX = player.x + distFwd * cosYaw;
      const centerWorldZ = player.z + distFwd * sinYaw;

      const stepU = s * invProjDistF;
      const floorStepX = stepU * rightX;
      const floorStepZ = stepU * rightZ;

      let floorX = centerWorldX + (0.5 - halfFw) * floorStepX;
      let floorZ = centerWorldZ + (0.5 - halfFw) * floorStepZ;

      const tDist = s * Math.hypot(dirFwd, dirY);
      const distShade = Math.max(0.28, 1.0 - tDist / 78.0);
      const shadeInt = (distShade * 256) | 0;

      const fogNorm = tDist > 26.0 ? Math.min(0.45, ((tDist - 26.0) / 55.0) * 0.45) : 0;
      const fogInt = (fogNorm * 256) | 0;
      const invFogInt = 256 - fogInt;

      const rowOffset = y * fw;

      for (let x = 0; x < fw; x++) {
        let tx = (floorX * scale) | 0;
        let tz = (floorZ * scale) | 0;
        if (tx < 0) tx = 0;
        else if (tx >= tw) tx = tw - 1;
        if (tz < 0) tz = 0;
        else if (tz >= th) tz = th - 1;

        const c = tex[tz * tw + tx];
        let r = ((c & 0xff) * shadeInt) >> 8;
        let g = (((c >> 8) & 0xff) * shadeInt) >> 8;
        let b = (((c >> 16) & 0xff) * shadeInt) >> 8;

        if (fogInt > 0) {
          r = ((r * invFogInt) + (fogRgb[0] * fogInt)) >> 8;
          g = ((g * invFogInt) + (fogRgb[1] * fogInt)) >> 8;
          b = ((b * invFogInt) + (fogRgb[2] * fogInt)) >> 8;
        }

        buf32[rowOffset + x] = (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;

        floorX += floorStepX;
        floorZ += floorStepZ;
      }
    }

    this.floorCtx.putImageData(this.floorImgData, 0, 0);
    ctx.drawImage(this.floorCanvas, 0, 0, fw, fh, 0, 0, w, h);

    // Dynamic ground contact shadows under standing targets/enemies in True 3D
    const projDist = (w * 0.5) / tanHalfFov;
    for (let i = 0; i < env.targets.length; i++) {
      const t = env.targets[i];
      if (t.downTimer > 0) continue;
      const dx = t.x - player.x;
      const dy = -totalEyeHeight;
      const dz = t.z - player.z;
      const dF = dx * cosYaw + dz * sinYaw;
      const dR = dx * rightX + dz * rightZ;

      const camX = dR;
      const camY = dy * cosPitch - dF * sinPitch;
      const camZ = dF * cosPitch + dy * sinPitch;
      if (camZ <= 0.15 || camZ > 65) continue;

      const sx = w * 0.5 + (camX * projDist) / camZ;
      const sy = h * 0.5 - (camY * projDist) / camZ;
      const rx = (0.44 * projDist) / camZ;
      const ry = Math.max(2, rx * (0.34 + 0.66 * Math.abs(sinPitch)));

      ctx.fillStyle = 'rgba(15, 18, 12, 0.38)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  worldToCam(wx, wy, wz, cam) {
    const dx = wx - cam.eyeX;
    const dy = wy - cam.eyeY;
    const dz = wz - cam.eyeZ;
    const dF = dx * cam.cosYaw + dz * cam.sinYaw;
    const dR = dx * cam.rightX + dz * cam.rightZ;
    return {
      x: dR,
      y: dy * cam.cosPitch - dF * cam.sinPitch,
      z: dF * cam.cosPitch + dy * cam.sinPitch
    };
  }

  clipAndProjectPoly(worldVerts, cam, zNear = 0.05) {
    const n = worldVerts.length;
    if (n < 3) return null;

    const camVerts = new Array(n);
    let anyInFront = false;
    for (let i = 0; i < n; i++) {
      const wv = worldVerts[i];
      const cv = this.worldToCam(wv[0], wv[1], wv[2], cam);
      if (cv.z >= zNear) anyInFront = true;
      camVerts[i] = cv;
    }
    if (!anyInFront) return null;

    const clipped = [];
    for (let i = 0; i < n; i++) {
      const a = camVerts[i];
      const b = camVerts[(i + 1) % n];
      const aIn = a.z >= zNear;
      const bIn = b.z >= zNear;

      if (aIn && bIn) {
        clipped.push(b);
      } else if (aIn && !bIn) {
        const t = (zNear - a.z) / (b.z - a.z);
        clipped.push({
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          z: zNear
        });
      } else if (!aIn && bIn) {
        const t = (zNear - a.z) / (b.z - a.z);
        clipped.push({
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          z: zNear
        });
        clipped.push(b);
      }
    }

    if (clipped.length < 3) return null;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, avgZ = 0;
    const screenPts = new Array(clipped.length);

    for (let i = 0; i < clipped.length; i++) {
      const v = clipped[i];
      const sx = cam.halfW + (v.x * cam.projDist) / v.z;
      const sy = cam.halfH - (v.y * cam.projDist) / v.z;
      screenPts[i] = { x: sx, y: sy };
      if (sx < minX) minX = sx;
      if (sx > maxX) maxX = sx;
      if (sy < minY) minY = sy;
      if (sy > maxY) maxY = sy;
      if (v.z < minZ) minZ = v.z;
      avgZ += v.z;
    }

    if (maxX < 0 || minX > cam.w || maxY < 0 || minY > cam.h) return null;

    return {
      pts: screenPts,
      minX,
      maxX,
      minY,
      maxY,
      minZ,
      avgZ: avgZ / clipped.length
    };
  }

  apply3DOccluderClip(ctx, x0, y0, x1, y1, itemDepth, occluders, stripW, numRays) {
    if (!occluders || occluders.length === 0) return;

    const relevant = [];
    for (let i = 0; i < occluders.length; i++) {
      const occ = occluders[i];
      if (occ.minZ < itemDepth - 0.04 && occ.maxX >= x0 && occ.minX <= x1 && occ.maxY >= y0 && occ.minY <= y1) {
        relevant.push(occ);
      }
    }
    if (relevant.length === 0) return;

    const startRay = Math.max(0, Math.floor(x0 / stripW));
    const endRay = Math.min(numRays - 1, Math.ceil(x1 / stripW));
    if (startRay > endRay) return;

    const clipPath = new Path2D();
    for (let r = startRay; r <= endRay; r++) {
      const rx = r * stripW;
      const cx = rx + stripW * 0.5;
      const blocked = [];

      for (let k = 0; k < relevant.length; k++) {
        const occ = relevant[k];
        if (cx < occ.minX || cx > occ.maxX) continue;

        const pts = occ.pts;
        let topY = Infinity;
        let botY = -Infinity;
        let hits = 0;
        for (let e = 0; e < pts.length; e++) {
          const pA = pts[e];
          const pB = pts[(e + 1) % pts.length];
          if ((pA.x <= cx && pB.x >= cx) || (pB.x <= cx && pA.x >= cx)) {
            const dx = pB.x - pA.x;
            const yHit = Math.abs(dx) < 1e-5 ? pA.y : pA.y + ((cx - pA.x) / dx) * (pB.y - pA.y);
            if (yHit < topY) topY = yHit;
            if (yHit > botY) botY = yHit;
            hits++;
          }
        }
        if (hits >= 2 && botY > topY) {
          blocked.push([Math.max(y0, topY), Math.min(y1, botY)]);
        }
      }

      if (blocked.length === 0) {
        clipPath.rect(rx, y0, stripW + 0.75, y1 - y0);
      } else {
        blocked.sort((a, b) => a[0] - b[0]);
        let curY = y0;
        for (let b = 0; b < blocked.length; b++) {
          const [bTop, bBot] = blocked[b];
          if (bTop > curY) {
            clipPath.rect(rx, curY, stripW + 0.75, bTop - curY);
          }
          if (bBot > curY) curY = bBot;
        }
        if (y1 > curY) {
          clipPath.rect(rx, curY, stripW + 0.75, y1 - curY);
        }
      }
    }

    ctx.clip(clipPath);
  }

  distSqEyeToBox(cam, minX, maxX, minY, maxY, minZ, maxZ) {
    const cx = Math.max(minX, Math.min(maxX, cam.eyeX));
    const cy = Math.max(minY, Math.min(maxY, cam.eyeY));
    const cz = Math.max(minZ, Math.min(maxZ, cam.eyeZ));
    const dx = cam.eyeX - cx;
    const dy = cam.eyeY - cy;
    const dz = cam.eyeZ - cz;
    return dx * dx + dy * dy + dz * dz;
  }

  pushBoxFaces(faceList, cam, box, style, overrideSortDistSq = null, subOrderBase = 0) {
    const { minX, maxX, minY, maxY, minZ, maxZ } = box;
    const distSq = overrideSortDistSq !== null
      ? overrideSortDistSq
      : this.distSqEyeToBox(cam, minX, maxX, minY, maxY, minZ, maxZ);
    if (distSq > 95 * 95) return;

    // 1. West face (-X)
    if (!box.skipWest && cam.eyeX < minX) {
      const yStart = Math.max(minY, box.westMinY || minY);
      if (maxY > yStart) {
        faceList.push({
          sortDistSq: distSq,
          subOrder: subOrderBase,
          face: 'WEST',
          side: 0,
          box,
          style,
          verts: [
            [minX, maxY, minZ],
            [minX, maxY, maxZ],
            [minX, yStart, maxZ],
            [minX, yStart, minZ]
          ]
        });
      }
    }
    // 2. East face (+X)
    if (!box.skipEast && cam.eyeX > maxX) {
      const yStart = Math.max(minY, box.eastMinY || minY);
      if (maxY > yStart) {
        faceList.push({
          sortDistSq: distSq,
          subOrder: subOrderBase,
          face: 'EAST',
          side: 0,
          box,
          style,
          verts: [
            [maxX, maxY, maxZ],
            [maxX, maxY, minZ],
            [maxX, yStart, minZ],
            [maxX, yStart, maxZ]
          ]
        });
      }
    }
    // 3. North face (-Z)
    if (!box.skipNorth && cam.eyeZ < minZ) {
      const yStart = Math.max(minY, box.northMinY || minY);
      if (maxY > yStart) {
        faceList.push({
          sortDistSq: distSq,
          subOrder: subOrderBase,
          face: 'NORTH',
          side: 1,
          box,
          style,
          verts: [
            [maxX, maxY, minZ],
            [minX, maxY, minZ],
            [minX, yStart, minZ],
            [maxX, yStart, minZ]
          ]
        });
      }
    }
    // 4. South face (+Z)
    if (!box.skipSouth && cam.eyeZ > maxZ) {
      const yStart = Math.max(minY, box.southMinY || minY);
      if (maxY > yStart) {
        faceList.push({
          sortDistSq: distSq,
          subOrder: subOrderBase,
          face: 'SOUTH',
          side: 1,
          box,
          style,
          verts: [
            [minX, maxY, maxZ],
            [maxX, maxY, maxZ],
            [maxX, yStart, maxZ],
            [minX, yStart, maxZ]
          ]
        });
      }
    }
    // 5. Top face (+Y)
    if (!box.skipTop && cam.eyeY > maxY) {
      faceList.push({
        sortDistSq: distSq,
        subOrder: subOrderBase + 0.001,
        face: 'TOP',
        side: 2,
        box,
        style,
        verts: [
          [minX, maxY, minZ],
          [maxX, maxY, minZ],
          [maxX, maxY, maxZ],
          [minX, maxY, maxZ]
        ]
      });
    }
    // 6. Bottom face (-Y)
    if (!box.skipBottom && minY > 0.01 && cam.eyeY < minY) {
      faceList.push({
        sortDistSq: distSq,
        subOrder: subOrderBase + 0.001,
        face: 'BOTTOM',
        side: 3,
        box,
        style,
        verts: [
          [minX, minY, maxZ],
          [maxX, minY, maxZ],
          [maxX, minY, minZ],
          [minX, minY, minZ]
        ]
      });
    }
  }

  fillProjectedPoly(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Draws true 3D perspective-projected bullseye circles lying directly on the torso face plane
  draw3DPlanarBullseye(ctx, cam, cx, cy, faceZ, shade) {
    const outerVerts = new Array(20);
    const innerVerts = new Array(20);
    const rOuter = 0.21;
    const rInner = 0.095;

    for (let i = 0; i < 20; i++) {
      const c = this.circleCos[i];
      const s = this.circleSin[i];
      outerVerts[i] = [cx + c * rOuter, cy + s * rOuter, faceZ];
      innerVerts[i] = [cx + c * rInner, cy + s * rInner, faceZ];
    }

    const outerProj = this.clipAndProjectPoly(outerVerts, cam, 0.05);
    if (!outerProj) return;

    ctx.fillStyle = `rgba(248, 245, 232, ${Math.min(0.96, shade * 1.15)})`;
    this.fillProjectedPoly(ctx, outerProj.pts);

    const innerProj = this.clipAndProjectPoly(innerVerts, cam, 0.05);
    if (innerProj) {
      ctx.fillStyle = `rgba(175, 42, 32, ${Math.min(0.96, shade * 1.15)})`;
      this.fillProjectedPoly(ctx, innerProj.pts);
    }
  }

  // Renders all 3D Walls, Crates, Trees, and Composite Targets in True 3D Perspective
  render3DWorldGeometry(ctx, cam, env) {
    const wallColors = env.wallColors || {
      1: [128, 133, 129],
      2: [130, 92, 54],
      3: [164, 146, 104]
    };
    const wallTopColors = env.wallTopColors || {
      1: [148, 152, 148],
      2: [148, 108, 68],
      3: [184, 166, 122]
    };

    const faceList = [];

    // 1. Grid Walls
    for (let gz = 0; gz < env.depth; gz++) {
      const row = env.grid[gz];
      for (let gx = 0; gx < env.width; gx++) {
        const cell = row[gx];
        if (cell <= 0) continue;

        const wallH = env.wallHeights[cell] || 3.0;
        const westH = gx > 0 && row[gx - 1] > 0 ? (env.wallHeights[row[gx - 1]] || 3.0) : 0;
        const eastH = gx + 1 < env.width && row[gx + 1] > 0 ? (env.wallHeights[row[gx + 1]] || 3.0) : 0;
        const northH = gz > 0 && env.grid[gz - 1][gx] > 0 ? (env.wallHeights[env.grid[gz - 1][gx]] || 3.0) : 0;
        const southH = gz + 1 < env.depth && env.grid[gz + 1][gx] > 0 ? (env.wallHeights[env.grid[gz + 1][gx]] || 3.0) : 0;

        this.pushBoxFaces(
          faceList,
          cam,
          {
            minX: gx,
            maxX: gx + 1,
            minY: 0,
            maxY: wallH,
            minZ: gz,
            maxZ: gz + 1,
            skipWest: westH >= wallH,
            skipEast: eastH >= wallH,
            skipNorth: northH >= wallH,
            skipSouth: southH >= wallH,
            westMinY: westH,
            eastMinY: eastH,
            northMinY: northH,
            southMinY: southH
          },
          {
            kind: 'WALL',
            rgb: wallColors[cell] || [125, 125, 125],
            topRgb: wallTopColors[cell] || [145, 145, 145]
          }
        );
      }
    }

    // 2. Crates & Trees
    for (let i = 0; i < env.props.length; i++) {
      const p = env.props[i];
      if (p.type === 'CRATE') {
        const hw = p.width * 0.5;
        this.pushBoxFaces(
          faceList,
          cam,
          {
            minX: p.x - hw,
            maxX: p.x + hw,
            minY: 0,
            maxY: p.height,
            minZ: p.z - hw,
            maxZ: p.z + hw
          },
          {
            kind: 'CRATE',
            rgb: [142, 105, 62],
            topRgb: [166, 126, 78]
          }
        );
      } else if (p.type === 'TREE') {
        const distSq = (cam.eyeX - p.x) * (cam.eyeX - p.x) + (cam.eyeZ - p.z) * (cam.eyeZ - p.z);
        if (distSq <= 95 * 95) {
          const sides = 8;
          const trunkR = p.width * 0.11;
          const trunkTop = p.height * 0.58;
          for (let s = 0; s < sides; s++) {
            const a0 = (s / sides) * Math.PI * 2;
            const a1 = ((s + 1) / sides) * Math.PI * 2;
            const shade = 0.72 + 0.28 * Math.cos(a0 - 0.8);
            faceList.push({
              sortDistSq: distSq,
              subOrder: 0,
              face: 'TREE',
              side: 0,
              style: { kind: 'TREE_TRUNK', rgb: [88, 60, 38], shadeMult: shade },
              verts: [
                [p.x + Math.cos(a0) * trunkR * 0.82, trunkTop, p.z + Math.sin(a0) * trunkR * 0.82],
                [p.x + Math.cos(a1) * trunkR * 0.82, trunkTop, p.z + Math.sin(a1) * trunkR * 0.82],
                [p.x + Math.cos(a1) * trunkR, 0, p.z + Math.sin(a1) * trunkR],
                [p.x + Math.cos(a0) * trunkR, 0, p.z + Math.sin(a0) * trunkR]
              ]
            });
          }

          const tiers = [
            { yBase: p.height * 0.30, yApex: p.height * 0.66, rBase: p.width * 0.50, rgb: [34, 72, 36] },
            { yBase: p.height * 0.50, yApex: p.height * 0.84, rBase: p.width * 0.39, rgb: [40, 82, 42] },
            { yBase: p.height * 0.70, yApex: p.height * 1.00, rBase: p.width * 0.27, rgb: [48, 94, 48] }
          ];
          for (let ti = 0; ti < tiers.length; ti++) {
            const tier = tiers[ti];
            for (let s = 0; s < sides; s++) {
              const a0 = (s / sides) * Math.PI * 2;
              const a1 = ((s + 1) / sides) * Math.PI * 2;
              const shade = 0.76 + 0.26 * Math.cos((a0 + a1) * 0.5 - 0.8);
              faceList.push({
                sortDistSq: distSq,
                subOrder: 0.01 * (ti + 1),
                face: 'TREE',
                side: 0,
                style: { kind: 'TREE_CONE', rgb: tier.rgb, shadeMult: shade },
                verts: [
                  [p.x, tier.yApex, p.z],
                  [p.x + Math.cos(a1) * tier.rBase, tier.yBase, p.z + Math.sin(a1) * tier.rBase],
                  [p.x + Math.cos(a0) * tier.rBase, tier.yBase, p.z + Math.sin(a0) * tier.rBase]
                ]
              });
            }
          }
        }
      }
    }

    // 3. Composite Range Targets (all parts share targetDistSq & order vertically relative to cam.eyeY)
    for (let i = 0; i < env.targets.length; i++) {
      const t = env.targets[i];
      const targetDistSq = this.distSqEyeToBox(
        cam,
        t.x - 0.34, t.x + 0.34,
        0.0, 1.72,
        t.z - 0.34, t.z + 0.34
      );
      if (targetDistSq > 95 * 95) continue;

      if (t.downTimer > 0) {
        this.pushBoxFaces(
          faceList,
          cam,
          { minX: t.x - 0.34, maxX: t.x + 0.34, minY: 0.0, maxY: 0.08, minZ: t.z - 0.34, maxZ: t.z + 0.34 },
          { kind: 'TARGET', rgb: [58, 62, 66], topRgb: [78, 82, 86] },
          targetDistSq,
          -Math.abs(cam.eyeY - 0.04)
        );
        this.pushBoxFaces(
          faceList,
          cam,
          { minX: t.x - 0.32, maxX: t.x + 0.32, minY: 0.08, maxY: 0.18, minZ: t.z - 0.10, maxZ: t.z + 0.95 },
          { kind: 'TARGET', rgb: [78, 82, 86], topRgb: [98, 102, 106] },
          targetDistSq,
          -Math.abs(cam.eyeY - 0.13)
        );
      } else {
        const torsoRgb = t.stunTimer > 0 ? [110, 155, 195] : (t.torsoRgb || [198, 68, 52]);
        const torsoTopRgb = t.stunTimer > 0 ? [135, 180, 220] : (t.torsoTopRgb || [222, 88, 70]);

        // Base plate (midY = 0.04)
        this.pushBoxFaces(
          faceList,
          cam,
          { minX: t.x - 0.34, maxX: t.x + 0.34, minY: 0.0, maxY: 0.08, minZ: t.z - 0.34, maxZ: t.z + 0.34 },
          { kind: 'TARGET', rgb: [58, 62, 66], topRgb: [78, 82, 86] },
          targetDistSq,
          -Math.abs(cam.eyeY - 0.04)
        );
        // Stand post (midY = 0.26)
        this.pushBoxFaces(
          faceList,
          cam,
          { minX: t.x - 0.08, maxX: t.x + 0.08, minY: 0.08, maxY: 0.44, minZ: t.z - 0.08, maxZ: t.z + 0.08 },
          { kind: 'TARGET', rgb: [82, 60, 38], topRgb: [98, 74, 48] },
          targetDistSq,
          -Math.abs(cam.eyeY - 0.26)
        );
        // Torso block (midY = 0.86)
        this.pushBoxFaces(
          faceList,
          cam,
          { minX: t.x - 0.32, maxX: t.x + 0.32, minY: 0.44, maxY: 1.28, minZ: t.z - 0.14, maxZ: t.z + 0.14 },
          {
            kind: 'TARGET',
            rgb: torsoRgb,
            topRgb: torsoTopRgb,
            hasBullseye: t.hasBullseye !== false,
            targetX: t.x,
            targetZ: t.z
          },
          targetDistSq,
          -Math.abs(cam.eyeY - 0.86)
        );
        // Head block (midY = 1.52)
        this.pushBoxFaces(
          faceList,
          cam,
          { minX: t.x - 0.16, maxX: t.x + 0.16, minY: 1.32, maxY: 1.72, minZ: t.z - 0.15, maxZ: t.z + 0.15 },
          { kind: 'TARGET', rgb: [242, 198, 65], topRgb: [255, 218, 92] },
          targetDistSq,
          -Math.abs(cam.eyeY - 1.52)
        );
      }
    }

    // Painter's Algorithm sort: farthest first, then subOrder tie-breaker
    faceList.sort((a, b) => (b.sortDistSq - a.sortDistSq) || (a.subOrder - b.subOrder));

    const occluders = [];
    const fogRgb = env.fogColor || [116, 130, 138];

    for (let i = 0; i < faceList.length; i++) {
      const f = faceList[i];
      const proj = this.clipAndProjectPoly(f.verts, cam, 0.05);
      if (!proj) continue;

      const dist = Math.sqrt(Math.max(0.01, f.sortDistSq));
      let shade = Math.max(0.28, 1.0 - dist / 68.0);
      if (f.face === 'TOP') shade = Math.min(1.08, shade * 1.12);
      else if (f.side === 1) shade *= 0.80;
      else if (f.style.shadeMult) shade *= f.style.shadeMult;

      const baseRgb = (f.face === 'TOP' && f.style.topRgb) ? f.style.topRgb : f.style.rgb;
      const fogBlend = dist > 26 ? Math.min(0.45, ((dist - 26) / 55) * 0.45) : 0;

      const r = Math.round((baseRgb[0] * shade) * (1 - fogBlend) + fogRgb[0] * fogBlend);
      const g = Math.round((baseRgb[1] * shade) * (1 - fogBlend) + fogRgb[1] * fogBlend);
      const b = Math.round((baseRgb[2] * shade) * (1 - fogBlend) + fogRgb[2] * fogBlend);

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      this.fillProjectedPoly(ctx, proj.pts);

      if (f.style.kind === 'WALL') {
        ctx.strokeStyle = `rgba(22, 24, 22, ${Math.max(0.18, 0.48 * shade)})`;
        ctx.lineWidth = Math.max(1, Math.min(2.2, 2.2 / Math.max(0.6, proj.avgZ)));
        ctx.stroke();

        if (f.face === 'TOP') {
          ctx.strokeStyle = `rgba(245, 248, 240, ${Math.max(0.10, 0.24 * shade)})`;
          ctx.stroke();
        }
      } else if (f.style.kind === 'CRATE') {
        const darkR = Math.round(r * 0.64);
        const darkG = Math.round(g * 0.64);
        const darkB = Math.round(b * 0.64);
        ctx.strokeStyle = `rgb(${darkR},${darkG},${darkB})`;
        ctx.lineWidth = Math.max(1.2, Math.min(3.5, 4.0 / Math.max(0.6, proj.avgZ)));
        ctx.stroke();

        if (f.face !== 'TOP' && proj.pts.length === 4) {
          ctx.beginPath();
          ctx.moveTo(proj.pts[0].x, proj.pts[0].y);
          ctx.lineTo(proj.pts[2].x, proj.pts[2].y);
          ctx.stroke();
        }
      } else if (f.style.kind === 'TARGET') {
        ctx.strokeStyle = `rgba(25, 22, 20, ${Math.max(0.22, 0.55 * shade)})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        if (f.style.hasBullseye && (f.face === 'NORTH' || f.face === 'SOUTH')) {
          const faceZ = f.face === 'NORTH' ? (f.style.targetZ - 0.14) : (f.style.targetZ + 0.14);
          this.draw3DPlanarBullseye(ctx, cam, f.style.targetX, 0.86, faceZ, shade);
        }
      }

      if (f.style.kind === 'WALL' || f.style.kind === 'CRATE') {
        occluders.push(proj);
      }
    }

    return occluders;
  }

  render(dt, player, env, settings) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const stepPx = settings.graphics.rayStepPx || 2;
    const numRays = Math.ceil(w / stepPx);

    if (this.hitMarkerTimer > 0) this.hitMarkerTimer -= dt;
    if (this.muzzleFlashTimer > 0) this.muzzleFlashTimer -= dt;

    const spec = player.getActiveWeaponSpec();
    const baseFov = (settings.graphics.fov * Math.PI) / 180;
    const zoomFactor = (player.isAds && spec && spec.category !== 'MELEE') ? spec.adsZoom : 1.0;
    const fov = baseFov / zoomFactor;
    const projDist = (w * 0.5) / Math.tan(fov * 0.5);

    const MAX_PITCH = WW2.MOVEMENT.MAX_PITCH;
    const effectivePitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, player.pitch + (player.viewKickPitch || 0)));
    const totalEyeHeight = (player.altitude || 0) + player.eyeHeight;

    const cosYaw = Math.cos(player.yaw);
    const sinYaw = Math.sin(player.yaw);
    const rightX = -sinYaw;
    const rightZ = cosYaw;

    const cosPitch = Math.cos(effectivePitch);
    const sinPitch = Math.sin(effectivePitch);

    const cam = {
      w,
      h,
      halfW: w * 0.5,
      halfH: h * 0.5,
      projDist,
      eyeX: player.x,
      eyeY: totalEyeHeight,
      eyeZ: player.z,
      cosYaw,
      sinYaw,
      rightX,
      rightZ,
      cosPitch,
      sinPitch
    };

    // 1. True 3D Sky Background
    const skyColors = env.skyColors || ['#2c3a47', '#4b5f6e', '#7c8e99'];
    const safeHorizonTan = Math.tan(Math.max(-1.555, Math.min(1.555, effectivePitch)));
    const horizonY = h * 0.5 + safeHorizonTan * projDist;
    const skyTop = Math.min(-h * 0.5, horizonY - h * 1.4);
    const skyBot = Math.max(h * 1.5, horizonY + h * 0.25);

    const skyGrad = ctx.createLinearGradient(0, skyTop, 0, skyBot);
    skyGrad.addColorStop(0.0, skyColors[0]);
    skyGrad.addColorStop(0.65, skyColors[1]);
    skyGrad.addColorStop(1.0, skyColors[2]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. True 3D Textured Floor & Dynamic Target Shadows
    this.renderTexturedFloor(ctx, w, h, stepPx, player, env, fov, effectivePitch, totalEyeHeight);

    // 3. True 3D Projected Walls, Crates, Trees & Targets
    const occluders = this.render3DWorldGeometry(ctx, cam, env);

    // 4. 3D .GLB Thrown Grenades, Tacticals & Planted Claymores
    let rendered3DEquip = new Set();
    if (this.assets && typeof this.assets.drawWorldProjectiles === 'function') {
      rendered3DEquip = this.assets.drawWorldProjectiles(
        ctx, w, h, player, env, fov, effectivePitch, occluders, stepPx, numRays, this.apply3DOccluderClip
      );
    }

    // 5. True 3D Projected Billboards (Signs, Smoke Clouds, Explosions, Target Status & Damage Popups)
    const billboards = [];

    for (let i = 0; i < env.props.length; i++) {
      const p = env.props[i];
      if (p.type !== 'SIGN') continue;
      const cv = this.worldToCam(p.x, 1.1, p.z, cam);
      if (cv.z > 0.1 && cv.z < 65) {
        billboards.push({ kind: 'SIGN', prop: p, camX: cv.x, camY: cv.y, camZ: cv.z });
      }
    }

    for (let i = 0; i < env.smokeClouds.length; i++) {
      const s = env.smokeClouds[i];
      const cv = this.worldToCam(s.x, 1.4, s.z, cam);
      if (cv.z > 0.1 && cv.z < 75) {
        billboards.push({ kind: 'SMOKE', smoke: s, camX: cv.x, camY: cv.y, camZ: cv.z });
      }
    }

    for (let i = 0; i < env.explosions.length; i++) {
      const ex = env.explosions[i];
      const cv = this.worldToCam(ex.x, 1.0, ex.z, cam);
      if (cv.z > 0.1 && cv.z < 75) {
        billboards.push({ kind: 'EXPLOSION', ex, camX: cv.x, camY: cv.y, camZ: cv.z });
      }
    }

    for (let pIdx = 0; pIdx < env.projectiles.length; pIdx++) {
      if (rendered3DEquip.has(pIdx)) continue;
      const proj = env.projectiles[pIdx];
      const cv = this.worldToCam(proj.x, proj.y + 0.12, proj.z, cam);
      if (cv.z > 0.1 && cv.z < 65) {
        billboards.push({ kind: 'PROJECTILE', proj, camX: cv.x, camY: cv.y, camZ: cv.z });
      }
    }

    for (let i = 0; i < env.targets.length; i++) {
      const t = env.targets[i];
      if (t.downTimer > 0) continue;
      const cv = this.worldToCam(t.x, 1.92, t.z, cam);
      if (cv.z > 0.1 && cv.z < 65) {
        billboards.push({ kind: 'TARGET_HUD', target: t, camX: cv.x, camY: cv.y, camZ: cv.z });
      }
    }

    billboards.sort((a, b) => b.camZ - a.camZ);

    for (const item of billboards) {
      const screenX = cam.halfW + (item.camX * projDist) / item.camZ;
      const screenY = cam.halfH - (item.camY * projDist) / item.camZ;

      if (item.kind === 'SIGN') {
        const postTop = this.worldToCam(item.prop.x, 2.0, item.prop.z, cam);
        const postBot = this.worldToCam(item.prop.x, 0.0, item.prop.z, cam);
        if (postTop.z <= 0.1 || postBot.z <= 0.1) continue;

        const yTop = cam.halfH - (postTop.y * projDist) / postTop.z;
        const yBot = cam.halfH - (postBot.y * projDist) / postBot.z;
        const pw = Math.max(4, (0.14 * projDist) / item.camZ);
        const bw = (1.35 * projDist) / item.camZ;
        const bh = (0.48 * projDist) / item.camZ;

        ctx.save();
        this.apply3DOccluderClip(
          ctx,
          screenX - bw * 0.6,
          yTop - 6,
          screenX + bw * 0.6,
          yBot + 6,
          item.camZ,
          occluders,
          stepPx,
          numRays
        );

        ctx.fillStyle = '#4f3a24';
        ctx.fillRect(screenX - pw * 0.5, yTop, pw, yBot - yTop);
        ctx.fillStyle = '#d4c8a8';
        ctx.fillRect(screenX - bw * 0.5, yTop, bw, bh);
        ctx.strokeStyle = '#3a3222';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX - bw * 0.5, yTop, bw, bh);

        if (item.camZ < 32) {
          const signText =
            item.prop.label ??
            item.prop.text ??
            item.prop.title ??
            item.prop.caption ??
            (item.prop.distance != null ? `${item.prop.distance}m` : '');
          if (signText !== '') {
            ctx.fillStyle = '#1f1c16';
            ctx.font = `bold ${Math.max(10, Math.floor(bh * 0.42))}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(signText), screenX, yTop + bh * 0.52);
          }
        }
        ctx.restore();
      } else if (item.kind === 'SMOKE') {
        const s = item.smoke;
        const radPx = (s.radius * projDist) / item.camZ;
        const alpha = Math.min(0.84, (s.life / s.maxLife) * 1.35);

        ctx.save();
        this.apply3DOccluderClip(
          ctx,
          screenX - radPx,
          screenY - radPx,
          screenX + radPx,
          screenY + radPx,
          item.camZ,
          occluders,
          stepPx,
          numRays
        );

        const grad = ctx.createRadialGradient(screenX, screenY, radPx * 0.1, screenX, screenY, radPx);
        grad.addColorStop(0, `rgba(218, 222, 224, ${alpha})`);
        grad.addColorStop(0.65, `rgba(182, 188, 192, ${alpha * 0.78})`);
        grad.addColorStop(1, 'rgba(155, 162, 166, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(screenX, screenY, radPx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (item.kind === 'EXPLOSION') {
        const ex = item.ex;
        const progress = 1 - (ex.life / ex.maxLife);
        const radPx = ((ex.radius * (0.35 + progress * 0.85)) * projDist) / item.camZ;
        const alpha = Math.max(0, (1 - progress) * 0.92);

        ctx.save();
        this.apply3DOccluderClip(
          ctx,
          screenX - radPx,
          screenY - radPx,
          screenX + radPx,
          screenY + radPx,
          item.camZ,
          occluders,
          stepPx,
          numRays
        );

        const grad = ctx.createRadialGradient(screenX, screenY, 2, screenX, screenY, radPx);
        grad.addColorStop(0, `rgba(255, 255, 240, ${alpha})`);
        grad.addColorStop(0.5, `rgba(${ex.color}, ${alpha * 0.85})`);
        grad.addColorStop(1, `rgba(${ex.color}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(screenX, screenY, radPx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (item.kind === 'PROJECTILE') {
        const p = item.proj;
        const rPx = Math.max(4, (0.13 * projDist) / item.camZ);

        ctx.save();
        this.apply3DOccluderClip(
          ctx,
          screenX - rPx * 4,
          screenY - rPx * 3,
          screenX + rPx * 4,
          screenY + rPx * 3,
          item.camZ,
          occluders,
          stepPx,
          numRays
        );

        if (p.spec.deployable) {
          ctx.fillStyle = '#3c4a36';
          ctx.fillRect(screenX - rPx * 1.4, screenY - rPx * 0.8, rPx * 2.8, rPx * 1.4);
          if (p.armed) {
            ctx.strokeStyle = 'rgba(255, 50, 50, 0.72)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(screenX - rPx * 0.4, screenY - rPx * 0.4);
            ctx.lineTo(screenX - rPx * 3.2, screenY - rPx * 1.4);
            ctx.moveTo(screenX + rPx * 0.4, screenY - rPx * 0.4);
            ctx.lineTo(screenX + rPx * 3.2, screenY - rPx * 1.4);
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = p.spec.slot === 'LETHAL' ? '#49583e' : '#6b757d';
          ctx.beginPath();
          ctx.arc(screenX, screenY, rPx, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#1b1e19';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();
      } else if (item.kind === 'TARGET_HUD') {
        const t = item.target;
        const barW = Math.max(16, (0.58 * projDist) / item.camZ);
        const barH = Math.max(3, (0.065 * projDist) / item.camZ);

        ctx.save();
        this.apply3DOccluderClip(
          ctx,
          screenX - barW,
          screenY - 26,
          screenX + barW,
          screenY + barH + 4,
          item.camZ,
          occluders,
          stepPx,
          numRays
        );

        const hpRatio = Math.max(0, t.hp / t.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(screenX - barW * 0.5, screenY, barW, barH);
        ctx.fillStyle = t.stunTimer > 0 ? '#5ac8fa' : (hpRatio > 0.5 ? '#4cd964' : (hpRatio > 0.25 ? '#ffcc00' : '#ff3b30'));
        ctx.fillRect(screenX - barW * 0.5, screenY, barW * hpRatio, barH);

        if (t.stunTimer > 0 && item.camZ < 28) {
          ctx.fillStyle = '#5ac8fa';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(t.stunType || 'STUNNED', screenX, screenY - 6);
        }
        ctx.restore();
      }
    }

    // 6. Floating Damage Numbers (True 3D projected)
    for (const pop of env.damagePopups) {
      const cv = this.worldToCam(pop.x, pop.yOffset, pop.z, cam);
      if (cv.z <= 0.15) continue;
      const sx = cam.halfW + (cv.x * projDist) / cv.z;
      const sy = cam.halfH - (cv.y * projDist) / cv.z;
      ctx.font = pop.headshot ? 'bold 18px monospace' : 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = pop.headshot ? '#ffd60a' : '#ffffff';
      ctx.fillText(`-${pop.damage}`, sx, sy);
    }

    // 7. First-Person Viewmodel (.GLB 3D Weapon / Melee / Equipment)
    if (this.assets && typeof this.assets.drawFirstPersonWeapon === 'function') {
      this.assets.drawFirstPersonWeapon(ctx, w, h, spec, player, this.muzzleFlashTimer);
    }

    // 8. Flashbang / Concussion Screen Effects
    if (player.flashBlindTimer > 0) {
      const blindAlpha = Math.min(0.96, (player.flashBlindTimer / 3.6) * (player.flashBlindPeak || 1.0));
      ctx.fillStyle = `rgba(255, 255, 255, ${blindAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (player.concussTimer > 0) {
      const concussAlpha = Math.min(0.32, (player.concussTimer / 3.2) * 0.32);
      ctx.fillStyle = `rgba(110, 165, 215, ${concussAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    // 9. Dynamic Crosshair, Hitmarkers & HUD
    this.drawCrosshair(ctx, w, h, spec, player);
    this.drawHUD(ctx, w, h, spec, player, settings);
    if (settings.graphics.showMinimap) {
      this.drawMinimap(ctx, w, player, env, settings.graphics.showTracers);
    }
  }

  drawCrosshair(ctx, w, h, spec, player) {
    const cx = w * 0.5;
    const cy = h * 0.5;

    if (this.hitMarkerTimer > 0) {
      const alpha = Math.min(1, this.hitMarkerTimer * 5);
      ctx.strokeStyle = this.hitMarkerKill
        ? `rgba(255, 59, 48, ${alpha})`
        : (this.hitMarkerHeadshot ? `rgba(255, 214, 10, ${alpha})` : `rgba(255, 255, 255, ${alpha})`);
      ctx.lineWidth = 2.5;
      const inner = 6;
      const outer = 14;
      ctx.beginPath();
      ctx.moveTo(cx - outer, cy - outer); ctx.lineTo(cx - inner, cy - inner);
      ctx.moveTo(cx + outer, cy - outer); ctx.lineTo(cx + inner, cy - inner);
      ctx.moveTo(cx - outer, cy + outer); ctx.lineTo(cx - inner, cy + inner);
      ctx.moveTo(cx + outer, cy + outer); ctx.lineTo(cx + inner, cy + inner);
      ctx.stroke();
    }

    if (player.holdingEquipSlot) {
      ctx.strokeStyle = 'rgba(255, 214, 10, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    if (!spec) return;

    if (spec.category === 'MELEE') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (player.isAds && spec.category === 'SNIPER') {
      ctx.strokeStyle = 'rgba(15, 18, 16, 0.92)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, cy); ctx.lineTo(w, cy);
      ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(10, 12, 10, 0.85)';
      ctx.lineWidth = Math.max(40, w * 0.18);
      ctx.beginPath();
      ctx.arc(cx, cy, h * 0.48, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    if (player.isAds) {
      ctx.fillStyle = 'rgba(255, 245, 210, 0.9)';
      ctx.beginPath();
      ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const speed = Math.hypot(player.vx, player.vz);
    const gap = 8 + spec.spreadHip * 240 + speed * 2.2 + (player.gunKickBack * 12);
    const len = 9;

    ctx.strokeStyle = 'rgba(245, 250, 240, 0.88)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - gap - len, cy); ctx.lineTo(cx - gap, cy);
    ctx.moveTo(cx + gap, cy);       ctx.lineTo(cx + gap + len, cy);
    ctx.moveTo(cx, cy - gap - len); ctx.lineTo(cx, cy - gap);
    ctx.moveTo(cx, cy + gap);       ctx.lineTo(cx, cy + gap + len);
    ctx.stroke();
  }

  drawHUD(ctx, w, h, spec, player, settings) {
    const state = player.getActiveWeaponState();
    const lSpec = player.getLethalSpec();
    const tSpec = player.getTacticalSpec();
    const speed = Math.hypot(player.vx, player.vz).toFixed(1);
    const pitchDeg = Math.round((player.pitch * 180) / Math.PI);

    // Bottom-Left: Stance, Pitch, Speed & Health
    ctx.fillStyle = 'rgba(15, 18, 16, 0.74)';
    ctx.fillRect(20, h - 105, 315, 85);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.strokeRect(20, h - 105, 315, 85);

    let stanceLabel = player.isSprinting ? 'OMNI-SPRINT' : player.stance;
    if (!player.isGrounded && !player.isMantling) stanceLabel = 'AIRBORNE';

    ctx.fillStyle = (player.stance === 'SLIDE' || player.stance === 'DIVE' || player.isMantling) ? '#5ac8fa' : '#e8ede4';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`STANCE: ${stanceLabel} (${speed} m/s)`, 32, h - 82);

    ctx.fillStyle = '#aeb8b2';
    ctx.font = '11px monospace';
    ctx.fillText(`PITCH: ${pitchDeg > 0 ? '+' : ''}${pitchDeg}°  |  ALT: ${player.altitude.toFixed(2)}m`, 32, h - 64);

    // Health bar
    const hpRatio = Math.max(0, Math.min(1, player.hp / player.maxHp));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(32, h - 50, 190, 12);
    ctx.fillStyle = hpRatio > 0.5 ? '#4cd964' : (hpRatio > 0.25 ? '#ffcc00' : '#ff3b30');
    ctx.fillRect(32, h - 50, 190 * hpRatio, 12);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`HP ${Math.ceil(player.hp)}`, 230, h - 40);

    if (player.holdingEquipSlot) {
      const activeEq = player.holdingEquipSlot === 'LETHAL' ? lSpec : tSpec;
      ctx.fillStyle = '#ffd60a';
      ctx.font = 'bold 12px monospace';
      if (activeEq && activeEq.cookable) {
        const rem = Math.max(0, activeEq.fuse - player.equipHoldTimer).toFixed(1);
        ctx.fillText(`COOKING ${activeEq.name.toUpperCase()} (${rem}s)`, 32, h - 25);
      } else if (activeEq) {
        ctx.fillText(`READY: ${activeEq.name.toUpperCase()}`, 32, h - 25);
      }
    } else if (this.hitMarkerTimer > 0 && this.lastHitInfo) {
      ctx.fillStyle = this.hitMarkerKill ? '#ff453a' : (this.hitMarkerHeadshot ? '#ffd60a' : '#e8ede4');
      ctx.font = 'bold 11px monospace';
      ctx.fillText(this.lastHitInfo, 32, h - 25);
    }

    // Bottom-Right: Weapon Slots, Ammo & Equipment Counters
    ctx.fillStyle = 'rgba(15, 18, 16, 0.74)';
    ctx.fillRect(w - 345, h - 105, 325, 85);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.strokeRect(w - 345, h - 105, 325, 85);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(spec ? spec.name.toUpperCase() : 'UNARMED', w - 34, h - 80);

    if (spec && spec.category === 'MELEE') {
      ctx.fillStyle = '#9fc297';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('MELEE WEAPON', w - 34, h - 55);
    } else if (state) {
      ctx.fillStyle = player.isReloading ? '#ffd60a' : (state.mag <= Math.ceil(spec.magSize * 0.25) ? '#ff453a' : '#e8ede4');
      ctx.font = 'bold 20px monospace';
      ctx.fillText(
        player.isReloading ? `RELOADING ${player.reloadTimer.toFixed(1)}s` : `${state.mag} / ${state.reserve}`,
        w - 34,
        h - 53
      );
    }

    ctx.textAlign = 'left';
    ctx.font = '11px monospace';
    const slotLabels = ['[1] PRI', '[2] SEC', '[3] MEL'];
    for (let s = 0; s < 3; s++) {
      ctx.fillStyle = player.activeSlot === s ? '#ffd60a' : '#7a857e';
      ctx.fillText(slotLabels[s], w - 332 + s * 62, h - 27);
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = '#d4cbb0';
    const lName = lSpec ? lSpec.name.split(' ').pop() : 'Frag';
    const tName = tSpec ? tSpec.name.split(' ').pop() : 'Smoke';
    ctx.fillText(`[G] ${lName}:${player.lethalCount}  [F] ${tName}:${player.tacticalCount}`, w - 34, h - 27);
  }

  drawMinimap(ctx, w, player, env, showTracers) {
    const size = 154;
    const x0 = w - size - 20;
    const y0 = 20;
    const scaleX = size / env.width;
    const scaleZ = size / env.depth;

    ctx.save();
    ctx.fillStyle = 'rgba(14, 17, 15, 0.84)';
    ctx.fillRect(x0, y0, size, size);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x0, y0, size, size);

    for (let gz = 0; gz < env.depth; gz++) {
      for (let gx = 0; gx < env.width; gx++) {
        const cell = env.grid[gz][gx];
        if (cell === 0) continue;
        ctx.fillStyle = cell === 1 ? '#646b66' : (cell === 2 ? '#7a5838' : '#9c8b64');
        ctx.fillRect(x0 + gx * scaleX, y0 + gz * scaleZ, Math.ceil(scaleX), Math.ceil(scaleZ));
      }
    }

    for (const p of env.props) {
      if (p.type === 'CRATE') {
        ctx.fillStyle = '#8e693e';
        ctx.fillRect(x0 + (p.x - p.width * 0.5) * scaleX, y0 + (p.z - p.width * 0.5) * scaleZ, Math.max(3, p.width * scaleX), Math.max(3, p.width * scaleZ));
      } else if (p.type === 'TREE') {
        ctx.fillStyle = '#366438';
        ctx.beginPath();
        ctx.arc(x0 + p.x * scaleX, y0 + p.z * scaleZ, Math.max(2.5, p.width * 0.4 * scaleX), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const s of env.smokeClouds) {
      ctx.fillStyle = 'rgba(200, 206, 210, 0.42)';
      ctx.beginPath();
      ctx.arc(x0 + s.x * scaleX, y0 + s.z * scaleZ, s.radius * scaleX, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const proj of env.projectiles) {
      ctx.fillStyle = proj.spec.slot === 'LETHAL' ? '#ff9f0a' : '#5ac8fa';
      ctx.beginPath();
      ctx.arc(x0 + proj.x * scaleX, y0 + proj.z * scaleZ, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const t of env.targets) {
      if (t.downTimer > 0) continue;
      ctx.fillStyle = t.stunTimer > 0 ? '#5ac8fa' : '#ff3b30';
      ctx.beginPath();
      ctx.arc(x0 + t.x * scaleX, y0 + t.z * scaleZ, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (showTracers) {
      ctx.strokeStyle = 'rgba(255, 225, 120, 0.75)';
      ctx.lineWidth = 1;
      for (const tr of env.tracers) {
        ctx.beginPath();
        ctx.moveTo(x0 + tr.x1 * scaleX, y0 + tr.z1 * scaleZ);
        ctx.lineTo(x0 + tr.x2 * scaleX, y0 + tr.z2 * scaleZ);
        ctx.stroke();
      }
    }

    const px = x0 + player.x * scaleX;
    const pz = y0 + player.z * scaleZ;
    ctx.fillStyle = 'rgba(90, 200, 250, 0.16)';
    ctx.beginPath();
    ctx.moveTo(px, pz);
    ctx.arc(px, pz, 22, player.yaw - 0.55, player.yaw + 0.55);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, pz, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd60a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(px, pz);
    ctx.lineTo(px + Math.cos(player.yaw) * 9, pz + Math.sin(player.yaw) * 9);
    ctx.stroke();

    ctx.restore();
  }
};