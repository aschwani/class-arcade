// asset_manager.js
// Three.js .GLB First-Person Viewmodel & True-Scale 3D World Equipment Renderer (True 3D Pitch Synced)

window.WW2 = window.WW2 || {};

WW2.AssetManager = class AssetManager {
  constructor() {
    this.MODEL_CONFIG = {
      // --- SMGs (models/smgs/) ---
      thompson_m1928: {
        file: 'models/smgs/thompson_m1928.glb',
        scale: 0.72,
        pos: [0.21, -0.20, -0.50],
        adsPos: [0.0, -0.140, -0.44],
        rot: [0, 0, 0]
      },
      mp40: {
        file: 'models/smgs/mp40.glb',
        scale: 0.72,
        pos: [0.21, -0.20, -0.50],
        adsPos: [0.0, -0.140, -0.44],
        rot: [0, 180, 0]
      },
      grease_gun: {
        file: 'models/smgs/m3_grease_gun.glb',
        scale: 0.68,
        pos: [0.21, -0.20, -0.48],
        adsPos: [0.0, -0.140, -0.42],
        rot: [0, 0, 0]
      },
      sten: {
        file: 'models/smgs/sten_mk2.glb',
        scale: 0.72,
        pos: [0.21, -0.20, -0.50],
        adsPos: [0.0, -0.140, -0.44],
        rot: [0, 0, 0]
      },
      ppsh_41: {
        file: 'models/smgs/ppsh_41.glb',
        scale: 0.76,
        pos: [0.21, -0.20, -0.52],
        adsPos: [0.0, -0.140, -0.46],
        rot: [0, 270, 0]
      },

      // --- ARs (models/ars/) ---
      stg_44: {
        file: 'models/ars/stg44.glb',
        scale: 0.80,
        pos: [0.21, -0.20, -0.52],
        adsPos: [0.0, -0.140, -0.46],
        rot: [0, 180, 0]
      },
      fg42: {
        file: 'models/ars/fg_42.glb',
        scale: 0.82,
        pos: [0.21, -0.20, -0.54],
        adsPos: [0.0, -0.140, -0.48],
        rot: [0, 270, 0]
      },
      m2_carbine: {
        file: 'models/ars/m2_carbine.glb',
        scale: 0.78,
        pos: [0.21, -0.20, -0.52],
        adsPos: [0.0, -0.138, -0.46],
        rot: [0, 270, 0]
      },
      fedorov_avtomat: {
        file: 'models/ars/fedorov_avtomat.glb',
        scale: 0.80,
        pos: [0.21, -0.20, -0.53],
        adsPos: [0.0, -0.140, -0.47],
        rot: [0, 180, 0]
      },
      bar_m1918: {
        file: 'models/ars/bar_m1918.glb',
        scale: 0.88,
        pos: [0.22, -0.22, -0.56],
        adsPos: [0.0, -0.142, -0.50],
        rot: [0, 180, 0]
      },

      // --- Snipers (models/snipers/) ---
      m1903a4_springfield: {
        file: 'models/snipers/m1903a4_springfield.glb',
        scale: 0.88,
        pos: [0.21, -0.21, -0.56],
        adsPos: [0.0, -0.136, -0.50],
        rot: [0, 90, 0]
      },
      mosin_nagant: {
        file: 'models/snipers/mosin_nagant.glb',
        scale: 0.90,
        pos: [0.21, -0.21, -0.58],
        adsPos: [0.0, -0.136, -0.51],
        rot: [0, 90, 0]
      },
      kar_98k: {
        file: 'models/snipers/kar98k.glb',
        scale: 0.88,
        pos: [0.21, -0.21, -0.56],
        adsPos: [0.0, -0.136, -0.50],
        rot: [0, 180, 0]
      },
      type_97_sniper: {
        file: 'models/snipers/type_97.glb',
        scale: 0.90,
        pos: [0.21, -0.21, -0.58],
        adsPos: [0.0, -0.136, -0.51],
        rot: [0, 90, 0]
      },
      svt_40: {
        file: 'models/snipers/svt_40.glb',
        scale: 0.86,
        pos: [0.21, -0.21, -0.55],
        adsPos: [0.0, -0.138, -0.49],
        rot: [0, 0, 0]
      },

      // --- Pistols (models/pistols/) ---
      colt_m1911a1: {
        file: 'models/pistols/colt_m1911a1.glb',
        scale: 0.34,
        pos: [0.19, -0.19, -0.42],
        adsPos: [0.0, -0.128, -0.36],
        rot: [0, 0, 0]
      },
      tokarev_tt33: {
        file: 'models/pistols/tt_33.glb',
        scale: 0.34,
        pos: [0.19, -0.19, -0.42],
        adsPos: [0.0, -0.128, -0.36],
        rot: [0, 270, 0]
      },
      luger_p08: {
        file: 'models/pistols/luger_p08.glb',
        scale: 0.34,
        pos: [0.19, -0.19, -0.42],
        adsPos: [0.0, -0.128, -0.36],
        rot: [0, 90, 0]
      },
      type_26_revolver: {
        file: 'models/pistols/type_26.glb',
        scale: 0.36,
        pos: [0.19, -0.19, -0.42],
        adsPos: [0.0, -0.128, -0.36],
        rot: [0, 90, 0]
      },
      colt_m1917: {
        file: 'models/pistols/colt_m1917.glb',
        scale: 0.36,
        pos: [0.19, -0.19, -0.42],
        adsPos: [0.0, -0.128, -0.36],
        rot: [0, 270, 0]
      },

      // --- Melee (models/knives/) ---
      trench_knife: {
        file: 'models/knives/trench_knife.glb',
        scale: 0.38,
        pos: [0.22, -0.20, -0.42],
        adsPos: [0.16, -0.18, -0.38],
        rot: [15, 160, -12],
        isMelee: true
      },
      entrenching_shovel: {
        file: 'models/knives/entrenching_shovel.glb',
        scale: 0.56,
        pos: [0.24, -0.22, -0.46],
        adsPos: [0.18, -0.19, -0.42],
        rot: [15, 160, -12],
        isMelee: true
      },
      type_95_shin_gunto: {
        file: 'models/knives/type_95_shin_gunto.glb',
        scale: 0.72,
        pos: [0.24, -0.22, -0.48],
        adsPos: [0.18, -0.19, -0.44],
        rot: [15, 160, -12],
        isMelee: true
      },

      // --- Lethals (models/lethals/) ---
      frag: {
        file: 'models/lethals/mk2_frag.glb',
        scale: 0.19,
        worldScale: 0.15,
        pos: [0.20, -0.19, -0.36],
        adsPos: [0.14, -0.16, -0.33],
        rot: [0, 0, 15],
        isEquip: true
      },
      sticky: {
        file: 'models/lethals/sticky_grenade.glb',
        scale: 0.21,
        worldScale: 0.15,
        pos: [0.20, -0.19, -0.36],
        adsPos: [0.14, -0.16, -0.33],
        rot: [0, 0, 15],
        isEquip: true
      },
      claymore: {
        file: 'models/lethals/mine.glb',
        scale: 0.28,
        worldScale: 0.24,
        pos: [0.18, -0.21, -0.40],
        adsPos: [0.12, -0.18, -0.36],
        rot: [0, 0, 0],
        isEquip: true
      },

      // --- Tacticals (models/tacticals/) ---
      smoke: {
        file: 'models/tacticals/m18_smoke.glb',
        scale: 0.21,
        worldScale: 0.18,
        pos: [0.20, -0.19, -0.36],
        adsPos: [0.14, -0.16, -0.33],
        rot: [0, 0, 10],
        isEquip: true
      },
      flashbang: {
        file: 'models/tacticals/flashbang.glb',
        scale: 0.20,
        worldScale: 0.15,
        pos: [0.20, -0.19, -0.36],
        adsPos: [0.14, -0.16, -0.33],
        rot: [0, 0, 10],
        isEquip: true
      },
      concussion: {
        file: 'models/tacticals/concussion.glb',
        scale: 0.20,
        worldScale: 0.15,
        pos: [0.20, -0.19, -0.36],
        adsPos: [0.14, -0.16, -0.33],
        rot: [0, 0, 10],
        isEquip: true
      }
    };

    this.DEFAULT_GUN_CFG = {
      scale: 0.76,
      pos: [0.21, -0.20, -0.52],
      adsPos: [0.0, -0.140, -0.46],
      rot: [0, 0, 0]
    };

    this.models = {};
    this.unitModels = {};
    this.worldClonePools = {};
    this.loadStatus = {};
    this.currentActiveId = null;

    this.adsLerp = 0;
    this.sprintLerp = 0;
    this.reloadLerp = 0;
    this.recoilKick = 0;
    this.meleeSlash = 0;
    this.bobPhase = 0;
    this.lastFrameTime = performance.now();

    this.threeReady = Boolean(window.THREE && THREE.GLTFLoader);
    if (this.threeReady) {
      this.initThreeScene();
    } else {
      console.warn('[AssetManager] Three.js or GLTFLoader not found; using 2D fallback viewmodels.');
    }
  }

  initThreeScene() {
    this.glCanvas = document.createElement('canvas');
    this.glCanvas.width = window.innerWidth;
    this.glCanvas.height = window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.glCanvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(this.glCanvas.width, this.glCanvas.height, false);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // 1. First-Person Viewmodel Scene
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(65, this.glCanvas.width / this.glCanvas.height, 0.01, 20);
    this.camera.position.set(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xe6f0fa, 0x6b6456, 1.2);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e4, 1.45);
    keyLight.position.set(1.5, 2.5, 1.5);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x9bc4e8, 0.8);
    rimLight.position.set(-1.8, 1.0, -2.0);
    this.scene.add(rimLight);

    this.muzzleLight = new THREE.PointLight(0xffaa33, 0, 2.5);
    this.muzzleLight.position.set(0.05, -0.05, -0.75);
    this.scene.add(this.muzzleLight);

    this.viewmodelPivot = new THREE.Group();
    this.scene.add(this.viewmodelPivot);

    // 2. World-Space 3D Scene (thrown grenades, tacticals & planted claymores)
    this.worldScene = new THREE.Scene();
    this.worldCamera = new THREE.PerspectiveCamera(60, this.glCanvas.width / this.glCanvas.height, 0.05, 150);
    this.worldCamera.matrixAutoUpdate = false;

    const wHemi = new THREE.HemisphereLight(0xdce8f2, 0x4b473c, 1.35);
    this.worldScene.add(wHemi);

    const wKey = new THREE.DirectionalLight(0xfff5e4, 1.55);
    wKey.position.set(12, 24, 15);
    this.worldScene.add(wKey);

    const wRim = new THREE.DirectionalLight(0x8bb4d9, 0.75);
    wRim.position.set(-15, 10, -18);
    this.worldScene.add(wRim);

    this.loader = new THREE.GLTFLoader();
  }

  getConfigForId(id, spec) {
    if (this.MODEL_CONFIG[id]) return this.MODEL_CONFIG[id];

    const folderByCategory = {
      SMG: 'smgs',
      AR: 'ars',
      SNIPER: 'snipers',
      PISTOL: 'pistols',
      MELEE: 'knives'
    };
    const sub = (spec && folderByCategory[spec.category]) || '';
    const file = sub ? `models/${sub}/${id}.glb` : `models/${id}.glb`;

    if (spec && spec.category === 'MELEE') {
      return { ...this.MODEL_CONFIG.trench_knife, file };
    }
    if (spec && spec.category === 'PISTOL') {
      return { ...this.MODEL_CONFIG.colt_m1911a1, file };
    }
    return { ...this.DEFAULT_GUN_CFG, file };
  }

  buildNormalizedUnitGroup(rawScene, cfg) {
    const unitWrapper = new THREE.Group();
    const innerPivot = new THREE.Group();

    const degToRad = Math.PI / 180;
    const rot = cfg.rot || [0, 0, 0];
    rawScene.rotation.set(rot[0] * degToRad, rot[1] * degToRad, rot[2] * degToRad);

    rawScene.traverse((child) => {
      if (child.isMesh) {
        child.frustumCulled = false;
        if (child.geometry && !child.geometry.boundingBox) {
          child.geometry.computeBoundingBox();
        }
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          for (const mat of mats) {
            mat.side = THREE.DoubleSide;
            if (mat.isMeshStandardMaterial && mat.metalness > 0.65) {
              mat.metalness = 0.55;
              mat.roughness = Math.max(0.32, mat.roughness);
            }
            mat.needsUpdate = true;
          }
        }
      }
    });

    rawScene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(rawScene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    if (Number.isFinite(maxDim) && maxDim > 0.0001) {
      rawScene.position.sub(center);
      innerPivot.add(rawScene);
      innerPivot.scale.setScalar(1.0 / maxDim);
    } else {
      innerPivot.add(rawScene);
    }

    unitWrapper.add(innerPivot);
    return unitWrapper;
  }

  registerLoadedGLTF(id, gltf, cfg) {
    if (this.models[id]) {
      this.viewmodelPivot.remove(this.models[id]);
    }
    if (this.worldClonePools[id]) {
      this.worldClonePools[id].forEach((m) => this.worldScene.remove(m));
      delete this.worldClonePools[id];
    }

    const unitGroup = this.buildNormalizedUnitGroup(gltf.scene, cfg);
    if (cfg.isEquip) {
      this.unitModels[id] = unitGroup;
    }

    const viewModel = cfg.isEquip ? unitGroup.clone() : unitGroup;
    viewModel.scale.setScalar(cfg.scale || 0.75);
    viewModel.visible = (this.currentActiveId === id);
    this.viewmodelPivot.add(viewModel);
    this.models[id] = viewModel;

    this.loadStatus[id] = 'loaded';
  }

  loadModel(id, spec) {
    if (!this.threeReady) return;
    if (this.loadStatus[id] === 'loading' || this.loadStatus[id] === 'loaded') return;

    const cfg = this.getConfigForId(id, spec);
    if (!cfg || !cfg.file) return;

    this.loadStatus[id] = 'loading';
    this.loader.load(
      cfg.file,
      (gltf) => {
        this.registerLoadedGLTF(id, gltf, cfg);
      },
      undefined,
      () => {
        this.loadStatus[id] = 'missing';
      }
    );
  }

  async loadModelsFromFileList(fileList, onProgress) {
    if (!this.threeReady) {
      if (onProgress) onProgress('Three.js CDN blocked by Wi-Fi — need local Three.js file');
      return 0;
    }

    const allConfigs = { ...this.MODEL_CONFIG };
    if (WW2.WEAPONS) {
      for (const [id, spec] of Object.entries(WW2.WEAPONS)) {
        if (!allConfigs[id]) {
          allConfigs[id] = this.getConfigForId(id, spec);
        }
      }
    }

    const totalExpected = Object.keys(allConfigs).length;
    const files = Array.from(fileList || []).filter(f => f.name.toLowerCase().endsWith('.glb'));
    let matchedCount = 0;

    for (const file of files) {
      const relPath = (file.webkitRelativePath || file.name).replace(/\\/g, '/').toLowerCase();
      const baseName = file.name.toLowerCase();

      for (const [id, cfg] of Object.entries(allConfigs)) {
        const targetSuffix = cfg.file.toLowerCase();
        const shortSuffix = targetSuffix.replace(/^models\//, '');
        const expectedBase = targetSuffix.split('/').pop();

        if (
          relPath.endsWith(targetSuffix) ||
          relPath.endsWith(shortSuffix) ||
          baseName === expectedBase ||
          baseName === `${id.toLowerCase()}.glb`
        ) {
          try {
            const buffer = await file.arrayBuffer();
            await new Promise((resolve) => {
              this.loader.parse(
                buffer,
                '',
                (gltf) => {
                  this.registerLoadedGLTF(id, gltf, cfg);
                  matchedCount++;
                  if (onProgress) onProgress(`Loaded ${matchedCount} / ${totalExpected} 3D models...`);
                  resolve();
                },
                (err) => {
                  console.warn(`[AssetManager] Failed to parse ${file.name}:`, err);
                  resolve();
                }
              );
            });
          } catch (e) {
            console.warn(`[AssetManager] Could not read ${file.name}:`, e);
          }
          break;
        }
      }
    }

    if (onProgress) {
      onProgress(
        matchedCount > 0
          ? `Ready! Loaded ${matchedCount} / ${totalExpected} 3D models`
          : 'No matching .glb files found — select your "models" folder'
      );
    }
    return matchedCount;
  }

  preloadAllWeapons() {
    if (!this.threeReady) return;
    if (window.location.protocol === 'file:') return;

    Object.keys(this.MODEL_CONFIG).forEach((id) => {
      this.loadModel(id, WW2.WEAPONS ? WW2.WEAPONS[id] : null);
    });

    if (WW2.WEAPONS) {
      Object.keys(WW2.WEAPONS).forEach((id) => {
        this.loadModel(id, WW2.WEAPONS[id]);
      });
    }
  }

  getWorldPoolMesh(id, poolIndex) {
    const unitBase = this.unitModels[id];
    if (!unitBase) return null;

    if (!this.worldClonePools[id]) {
      this.worldClonePools[id] = [];
    }
    const pool = this.worldClonePools[id];
    while (pool.length <= poolIndex) {
      const clone = unitBase.clone();
      clone.visible = false;
      this.worldScene.add(clone);
      pool.push(clone);
    }
    return pool[poolIndex];
  }

  // Renders thrown/planted 3D .glb equipment using True 3D Pitch Camera Projection (+/- 90 deg)
  drawWorldProjectiles(ctx, w, h, player, env, fov, effectivePitch, occluders, stripW, numRays, clipHelper) {
    const renderedIndices = new Set();
    if (!this.threeReady || !env || !env.projectiles || env.projectiles.length === 0) {
      return renderedIndices;
    }

    if (window.location.protocol !== 'file:') {
      for (const proj of env.projectiles) {
        if (!this.loadStatus[proj.spec.id]) {
          this.loadModel(proj.spec.id, proj.spec);
        }
      }
    }

    Object.values(this.worldClonePools).forEach((pool) => {
      for (let i = 0; i < pool.length; i++) pool[i].visible = false;
    });

    const totalEyeHeight = (player.altitude || 0) + player.eyeHeight;
    const projDist = (w * 0.5) / Math.tan(fov * 0.5);

    const cosYaw = Math.cos(player.yaw);
    const sinYaw = Math.sin(player.yaw);
    const rightX = -sinYaw;
    const rightZ = cosYaw;

    const cosPitch = Math.cos(effectivePitch);
    const sinPitch = Math.sin(effectivePitch);

    const poolUsage = {};
    const visibleItems = [];

    for (let pIdx = 0; pIdx < env.projectiles.length; pIdx++) {
      const proj = env.projectiles[pIdx];
      const id = proj.spec.id;
      if (!this.unitModels[id]) continue;

      renderedIndices.add(pIdx);

      const cfg = this.MODEL_CONFIG[id] || { worldScale: 0.16 };
      const worldScale = cfg.worldScale || 0.16;

      const used = poolUsage[id] || 0;
      poolUsage[id] = used + 1;

      const mesh = this.getWorldPoolMesh(id, used);
      if (!mesh) continue;

      const restLift = proj.spec.deployable ? (worldScale * 0.45) : (worldScale * 0.48);
      const worldY = proj.y + restLift;

      const dx = proj.x - player.x;
      const dy = worldY - totalEyeHeight;
      const dz = proj.z - player.z;

      const dF = dx * cosYaw + dz * sinYaw;
      const dR = dx * rightX + dz * rightZ;

      // True 3D camera-space coordinates
      const camX = dR;
      const camY = dy * cosPitch - dF * sinPitch;
      const camZ = dF * cosPitch + dy * sinPitch;

      if (camZ <= 0.06) continue;

      mesh.visible = true;
      mesh.position.set(proj.x, worldY, proj.z);
      mesh.scale.setScalar(worldScale);

      if (proj.spec.deployable) {
        mesh.rotation.set(0, -proj.yaw + Math.PI * 0.5, 0);
      } else {
        mesh.rotation.set(proj.spinX || 0, -proj.yaw, proj.spinZ || 0);
      }

      const screenX = (w * 0.5) + (camX * projDist) / camZ;
      const screenY = (h * 0.5) - (camY * projDist) / camZ;
      const halfBoxPx = Math.max(48, (worldScale * 3.5 * projDist) / camZ);

      // Ground shadow projection on y = proj.y
      const dyShadow = proj.y - totalEyeHeight;
      const camYShadow = dyShadow * cosPitch - dF * sinPitch;
      const camZShadow = dF * cosPitch + dyShadow * sinPitch;
      const shadowScreenY = camZShadow > 0.06
        ? (h * 0.5) - (camYShadow * projDist) / camZShadow
        : screenY + (worldScale * 0.45 * projDist) / camZ;

      visibleItems.push({
        proj,
        camZ,
        screenX,
        screenY,
        shadowScreenY,
        worldScale,
        minX: screenX - halfBoxPx,
        maxX: screenX + halfBoxPx,
        minY: screenY - halfBoxPx,
        maxY: screenY + halfBoxPx
      });
    }

    if (visibleItems.length === 0) {
      return renderedIndices;
    }

    if (this.glCanvas.width !== w || this.glCanvas.height !== h) {
      this.renderer.setSize(w, h, false);
    }

    // True 3D Pitched Camera matching renderer_25d.js to the sub-pixel
    const vFovDeg = (2 * Math.atan(Math.tan(fov * 0.5) * (h / w)) * 180) / Math.PI;
    this.worldCamera.clearViewOffset();
    this.worldCamera.fov = vFovDeg;
    this.worldCamera.aspect = w / h;
    this.worldCamera.updateProjectionMatrix();

    const upX = -sinPitch * cosYaw;
    const upY = cosPitch;
    const upZ = -sinPitch * sinYaw;
    const backX = -cosPitch * cosYaw;
    const backY = -sinPitch;
    const backZ = -cosPitch * sinYaw;

    this.worldCamera.matrixWorld.set(
      rightX, upX, backX, player.x,
      0,      upY, backY, totalEyeHeight,
      rightZ, upZ, backZ, player.z,
      0,      0,   0,     1
    );
    this.worldCamera.matrixWorldInverse.copy(this.worldCamera.matrixWorld).invert();

    this.renderer.render(this.worldScene, this.worldCamera);

    visibleItems.sort((a, b) => b.camZ - a.camZ);

    for (const item of visibleItems) {
      const x0 = Math.max(0, Math.floor(item.minX));
      const y0 = Math.max(0, Math.floor(item.minY));
      const x1 = Math.min(w, Math.ceil(item.maxX));
      const y1 = Math.min(h, Math.ceil(item.maxY));
      if (x1 <= x0 || y1 <= y0) continue;

      ctx.save();
      if (clipHelper && occluders) {
        clipHelper(ctx, x0, y0, x1, y1, item.camZ, occluders, stripW, numRays);
      }

      const shadowRx = Math.max(4, (item.worldScale * 0.65 * projDist) / item.camZ);
      const shadowRy = Math.max(2, shadowRx * (0.36 + 0.64 * Math.abs(sinPitch)));
      ctx.fillStyle = 'rgba(12, 14, 10, 0.42)';
      ctx.beginPath();
      ctx.ellipse(item.screenX, item.shadowScreenY, shadowRx, shadowRy, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.drawImage(this.glCanvas, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);

      if (item.proj.spec.deployable && item.proj.armed) {
        const beamSpan = Math.max(14, (1.1 * projDist) / item.camZ);
        const mineW = Math.max(6, (0.24 * projDist) / item.camZ);
        ctx.strokeStyle = 'rgba(255, 45, 45, 0.78)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(item.screenX - mineW * 0.25, item.screenY);
        ctx.lineTo(item.screenX - beamSpan, item.screenY + mineW * 0.25);
        ctx.moveTo(item.screenX + mineW * 0.25, item.screenY);
        ctx.lineTo(item.screenX + beamSpan, item.screenY + mineW * 0.25);
        ctx.stroke();
      }

      ctx.restore();
    }

    return renderedIndices;
  }

  resolveActiveItem(spec, player) {
    const equipSlot = (player.holdingEquipSlot || '').toUpperCase();
    if (equipSlot === 'LETHAL' && typeof player.getLethalSpec === 'function') {
      const lSpec = player.getLethalSpec();
      if (lSpec) return { id: lSpec.id, spec: lSpec, kind: 'EQUIP' };
    }
    if (equipSlot === 'TACTICAL' && typeof player.getTacticalSpec === 'function') {
      const tSpec = player.getTacticalSpec();
      if (tSpec) return { id: tSpec.id, spec: tSpec, kind: 'EQUIP' };
    }
    if (spec) {
      return {
        id: spec.id,
        spec,
        kind: spec.category === 'MELEE' ? 'MELEE' : 'GUN'
      };
    }
    return null;
  }

  drawFirstPersonWeapon(ctx, w, h, spec, player, muzzleFlashTimer) {
    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastFrameTime) / 1000));
    this.lastFrameTime = now;

    const active = this.resolveActiveItem(spec, player);
    if (!active) return;

    if (this.threeReady && !this.loadStatus[active.id] && window.location.protocol !== 'file:') {
      this.loadModel(active.id, active.spec);
    }

    const loadedMesh = this.threeReady ? this.models[active.id] : null;

    if (!loadedMesh) {
      this.draw2DFallbackViewmodel(ctx, w, h, active, player, muzzleFlashTimer);
      return;
    }

    if (this.glCanvas.width !== w || this.glCanvas.height !== h) {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }

    if (this.currentActiveId !== active.id) {
      Object.keys(this.models).forEach((key) => {
        if (this.models[key]) this.models[key].visible = (key === active.id);
      });
      this.currentActiveId = active.id;
    }

    const cfg = this.getConfigForId(active.id, active.spec);
    const isMelee = active.kind === 'MELEE';
    const isEquip = active.kind === 'EQUIP';

    const targetAds = (player.isAds && !isMelee && !isEquip && !player.isSprinting && !player.isReloading) ? 1 : 0;
    const targetSprint = (player.isSprinting && !player.isAds) ? 1 : 0;
    const targetReload = player.isReloading ? 1 : 0;

    const lerpRate = Math.min(1, dt * 14);
    this.adsLerp += (targetAds - this.adsLerp) * lerpRate;
    this.sprintLerp += (targetSprint - this.sprintLerp) * Math.min(1, dt * 10);
    this.reloadLerp += (targetReload - this.reloadLerp) * Math.min(1, dt * 9);

    if (muzzleFlashTimer > 0 && !isMelee && !isEquip) {
      this.recoilKick = Math.min(1.0, this.recoilKick + dt * 28);
      this.muzzleLight.intensity = 3.2;
    } else {
      this.recoilKick = Math.max(0, this.recoilKick - dt * 9.5);
      this.muzzleLight.intensity = Math.max(0, this.muzzleLight.intensity - dt * 45);
    }

    const swinging = Boolean(
      player.isMeleeing ||
      (player.meleeTimer && player.meleeTimer > 0) ||
      (player.meleeSwingTimer && player.meleeSwingTimer > 0)
    );
    if (swinging) {
      this.meleeSlash = Math.min(1, this.meleeSlash + dt * 14);
    } else {
      this.meleeSlash = Math.max(0, this.meleeSlash - dt * 10);
    }

    const horizSpeed = Math.hypot(player.vx || 0, player.vz || 0);
    if (horizSpeed > 0.25 && player.isGrounded) {
      this.bobPhase += dt * (player.isSprinting ? 14 : 9.5);
    } else {
      this.bobPhase += dt * 1.8;
    }
    const bobScale = (horizSpeed > 0.25 && player.isGrounded) ? (1 - this.adsLerp * 0.78) : 0.12;
    const bobX = Math.cos(this.bobPhase * 0.5) * 0.014 * bobScale;
    const bobY = Math.abs(Math.sin(this.bobPhase)) * -0.012 * bobScale;

    const hip = cfg.pos || [0.21, -0.20, -0.52];
    const ads = cfg.adsPos || [0.0, -0.140, -0.46];

    const equipPullback = isEquip ? Math.min(1, (player.equipHoldTimer || 0) * 2.5) : 0;

    let px = hip[0] + (ads[0] - hip[0]) * this.adsLerp + bobX;
    let py = hip[1] + (ads[1] - hip[1]) * this.adsLerp + bobY;
    let pz = hip[2] + (ads[2] - hip[2]) * this.adsLerp;

    px += this.sprintLerp * -0.07 - this.meleeSlash * 0.16 + equipPullback * 0.035;
    py += this.sprintLerp * -0.04 - this.reloadLerp * 0.14 + this.recoilKick * 0.012 + equipPullback * 0.025;
    pz += this.recoilKick * 0.065 - this.meleeSlash * 0.18 + equipPullback * 0.05;

    this.viewmodelPivot.position.set(px, py, pz);

    const rotX = (this.recoilKick * 0.14) - (this.reloadLerp * 0.55) - (this.meleeSlash * 0.45) + (equipPullback * 0.25);
    const rotY = (this.sprintLerp * 0.58) + (this.meleeSlash * 0.75);
    const rotZ = (this.sprintLerp * 0.22) + (this.reloadLerp * 0.35) + (this.meleeSlash * 0.55) - (equipPullback * 0.18);
    this.viewmodelPivot.rotation.set(rotX, rotY, rotZ);

    const targetFov = 65 - this.adsLerp * 14;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();
    }

    this.renderer.render(this.scene, this.camera);
    ctx.drawImage(this.glCanvas, 0, 0, w, h);

    if (muzzleFlashTimer > 0 && !isMelee && !isEquip) {
      const fx = w * (0.5 + (1 - this.adsLerp) * 0.08);
      const fy = h * (0.54 + (1 - this.adsLerp) * 0.05);
      ctx.save();
      const grad = ctx.createRadialGradient(fx, fy, 2, fx, fy, 46);
      grad.addColorStop(0, 'rgba(255, 250, 210, 0.95)');
      grad.addColorStop(0.45, 'rgba(255, 175, 45, 0.65)');
      grad.addColorStop(1, 'rgba(255, 120, 20, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(fx, fy, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  draw2DFallbackViewmodel(ctx, w, h, active, player, muzzleFlashTimer) {
    const cx = player.isAds ? w * 0.5 : w * 0.68;
    const cy = player.isAds ? h * 0.76 : h * 0.80;

    ctx.save();
    if (active.kind === 'MELEE') {
      ctx.translate(cx, cy);
      ctx.rotate(-0.35);
      ctx.fillStyle = '#6b4c2e';
      ctx.fillRect(-12, -30, 24, 95);
      ctx.fillStyle = '#b59445';
      ctx.fillRect(-20, -36, 40, 10);
      ctx.fillStyle = '#cdd4d9';
      ctx.beginPath();
      ctx.moveTo(-9, -36);
      ctx.lineTo(0, -145);
      ctx.lineTo(9, -36);
      ctx.closePath();
      ctx.fill();
    } else if (active.kind === 'EQUIP') {
      ctx.fillStyle = '#4e6343';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 30, 26, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1b2119';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      const gunW = player.isAds ? 34 : 46;
      const gunH = player.isAds ? 170 : 195;
      ctx.fillStyle = '#2d3236';
      ctx.fillRect(cx - gunW * 0.5, cy - gunH, gunW, gunH);
      ctx.fillStyle = '#5c4128';
      ctx.fillRect(cx - gunW * 0.42, cy - gunH * 0.45, gunW * 0.84, gunH * 0.45);

      if (muzzleFlashTimer > 0) {
        ctx.fillStyle = 'rgba(255, 210, 80, 0.85)';
        ctx.beginPath();
        ctx.arc(cx, cy - gunH - 12, 26, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
};