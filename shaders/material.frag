precision mediump float;

struct Material {
  vec3 ambient;
  vec3 diffuse;
  vec3 specular;
  float shininess;
};

struct Light {
  vec3 position;

  vec3 ambient;
  vec3 diffuse;
  vec3 specular;
};

varying vec3 FragPos, Normal;
varying vec2 TextureCoord;

varying vec3 v_surfaceToLight;

uniform vec3 viewPos, viewPos2;
uniform Light light, light2;
uniform Material material;
uniform bool isLight;
uniform sampler2D sampler;
uniform bool isTextured, grayScale, nightVision;

void main() {
  // Ambient
  vec3 ambientC = light.ambient * material.ambient;

  // Diffuse
  vec3 norm = normalize(Normal);
  vec3 lightDir = normalize(light.position - FragPos);
  //float diff = max(dot(norm, lightDir), 0.0);
  float diff = dot(Normal, lightDir);
  vec3 diffuseC = light.diffuse * (diff * material.diffuse);

  // Specular
  vec3 viewDir = normalize(viewPos - FragPos);
  vec3 reflectDir = reflect(-lightDir, norm);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
  vec3 specularC = light.specular * (spec * material.specular);

  vec3 result = ambientC + diffuseC + specularC;

  vec4 fragmentColor;
  if (isTextured) {
      fragmentColor = texture2D(sampler, vec2(TextureCoord.s, TextureCoord.t));
  } else {
      fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
  gl_FragColor = vec4(fragmentColor.rgb * result, fragmentColor.a);
  
  if(!grayScale && !nightVision) {
    gl_FragColor = vec4(fragmentColor.rgb * result, fragmentColor.a);
  }
  else if(grayScale && !nightVision) {
    fragmentColor[0] *= 0.3;
    fragmentColor[1] *= 0.59;
    fragmentColor[2] *= 0.11;
    vec3 gray = vec3(fragmentColor[0] + fragmentColor[1] + fragmentColor[2]);
    gl_FragColor = vec4(gray * result, fragmentColor.a);
  }
  else if(nightVision){
    fragmentColor[0] *= 0.3;
    fragmentColor[1] *= 0.59;
    fragmentColor[2] *= 0.11;
    gl_FragColor = vec4(fragmentColor.rgb, fragmentColor.a);
  }

  //if (isLight) gl_FragColor = vec4(1.0);
  if (isLight) gl_FragColor.rgb *= diff;
}
