import {vec2, vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Plane extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  center: vec4;
  dimensions: vec4; // [xi, xo, zi, zo]
  resolution: number;


  constructor(center: vec3, dimensions: vec4, resolution: number) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    this.dimensions = vec4.fromValues(dimensions[0], dimensions[1], dimensions[2], dimensions[3]);
    this.resolution = resolution;
  }

  create() {

    let x_start = this.dimensions[0];
    let x_end = this.dimensions[1];

    let z_start = this.dimensions[2];
    let z_end = this.dimensions[3];

    let cell_width_x = (this.dimensions[1] - this.dimensions[0]) / this.resolution;
    let half_cell_width_x = cell_width_x / 2.0;

    let cell_width_z = (this.dimensions[3] - this.dimensions[2]) / this.resolution;
    let half_cell_width_z = cell_width_z / 2.0;

    this.indices = new Uint32Array(40000);
    this.normals = new Float32Array(110000);
    this.positions = new Float32Array(110000);


    let this_tri_index = 0;
    let this_index_index = 0;

    let this_cells_index = 0;

    for (let xi = x_start; xi < x_end; xi += cell_width_x) {
      for (let zi = z_start; zi < z_end; zi += cell_width_z) {
        // handle this cells indices
          this.indices[this_index_index] = this_tri_index;
          this.indices[this_index_index + 1] = this_tri_index + 1;
          this.indices[this_index_index + 2] = this_tri_index + 2;
          this.indices[this_index_index + 3] = this_tri_index;
          this.indices[this_index_index + 4] = this_tri_index + 2;
          this.indices[this_index_index + 5] = this_tri_index + 3;
          this_index_index += 6;
          this_tri_index += 4;

          // handle this cells normals
          for (let i = 0; i < 4; ++i) {
            
            this.normals[this_cells_index + (4 * i)] = 0;
            this.normals[this_cells_index + (4 * i) + 1] = 1;
            this.normals[this_cells_index + (4 * i) + 2] = 0;
            this.normals[this_cells_index + (4 * i) + 3] = 0;
          }
          // handle this cells positions
          this.positions[this_cells_index] = xi - half_cell_width_x;
          this.positions[this_cells_index + 1] = this.center[1];
          this.positions[this_cells_index + 2] = zi - half_cell_width_z;
          this.positions[this_cells_index + 3] = 1;

          this.positions[this_cells_index + 4] = xi + half_cell_width_x;
          this.positions[this_cells_index + 5] = this.center[1];
          this.positions[this_cells_index + 6] = zi - half_cell_width_x;
          this.positions[this_cells_index + 7] = 1;

          this.positions[this_cells_index + 8] = xi + half_cell_width_x;
          this.positions[this_cells_index + 9] = this.center[1];
          this.positions[this_cells_index + 10] = zi + half_cell_width_z;
          this.positions[this_cells_index + 11] = 1;

          this.positions[this_cells_index + 12] = xi - half_cell_width_x;
          this.positions[this_cells_index + 13] = this.center[1];
          this.positions[this_cells_index + 14] = zi + half_cell_width_z;
          this.positions[this_cells_index + 15] = 1;

          this_cells_index += 16;
      }
    }
    console.log(cell_width_x, " ", half_cell_width_x, " ", cell_width_z, " ", half_cell_width_z);
    console.log(this_index_index, " ", this_tri_index, " ", this_cells_index);


    this.generateIdx();
    this.generatePos();
    this.generateNor();

    this.count = this_index_index;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    console.log(`Created plane`);
  }
};

export default Plane;
