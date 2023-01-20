import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import animalUrl from '../src/LowPoly-Characters.glb?url';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const RETICLE_URL =
  'https://immersive-web.github.io/webxr-samples/media/gltf/reticle/reticle.gltf';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { canvas, hitTestResults, session } from './session';

export const clock = new THREE.Clock();
export const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  1,
  1000
);

camera.position.set(0, 0, 3);

export let scene = null;
export let modelLoaded = null;
export let renderer;
export let targetObject = null;

let reticle = null;
let model;
let clips;
export let mixers = [];
export let modelsInScene = [];

let raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();


let selectedModelIndex = 0;
let targetObjectMaterial;

const tempMatrix = new THREE.Matrix4();
export const initScene = (gl, session) => {
  let checkButton = document.getElementById('checkButton');
  // let cancelPlaceModelButton = document.getElementById(
  //   'cancelPlaceModelButton'
  // );
  let trashButton = document.getElementById('trashButton');
  let cancelButton = document.getElementById('cancelButton');
  let rotateLeftButton = document.getElementById('rotateLeftButton');
  let rotateRightButton = document.getElementById('rotateRightButton');

  checkButton.addEventListener('click', addModel);
  // cancelPlaceModelButton.addEventListener('click', stopPlacingModel);
  trashButton.addEventListener('click', deleteTargetObject);
  cancelButton.addEventListener('click', cancelTargetObject);
  rotateLeftButton.addEventListener('click', rotateLeftModel);
  rotateRightButton.addEventListener('click', rotateRightModel);

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
  // renderer.setPixelRatio( window.devicePixelRatio );
  // renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.xr.enabled = true;

  renderer.autoClear = false;

  camera.matrixAutoUpdate = false;
  // document.getElementById('home-menu').addEventListener(
  //   'beforexrselect', ev => {
  //     ev.preventDefault()
  // });

  window.addEventListener('resize', onWindowResize);
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

// export const onSelectionEvent = (event) => {
//   let source = event.inputSource;

//   if (source.targetRayMode != 'screen') {
//     return;
//   }
//   if (
//     event.type === 'select'
//     // !isCatalogueOpen &&
//     // !placeObjectButtons &&
//     // !objectSelectedButtons &&
//   ) {
//     hitTest();
//   }
// };

// export const hitTest = () => {
//   raycaster.setFromCamera(pointer, camera);

//   const intersects = raycaster.intersectObjects(modelsInScene, true);
//   console.log(intersects);
//   // let object = modelsInScene[0];
//   // object.translateY(0.1);
//   //     targetObject = object;
//   if (intersects.length > 0) {
//     let object = getOriginalParentOfObject3D(intersects[0].object);

//     if (object != null) {
//       if (targetObject != null) {
//         // cancelTargetObject();
//         // setObjectSelectedButtons(false);
//       }
//       object.material.emissive.b = 1;
//       object.translateY(0.1);
//       targetObject = object;
//       modelLoaded = null;

//     }
//     return true;
//   }
//   return false;
// };

export const addModel = () => {
  if (model && reticle.visible) {
    const clone = SkeletonUtils.clone(model);
    clone.position.copy(reticle.position);

    const mixer = new THREE.AnimationMixer(clone);
    // Play a specific animation
    const clip = THREE.AnimationClip.findByName(clips, 'sillydance');
    const action = mixer.clipAction(clip);
    mixers.push(mixer);
    modelsInScene.push(clone);
    action.play();
    scene.add(clone);
    // console.log('model added' + model)
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
    if (reticle && reticle.visible) {
      reticle.visible = false;
    }
  }
};

export function existModelsOnScene() {
  return modelsInScene.length > 0;
}

export const onPointerMove = (event) => {
  // calculate pointer position in normalized device coordinates
  // (-1 to +1) for both components
  // console.log(event.target);
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  console.log('pointermoved');
};

function rotateLeftModel() {
  targetObject.rotateY(-0.5);
}

function rotateRightModel() {
  targetObject.rotateY(0.5);
}

export function cancelTargetObject() {
  targetObjectMaterial.emissive.b = 0;
  targetObject = null;
}

function deleteTargetObject() {
  targetObject.clear();
  let index = modelsInScene.indexOf(targetObject);
  if (targetObject != -1) {
    modelsInScene.splice(index, 1);
  }
  targetObject = null;
}

// target

export function onSelectStart(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  console.log('selectStart', modelsInScene);
  if (modelsInScene.length > 0) {
    if (modelsInScene.length == selectedModelIndex) {
      selectedModelIndex = 0;
    }
    targetObject = modelsInScene[selectedModelIndex];
    if(targetObjectMaterial){
      targetObjectMaterial.emissive.b = 0;
    }
    targetObjectMaterial = targetObject.children[0].children[0].material;
    console.log(targetObject);
    //console.log(getOriginalParentOfObject3D(hitTestResults[0].object));
    let _raycaster = new THREE.Raycaster();
      var cameraPostion = new THREE.Vector3();
    var cameraDirection = new THREE.Vector3();
      camera.getWorldPosition(cameraPostion);
      camera.getWorldDirection(cameraDirection);
      _raycaster.set( cameraPostion, cameraDirection );
      // _raycaster.set( camera.getWorldPosition(), camera.getWorldDirection() );
   //  _raycaster.setFromCamera(pointer, camera);
    const intersects = _raycaster.intersectObjects(modelsInScene, true);
    console.log(intersects);
    //   if ( intersects.length > 0 ) {
    //     let object = getOriginalParentOfObject3D(intersects[0].object);
    //     if(object != null) {
    //       if(targetObject != null) {
    //         cancelTargetObject();
    //         setObjectSelectedButtons(false);
    //       }
    // TODO: this
    targetObjectMaterial.emissive.b = 1;
    // targetObject.translateY(.1);
    modelLoaded = null;
    selectedModelIndex++;
  }
}

export function onSelectEnd(event) {
  // const controller = event.target;
  // if ( targetObject !== null ) {
  //   const object = controller.userData.selected;
  //   object.material.emissive.b = 0;
  //   // group.attach( object );
  //   // controller.userData.selected = undefined;
  //   object.translateY(0.1);
  //   targetObject = null;
  //   modelLoaded = object;
  // }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}
