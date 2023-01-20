import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import {
  camera,
  clock,
  getModelOnSelect,
  initScene,
  mixers,
  modelLoaded,
  renderer,
  reticle,
  scene,
  targetObject,
} from './scene';

const controls = document.getElementById('app');
let gl = null;
let isCatalogueOpen = false;
let objectSelectedButtons = false;
let placeObjectButtons = false;

export const xrButton = document.querySelector('#startAR');



export let canvas;

export const checkXR = async () => {
  if (navigator.xr) {
    const isSupported = await checkSupportedState();
    return isSupported;
  }
};

export const loaderAnim = document.getElementById('js-loader');
let sessionSupported = false;

let delta = 0;
export let xrSession = null;
export let referenceSpace,
  viewerSpace,
  xrHitTestSource = null;

export let hitTestResults;

export function setObjectSelectedButtons(value) {
  objectSelectedButtons = value;
}

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
  if (!xrSession) {
    xrSession = await navigator.xr.requestSession('immersive-ar', {
      optionalFeatures: ['dom-overlay'],
      requiredFeatures: ['local', 'hit-test'],
      domOverlay: { root: controls },
    });
    onSessionStarted(xrSession);
  } else {
    xrSession.end();
  }
};
const onSessionStarted = async (session) => {
  session.addEventListener('end', onSessionEnded);
  session.addEventListener("select", onSelectionEvent)
  // session.addEventListener('select', onSelectionEvent);
  // session.addEventListener( 'selectstart', onSelectStart );
  // session.addEventListener( 'selectend', onSelectEnd );
  // document.addEventListener( 'mousemove', onpointermove );
  controls.classList.remove('hidden');

  // create canvas and initialize WebGL Context
  canvas = document.createElement('canvas');
  loaderAnim.classList.remove('hidden');
  // document.body.appendChild(canvas);
  gl = canvas.getContext('webgl2', { xrCompatible: true });
  // gl = canvas.getContext('webgl', { xrCompatible: true })
  initScene(gl, session);
  session.updateRenderState({
    baseLayer: new XRWebGLLayer(session, gl),
  });
  referenceSpace = await session.requestReferenceSpace('local');
  viewerSpace = await session.requestReferenceSpace('viewer');
  xrHitTestSource = await session.requestHitTestSource({
    space: viewerSpace,
  });

  session.requestAnimationFrame(onXRFrame);
};

const onXRFrame = (time, frame) => {
  let session = frame.session;
  session.requestAnimationFrame(onXRFrame);
  // console.log(scene.children)
  delta = clock.getDelta();
  mixers.forEach((mixer, index) => {
    mixer.update(delta);
  });


  if (xrHitTestSource && modelLoaded != null) {
    // obtain hit test results by casting a ray from the center of device screen
    // into AR view. Results indicate that ray intersected with one or more detected surfaces
    const hitTestResults = frame.getHitTestResults(xrHitTestSource);
    if (hitTestResults.length && modelLoaded != null) {
      // obtain a local pose at the intersection point
      const pose = hitTestResults[0].getPose(referenceSpace);
      // place a reticle at the intersection point
      reticle.matrix.fromArray(pose.transform.matrix);
      reticle.visible = true;
    }
  } else {
      reticle.visible = false;
    
   
    // do not show a reticle if no surfaces are intersected
    
    // if(placeObjectButtons === true){
    //   // hidePlaceObjectDiv();
    //   placeObjectButtons = false;
    // }
  }

  // bind our gl context that was created with WebXR to threejs renderer
  gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer);
  renderer.render(scene, camera);
};

function onSessionEnded(event) {
  xrSession = null;
  gl = null;
  if (xrHitTestSource) xrHitTestSource.cancel();
  xrHitTestSource = null;
}

const onSelectionEvent = (event) => {
  let source = event.inputSource;

  if (source.targetRayMode != 'screen') {
    return;
  }
  if (
    event.type === 'select' &&
    // !isCatalogueOpen &&
    // !placeObjectButtons &&
    !objectSelectedButtons 
  ) {
   getModelOnSelect(event);
  }
};

export function showPlaceObjectDiv() {
  document.getElementById('checkButtonDiv').style.display = 'flex';
  // document.getElementById('cancelPlaceModelButtonDiv').style.display = 'flex';
}

export function hidePlaceObjectDiv() {
  document.getElementById('checkButtonDiv').style.display = 'none';
  //document.getElementById('cancelPlaceModelButtonDiv').style.display = 'none';
}

export function hideObjectSelectedDivs() {
  document.querySelectorAll('.danceButtonDiv').forEach(el => el.style.display = 'none');
  document.getElementById('trashButtonDiv').style.display = 'none';
  document.getElementById('cancelButtonDiv').style.display = 'none';
  document.getElementById('rotateLeftButtonDiv').style.display = 'none';
  document.getElementById('rotateRightButtonDiv').style.display = 'none';
}

export function showObjectSelectedDivs() {
  document.querySelectorAll('.danceButtonDiv').forEach(el => el.style.display = 'flex');
  document.getElementById('trashButtonDiv').style.display = 'flex';
  document.getElementById('cancelButtonDiv').style.display = 'flex';
  document.getElementById('rotateLeftButtonDiv').style.display = 'flex';
  document.getElementById('rotateRightButtonDiv').style.display = 'flex';
}
export function hideTargetDot() {
  document.getElementById('targetDotDiv').style.display = 'none';
}

export function showTargetDot() {
  document.getElementById('targetDotDiv').style.display = 'flex';
}
