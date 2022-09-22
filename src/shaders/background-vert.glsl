#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;
precision highp int;

in vec4 vs_Pos;
in vec2 vs_UV;

out vec4 fs_Pos;
out vec2 fs_UV;

void main()
{
    fs_UV = vs_UV;
    fs_Pos = vs_Pos;
    gl_Position = vs_Pos;
}