<template>
  <div>
    <div class="controls mb-4">
      <v-card-title class="text-subtitle-1">{{
        t("layeredImages.controls.title")
      }}</v-card-title>
      <v-row>
        <v-col cols="12" sm="6">
          <v-slider
            v-model="layerDistance"
            :min="0.1"
            :max="2"
            :step="0.1"
            :label="t('layeredImages.layerDistance')"
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
import { useI18n } from "vue-i18n";
import type { ImageDataObject } from "@/types/imageData";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const { t } = useI18n();

const props = defineProps<{
  modelValue: ImageDataObject[];
  selectedIndices?: number[]; // 選択されたレイヤーのインデックスの配列
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
const meshes: (
  | THREE.Mesh<
      THREE.BufferGeometry,
      THREE.MeshBasicMaterial | THREE.MeshBasicMaterial[]
    >
  | THREE.LineSegments
)[] = [];
const textures: THREE.Texture[] = []; // テクスチャを追跡するための配列

// 外部から呼び出し可能な再描画メソッドを定義
const redraw = () => {
  drawImages();
};

// プロパティの変更を監視
watch(
  [layerDistance, () => props.selectedIndices, () => props.modelValue],
  () => {
    nextTick(() => {
      drawImages();
    });
  },
  { deep: true }
);

// シーンのセットアップ
const setupScene = () => {
  if (!containerRef.value) return;

  // シーン作成
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // カメラ設定
  const aspect =
    containerRef.value.clientWidth / containerRef.value.clientHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  camera.position.z = 30;

  // レンダラー設定
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
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

  // 初期描画
  drawImages();
};

// 画像の描画
const drawImages = () => {
  if (!scene || !camera || !renderer || !containerRef.value) return;

  // 既存のメッシュとテクスチャをクリーンアップ
  cleanup();

  // シーンが空の場合は早期リターン
  if (props.modelValue.length === 0) return;

  // 画像を順番に描画（インデックスが小さい順＝後ろから描画）
  props.modelValue.forEach((imageObj, index) => {
    if (!scene) return;

    const texture = new THREE.Texture(imageObj.img);
    texture.needsUpdate = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.push(texture);

    // レイヤーの選択状態に応じて透明度を設定
    const isSelected = props.selectedIndices?.includes(index) ?? true;
    const opacity = isSelected ? 1.0 : 0.05;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      alphaTest: 0.001,
      opacity: opacity,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendEquation: THREE.AddEquation,
    });

    // 画像サイズに基づいてジオメトリを作成
    const maxDimension = Math.max(imageObj.width, imageObj.height);
    const scale = 20 / maxDimension;
    const geometry = new THREE.PlaneGeometry(
      imageObj.width * scale,
      imageObj.height * scale
    );

    // 前面の画像
    const frontMesh = new THREE.Mesh(geometry, material);
    frontMesh.position.z = -index * layerDistance.value;
    frontMesh.renderOrder = props.modelValue.length - index;

    // 背面の画像（黒い断面を表現するため）
    const backMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      opacity: material.opacity,
      alphaMap: texture,
      alphaTest: 0.001,
    });
    const backMesh = new THREE.Mesh(geometry, backMaterial);
    backMesh.position.z = frontMesh.position.z - 0.05;
    backMesh.renderOrder = frontMesh.renderOrder - 0.5;

    scene.add(frontMesh);
    scene.add(backMesh);
    meshes.push(frontMesh, backMesh);
  });

  // カメラの位置を調整
  if (camera && meshes.length > 0) {
    const lastMesh = meshes[meshes.length - 1];
    const distance = Math.abs(lastMesh.position.z) + 15;
    camera.position.z = distance;
    camera.updateProjectionMatrix();
  }
};

// アニメーションループ
const animate = () => {
  if (!renderer || !scene || !camera) return;

  animationFrameId = requestAnimationFrame(animate);
  controls?.update();

  // シーンが空でない場合のみレンダリング
  if (scene.children.length > 0) {
    renderer.render(scene, camera);
  }
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

// クリーンアップ関数
const cleanup = () => {
  // 既存のテクスチャを解放
  textures.forEach((texture) => {
    texture.dispose();
  });
  textures.length = 0;

  // 既存のメッシュを削除
  meshes.forEach((mesh) => {
    if (scene) {
      scene.remove(mesh);
      if (mesh instanceof THREE.Mesh) {
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
      } else if (mesh instanceof THREE.LineSegments) {
        mesh.geometry.dispose();
      }
    }
  });
  meshes.length = 0;
};

onMounted(() => {
  // DOMの更新を待ってから初期化
  setTimeout(() => {
    setupScene();
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
      mesh:
        | THREE.Mesh<
            THREE.BufferGeometry,
            THREE.MeshBasicMaterial | THREE.MeshBasicMaterial[]
          >
        | THREE.LineSegments
    ) => {
      if (mesh instanceof THREE.Mesh) {
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
      } else if (mesh instanceof THREE.LineSegments) {
        mesh.geometry.dispose();
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

// expose redraw method
defineExpose({
  redraw,
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
