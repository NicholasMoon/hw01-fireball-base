import {vec3, vec4} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import PostProcessQuad from './geometry/PostProcessQuad';
import Plane from './geometry/Plane';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  tesselations: 6,
  lava_time_frequency: 70.0,
  lava_noise_frequency: 0.6,
  lava_noise_amp: 1.4,
  lava_noise_persistence: 0.5,
  lava_noise_octaves: 4,
  terrain_noise_frequency: 0.39,
  terrain_noise_frequency_2: 0.15,
  terrain_noise_amp: 0.9,
  terrain_noise_persistence: 0.5,
  terrain_noise_octaves: 4,
  water_time_frequency: 40.0,
  water_noise_frequency: 0.024,
  water_noise_frequency_2: 0.48,
  water_noise_amp: 1.7,
  water_noise_persistence: 0.5,
  water_noise_octaves: 4,
  water_noise_bias: 0.25,
  water_noise_gain: 0.6,
  stars_time_frequency: 30.0,
  stars_noise_frequency: 1.46,
  'Reload Scene': ReloadScene, // A function pointer, essentially
};

let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let postprocessquad: PostProcessQuad;
let plane: Plane;
let water_plane: Plane;
let prevTesselations: number = 6;
let myTime: number = 0;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 8.5, 0), 4, controls.tesselations);
	icosphere.create();
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();
  cube = new Cube(vec3.fromValues(2, 0, 0));
  cube.create();
  postprocessquad = new PostProcessQuad(vec3.fromValues(2, 0, 0));
  postprocessquad.create();
  plane = new Plane(vec3.fromValues(0, 0, 0), vec4.fromValues(-20.0,20.0,-20.0,20.0), 80.0);
  plane.create();
  water_plane = new Plane(vec3.fromValues(0, 2, 0), vec4.fromValues(-20.0,20.0,-20.0,20.0), 80.0);
  water_plane.create();

}

