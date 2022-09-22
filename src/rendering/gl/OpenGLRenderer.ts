import {mat4, vec2, vec3, vec4} from 'gl-matrix';
import Drawable from './Drawable';
import Camera from '../../Camera';
import {gl} from '../../globals';
import ShaderProgram from './ShaderProgram';

// In this file, `gl` is accessible because it is imported above
class OpenGLRenderer {

  postprocess_tex: WebGLTexture | null;

  constructor(public canvas: HTMLCanvasElement) {

  }

  setClearColor(r: number, g: number, b: number, a: number) {
    gl.clearColor(r, g, b, a);
  }

  setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  

  render(camera: Camera, prog: ShaderProgram, drawables: Array<Drawable>, myTime: number, myFreq: vec4,
  myNoiseFreq: vec4, myNoiseAmp: vec4, myNoisePersistence: vec4, myNoiseOctaves: vec4, myLightPos: vec4, myLightCol: vec3) {

      let model = mat4.create();
      let viewProj = mat4.create();
      
      let lightColor = vec4.fromValues(myLightCol[0], myLightCol[1], myLightCol[2], 1);
      let camPos = vec4.fromValues(camera.controls.eye[0], camera.controls.eye[1], camera.controls.eye[2], 1);
      let screenDims = vec2.fromValues(this.canvas.width, this.canvas.height);

      mat4.identity(model);
      mat4.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
      prog.setModelMatrix(model);
      prog.setViewProjMatrix(viewProj);
      prog.setTime(myTime);
      prog.setFreq(myFreq);
      prog.setNoiseFreq(myNoiseFreq);
      prog.setNoiseAmp(myNoiseAmp);
      prog.setNoisePersistence(myNoisePersistence);
      prog.setNoiseOctaves(myNoiseOctaves);
      prog.setLightPos(myLightPos);
      prog.setLightCol(lightColor);
      
      
      prog.setCamPos(camPos);
      prog.setCamViewMatrix(camera.viewMatrix);

      prog.setScreenDims(screenDims);

      prog.setModelMatrix(model);
          
          
      for (let this_drawable of drawables) {
        prog.draw(this_drawable);
      }
      
			
		}
};

export default OpenGLRenderer;
