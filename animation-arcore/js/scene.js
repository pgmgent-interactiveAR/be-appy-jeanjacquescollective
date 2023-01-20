import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import modelUrl from '../src/LowPoly-Characters.glb?url';
import model2Url from '../src/dinosaur.glb?url';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  hideObjectSelectedDivs,
  hidePlaceObjectDiv,
  hideTargetDot,
  setObjectSelectedButtons,
  showObjectSelectedDivs,
  showPlaceObjectDiv,
  showTargetDot,
} from './session';

const animatedWithBones = true;
const testArrow = false;
export const clock = new THREE.Clock();
export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

export let scene = null;
export let modelLoaded = null;
export let renderer;
export let targetObject = null;

export let reticle = null;
let models = [];
let clips = null;
let arrow = null;
export let mixers = [];
export let modelsInScene = [];

let raycaster = new THREE.Raycaster();

export let targetedCircle = null;
export const initScene = (gl, session) => {
  let checkButton = document.getElementById('checkButton');
  // let cancelPlaceModelButton = document.getElementById(
  //   'cancelPlaceModelButton'
  // );
  let trashButton = document.getElementById('trashButton');
  let cancelButton = document.getElementById('cancelButton');
  let rotateLeftButton = document.getElementById('rotateLeftButton');
  let rotateRightButton = document.getElementById('rotateRightButton');

  const danceButtons = document.querySelectorAll('.danceButton');

  danceButtons.forEach((el) =>
    el.addEventListener('click', (event) => {
      startDance(event.target.getAttribute('data-el'));
    })
  );

  const modelButtons = document.querySelectorAll('.modelButtons');

  modelButtons.forEach((el) =>
    el.addEventListener('click', (event) => {
      selectModel(event.target.getAttribute('data-el'));
    })
  );
  checkButton.addEventListener('click', placeObject);
  // cancelPlaceModelButton.addEventListener('click', stopPlacingModel);
  trashButton.addEventListener('click', deleteTargetObject);
  cancelButton.addEventListener('click', cancelTargetObject);
  rotateLeftButton.addEventListener('click', rotateLeftModel);
  rotateRightButton.addEventListener('click', rotateRightModel);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    autoClear: true,
    context: gl,
    canvas: gl.canvas,
  });
  renderer.setClearColor(0x010101, 0);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  // for correct displaying
  renderer.xr.setReferenceSpaceType('local');
  renderer.xr.setSession(session);

  // create scene to draw object on
  scene = new THREE.Scene();
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
  directionalLight.position.set(10, 15, 10);
  scene.add(directionalLight);
  const loader = new GLTFLoader();

  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
    new THREE.MeshPhongMaterial({ color: '#2d4258' })
  );
  if (testArrow) {
    arrow = new THREE.ArrowHelper(
      raycaster.ray.direction,
      raycaster.ray.origin,
      100,
      Math.random() * 0xffffff
    );
    scene.add(arrow);
  }

  loader.load(modelUrl, function (gltf) {
    models[0] = gltf.scene;
    modelLoaded = models[0];
    clips = gltf.animations;
    // model.position.set(0, 0, -2);
    if (animatedWithBones) {
      models[0].scale.set(0.5, 0.5, 0.5);
      // let skeleton = new THREE.SkeletonHelper( model );
      // skeleton.visible = true;
      // scene.add(skeleton);
    } else {
      models[0].scale.set(0.001, 0.001, 0.001);
    }

    models[0].rotateY(0);
    models[0].visible = true;
    models[0].traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    // loaderAnim.remove();
    // scene.add(model);
  });

  loader.load(model2Url, function (gltf) {
    models[1] = gltf.scene;
    // modelLoaded = model;
    //clips = gltf.animations;
    //model.position.set(0, 0, -2);
  
    models[1].scale.set(0.001, 0.001, 0.001);


    models[1].rotateY(0);
    models[1].visible = true;
    // loaderAnim.remove();
    // scene.add(models[1]);
  });

  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  camera.matrixAutoUpdate = false;

  // prevent selection
  document
    .getElementById('home-menu')
    .addEventListener('beforexrselect', (ev) => {
      ev.preventDefault();
    });

  window.addEventListener('resize', onWindowResize);
};

export function setModelLoaded(model) {
  modelLoaded = models[0];
}

const getOriginalParentOfObject3D = (objectParam) => {
  let founded = false;
  let parent = null;

  while (!founded) {
    //Keep moving to object parent until the parent of the object is
    //Scene. Scene parent is null
    if (objectParam.parent.parent === null) {
      parent = objectParam;
      founded = true;
    } else {
      objectParam = objectParam.parent;
    }
  }
  return parent.root;
};

