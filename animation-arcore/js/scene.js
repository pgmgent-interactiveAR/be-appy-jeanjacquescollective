import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import animalUrl from '../src/LowPoly-Characters.glb?url';
const RETICLE_URL =
  'https://immersive-web.github.io/webxr-samples/media/gltf/reticle/reticle.gltf';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export const clock = new THREE.Clock();
export const camera = new THREE.PerspectiveCamera();

export let scene = null;
export let modelLoaded = null;
let reticle = null;
export let renderer;
let model;
let clips;
export let mixers = [];
export let modelsInScene = [];
let raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

export const initScene = (gl, session) => {
  let checkButton = document.getElementById('checkButton');
  let cancelPlaceModelButton = document.getElementById(
    'cancelPlaceModelButton'
  );
  let trashButton = document.getElementById('trashButton');
  let cancelButton = document.getElementById('cancelButton');
  let rotateLeftButton = document.getElementById('rotateLeftButton');
  let rotateRightButton = document.getElementById('rotateRightButton');

  // checkButton.addEventListener('click', placeObject);
  // cancelPlaceModelButton.addEventListener('click', stopPlacingModel);
  // trashButton.addEventListener('click', deleteTargetObject);
  // cancelButton.addEventListener('click', cancelTargetObject);
  // rotateLeftButton.addEventListener('click', rotateLeftModel);
  // rotateRightButton.addEventListener('click', rotateRightModel);

  // create scene to draw object on
  scene = new THREE.Scene();
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
  directionalLight.position.set(10, 15, 10);
  scene.add(directionalLight);
  const loader = new GLTFLoader();
  loader.load(RETICLE_URL, function (gltf) {
    reticle = gltf.scene;
    reticle.visible = false;
    scene.add(reticle);
  });

  loader.load(animalUrl, function (gltf) {
    model = gltf.scene;
    clips = gltf.animations;
    model.position.set(0, 0, -2);
    model.scale.set(1, 1, 1);
    model.rotateY(0);
    model.visible = true;
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    // loaderAnim.remove();
    // scene.add(model);
  });

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    preserveDrawingBuffer: true,
    canvas: gl.canvas,
    context: gl,
  });

  renderer.autoClear = false;

  camera.matrixAutoUpdate = false;
};

export function setModelLoaded(model) {
  modelLoaded = model;
}

const getOriginalParentOfObject3D = (objectParam) => {
  let founded = false;
  let parent = null;

  while (!founded) {
    //Keep moving to object parent until the parent of the object is       //Scene. Scene parent is null

    if (objectParam.parent.parent === null) {
      parent = objectParam;
      founded = true;
    } else {
      objectParam = objectParam.parent;
    }
  }
  return parent;
};

export const onSelectionEvent = (event) => {
  let source = event.inputSource;
  if (source.targetRayMode != 'screen') {
    return;
  }
  if (
    event.type === 'select'
    // !isCatalogueOpen &&
    // !placeObjectButtons &&
    // !objectSelectedButtons &&
  ) {
    addOrSelectModel();
  }
};

export const addOrSelectModel = () => {


  

  raycaster.setFromCamera( pointer, camera );

  // let cameraPostion = new THREE.Vector3();
  // let cameraDirection = new THREE.Vector3();
  // camera.getWorldPosition(cameraPostion);
  // camera.getWorldDirection(cameraDirection);
  // _raycaster.set(cameraPostion, cameraDirection);
  // console.log(_raycaster)
  const intersects = raycaster.intersectObjects(modelsInScene, true);
  console.log(intersects);
  if (intersects.length > 0) {
    let object = getOriginalParentOfObject3D(intersects[0].object);
    if (object != null) {
      if (targetObject != null) {
        // cancelTargetObject();
        // setObjectSelectedButtons(false);
      }
      object.translateY(0.1);
      targetObject = object;
      modelLoaded = null;
    }
  } else {
    addModel();
  }
};

export const addModel = () => {
  if (model) {
    const clone = SkeletonUtils.clone(model);
    clone.position.copy(reticle.position);
    scene.add(clone);
    const mixer = new THREE.AnimationMixer(clone);
    // Play a specific animation
    const clip = THREE.AnimationClip.findByName(clips, 'sillydance');
    const action = mixer.clipAction(clip);
    mixers.push(mixer);
    modelsInScene.push(clone);
    action.play();
  }
};

export const updateReticle = (hitTestResults, referenceSpace) => {
  if (hitTestResults.length > 0 && reticle !== null) {
    const hitPose = hitTestResults[0].getPose(referenceSpace);

    reticle.position.set(
      hitPose.transform.position.x,
      hitPose.transform.position.y,
      hitPose.transform.position.z
    );
    // reticle.matrix.fromArray( hitPose.transform.matrix )
    reticle.visible = true;
    reticle.updateMatrixWorld(true);
  } else {
    // reticle.visible = false;
  }
};

export function existModelsOnScene() {
  return modelsInScene.length > 0;
}

export const onPointerMove = ( event ) => {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}