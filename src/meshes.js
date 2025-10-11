import * as THREE from "../vendor/three/build/three.module.js";
import { GLTFLoader } from "../vendor/three/examples/jsm/loaders/GLTFLoader.js";
import { THEME_COLORS } from "../config/index.js";
import { HERO_MODEL_URL } from "../config/index.js";
import { parseThreeColor } from "./utils.js";

/**
 * Hero character mesh with optional GLTF model replacement
 * @extends THREE.Group
 */
export class HeroMesh extends THREE.Group {
  constructor() {
    super();
    this._build();
    this.position.set(10, 1.1, 10);
  }

  _build() {
    // Torso
    const torsoGeo = new THREE.CapsuleGeometry(0.75, 1.25, 6, 14);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: THEME_COLORS.themeLightOrange,
      emissive: THEME_COLORS.heroBodyEmissive,
      metalness: 0.2,
      roughness: 0.55,
    });
    this.body = new THREE.Mesh(torsoGeo, torsoMat);
    this.body.castShadow = true;

    // Head
    this.head = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 20, 20),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.heroSkin, emissive: THEME_COLORS.heroSkinEmissive, roughness: 0.45 })
    );
    this.head.position.y = 1.75;
    this.body.add(this.head);

    // Beard (cone)
    this.beard = new THREE.Mesh(
      new THREE.ConeGeometry(0.38, 0.7, 16),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.heroBeard, emissive: THEME_COLORS.heroBeardEmissive, roughness: 0.4 })
    );
    this.beard.position.set(0, 1.35, 0.28);
    this.beard.rotation.x = Math.PI * 0.05;
    this.body.add(this.beard);

    // Laurel crown (thin torus)
    this.crown = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.06, 10, 28),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.heroCrown, emissive: THEME_COLORS.themeAccent, metalness: 0.4, roughness: 0.3 })
    );
    this.crown.position.y = 1.78;
    this.crown.rotation.x = Math.PI / 2;
    this.body.add(this.crown);

    // Shoulder pads
    const shoulderMat = new THREE.MeshStandardMaterial({ color: THEME_COLORS.darkOrange, emissive: THEME_COLORS.heroShoulderEmissive, metalness: 0.35, roughness: 0.45 });
    this.shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), shoulderMat);
    this.shoulderL.position.set(-0.7, 1.45, 0.1);
    this.shoulderR = this.shoulderL.clone();
    this.shoulderR.position.x = 0.7;
    this.body.add(this.shoulderL, this.shoulderR);

    // Cloak (simple plane)
    this.cloak = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 2.4, 1, 3),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.heroCloak, emissive: THEME_COLORS.heroCloakEmissive, side: THREE.DoubleSide, roughness: 0.8 })
    );
    this.cloak.position.set(0, 1.2, -0.45);
    this.cloak.rotation.x = Math.PI;
    this.body.add(this.cloak);

    // Right arm
    this.rightArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.14, 0.6, 6, 10),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.themeLightOrange, emissive: THEME_COLORS.heroBodyEmissive, roughness: 0.55 })
    );
    this.rightArm.position.set(0.65, 1.3, 0.15);
    this.rightArm.rotation.z = -Math.PI * 0.25;
    this.add(this.rightArm);

    // Right hand anchor
    this.handAnchor = new THREE.Object3D();
    this.handAnchor.position.set(0.85, 1.15, 0.25);
    this.add(this.handAnchor);

    // Left hand anchor
    this.leftHandAnchor = new THREE.Object3D();
    this.leftHandAnchor.position.set(-0.85, 1.15, 0.25);
    this.add(this.leftHandAnchor);

    // Left hand fire orb + light (for FP two-hands effect)
    this.leftFireOrb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.2, 0),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.themeOrange, emissive: THEME_COLORS.themeAccent, emissiveIntensity: 2.0, roughness: 0.15, metalness: 0.1 })
    );
    this.leftHandAnchor.add(this.leftFireOrb);
    this.leftHandLight = new THREE.PointLight(THEME_COLORS.heroHandLight, 1.0, 18, 2);
    this.leftHandAnchor.add(this.leftHandLight);

    // Right hand fire orb + light
    this.fireOrb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.2, 0),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.themeOrange, emissive: THEME_COLORS.themeAccent, emissiveIntensity: 2.2, roughness: 0.15, metalness: 0.1 })
    );
    this.handAnchor.add(this.fireOrb);

    this.handLight = new THREE.PointLight(THEME_COLORS.heroHandLight, 1.3, 20, 2);
    this.handAnchor.add(this.handLight);

    // Left arm (symmetric)
    this.leftArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.14, 0.6, 6, 10),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.themeLightOrange, emissive: THEME_COLORS.heroBodyEmissive, roughness: 0.55 })
    );
    this.leftArm.position.set(-0.65, 1.3, 0.15);
    this.leftArm.rotation.z = Math.PI * 0.25;
    this.add(this.leftArm);

    // Biceps bulges
    this.bicepR = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 14, 14),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.themeLightOrange, emissive: THEME_COLORS.heroBodyEmissive, roughness: 0.55 })
    );
    this.bicepR.position.set(0.55, 1.45, 0.12);
    this.bicepL = this.bicepR.clone();
    this.bicepL.position.x = -0.55;
    this.add(this.bicepR, this.bicepL);

    // Tunic (waist cloth)
    this.tunic = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 0.9, 1.0, 28, 1, true),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.themeLightOrange, emissive: THEME_COLORS.heroCloak, metalness: 0.2, roughness: 0.7, side: THREE.DoubleSide })
    );
    this.tunic.position.set(0, 0.6, 0);
    this.body.add(this.tunic);

    // Belt
    this.belt = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.06, 12, 32),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.heroBelt, emissive: THEME_COLORS.themeAccent, metalness: 0.5, roughness: 0.2 })
    );
    this.belt.position.y = 1.0;
    this.body.add(this.belt);

    // Hair cap
    this.hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.56, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.heroHair, emissive: THEME_COLORS.heroHairEmissive, roughness: 0.65 })
    );
    this.hairCap.position.set(0, 0.18, 0);
    this.head.add(this.hairCap);

    // Small ponytail
    this.pony = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.35, 12),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.heroHair, emissive: THEME_COLORS.heroHairEmissive })
    );
    this.pony.position.set(0, -0.2, -0.25);
    this.pony.rotation.x = Math.PI * 0.9;
    this.head.add(this.pony);

    // Parts to hide when entering first-person
    this.fpHideParts = [
      this.body,
      this.head,
      this.cloak,
      this.tunic,
      this.belt,
      this.shoulderL,
      this.shoulderR,
      this.bicepR,
      this.bicepL,
      this.beard,
      this.crown,
      this.hairCap,
      this.pony
    ];

    // Assemble placeholder into root
    this.add(this.body);

    // Optional: load external GoW GLTF model
    if (HERO_MODEL_URL) {
      this._loadGLTFModel();
    }
  }

  _loadGLTFModel() {
    const loader = new GLTFLoader();
    loader.load(
      HERO_MODEL_URL,
      (gltf) => {
        const model = gltf.scene || (gltf.scenes && gltf.scenes[0]);
        if (model) {
          model.traverse((o) => {
            if (o.isMesh) {
              o.castShadow = true;
              o.receiveShadow = true;
            }
          });
          // Normalize model height to ~2.2 world units
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const targetHeight = 2.2;
          const s = size.y > 0 ? targetHeight / size.y : 1;
          model.scale.setScalar(s);
          model.position.set(0, 0, 0);
          this.add(model);
          // Hide placeholder body
          this.body.visible = false;
        }
      },
      undefined,
      (err) => {
        console.warn("Failed to load HERO_MODEL_URL:", HERO_MODEL_URL, err);
      }
    );
  }
}

