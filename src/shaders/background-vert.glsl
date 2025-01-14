#version 300 es

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