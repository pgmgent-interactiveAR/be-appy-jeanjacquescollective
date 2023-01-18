import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {
  addModel,
  camera,
  clock,
  initScene,
  mixers,
  onPointerMove,
  onSelectionEvent,
  renderer,
  scene,
  updateReticle,
} from './scene';

export const xrButton = document.querySelector('#startAR');

export const checkXR = async () => {
  if (navigator.xr) {
    const isSupported = await checkSupportedState();
    return isSupported;
  }
};

export const loaderAnim = document.getElementById('js-loader');
let sessionSupported = false;
let targetObject = null;

let delta = 0;
let session = null;
export let referenceSpace,
  viewerSpace,
  hitTestSource = null;

const checkSupportedState = () => {
  return new Promise((resolve, reject) => {
    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
      if (supported) {
        xrButton.innerHTML = 'Enter AR';
        sessionSupported = true;
        resolve(true);
      } else {
        xrButton.innerHTML = 'AR not found';
        reject();
      }
    });
  });
};

export const activateXR = async () => {
  if (!session) {
    session = await navigator.xr.requestSession('immersive-ar', {
      optionalFeatures: ['dom-overlay'],
      requiredFeatures: ['hit-test'],
      domOverlay: { root: document.getElementById('app') },
    });
    onSessionStarted(session);
  } else {
    session.end();
  }
};
const onSessionStarted = async (session) => {
  // create canvas and initialize WebGL Context
  const canvas = document.createElement('canvas');
  loaderAnim.classList.remove('hidden');
  document.body.appendChild(canvas);
  let gl = canvas.getContext('webgl', { xrCompatible: true });
  // if (WEBGL.isWebGL2Available()) {
  //   gl = canvas.getContext('webgl2', { xrCompatible: true });
  // } else {
  //   gl = canvas.getContext('webgl', { xrCompatible: true });
  // }
  // const gl = canvas.getContext('webgl', { xrCompatible: true });
  initScene(gl, session);
  session.updateRenderState({
    baseLayer: new XRWebGLLayer(session, gl),
  });
  referenceSpace = await session.requestReferenceSpace('local');
  viewerSpace = await session.requestReferenceSpace('viewer');
  hitTestSource = await session.requestHitTestSource({
    space: viewerSpace,
  });

  const onXRFrame = (time, frame) => {
    session.requestAnimationFrame(onXRFrame);
    delta = clock.getDelta();
    mixers.forEach((mixer, index) => {
      mixer.update(delta);
    });
    const pose = frame.getViewerPose(referenceSpace);

    if (pose) {
      const view = pose.views[0];
      const viewport = session.renderState.baseLayer.getViewport(view);
      renderer.setSize(viewport.width, viewport.height);
      camera.matrix.fromArray(view.transform.matrix);
      camera.projectionMatrix.fromArray(view.projectionMatrix);
      camera.updateMatrixWorld(true);
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      updateReticle(hitTestResults, referenceSpace);
    }
    gl.bindFramebuffer(
      gl.FRAMEBUFFER,
      session.renderState.baseLayer.framebuffer
    );

    renderer.render(scene, camera);
  };

  session.addEventListener('select', onSelectionEvent);
  session.requestAnimationFrame(onXRFrame);
};

window.addEventListener('pointermove', onPointerMove);