/**
 * Enemy mesh with single eye detail
 * @extends THREE.Mesh
 */
export class EnemyMesh extends THREE.Mesh {
  constructor(options = {}) {
    const color = options.color !== undefined ? options.color : THEME_COLORS.enemyDark;
    const eyeEmissive = options.eyeEmissive !== undefined ? options.eyeEmissive : THEME_COLORS.enemyEyeEmissive;

    const geo = new THREE.CapsuleGeometry(0.6, 0.8, 4, 10);
    const mat = new THREE.MeshStandardMaterial({ color: color, emissive: THEME_COLORS.enemyBodyEmissive, roughness: 0.7 });
    
    super(geo, mat);
    this.castShadow = true;

    this.eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.enemyEye, emissive: eyeEmissive })
    );
    this.eye.position.set(0, 1.2, 0.45);
    this.add(this.eye);
  }
}

/**
 * Billboard HP bar for enemies
 * @extends THREE.Group
 */
export class BillboardHPBar extends THREE.Group {
  constructor() {
    super();
    this.position.set(0, 2.2, 0);

    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.14),
      new THREE.MeshBasicMaterial({ color: THEME_COLORS.hpBarBg, transparent: true, opacity: 0.6 })
    );
    this.add(bg);

    this.fill = new THREE.Mesh(
      new THREE.PlaneGeometry(1.36, 0.1),
      new THREE.MeshBasicMaterial({ color: THEME_COLORS.hpBarFill })
    );
    this.fill.position.z = 0.001;
    this.add(this.fill);
  }
}

