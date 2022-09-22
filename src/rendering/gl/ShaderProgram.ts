import {vec2, vec4, mat4} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../../globals';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;
  shader_name: string;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    this.shader_name = source;
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;
  vert_shader_file: string;
  frag_shader_file: string;
  

  attrPos: number;
  attrNor: number;
  attrCol: number;
  attrUV: number;

  unifModel: WebGLUniformLocation;
  unifModelInvTr: WebGLUniformLocation;
  unifViewProj: WebGLUniformLocation;
  unifColor: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;
  unifCubePos: WebGLUniformLocation;
  
  unifFreq: WebGLUniformLocation;
  unifNoiseFreq: WebGLUniformLocation;
  unifNoiseAmp: WebGLUniformLocation;
  unifNoisePersistence: WebGLUniformLocation;
  unifNoiseOctaves: WebGLUniformLocation;
  
  unifLightPos: WebGLUniformLocation;
  unifLightCol: WebGLUniformLocation;
  
  unifRoughness: WebGLUniformLocation;
  unifMetallic: WebGLUniformLocation;
  
  unifCamPos: WebGLUniformLocation;
  unifCamViewMatrix: WebGLUniformLocation;

  unifScreenDims: WebGLUniformLocation;

  unifRenderedTexture: WebGLUniformLocation;

  constructor(shaders: Array<Shader>) {
    this.prog = gl.createProgram();

    this.vert_shader_file = shaders[0].shader_name;
    this.frag_shader_file = shaders[1].shader_name;

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");
    this.attrUV = gl.getAttribLocation(this.prog, "vs_UV");

    this.unifModel      = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj   = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifColor      = gl.getUniformLocation(this.prog, "u_Color");
    this.unifTime       = gl.getUniformLocation(this.prog, "u_Time");
    this.unifCubePos    = gl.getUniformLocation(this.prog, "u_CubePos");
	
	
    this.unifFreq    = gl.getUniformLocation(this.prog, "u_Freq");
    this.unifNoiseFreq    = gl.getUniformLocation(this.prog, "u_NoiseFreq");
    this.unifNoiseAmp    = gl.getUniformLocation(this.prog, "u_NoiseAmp");
    this.unifNoisePersistence    = gl.getUniformLocation(this.prog, "u_NoisePersistence");
    this.unifNoiseOctaves    = gl.getUniformLocation(this.prog, "u_NoiseOctaves");
    
    this.unifLightPos    = gl.getUniformLocation(this.prog, "u_LightPos");
    this.unifLightCol    = gl.getUniformLocation(this.prog, "u_LightCol");
    
    this.unifRoughness    = gl.getUniformLocation(this.prog, "u_Roughness");
    this.unifMetallic    = gl.getUniformLocation(this.prog, "u_Metallic");
    
    this.unifCamPos    = gl.getUniformLocation(this.prog, "u_CamPos");
    this.unifCamViewMatrix    = gl.getUniformLocation(this.prog, "u_CamViewMatrix");

    this.unifScreenDims    = gl.getUniformLocation(this.prog, "u_ScreenDims");

    this.unifRenderedTexture    = gl.getUniformLocation(this.prog, "u_RenderedTexture");
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== -1) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== -1) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  setViewProjMatrix(vp: mat4) {
    this.use();
    if (this.unifViewProj !== -1) {
      gl.uniformMatrix4fv(this.unifViewProj, false, vp);
    }
  }
  
  setTime(myTime: number) {
    this.use();
    if (this.unifTime !== -1) {
      gl.uniform1i(this.unifTime, myTime);
    }
  }
  
  setFreq(myFreq: vec4) {
    this.use();
    if (this.unifFreq !== -1) {
      gl.uniform4fv(this.unifFreq, myFreq);
    }
  }
  
  setNoiseFreq(myNoiseFreq: vec4) {
    this.use();
    if (this.unifNoiseFreq !== -1) {
      gl.uniform4fv(this.unifNoiseFreq, myNoiseFreq);
    }
  }
  
  setNoiseAmp(myNoiseAmp: vec4) {
    this.use();
    if (this.unifNoiseAmp !== -1) {
      gl.uniform4fv(this.unifNoiseAmp, myNoiseAmp);
    }
  }
  
  setNoisePersistence(myNoisePersistence: vec4) {
    this.use();
    if (this.unifNoisePersistence !== -1) {
      gl.uniform4fv(this.unifNoisePersistence, myNoisePersistence);
    }
  }
  
  setNoiseOctaves(myNoiseOctaves: vec4) {
    this.use();
    if (this.unifNoiseOctaves !== -1) {
      gl.uniform4fv(this.unifNoiseOctaves, myNoiseOctaves);
    }
  }
  
  setLightPos(myLightPos: vec4) {
    this.use();
    if (this.unifLightPos !== -1) {
      gl.uniform4fv(this.unifLightPos, myLightPos);
    }
  }
  
  setLightCol(myLightCol: vec4) {
    this.use();
    if (this.unifLightCol !== -1) {
      gl.uniform4fv(this.unifLightCol, myLightCol);
    }
  }
  
  setCamPos(myCamPos: vec4) {
    this.use();
    if (this.unifCamPos !== -1) {
      gl.uniform4fv(this.unifCamPos, myCamPos);
    }
  }

  setCamViewMatrix(myCamViewMatrix: mat4) {
    this.use();
    if (this.unifCamViewMatrix !== -1) {
      gl.uniformMatrix4fv(this.unifCamViewMatrix, false, myCamViewMatrix);
    }
  }

  setScreenDims(myScreenDims: vec2) {
    this.use();
    if (this.unifScreenDims !== -1) {
      gl.uniform2fv(this.unifScreenDims, myScreenDims);
    }
  }

  draw(d: Drawable) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
    }

    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
    }

    if (this.attrUV != -1 && d.bindUV()) {
      gl.enableVertexAttribArray(this.attrUV);
      gl.vertexAttribPointer(this.attrUV, 2, gl.FLOAT, false, 0, 0);
    }

    d.bindIdx();
    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
    if (this.attrUV != -1) gl.disableVertexAttribArray(this.attrUV);
  }
};

export default ShaderProgram;