function ReloadScene() {
  controls.tesselations = 6;
  controls.lava_time_frequency = 70.0;
  controls.lava_noise_frequency = 0.6;
  controls.lava_noise_amp = 1.4;
  controls.lava_noise_persistence = 0.5;
  controls.lava_noise_octaves = 4;
  controls.terrain_noise_frequency = 0.39;
  controls.terrain_noise_frequency_2 = 0.15;
  controls.terrain_noise_amp = 0.9;
  controls.terrain_noise_persistence = 0.5;
  controls.terrain_noise_octaves = 4;
  controls.water_time_frequency = 40.0;
  controls.water_noise_frequency = 0.024;
  controls.water_noise_frequency_2 = 0.48;
  controls.water_noise_amp = 1.7;
  controls.water_noise_persistence = 0.5;
  controls.water_noise_octaves = 4;
  controls.water_noise_bias = 0.25;
  controls.water_noise_gain = 0.6;
  controls.stars_time_frequency = 30.0;
  controls.stars_noise_frequency = 1.46;

}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI({width: 350});
  gui.add(controls, 'tesselations', 0, 8).step(1).listen();

  gui.add(controls, 'lava_time_frequency', 10.0, 500.0).step(10.0).listen(); 
  gui.add(controls, 'lava_noise_frequency', 0.1, 8.0).step(0.1).listen();
  gui.add(controls, 'lava_noise_amp', 0.1, 2.0).step(0.1).listen(); 
  gui.add(controls, 'lava_noise_persistence', 0.1, 2.0).step(0.1).listen();
  gui.add(controls, 'lava_noise_octaves', 1, 8).step(1).listen();

  gui.add(controls, 'terrain_noise_frequency', 0.01, 1.0).step(0.01).listen();
  gui.add(controls, 'terrain_noise_frequency_2', 0.01, 1.0).step(0.01).listen();
  gui.add(controls, 'terrain_noise_amp', 0.1, 2.0).step(0.1).listen(); 
  gui.add(controls, 'terrain_noise_persistence', 0.1, 2.0).step(0.1).listen();
  gui.add(controls, 'terrain_noise_octaves', 1, 8).step(1).listen();

  gui.add(controls, 'water_time_frequency', 10.0, 500.0).step(10.0).listen(); 
  gui.add(controls, 'water_noise_frequency', 0.001, 0.1).step(0.001).listen();
  gui.add(controls, 'water_noise_frequency_2', 0.01, 1.0).step(0.01).listen();
  gui.add(controls, 'water_noise_amp', 0.1, 2.0).step(0.1).listen(); 
  gui.add(controls, 'water_noise_persistence', 0.1, 2.0).step(0.1).listen();
  gui.add(controls, 'water_noise_octaves', 1, 8).step(1).listen();
  gui.add(controls, 'water_noise_bias', 0.01, 1.0).step(0.01).listen();
  gui.add(controls, 'water_noise_gain', 0.01, 1.0).step(0.01).listen();

  gui.add(controls, 'stars_time_frequency', 10.0, 500.0).step(10.0).listen(); 
  gui.add(controls, 'stars_noise_frequency', 0.1, 2.0).step(0.01).listen();
  
  gui.add(controls, 'Reload Scene').listen();

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 6, 22), vec3.fromValues(0, 6, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  const ground = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/ground-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/ground-frag.glsl')),
  ]);

  const background = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/background-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/background-frag.glsl')),
  ]);

  const water_shader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/water-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/water-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

  // read from GUI
  let frequencies = vec4.fromValues(controls.lava_time_frequency, controls.water_time_frequency, controls.terrain_noise_frequency_2, controls.stars_time_frequency);
  let noiseFrequencies = vec4.fromValues(controls.lava_noise_frequency, controls.terrain_noise_frequency, controls.water_noise_frequency, controls.stars_noise_frequency);
  let noiseAmplitudes = vec4.fromValues(controls.lava_noise_amp, controls.terrain_noise_amp, controls.water_noise_amp, controls.water_noise_frequency_2);
  let noisePersistence = vec4.fromValues(controls.lava_noise_persistence, controls.terrain_noise_persistence, controls.water_noise_persistence, controls.water_noise_bias);
  let noiseOctaves = vec4.fromValues(controls.lava_noise_octaves, controls.terrain_noise_octaves, controls.water_noise_octaves, controls.water_noise_gain);

	let lightColor = vec3.fromValues(232,109,0);
	let lightPos = vec4.fromValues(0, 3.75, 0, 1);

  if(controls.tesselations != prevTesselations)
  {
    // change sphere tesselation
    prevTesselations = controls.tesselations;
    for (let x = 0; x < 1; x += 1) {
      icosphere = new Icosphere(vec3.fromValues(0, 8.5, 0), 4, controls.tesselations);
      icosphere.create();
    }
  }

    // render background
    renderer.render(camera, background, [ postprocessquad ],  myTime, frequencies, 
					noiseFrequencies, noiseAmplitudes, noisePersistence, noiseOctaves, 
					lightPos, lightColor);
    
    // clear depth buffer so next passes write over
    gl.clear(gl.DEPTH_BUFFER_BIT);
    
    // render geometry
    renderer.render(camera, ground, [ plane ],  myTime, frequencies, 
      noiseFrequencies, noiseAmplitudes, noisePersistence, noiseOctaves, 
      lightPos, lightColor);

    renderer.render(camera, water_shader, [ water_plane ],  myTime, frequencies, 
      noiseFrequencies, noiseAmplitudes, noisePersistence, noiseOctaves, 
      lightPos, lightColor);

    renderer.render(camera, lambert, [ icosphere ],  myTime, frequencies, 
      noiseFrequencies, noiseAmplitudes, noisePersistence, noiseOctaves, 
      lightPos, lightColor);



    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
	  myTime = myTime + 1;
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
