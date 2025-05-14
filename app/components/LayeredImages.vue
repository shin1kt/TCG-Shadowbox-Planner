<template>
  <div>
    <div class="controls mb-4">
      <v-row>
        <v-col cols="12" sm="6">
          <v-slider
            v-model="layerDistance"
            :min="0.1"
            :max="2"
            :step="0.1"
            label="Layer Distance"
            @mousedown.stop
            @touchstart.stop
          ></v-slider>
        </v-col>
      </v-row>
    </div>
    <div class="layered-images-container" ref="containerRef"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, onUnmounted } from "vue";
import type { ImageDataObject } from "@/types/imageData";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const props = defineProps<{
  modelValue: ImageDataObject[];
}>();

// 調整可能なパラメータ
const layerDistance = ref(0.5); // Layer distance

const containerRef = ref<HTMLDivElement | null>(null);

// Three.jsのオブジェクトをリアクティブではなく通常の変数として管理
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let controls: OrbitControls | null = null;
let animationFrameId: number | null = null;
const meshes: THREE.Mesh<
  THREE.BufferGeometry,
  THREE.MeshBasicMaterial | THREE.MeshBasicMaterial[]
>[] = [];
const textures: THREE.Texture[] = []; // テクスチャを追跡するための配列

// シーンのセットアップ
const setupScene = () => {
  if (!containerRef.value) return;

  // シーン作成
  scene = new THREE.Scene();

  // カメラ設定
  const aspect =
    containerRef.value.clientWidth / containerRef.value.clientHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  camera.position.z = 30;

  // レンダラー設定
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.setSize(
    containerRef.value.clientWidth,
    containerRef.value.clientHeight
  );
  renderer.setClearColor(0xffffff, 1);
  containerRef.value.appendChild(renderer.domElement);

  // コントロール設定
  if (camera && renderer) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
  }
};

// 画像の描画
const drawImages = () => {
  if (!scene || !camera || !renderer || !containerRef.value) return;

  // 既存のテクスチャを解放
  textures.forEach((texture) => {
    texture.dispose();
  });
  textures.length = 0;

  // 既存のメッシュを削除
  meshes.forEach(
    (
      mesh: THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshBasicMaterial | THREE.MeshBasicMaterial[]
      >
    ) => {
      if (scene) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => {
            if (m.map) {
              m.map.dispose();
            }
            m.dispose();
          });
        } else {
          if (mesh.material.map) {
            mesh.material.map.dispose();
          }
          mesh.material.dispose();
        }
      }
    }
  );
  meshes.length = 0;

  // 画像を順番に描画（インデックスが小さい順＝後ろから描画）
  props.modelValue.forEach((imageObj, index) => {
    if (!scene) return;

    const texture = new THREE.Texture(imageObj.img);
    texture.needsUpdate = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.push(texture); // テクスチャを追跡配列に追加

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
      alphaTest: 0.01,
      opacity: 1.0,
      blending: THREE.NormalBlending,
    });

    // 画像サイズに基づいてジオメトリを作成
    const maxDimension = Math.max(imageObj.width, imageObj.height);
    const scale = 20 / maxDimension;

    const geometry = new THREE.PlaneGeometry(
      imageObj.width * scale,
      imageObj.height * scale
    );

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -index * layerDistance.value;
    scene.add(mesh);
    meshes.push(mesh);
  });

  // カメラの位置を調整
  if (camera && meshes.length > 0) {
    const lastMesh = meshes[meshes.length - 1];
    const distance = Math.abs(lastMesh.position.z) + 15;
    camera.position.z = distance;
  }
};

// アニメーションループ
const animate = () => {
  if (!renderer || !scene || !camera) return;

  animationFrameId = requestAnimationFrame(animate);
  controls?.update();
  renderer.render(scene, camera);
};

// ウィンドウリサイズ時の処理
const handleResize = () => {
  if (!camera || !renderer || !containerRef.value) return;

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);

  // リサイズ時に再描画
  drawImages();
};

// パラメータの変更を監視
watch([layerDistance], () => {
  drawImages();
});

onMounted(() => {
  // DOMの更新を待ってから初期化
  setTimeout(() => {
    setupScene();
    drawImages();
    animate();
  }, 100);

  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }

  window.removeEventListener("resize", handleResize);

  // テクスチャの解放
  textures.forEach((texture) => {
    texture.dispose();
  });
  textures.length = 0;

  // リソースの解放
  meshes.forEach(
    (
      mesh: THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshBasicMaterial | THREE.MeshBasicMaterial[]
      >
    ) => {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => {
          if (m.map) {
            m.map.dispose();
          }
          m.dispose();
        });
      } else {
        if (mesh.material.map) {
          mesh.material.map.dispose();
        }
        mesh.material.dispose();
      }
    }
  );
  meshes.length = 0;

  if (renderer) {
    renderer.dispose();
    const gl = renderer.getContext();
    if (gl) {
      const loseContext = gl.getExtension("WEBGL_lose_context");
      if (loseContext) loseContext.loseContext();
    }
    renderer.domElement.remove();
    renderer = null;
  }

  if (scene) {
    scene.clear();
    scene = null;
  }

  camera = null;
  controls = null;
});
</script>

<style scoped>
.layered-images-container {
  width: 100%;
  height: 500px;
  overflow: hidden;
  position: relative;
}

.controls {
  background-color: rgba(255, 255, 255, 0.9);
  padding: 1rem;
  border-radius: 4px;
}
</style>
