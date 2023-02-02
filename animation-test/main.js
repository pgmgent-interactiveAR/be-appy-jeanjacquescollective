import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import modelUrl from './src/Helena-lowres.glb?url';
// import model2Url from './src/dinosaur.glb?url';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';


export let mixers = [];

function init() {
  let modelLoaded = null;
const modelsUrl = [modelUrl];
let models = [];

let clips = null;

const loader = new GLTFLoader();
  const container = document.getElementById( 'container' );

  const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.set( 1, 2, - 3 );
  camera.lookAt( 0, 1, 0 );

  const clock = new THREE.Clock();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xa0a0a0 );
  scene.fog = new THREE.Fog( 0xa0a0a0, 10, 50 );

  const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
  hemiLight.position.set( 0, 20, 0 );
  scene.add( hemiLight );

  const dirLight = new THREE.DirectionalLight( 0xffffff );
  dirLight.position.set( - 3, 10, - 10 );
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 2;
  dirLight.shadow.camera.bottom = - 2;
  dirLight.shadow.camera.left = - 2;
  dirLight.shadow.camera.right = 2;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 40;
  scene.add( dirLight );

  // scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

  // ground

  const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
  mesh.rotation.x = - Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add( mesh );


  modelsUrl.forEach((modelUrl, index) => {
    console.log('ret')
    loader.load(modelUrl, function (gltf) {
      models[index] = gltf.scene;
      modelLoaded = models[index];
      let actions = [];
      let mixer = new THREE.AnimationMixer( models[index] );
      if(gltf.animations){
        clips = gltf.animations;
        clips.forEach((clip,index) => {
          actions[index] = mixer.clipAction( clips [index]);
        })
      }
      // model.position.set(0, 0, -2);
      models[index].scale.set(0.5, 0.5, 0.5);
      models[index].rotateY(0);
      models[index].visible = true;
      let skeleton = new THREE.SkeletonHelper( models[index] );
      skeleton.visible = false;
      scene.add( skeleton );
      scene.add(models[index]);
      models[index].actions = actions;
      models[0].actions.forEach((action, index) =>{ 
        console.log(action)
      });
    });

  });

 
}

init();