/**
 * Portal mesh with animated components
 * @extends THREE.Group
 */
export class PortalMesh extends THREE.Group {
  constructor(color = THEME_COLORS.portal) {
    super();
    const { hex, alpha } = parseThreeColor(color);

    // Outer ring (vertical gate)
    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.15, 16, 40),
      new THREE.MeshStandardMaterial({
        color: hex,
        emissive: hex,
        emissiveIntensity: 1.1,
        metalness: 0.35,
        roughness: 0.25,
        transparent: alpha < 1,
        opacity: alpha
      })
    );

    // Inner swirl (rotating disc to feel like a gate)
    this.swirl = new THREE.Mesh(
      new THREE.CircleGeometry(1.0, 48),
      new THREE.MeshBasicMaterial({
        color: hex,
        transparent: true,
        opacity: 0.35 * alpha,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    this.swirl.position.z = 0.02;

    // Soft glow backing
    this.glow = new THREE.Mesh(
      new THREE.CircleGeometry(1.25, 48),
      new THREE.MeshBasicMaterial({
        color: hex,
        transparent: true,
        opacity: 0.18 * alpha,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    this.glow.position.z = -0.02;

    // Base pedestal
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.1, 0.2, 24),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.portalBase, metalness: 0.3, roughness: 0.6 })
    );
    base.position.y = -1.1;

    this.add(this.ring);
    this.add(this.glow);
    this.add(this.swirl);
    this.add(base);

    // Decorative point light for aura
    const light = new THREE.PointLight(hex, 0.9, 12, 2);
    light.position.set(0, 0.4, 0);
    this.add(light);
  }
}

/**
 * Simple house structure
 * @extends THREE.Group
 */
export class House extends THREE.Group {
  constructor() {
    super();

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3, 6),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.houseBase })
    );
    base.position.y = 1.5;
    this.add(base);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(4.5, 2.5, 4),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.heroCloak })
    );
    roof.position.y = 4.1;
    roof.rotation.y = Math.PI / 4;
    this.add(roof);
  }
}

/**
 * Hero overhead HP/MP dual bars (billboard)
 * @extends THREE.Group
 */
export class HeroOverheadBars extends THREE.Group {
  constructor() {
    super();
    this.position.set(0, 2.6, 0);

    // Backboard
    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.26),
      new THREE.MeshBasicMaterial({ color: THEME_COLORS.overheadBarBg, transparent: true, opacity: 0.5 })
    );
    this.add(bg);

    // HP (top)
    this.hpFill = new THREE.Mesh(
      new THREE.PlaneGeometry(1.74, 0.1),
      new THREE.MeshBasicMaterial({ color: THEME_COLORS.hp })
    );
    this.hpFill.position.set(0, 0.06, 0.001);
    this.add(this.hpFill);

    // MP (bottom)
    this.mpFill = new THREE.Mesh(
      new THREE.PlaneGeometry(1.74, 0.1),
      new THREE.MeshBasicMaterial({ color: THEME_COLORS.mp })
    );
    this.mpFill.position.set(0, -0.06, 0.001);
    this.add(this.mpFill);
  }
}

// ====== Greek-inspired structures and varied nature props ======

/**
 * Greek column structure
 * @extends THREE.Group
 */
export class GreekColumn extends THREE.Group {
  constructor(options = {}) {
    super();

    const {
      height = 5,
      radius = 0.28,
      order = "doric", // "doric" | "ionic" | "corinthian"
      color = THEME_COLORS.sandstone,
      roughness = 0.55,
      metalness = 0.04,
    } = options;

    const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness });

    // Stylobate/plinth
    const plinthH = Math.max(0.14, height * 0.03);
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(radius * 2.2, plinthH, radius * 2.2),
      mat
    );
    plinth.position.y = plinthH / 2;
    this.add(plinth);

    // Shaft
    const shaftH = height * 0.8;
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.9, radius * 0.98, shaftH, 20, 1),
      mat
    );
    shaft.position.y = plinthH + shaftH / 2;
    this.add(shaft);

    // Capital
    const capH = Math.max(0.12, height * 0.06);
    const echinus = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.15, radius * 1.1, capH * 0.55, 18, 1),
      mat
    );
    echinus.position.y = plinthH + shaftH + (capH * 0.275);
    this.add(echinus);

    const abacus = new THREE.Mesh(
      new THREE.BoxGeometry(radius * 2.0, capH * 0.5, radius * 2.0),
      mat
    );
    abacus.position.y = plinthH + shaftH + capH * 0.8;
    this.add(abacus);

    // Simple hint for different orders (tiny top ornament)
    if (order === "ionic" || order === "corinthian") {
      const ornament = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.55, capH * 0.12, 6, 16),
        mat
      );
      ornament.position.y = abacus.position.y + capH * 0.35;
      ornament.rotation.x = Math.PI / 2;
      this.add(ornament);
    }
  }
}

