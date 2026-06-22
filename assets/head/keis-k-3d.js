import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { SVGLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/SVGLoader.js';

const container = document.querySelector('#keis-k-3d');

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 2000);
camera.position.set(0, 0, 850);

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 1.3));

const light1 = new THREE.DirectionalLight(0xffffff, 3.5);
light1.position.set(300, 400, 500);
scene.add(light1);

const light2 = new THREE.DirectionalLight(0xff8a3d, 2.2);
light2.position.set(-300, 100, 350);
scene.add(light2);

const group = new THREE.Group();
scene.add(group);

const whiteMat = new THREE.MeshStandardMaterial({
  color: 0xf2eee7,
  metalness: 0.9,
  roughness: 0.18
});

const orangeMat = new THREE.MeshStandardMaterial({
  color: 0xe77f32,
  metalness: 0.85,
  roughness: 0.2
});

const loader = new SVGLoader();

loader.load('/assets/head/keis-k-mark.svg', (data) => {
  data.paths.forEach((path) => {
    const shapes = SVGLoader.createShapes(path);

    shapes.forEach((shape) => {
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 85,
        bevelEnabled: true,
        bevelThickness: 10,
        bevelSize: 7,
        bevelSegments: 6
      });

      geometry.center();

      const fill = path.userData?.style?.fill || '';
      const material = fill.includes('orange') || fill.includes('e77f32') || fill.includes('dc8a45')
        ? orangeMat
        : whiteMat;

      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
    });
  });

  group.scale.set(0.42, -0.42, 0.42);
});

function animate() {
  requestAnimationFrame(animate);

  group.rotation.y += 0.018;
  group.rotation.x = 0.04;

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});