// player_controller.js
// Decoupled (x, z) + Vertical Physics, Mantle-on-Top vs Sprint-Vault, Quick Melee & Slot-3 Melee Weapon, Equipment & CoD Recoil

window.WW2 = window.WW2 || {};

WW2.PlayerController = class PlayerController {
  constructor(startX = 14.0, startZ = 5.0, startYaw = Math.PI / 2) {
    this.x = startX;
    this.z = startZ;
    this.vx = 0;
    this.vz = 0;

    // Vertical elevation (feet height above ground in meters)
    this.altitude = 0;
    this.vy = 0;
    this.isGrounded = true;

    this.yaw = startYaw;
    this.pitch = 0;

    // Health & Stance
    this.hp = 100;
    this.maxHp = 100;
    this.stance = 'STAND';   // 'STAND' | 'CROUCH' | 'SLIDE' | 'DIVE' | 'PRONE' | 'MANTLE' | 'VAULT'
    this.eyeHeight = WW2.MOVEMENT.EYE_HEIGHT_STAND;
    this.terrainModifier = 1.0;

    // Toggle / Hold movement state
    this.isSprinting = false;
    this.sprintToggled = false;
    this.isAds = false;

    this.slideDirX = 0;
    this.slideDirZ = 0;
    this.slideSpeed = 0;
    this.slideCooldown = 0;
    this.diveTimer = 0;
    this.diveRecoveryTimer = 0;

    // Mantle / Sprint-Vault interpolation state
    this.isMantling = false;
    this.mantleMode = 'MANTLE'; // 'MANTLE' (onto surface) | 'VAULT' (sprint over barrier)
    this.mantleTimer = 0;
    this.mantleTotalDuration = WW2.MOVEMENT.MANTLE_DURATION;
    this.mantleStartX = 0;
    this.mantleStartZ = 0;
    this.mantleStartAlt = 0;
    this.mantleEndX = 0;
    this.mantleEndZ = 0;
    this.mantleEndAlt = 0;

    // Three-slot weapon loadout: [Primary (0), Secondary (1), Melee (2)]
    this.slots = [null, null, null];
    this.activeSlot = 0;
    this.lastGunSlot = 0;

    // Quick Melee (Gun Butt) & Dedicated Melee Weapon State
    this.meleeHoldActive = false;
    this.meleeHoldTimer = 0;
    this.meleeHoldTriggered = false;
    this.meleeCooldown = 0;
    this.meleeSwingTimer = 0;
    this.meleeSwingDuration = WW2.MELEE_CONSTANTS.BUTT_SWING_DURATION;
    this.meleeSwingType = 'BUTT'; // 'BUTT' | 'SLASH'

    // Tacticals & Lethals Loadout
    this.lethalId = 'frag';
    this.lethalCount = 3;
    this.tacticalId = 'smoke';
    this.tacticalCount = 3;

    this.holdingEquipSlot = null; // 'LETHAL' | 'TACTICAL' | null
    this.equipHoldTimer = 0;

    // Tactical status effects on player
    this.flashBlindTimer = 0;
    this.flashBlindPeak = 0;
    this.concussTimer = 0;

    // Firing & Real Persistent Recoil State
    this.fireTimer = 0;
    this.triggerReleased = true;
    this.isReloading = false;
    this.reloadTimer = 0;

    this.viewKickPitch = 0;
    this.viewKickYaw = 0;
    this.gunKickBack = 0;
    this.bobTimer = 0;

    // Input state
    this.keys = {};
    this.mouseDown = false;
    this.rightMouseDown = false;
  }

  equipWeapon(weaponId, slotIndex = 0, customAmmo = null) {
    const template = WW2.WEAPONS[weaponId];
    if (!template) return;
    this.slots[slotIndex] = {
      id: template.id,
      mag: customAmmo?.mag ?? template.magSize,
      reserve: customAmmo?.reserve ?? template.reserveMax
    };
    this.activeSlot = slotIndex;
    if (slotIndex === 0 || slotIndex === 1) {
      this.lastGunSlot = slotIndex;
    }
    this.isReloading = false;
    this.reloadTimer = 0;
  }

  getActiveWeaponSpec() {
    const slot = this.slots[this.activeSlot];
    return slot ? WW2.WEAPONS[slot.id] : null;
  }

  getActiveWeaponState() {
    return this.slots[this.activeSlot];
  }

  getLethalSpec() {
    return WW2.EQUIPMENT[this.lethalId];
  }

  getTacticalSpec() {
    return WW2.EQUIPMENT[this.tacticalId];
  }

  cycleLethal() {
    if (this.holdingEquipSlot) return;
    const idx = WW2.LETHAL_ORDER.indexOf(this.lethalId);
    this.lethalId = WW2.LETHAL_ORDER[(idx + 1) % WW2.LETHAL_ORDER.length];
    this.lethalCount = 3;
  }

  cycleTactical() {
    if (this.holdingEquipSlot) return;
    const idx = WW2.TACTICAL_ORDER.indexOf(this.tacticalId);
    this.tacticalId = WW2.TACTICAL_ORDER[(idx + 1) % WW2.TACTICAL_ORDER.length];
    this.tacticalCount = 3;
  }

  restockEquipment() {
    this.lethalCount = 3;
    this.tacticalCount = 3;
    this.flashBlindTimer = 0;
    this.concussTimer = 0;
  }

  switchSlot(slotIndex) {
    if (slotIndex === this.activeSlot || !this.slots[slotIndex] || this.holdingEquipSlot) return;
    this.activeSlot = slotIndex;
    if (slotIndex === 0 || slotIndex === 1) {
      this.lastGunSlot = slotIndex;
    }
    this.isReloading = false;
    this.reloadTimer = 0;
    this.isAds = false;
    this.fireTimer = 0.16;
  }

  equipMeleeSlot() {
    if (!this.slots[2]) return;
    this.switchSlot(2);
  }

  quickSwapWeapon() {
    if (this.activeSlot === 2) {
      this.switchSlot(this.slots[this.lastGunSlot] ? this.lastGunSlot : 0);
    } else {
      const nextGun = this.activeSlot === 0 ? 1 : 0;
      if (this.slots[nextGun]) {
        this.switchSlot(nextGun);
      }
    }
  }

  triggerMeleeAttack(onMeleeCallback) {
    if (this.meleeCooldown > 0 || this.isMantling || this.stance === 'DIVE' || this.holdingEquipSlot) return;

    const spec = this.getActiveWeaponSpec();
    const isDedicatedMelee = Boolean(spec && spec.category === 'MELEE');
    const M = WW2.MELEE_CONSTANTS;
    const MAX_PITCH = WW2.MOVEMENT.MAX_PITCH;

    this.isReloading = false;
    this.reloadTimer = 0;
    this.isAds = false;
    this.isSprinting = false;
    this.sprintToggled = false;

    this.meleeSwingType = isDedicatedMelee ? 'SLASH' : 'BUTT';
    this.meleeSwingDuration = isDedicatedMelee ? (60 / spec.rpm) * 0.65 : M.BUTT_SWING_DURATION;
    this.meleeSwingTimer = this.meleeSwingDuration;
    this.meleeCooldown = isDedicatedMelee ? (60 / spec.rpm) : M.BUTT_COOLDOWN;

    this.viewKickPitch -= 0.018;
    this.viewKickYaw += isDedicatedMelee ? -0.025 : 0.025;

    const clampedMeleePitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitch + (this.viewKickPitch || 0)));

    if (onMeleeCallback) {
      onMeleeCallback({
        isDedicatedMelee,
        weapon: spec,
        originX: this.x,
        originZ: this.z,
        originEyeHeight: this.altitude + this.eyeHeight,
        yaw: this.yaw,
        pitchAngle: clampedMeleePitch,
        range: isDedicatedMelee ? spec.rangeMax : M.BUTT_RANGE,
        damage: isDedicatedMelee ? spec.damage : M.BUTT_DAMAGE,
        headshotMult: isDedicatedMelee ? spec.headshotMult : M.BUTT_HEADSHOT_MULT
      });
    }
  }

  handleMeleeInputDown(code, settings, onMeleeCallback) {
    const qmBind = settings.bindings.quickMelee;
    const emBind = settings.bindings.equipMelee;

    if (qmBind === emBind) {
      if (code === qmBind && !this.meleeHoldActive) {
        this.meleeHoldActive = true;
        this.meleeHoldTimer = 0;
        this.meleeHoldTriggered = false;
      }
    } else {
      if (code === qmBind) {
        this.triggerMeleeAttack(onMeleeCallback);
      } else if (code === emBind) {
        this.equipMeleeSlot();
      }
    }
  }

  handleMeleeInputUp(code, settings, onMeleeCallback) {
    const qmBind = settings.bindings.quickMelee;
    const emBind = settings.bindings.equipMelee;

    if (qmBind === emBind && code === qmBind && this.meleeHoldActive) {
      const alreadyEquippedByHold = this.meleeHoldTriggered;
      this.meleeHoldActive = false;
      this.meleeHoldTimer = 0;
      this.meleeHoldTriggered = false;

      if (!alreadyEquippedByHold) {
        this.triggerMeleeAttack(onMeleeCallback);
      }
    }
  }

  startReload() {
    const spec = this.getActiveWeaponSpec();
    const state = this.getActiveWeaponState();
    if (!spec || !state || spec.category === 'MELEE' || this.isReloading || this.isMantling || this.holdingEquipSlot) return;
    if (state.mag >= spec.magSize || state.reserve <= 0) return;

    this.isReloading = true;
    this.reloadTimer = spec.reloadTime;
    this.isAds = false;
    this.sprintToggled = false;
  }

  applyMouseLook(movementX, movementY, settings) {
    const M = WW2.MOVEMENT;
    const ctrl = settings.controls;
    const spec = this.getActiveWeaponSpec();

    let radPerCount = ctrl.mouseSens * M.COD_YAW_DEG_PER_COUNT * (Math.PI / 180);

    if (this.isAds && spec && spec.category !== 'MELEE') {
      const hipFovRad = (settings.graphics.fov * Math.PI) / 180;
      const adsFovRad = hipFovRad / spec.adsZoom;
      const zoomScale = Math.tan(adsFovRad * 0.5) / Math.tan(hipFovRad * 0.5);
      radPerCount *= zoomScale * ctrl.adsSensMult;
    }

    if (this.concussTimer > 0) {
      radPerCount *= 0.65;
    }

    const MAX_PITCH = M.MAX_PITCH;
    const ySign = ctrl.invertY ? 1 : -1;
    this.yaw += movementX * radPerCount;
    this.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitch + movementY * radPerCount * ySign));
  }

  handleJumpOrMantleInput(env) {
    if (this.isMantling || this.stance === 'DIVE') return;

    if (env && typeof env.getMantleTarget === 'function') {
      const target = env.getMantleTarget(this.x, this.z, this.yaw, this.altitude, this.isSprinting);
      if (target) {
        this.isMantling = true;
        this.mantleMode = target.mode || 'MANTLE';
        this.mantleTotalDuration = (this.mantleMode === 'VAULT')
          ? WW2.MOVEMENT.VAULT_DURATION
          : WW2.MOVEMENT.MANTLE_DURATION;
        this.mantleTimer = this.mantleTotalDuration;

        this.mantleStartX = this.x;
        this.mantleStartZ = this.z;
        this.mantleStartAlt = this.altitude;
        this.mantleEndX = target.landX;
        this.mantleEndZ = target.landZ;
        this.mantleEndAlt = target.landAlt;

        this.stance = this.mantleMode;
        this.vy = 0;
        this.isGrounded = false;
        this.isAds = false;
        this.isSprinting = false;
        return;
      }
    }

    if (this.isGrounded && (this.stance === 'CROUCH' || this.stance === 'PRONE')) {
      this.stance = 'STAND';
      return;
    }

    if (this.isGrounded) {
      if (this.stance === 'SLIDE') {
        this.stance = 'STAND';
        this.slideCooldown = WW2.MOVEMENT.SLIDE_COOLDOWN;
      }
      this.vy = WW2.MOVEMENT.JUMP_IMPULSE;
      this.isGrounded = false;
    }
  }

  handleLethalKeyDown() {
    if (this.isMantling || this.stance === 'DIVE' || this.holdingEquipSlot) return;
    if (this.lethalCount <= 0) return;

    const spec = this.getLethalSpec();
    if (!spec) return;

    this.isAds = false;
    this.isReloading = false;
    this.sprintToggled = false;
    this.holdingEquipSlot = 'LETHAL';
    this.equipHoldTimer = 0;
  }

  handleLethalKeyUp(onEquipAction) {
    if (this.holdingEquipSlot !== 'LETHAL') return;
    const spec = this.getLethalSpec();
    this.holdingEquipSlot = null;
    if (!spec || this.lethalCount <= 0) return;

    this.lethalCount -= 1;

    if (spec.deployable) {
      if (onEquipAction) {
        onEquipAction({
          type: 'DEPLOY',
          spec,
          x: this.x,
          z: this.z,
          altitude: this.altitude,
          yaw: this.yaw
        });
      }
      return;
    }

    const remainingFuse = spec.cookable
      ? Math.max(0.15, spec.fuse - this.equipHoldTimer)
      : spec.fuse;

    if (onEquipAction) {
      onEquipAction({
        type: 'THROW',
        spec,
        x: this.x,
        z: this.z,
        eyeHeight: this.altitude + this.eyeHeight,
        yaw: this.yaw,
        pitch: this.pitch,
        vx: this.vx,
        vz: this.vz,
        fuse: remainingFuse
      });
    }
  }

  handleTacticalKeyDown() {
    if (this.isMantling || this.stance === 'DIVE' || this.holdingEquipSlot) return;
    if (this.tacticalCount <= 0) return;

    this.isAds = false;
    this.isReloading = false;
    this.sprintToggled = false;
    this.holdingEquipSlot = 'TACTICAL';
    this.equipHoldTimer = 0;
  }

  handleTacticalKeyUp(onEquipAction) {
    if (this.holdingEquipSlot !== 'TACTICAL') return;
    const spec = this.getTacticalSpec();
    this.holdingEquipSlot = null;
    if (!spec || this.tacticalCount <= 0) return;

    this.tacticalCount -= 1;
    if (onEquipAction) {
      onEquipAction({
        type: 'THROW',
        spec,
        x: this.x,
        z: this.z,
        eyeHeight: this.altitude + this.eyeHeight,
        yaw: this.yaw,
        pitch: this.pitch,
        vx: this.vx,
        vz: this.vz,
        fuse: spec.fuse
      });
    }
  }

  handleSprintKeyDown(settings) {
    if (settings.movement.sprintBehavior === 'TOGGLE') {
      this.sprintToggled = !this.sprintToggled;
    }
  }

  handleCrouchKeyDown(settings) {
    if (this.stance === 'DIVE' || this.isMantling) return;

    const movingHorizontally = Math.hypot(this.vx, this.vz) > 4.0;
    if (this.isGrounded && this.isSprinting && movingHorizontally && this.slideCooldown <= 0 && this.stance === 'STAND') {
      const mag = Math.hypot(this.vx, this.vz);
      this.slideDirX = this.vx / mag;
      this.slideDirZ = this.vz / mag;
      this.slideSpeed = WW2.MOVEMENT.SLIDE_IMPULSE;
      this.stance = 'SLIDE';
      this.isSprinting = false;
      this.sprintToggled = false;
      this.isAds = false;
      return;
    }

    if (settings.movement.crouchBehavior === 'HOLD') {
      if (this.stance === 'STAND' || this.stance === 'PRONE') {
        this.stance = 'CROUCH';
        this.sprintToggled = false;
      }
    } else {
      if (this.stance === 'STAND') {
        this.stance = 'CROUCH';
        this.sprintToggled = false;
      } else if (this.stance === 'CROUCH' || this.stance === 'PRONE') {
        this.stance = 'STAND';
      }
    }
  }

  handleCrouchKeyUp(settings) {
    if (settings.movement.crouchBehavior === 'HOLD' && this.stance === 'CROUCH') {
      this.stance = 'STAND';
    }
  }

  handleProneKeyDown(settings) {
    if (this.stance === 'DIVE' || this.isMantling) return;

    const movingHorizontally = Math.hypot(this.vx, this.vz) > 4.2;
    if (this.isGrounded && this.isSprinting && movingHorizontally && this.stance === 'STAND') {
      const mag = Math.hypot(this.vx, this.vz);
      this.slideDirX = this.vx / mag;
      this.slideDirZ = this.vz / mag;
      this.slideSpeed = WW2.MOVEMENT.DIVE_IMPULSE;
      this.stance = 'DIVE';
      this.diveTimer = WW2.MOVEMENT.DIVE_DURATION;
      this.diveRecoveryTimer = WW2.MOVEMENT.DIVE_RECOVERY;
      this.isSprinting = false;
      this.sprintToggled = false;
      this.isAds = false;
      return;
    }

    if (settings.movement.proneBehavior === 'HOLD') {
      if (this.stance !== 'PRONE') {
        this.stance = 'PRONE';
        this.sprintToggled = false;
      }
    } else {
      if (this.stance === 'PRONE') {
        this.stance = 'STAND';
      } else {
        this.stance = 'PRONE';
        this.sprintToggled = false;
      }
    }
  }

  handleProneKeyUp(settings) {
    if (settings.movement.proneBehavior === 'HOLD' && this.stance === 'PRONE') {
      this.stance = 'STAND';
    }
  }

  update(dt, settings, env, onFireCallback, onEquipAction, onMeleeCallback) {
    const M = WW2.MOVEMENT;
    const binds = settings.bindings;
    const moveSet = settings.movement;
    const weaponSpec = this.getActiveWeaponSpec();
    const weaponMult = weaponSpec ? weaponSpec.moveMult : 1.04;

    if (this.slideCooldown > 0) this.slideCooldown -= dt;
    if (this.fireTimer > 0) this.fireTimer -= dt;
    if (this.meleeCooldown > 0) this.meleeCooldown = Math.max(0, this.meleeCooldown - dt);
    if (this.meleeSwingTimer > 0) this.meleeSwingTimer = Math.max(0, this.meleeSwingTimer - dt);
    if (this.flashBlindTimer > 0) this.flashBlindTimer = Math.max(0, this.flashBlindTimer - dt);
    if (this.concussTimer > 0) this.concussTimer = Math.max(0, this.concussTimer - dt);

    if (this.meleeHoldActive) {
      this.meleeHoldTimer += dt;
      if (!this.meleeHoldTriggered && this.meleeHoldTimer >= WW2.MELEE_CONSTANTS.HOLD_EQUIP_TIME) {
        this.meleeHoldTriggered = true;
        this.equipMeleeSlot();
      }
    }

    if (this.holdingEquipSlot) {
      this.equipHoldTimer += dt;
      if (this.holdingEquipSlot === 'LETHAL') {
        const lSpec = this.getLethalSpec();
        if (lSpec && lSpec.cookable && this.equipHoldTimer >= lSpec.fuse) {
          this.holdingEquipSlot = null;
          this.lethalCount = Math.max(0, this.lethalCount - 1);
          if (onEquipAction) {
            onEquipAction({
              type: 'OVERCOOK',
              spec: lSpec,
              x: this.x,
              z: this.z,
              altitude: this.altitude
            });
          }
        }
      }
    }

    if (this.isMantling) {
      this.mantleTimer -= dt;
      const t = Math.min(1, 1 - (this.mantleTimer / this.mantleTotalDuration));
      const ease = 1 - Math.pow(1 - t, 2);
      const peakArc = (this.mantleMode === 'VAULT') ? 1.25 : 0.25;
      const arc = Math.sin(t * Math.PI) * peakArc;

      this.x = this.mantleStartX + (this.mantleEndX - this.mantleStartX) * ease;
      this.z = this.mantleStartZ + (this.mantleEndZ - this.mantleStartZ) * ease;
      this.altitude = this.mantleStartAlt + (this.mantleEndAlt - this.mantleStartAlt) * ease + arc;
      this.vx = (this.mantleEndX - this.mantleStartX) / this.mantleTotalDuration;
      this.vz = (this.mantleEndZ - this.mantleStartZ) / this.mantleTotalDuration;

      this.eyeHeight = M.EYE_HEIGHT_STAND - Math.sin(t * Math.PI) * 0.35;

      if (this.mantleTimer <= 0) {
        this.isMantling = false;
        this.stance = 'STAND';
        this.altitude = this.mantleEndAlt;
        this.vy = 0;
        this.isGrounded = true;
      }

      this.updateWeapon(dt, onFireCallback, onMeleeCallback);
      return;
    }

    let moveForward = 0;
    let moveStrafe = 0;
    if (this.keys[binds.moveForward]) moveForward += 1;
    if (this.keys[binds.moveBack]) moveForward -= 1;
    if (this.keys[binds.moveRight]) moveStrafe += 1;
    if (this.keys[binds.moveLeft]) moveStrafe -= 1;

    const inputLen = Math.hypot(moveForward, moveStrafe);
    if (inputLen > 0) {
      moveForward /= inputLen;
      moveStrafe /= inputLen;
    }

    const cosY = Math.cos(this.yaw);
    const sinY = Math.sin(this.yaw);
    const wishX = (cosY * moveForward) - (sinY * moveStrafe);
    const wishZ = (sinY * moveForward) + (cosY * moveStrafe);

    this.isAds = Boolean(
      this.rightMouseDown &&
      weaponSpec &&
      weaponSpec.category !== 'MELEE' &&
      !this.isReloading &&
      !this.holdingEquipSlot &&
      this.meleeSwingTimer <= 0 &&
      this.stance !== 'DIVE'
    );

    if (inputLen === 0 || this.isAds || this.isReloading || this.holdingEquipSlot || this.concussTimer > 0) {
      this.sprintToggled = false;
    }

    let wantsSprint = false;
    if (moveSet.autoOmniSprint && inputLen > 0 && !this.isAds && !this.isReloading && !this.holdingEquipSlot && this.concussTimer <= 0) {
      wantsSprint = true;
    } else if (moveSet.sprintBehavior === 'TOGGLE') {
      wantsSprint = Boolean(this.sprintToggled && inputLen > 0 && !this.isAds && !this.isReloading && !this.holdingEquipSlot && this.concussTimer <= 0);
    } else {
      wantsSprint = Boolean(this.keys[binds.sprint] && inputLen > 0 && !this.isAds && !this.isReloading && !this.holdingEquipSlot && this.concussTimer <= 0);
    }

    if (wantsSprint && (this.stance === 'CROUCH' || this.stance === 'PRONE')) {
      const holdingCrouch = (moveSet.crouchBehavior === 'HOLD' && this.keys[binds.crouchSlide]);
      const holdingProne = (moveSet.proneBehavior === 'HOLD' && this.keys[binds.diveProne]);
      if (!holdingCrouch && !holdingProne) {
        this.stance = 'STAND';
      }
    }
    this.isSprinting = wantsSprint && this.stance === 'STAND';

    const concussMult = this.concussTimer > 0 ? 0.55 : 1.0;

    if (this.stance === 'SLIDE') {
      this.slideSpeed -= M.SLIDE_FRICTION * dt;
      this.vx = this.slideDirX * this.slideSpeed * this.terrainModifier * concussMult;
      this.vz = this.slideDirZ * this.slideSpeed * this.terrainModifier * concussMult;

      if (this.slideSpeed <= M.SLIDE_MIN_SPEED) {
        this.stance = (moveSet.crouchBehavior === 'HOLD' && !this.keys[binds.crouchSlide]) ? 'STAND' : 'CROUCH';
        this.slideCooldown = M.SLIDE_COOLDOWN;
      }
    } else if (this.stance === 'DIVE') {
      if (this.diveTimer > 0) {
        this.diveTimer -= dt;
        this.vx = this.slideDirX * this.slideSpeed * this.terrainModifier;
        this.vz = this.slideDirZ * this.slideSpeed * this.terrainModifier;
      } else {
        this.vx *= 0.82;
        this.vz *= 0.82;
        this.diveRecoveryTimer -= dt;
        if (this.diveRecoveryTimer <= 0) {
          this.stance = (moveSet.proneBehavior === 'HOLD' && !this.keys[binds.diveProne]) ? 'STAND' : 'PRONE';
        }
      }
    } else {
      let targetSpeed = M.BASE_WALK_SPEED;
      if (this.isSprinting) targetSpeed = M.OMNI_SPRINT_SPEED;
      else if (this.stance === 'CROUCH') targetSpeed = M.CROUCH_SPEED;
      else if (this.stance === 'PRONE') targetSpeed = M.PRONE_SPEED;

      targetSpeed *= weaponMult * this.terrainModifier * concussMult;
      if (this.isAds && weaponSpec) {
        targetSpeed *= weaponSpec.adsMoveMult;
      }

      const rate = this.isGrounded ? (inputLen > 0 ? M.ACCEL : M.FRICTION) : 4.5;
      const targetVx = wishX * targetSpeed;
      const targetVz = wishZ * targetSpeed;
      this.vx += (targetVx - this.vx) * Math.min(1, rate * dt);
      this.vz += (targetVz - this.vz) * Math.min(1, rate * dt);
    }

    const nextX = this.x + this.vx * dt;
    if (!env || !env.isBlocked(nextX, this.z, M.PLAYER_RADIUS, this.altitude)) {
      this.x = nextX;
    } else {
      this.vx = 0;
    }

    const nextZ = this.z + this.vz * dt;
    if (!env || !env.isBlocked(this.x, nextZ, M.PLAYER_RADIUS, this.altitude)) {
      this.z = nextZ;
    } else {
      this.vz = 0;
    }

    const supportHeight = env && typeof env.getSupportHeight === 'function'
      ? env.getSupportHeight(this.x, this.z, this.altitude)
      : 0;

    if (this.altitude > supportHeight || this.vy > 0) {
      this.vy -= M.GRAVITY * dt;
      this.altitude += this.vy * dt;
      this.isGrounded = false;

      if (this.altitude <= supportHeight && this.vy <= 0) {
        this.altitude = supportHeight;
        this.vy = 0;
        this.isGrounded = true;
      }
    } else {
      this.altitude = supportHeight;
      this.vy = 0;
      this.isGrounded = true;
    }

    let targetEye = M.EYE_HEIGHT_STAND;
    if (this.stance === 'CROUCH') targetEye = M.EYE_HEIGHT_CROUCH;
    else if (this.stance === 'SLIDE') targetEye = M.EYE_HEIGHT_SLIDE;
    else if (this.stance === 'DIVE' || this.stance === 'PRONE') targetEye = M.EYE_HEIGHT_PRONE;

    this.eyeHeight += (targetEye - this.eyeHeight) * Math.min(1, M.EYE_LERP_SPEED * dt);

    const currentSpeed = Math.hypot(this.vx, this.vz);
    if (this.isGrounded && currentSpeed > 0.3 && (this.stance === 'STAND' || this.stance === 'CROUCH')) {
      this.bobTimer += dt * currentSpeed * 1.9;
    }

    this.updateWeapon(dt, onFireCallback, onMeleeCallback);
  }

  updateWeapon(dt, onFireCallback, onMeleeCallback) {
    this.viewKickPitch *= Math.pow(0.002, dt);
    this.viewKickYaw *= Math.pow(0.002, dt);
    this.gunKickBack = Math.max(0, this.gunKickBack - dt * 4.5);

    const spec = this.getActiveWeaponSpec();
    const state = this.getActiveWeaponState();
    if (!spec || !state) return;

    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        const needed = spec.magSize - state.mag;
        const loaded = Math.min(needed, state.reserve);
        state.mag += loaded;
        state.reserve -= loaded;
        this.isReloading = false;
      }
      return;
    }

    if (!this.mouseDown) {
      this.triggerReleased = true;
      return;
    }

    if (spec.category === 'MELEE') {
      if (this.triggerReleased && this.meleeCooldown <= 0 && this.stance !== 'DIVE' && !this.isMantling && !this.holdingEquipSlot) {
        this.triggerReleased = false;
        this.triggerMeleeAttack(onMeleeCallback);
      }
      return;
    }

    const MAX_PITCH = WW2.MOVEMENT.MAX_PITCH;
    const canFireMode = (spec.fireMode === 'AUTO') || this.triggerReleased;
    if (canFireMode && this.fireTimer <= 0 && state.mag > 0 && this.stance !== 'DIVE' && !this.isMantling && !this.holdingEquipSlot && this.meleeSwingTimer <= 0) {
      state.mag -= 1;
      this.fireTimer = 60 / spec.rpm;
      this.triggerReleased = false;
      this.isSprinting = false;
      this.sprintToggled = false;

      const adsScale = this.isAds ? 0.72 : 1.0;
      const stanceScale = (this.stance === 'CROUCH' || this.stance === 'PRONE') ? 0.80 : 1.0;
      const climbPitch = spec.recoilPitch * adsScale * stanceScale * (0.85 + Math.random() * 0.3);
      const climbYaw = ((spec.recoilBiasYaw || 0) + (Math.random() - 0.5) * 2 * spec.recoilYaw) * adsScale * stanceScale;

      this.pitch = Math.min(MAX_PITCH, this.pitch + climbPitch);
      this.yaw += climbYaw;

      this.viewKickPitch += climbPitch * 0.55;
      this.viewKickYaw += climbYaw * 0.45;
      this.gunKickBack = Math.min(1.0, this.gunKickBack + 0.42);

      const spread = this.isAds ? spec.spreadAds : spec.spreadHip;
      const shotYaw = this.yaw + this.viewKickYaw + (Math.random() - 0.5) * spread;
      const rawAimPitch = this.pitch + this.viewKickPitch + (Math.random() - 0.5) * spread * 0.65;
      const clampedAimPitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, rawAimPitch));

      if (onFireCallback) {
        onFireCallback({
          weapon: spec,
          originX: this.x,
          originZ: this.z,
          originEyeHeight: this.altitude + this.eyeHeight,
          shotYaw: shotYaw,
          shotPitchAngle: clampedAimPitch,
          remainingMag: state.mag
        });
      }

      if (state.mag === 0 && state.reserve > 0) {
        this.startReload();
      }
    }
  }
};