/**
 * Greek temple structure
 * @extends THREE.Group
 */
export class GreekTemple extends THREE.Group {
  constructor(options = {}) {
    super();

    const {
      cols = 6,
      rows = 10,
      colSpacingX = 2.4,
      colSpacingZ = 2.6,
      columnHeight = 5.6,
      baseMargin = 0.9,
      color = THEME_COLORS.sandstone,
    } = options;

    const mat = new THREE.MeshStandardMaterial({ color });
    const width = (cols - 1) * colSpacingX;
    const depth = (rows - 1) * colSpacingZ;

    // Stylobate (base platform)
    const baseH = 0.5;
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(width + baseMargin * 2.2, baseH, depth + baseMargin * 2.2),
      mat
    );
    base.position.y = baseH / 2;
    this.add(base);

    // Perimeter columns
    const addCol = (x, z) => {
      const c = new GreekColumn({ height: columnHeight, radius: 0.3 + Math.random() * 0.04 });
      c.position.set(x, baseH, z);
      this.add(c);
    };

    const x0 = -width / 2;
    const z0 = -depth / 2;

    for (let i = 0; i < cols; i++) {
      const x = x0 + i * colSpacingX;
      addCol(x, z0);
      addCol(x, z0 + depth);
    }
    for (let j = 1; j < rows - 1; j++) {
      const z = z0 + j * colSpacingZ;
      addCol(x0, z);
      addCol(x0 + width, z);
    }

    // Entablature (flat beam)
    const beamH = 0.35;
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(width + baseMargin * 1.6, beamH, depth + baseMargin * 1.6),
      mat
    );
    beam.position.y = baseH + columnHeight + beamH / 2;
    this.add(beam);

    // Simple flat roof slab
    const roofH = 0.28;
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(width + baseMargin * 2.0, roofH, depth + baseMargin * 2.0),
      mat
    );
    roof.position.y = beam.position.y + beamH / 2 + roofH / 2;
    this.add(roof);

    // Front steps hint
    const steps = new THREE.Mesh(
      new THREE.BoxGeometry((width + baseMargin * 2.2) * 0.7, baseH * 0.4, baseMargin * 1.2),
      mat
    );
    steps.position.set(0, baseH * 0.2, z0 - baseMargin * 0.6);
    this.add(steps);
  }
}

/**
 * Villa structure with porch
 * @extends THREE.Group
 */
export class Villa extends THREE.Group {
  constructor(options = {}) {
    super();

    const {
      width = 12,
      depth = 8,
      height = 4,
      colorBase = THEME_COLORS.villaBase,
      colorRoof = THEME_COLORS.heroCloak,
    } = options;

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color: colorBase })
    );
    base.position.y = height / 2;
    this.add(base);

    // Pyramid-like roof
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(width, depth) * 0.6, height * 0.9, 4),
      new THREE.MeshStandardMaterial({ color: colorRoof })
    );
    roof.position.y = height + (height * 0.45);
    roof.rotation.y = Math.PI / 4;
    this.add(roof);

    // Small porch with columns
    const porchDepth = Math.min(3.2, depth * 0.45);
    const porch = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.6, 0.3, porchDepth),
      new THREE.MeshStandardMaterial({ color: colorBase, roughness: 0.8 })
    );
    porch.position.set(0, 0.2, depth / 2 + porchDepth * 0.5 - 0.15);
    this.add(porch);

    const colOffX = width * 0.22;
    const colZ = depth / 2 + porchDepth * 0.25;
    const c1 = new GreekColumn({ height: height * 0.85, radius: 0.18, color: THEME_COLORS.villaPorchColumn });
    c1.position.set(-colOffX, 0.3, colZ);
    const c2 = c1.clone();
    c2.position.x = colOffX;
    this.add(c1, c2);
  }
}

