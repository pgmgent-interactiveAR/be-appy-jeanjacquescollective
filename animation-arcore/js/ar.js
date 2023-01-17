import animalUrl from '../dist/assets/LowPoly-Characters.glb?url'
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';


import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
const app = () => {
  const init = () => {
    console.log(navigator.xr);
    if (navigator.xr) {
      document.querySelector('#startAR').addEventListener('click', activateXR);
    } else {
      alert('not comp');
    }
  };

  const activateXR = async () => {
    // create canvas and initialize WebGL Context
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const gl = canvas.getContext('webgl', { xrCompatible: true });

    // create scene to draw object on
    const scene = new THREE.Scene();

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(10, 15, 10);
    scene.add(directionalLight);
    const loader = new GLTFLoader();
    let reticle;
    loader.load(
      'https://immersive-web.github.io/webxr-samples/media/gltf/reticle/reticle.gltf',
      function (gltf) {
        reticle = gltf.scene;
        reticle.visible = false;
        scene.add(reticle);
      }
    );

    let animal;
    loader.load(
      animalUrl,
      function (gltf) {
        animal = gltf.scene;
        animal.position.set(0,0,-2);
        animal.scale.set(1,1,1);
        animal.rotateY(0);
        animal.visible = true;
        scene.add(animal);
      }
    );
    
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      preserveDrawingBuffer: true,
      canvas: canvas,
      context: gl,
    });

    renderer.autoClear = false;

    const camera = new THREE.PerspectiveCamera();
    camera.matrixAutoUpdate = false;

    const session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: {root: document.getElementById('app')},
    });

    session.updateRenderState({
      baseLayer: new XRWebGLLayer(session, gl),
    });
    session.addEventListener('select', (event) => {
      if (animal) {
        const clone = SkeletonUtils.clone(animal);
        clone.position.copy(reticle.position);
        scene.add(clone);
      }
    });
    const referenceSpace = await session.requestReferenceSpace('local');

    const viewerSpace = await session.requestReferenceSpace('viewer');

    const hitTestSource = await session.requestHitTestSource({
      space: viewerSpace,
    });

    const onXRFrame = (time, frame) => {
      session.requestAnimationFrame(onXRFrame);

      gl.bindFramebuffer(
        gl.FRAMEBUFFER,
        session.renderState.baseLayer.framebuffer
      );

      const pose = frame.getViewerPose(referenceSpace);

      if (pose) {

        const view = pose.views[0];

        const viewport = session.renderState.baseLayer.getViewport(view);
        renderer.setSize(viewport.width, viewport.height);

        camera.matrix.fromArray(view.transform.matrix);
        camera.projectionMatrix.fromArray(view.projectionMatrix);
        camera.updateMatrixWorld(true);

        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0 && reticle) {
          const hitPose = hitTestResults[0].getPose(referenceSpace);
          reticle.visible = true;
          reticle.position.set(
            hitPose.transform.position.x,
            hitPose.transform.position.y,
            hitPose.transform.position.z
          );
          reticle.updateMatrixWorld(true);
        }
        renderer.render(scene, camera);
      }
    };
    session.requestAnimationFrame(onXRFrame);
  };

  const rotateCube = (cubeToRotate, speedX = 0, speedY = 0) => {
    cubeToRotate.rotation.y += speedX;
    cubeToRotate.rotation.x += speedY;
  };

  init();
};

app();