export const getModelOnSelect = (event) => {
  console.log(event.target);
  // TODO set from camera
  // onPointerMove(event);
  // raycaster.setFromCamera(pointer, camera);
  // cameraWorldPosition.setFromMatrixPosition( camera.matrixWorld );
  let cameraPosition = new THREE.Vector3();
  let cameraDirection = new THREE.Vector3();
  camera.getWorldPosition(cameraPosition);
  camera.getWorldDirection(cameraDirection);
  // console.log(cameraPosition);
  raycaster.set(cameraPosition, cameraDirection);
  if (testArrow) {
    arrow.position.copy(cameraPosition);
    arrow.setDirection(raycaster.ray.direction);
  }

  const intersects = raycaster.intersectObjects(modelsInScene, true);
  // let object = modelsInScene[0];
  // object.translateY(0.1);
  //     targetObject = object;
  if (intersects.length > 0) {
    let object = getOriginalParentOfObject3D(intersects[0].object);
    if (object != null) {
      if (targetObject != null) {
        cancelTargetObject(false);
        setObjectSelectedButtons(false);
      }
      // object.getObjectByProperty("isSkinnedMesh", true).material.emissive.b = .5;
      targetObject = object;
      console.log(targetedCircle)
      if(!targetedCircle || targetedCircle.parent == null){
      targetedCircle = reticle.clone();
      console.log(targetObject);
      targetedCircle.position.copy(targetObject.position);
      // targetedCircle.applyMatrix4(targetObject.matrix);
      scene.add(targetedCircle);
      }
      modelLoaded = null;
      showObjectSelectedDivs();
      hideTargetDot();
      hidePlaceObjectDiv();
    } else if (targetObject) {
      // targetObject.getObjectByProperty("isSkinnedMesh", true).material.emissive.b = 0;
    }
  } else if (targetObject) {
    // targetObject.getObjectByProperty("isSkinnedMesh", true).material.emissive.b = 0;
  }
};

export const placeObject = (event) => {
  event.preventDefault();
  if (modelLoaded && reticle.visible) {
    if (clips) {
      const clone = SkeletonUtils.clone(modelLoaded);
      //clone.position.copy(reticle.position);
      clone.applyMatrix4(reticle.matrix);
      const mixer = new THREE.AnimationMixer(clone);
      let skeleton = new THREE.SkeletonHelper(clone);
      skeleton.visible = false;

      // Play a specific animation
      const clip = THREE.AnimationClip.findByName(clips, 'sillydance');
      const action = mixer.clipAction(clip);
      mixers.push(mixer);
      modelsInScene.push(skeleton);

      action.play();
      scene.add(clone);
      scene.add(skeleton);
    } else {
      const clone = modelLoaded.clone()
      //clone.position.copy(reticle.position);
      clone.applyMatrix4(reticle.matrix);
      scene.add(clone);
      modelsInScene.push(clone);
    }
  }
};

export function existModelsOnScene() {
  return modelsInScene.length > 0;
}

function rotateLeftModel() {
  targetObject.rotateY(-0.5);
}

function rotateRightModel() {
  targetObject.rotateY(0.5);
}

export function cancelTargetObject(buttonClicked = true) {
  if (buttonClicked) {
    scene.remove(targetedCircle);
    targetedCircle.clear();
    console.log('targeted');
  }

  // targetObject = null;
  modelLoaded = models[0];
  hideObjectSelectedDivs();
  showTargetDot();
  showPlaceObjectDiv();
}

function deleteTargetObject() {
  modelsInScene.forEach(model => {
    if(targetObject == model.root){
      scene.remove(model);
    }
  });
  scene.remove(targetedCircle);
  scene.remove(targetObject);
  targetedCircle.clear();
  targetObject.clear();
  let index = modelsInScene.indexOf(targetObject);
  if (targetObject != -1) {
    modelsInScene.splice(index, 1);
  }
  targetObject = null;
  modelLoaded = models[0];
  hideObjectSelectedDivs();
  showPlaceObjectDiv();
  showTargetDot();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

const startDance = (dance) => {
  mixers.forEach((mixer, index) => {
    if (mixer.getRoot() === targetObject) {
      mixer.stopAllAction();
      console.log(mixer.getRoot());
      const clip = THREE.AnimationClip.findByName(clips, dance);
      if (mixer.existingAction(clip) != null) {
        mixer.existingAction(clip, targetObject).play();
        return;
      }
      mixer.clipAction(clip, targetObject).play();
    }
  });
};

const selectModel = (index) => {
  modelLoaded = models[index];
  console.log(modelLoaded)
};