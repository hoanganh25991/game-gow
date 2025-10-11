# Vendor Dependencies

This directory contains third-party libraries that are vendored (copied locally) instead of being loaded from CDN.

## Three.js v0.160.0

Downloaded from unpkg.com on 2024-10-03.

### Files:
- `three/build/three.module.js` - Core Three.js library (ES Module)
- `three/examples/jsm/loaders/GLTFLoader.js` - GLTF model loader
- `three/examples/jsm/utils/BufferGeometryUtils.js` - Geometry utilities

### Original URLs:
- https://unpkg.com/three@0.160.0/build/three.module.js
- https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js
- https://unpkg.com/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.js

### Usage:
All source files have been updated to use these local vendor files:
```javascript
import * as THREE from "../vendor/three/build/three.module.js";
import { GLTFLoader } from "../vendor/three/examples/jsm/loaders/GLTFLoader.js";
```

The import map in `index.html` has also been updated to resolve the `three` module to the local vendor path.

### Why Vendored?
- ✅ Offline support for PWA
- ✅ Faster load times (no external network requests)
- ✅ Version control and consistency
- ✅ No dependency on external CDN availability
- ✅ Better caching and reliability

### Files Updated:
- `index.html` - Import map and removed unpkg.com DNS prefetch
- All JavaScript files in `src/` directory that import Three.js