/**
 * Cypress tree with fire theme
 * @extends THREE.Group
 */
export class CypressTree extends THREE.Group {
  constructor() {
    super();

    const trunkH = 1.6 + Math.random() * 0.8;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, trunkH, 6),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.trunk })
    );
    trunk.position.y = trunkH / 2;
    this.add(trunk);

    const levels = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < levels; i++) {
      const h = 1.0 + (levels - i) * 0.5;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.4 + (levels - i) * 0.18, h, 8),
        new THREE.MeshStandardMaterial({ color: THEME_COLORS.cypressFoliage })
      );
      cone.position.y = trunkH + (i * h * 0.55);
      this.add(cone);
    }
  }
}

/**
 * Olive tree with fire theme
 * @extends THREE.Group
 */
export class OliveTree extends THREE.Group {
  constructor() {
    super();

    const trunkH = 1.3 + Math.random() * 0.7;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, trunkH, 8),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.stem })
    );
    trunk.position.y = trunkH / 2;
    this.add(trunk);

    const canopyMat = new THREE.MeshStandardMaterial({ color: THEME_COLORS.oliveCanopy });
    const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), canopyMat);
    const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 12), canopyMat);
    const s3 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), canopyMat);
    s1.position.set(0.0, trunkH + 0.2, 0.0);
    s2.position.set(-0.45, trunkH + 0.1, 0.2);
    s3.position.set(0.4, trunkH + 0.0, -0.25);
    this.add(s1, s2, s3);
  }
}

/**
 * Greek statue
 * @extends THREE.Group
 */
export class GreekStatue extends THREE.Group {
  constructor(options = {}) {
    super();

    const {
      color = THEME_COLORS.sandstone
    } = options;

    const mat = new THREE.MeshStandardMaterial({ color });

    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.4, 1.2),
      mat
    );
    plinth.position.y = 0.2;
    this.add(plinth);

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 1.6, 16),
      mat
    );
    body.position.y = 0.2 + 0.8;
    this.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14), mat);
    head.position.y = body.position.y + 0.95;
    this.add(head);

    // Arms (simple hints)
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.8, 10), mat);
    armL.position.set(-0.45, body.position.y + 0.3, 0);
    armL.rotation.z = Math.PI / 6;
    const armR = armL.clone();
    armR.position.x = 0.45;
    armR.rotation.z = -Math.PI / 6;
    this.add(armL, armR);
  }
}

/**
 * Obelisk structure
 * @extends THREE.Group
 */
export class Obelisk extends THREE.Group {
  constructor(options = {}) {
    super();

    const {
      height = 6,
      baseSize = 1.2,
      color = THEME_COLORS.sandstone
    } = options;

    const mat = new THREE.MeshStandardMaterial({ color });

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(baseSize, 0.35, baseSize),
      mat
    );
    base.position.y = 0.175;
    this.add(base);

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.6, height, 4),
      mat
    );
    shaft.position.y = 0.35 + height / 2;
    this.add(shaft);

    const tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 0.6, 4),
      mat
    );
    tip.position.y = 0.35 + height + 0.3;
    this.add(tip);
  }
}

// ====== Backward compatibility - factory functions ======
// Keep these for existing code that uses the old API

export function createHeroMesh() {
  return new HeroMesh();
}

export function createEnemyMesh(options = {}) {
  return new EnemyMesh(options);
}

export function createBillboardHPBar() {
  const bar = new BillboardHPBar();
  return { container: bar, fill: bar.fill };
}

export function createPortalMesh(color = THEME_COLORS.portal) {
  const portal = new PortalMesh(color);
  return { group: portal, ring: portal.ring, swirl: portal.swirl, glow: portal.glow };
}

export function createHouse() {
  return new House();
}

export function createHeroOverheadBars() {
  const bars = new HeroOverheadBars();
  return { container: bars, hpFill: bars.hpFill, mpFill: bars.mpFill };
}

export function createGreekColumn(options = {}) {
  return new GreekColumn(options);
}

export function createGreekTemple(options = {}) {
  return new GreekTemple(options);
}

export function createVilla(options = {}) {
  return new Villa(options);
}

export function createCypressTree() {
  return new CypressTree();
}

export function createOliveTree() {
  return new OliveTree();
}

export function createGreekStatue(options = {}) {
  return new GreekStatue(options);
}

export function createObelisk(options = {}) {
  return new Obelisk(options);
}
