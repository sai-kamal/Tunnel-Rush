precision mediump float;

attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_texture;

uniform mat4 projection, view, model, modelInv;
uniform bool isFishLens;

varying vec3 FragPos, Normal;
varying vec2 TextureCoord;
varying vec3 v_surfaceToLight;

void main() {
  gl_Position = projection * view * model * vec4(a_position, 1);
  FragPos = vec3(model * vec4(a_position, 1.0));
  mat3 tm;
  tm[0] = vec3(modelInv[0].x, modelInv[1].x, modelInv[2].x);
  tm[1] = vec3(modelInv[0].y, modelInv[1].y, modelInv[2].y);
  tm[2] = vec3(modelInv[0].z, modelInv[1].z, modelInv[2].z);
  Normal = tm * vec3(a_normal);
  TextureCoord = a_texture;
}
