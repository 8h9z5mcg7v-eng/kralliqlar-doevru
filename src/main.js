// ============================================================
// main.js — bootstrap: loading screen, game creation, start.
// ============================================================
import { Game } from './core/Game.js';
import { initTooltip } from './ui/Tooltip.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function boot() {
  initTooltip();
  const canvas = document.getElementById('game-canvas');
  const fill = document.getElementById('loading-fill');

  // fake-but-honest progress: asset build is synchronous & fast,
  // so we animate the bar across the actual init steps.
  fill.style.width = '30%';

  requestAnimationFrame(() => {
    fill.style.width = '65%';
    let game;
    try {
      game = new Game(canvas);
    } catch (err) {
      console.error('[KingdomTiles] fatal init error:', err);
      const inner = document.getElementById('loading-inner');
      if (inner) {
        inner.innerHTML =
          '<h1>Hexkingdom</h1><p style="color:#e08a7a">Failed to start: ' +
          String(err && err.message ? err.message : err) +
          '</p>';
      }
      return;
    }
    fill.style.width = '100%';
    game.start();

    // CC0 medieval castle courtyard model, streamed from a permanent CORS-enabled CDN.
    // The game remains playable if the external asset is temporarily unavailable.
    const castleLoader = new GLTFLoader();
    castleLoader.load(
      'https://cdn.3dassets.dev/assets/23508/v1/model.glb',
      (gltf) => {
        const castle = gltf.scene;
        castle.name = 'KralliqlarDovru_CC0_CastleCourtyard';
        // Normalize the downloaded scene so it fits the game's visible starting area.
        castle.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(castle);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        castle.scale.setScalar(5.5 / maxDim);
        castle.position.set(-center.x * castle.scale.x, 0.28 - bounds.min.y * castle.scale.y, -center.z * castle.scale.z);
        castle.traverse((object) => {
          if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });
        game.scene.add(castle);
        game.castleAsset = castle;
        game.ui.toast('Orta əsr qalası yükləndi!');
      },
      undefined,
      (error) => {
        console.warn('[Krallıqlar Dövrü] Qala modeli yüklənmədi:', error);
        game.ui.toast('Qala modeli yüklənmədi. Səhifəni yenilə.');
      }
    );

    setTimeout(() => game.ui.hideLoading(), 350);

    // expose for debugging / headless tests
    window.__game = game;
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
