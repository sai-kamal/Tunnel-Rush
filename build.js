(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
'use strict';

var shaders = require('./shaders');

var _require = require('./models'),
    drawModel = _require.drawModel,
    makeModel = _require.makeModel,
    drawLight = _require.drawLight;

var m = require('./matrix');
var vec = require('./vector');
// var mt = require('mousetrap')

window.playFlag = 1;
window.jumpFlag = 1;
window.grayScale = 0;
window.nightVision = 0;
window.gFlag = 1;
window.nFlag = 1;
window.gravity = 0.001;
window.velocity = 1;
window.jumpx = 0;
window.jumpy = 0;
window.jumpz = 0;

window.level = 1;
window.score = 0;
window.prevScore = -10;
var numObstacles = 7;
var numObstacles2 = 5;
var then = 0;

var scalex = 1;
var scaley = 1;
var scalez = 1;

var up = [0, 1, 0];
var outerRadius = 50.0 * scalex;
window.revolveAngle = 0;
var revolveRadius = outerRadius;
window.revolveSpeed = 18;

window.octRadius = 5 * scalex; //0.25
window.octAngle = 270;
window.octSpeed = 200;
window.octStepsA = 0;
window.octStepsD = 0;

var Camera = {
  x: revolveRadius,
  y: 0,
  z: 0,
  lookx: 0,
  looky: 0,
  lookz: 0,
  tempx: 0,
  tempz: 0,
  mouseUpdate: false,
  fishLens: false,
  fishView: false,
  mouseX: 0,
  mouseY: 0
};

function toRadians(angle) {
  return angle * (Math.PI / 180);
}

window.Matrices = {};
window.models = {};

window.addEventListener('keydown', keyChecker);
window.addEventListener('keyup', keyChecker);

window.keyMap = {};
function keyChecker(key) {
  window.keyMap[key.keyCode] = key.type == "keydown";
}

function keyImplementation() {
  if (window.keyMap[65]) {
    window.octStepsA -= 1;
  }
  if (window.keyMap[68]) {
    window.octStepsD -= 1;
  }
  if (window.keyMap[87]) {
    window.revolveAngle -= 0.7;
  }
  if (window.keyMap[83]) {
    window.revolveAngle += 0.7;
  }
  if (window.keyMap[32] && window.jumpFlag) {
    window.velocity = 0;
    window.gravity = 0.1;
    window.jumpFlag = 0;
    // console.log("jump")
  }
  if (window.keyMap[71] && window.gFlag) {
    window.grayScale = !window.grayScale;
    window.gFlag = 0;
    gl.uniform1i(gl.getUniformLocation(program, 'grayScale'), window.grayScale);
    // console.log('g');
    // console.log(window.grayScale);
  }
  if (!window.keyMap[71]) {
    window.gFlag = 1;
  }

  if (window.keyMap[78] && window.nFlag) {
    window.nightVision = !window.nightVision;
    window.nFlag = 0;
    gl.uniform1i(gl.getUniformLocation(program, 'nightVision'), window.nightVision);
    console.log('n');
    // console.log(window.nightVision);
  }
  if (!window.keyMap[78]) {
    window.nFlag = 1;
  }
  // if(window.keyMap[32] == false) {
  //   window.jumpFlag = 1;
  // }
}

function autoMovement() {

  Camera.x = revolveRadius * Math.cos(toRadians(window.revolveAngle));
  Camera.z = revolveRadius * Math.sin(toRadians(window.revolveAngle));

  window.octAngle += Math.round(window.octStepsA - window.octStepsD) * window.deltaTime * window.octSpeed;
  var tempx = window.octRadius * Math.cos(toRadians(window.octAngle)) * Math.cos(toRadians(window.revolveAngle));
  Camera.y = window.octRadius * Math.sin(toRadians(window.octAngle));
  var tempz = window.octRadius * Math.cos(toRadians(window.octAngle)) * Math.sin(toRadians(window.revolveAngle));
  // console.log("tempx", window.jumpx);
  // console.log("tempz", window.jumpy);
  // console.log(window.octAngle);

  Camera.x += tempx;
  Camera.z += tempz;
  window.octStepsA = 0;
  window.octStepsD = 0;

  // var look = vec.cross([Camera.x, Camera.y, Camera.z], [0, 1, 0]);
  var look = vec.normalize(vec.cross(vec.normalize([Camera.x, Camera.y, Camera.z]), [0, 1, 0]));
  Camera.lookx = -look[0];
  Camera.looky = -look[1];
  Camera.lookz = -look[2];

  // window.octAngle += window.octSpeed * window.deltaTime;
  // window.octAngle = window.octAngle % 360;
  if (window.playFlag == 1) {
    window.revolveAngle -= window.revolveSpeed * window.deltaTime;
  }
  Camera.tempx = tempx;
  Camera.tempz = tempz;
  up[0] = Math.round(-tempx);
  up[1] = Math.round(-Camera.y);
  up[2] = Math.round(-tempz);

  // var temp_up = [0, 0, 0];
  // temp_up[0] = Math.cos(toRadians(window.revolveAngle)) - Camera.x;
  // temp_up[1] = -Camera.y;
  // temp_up[2] = Math.sin(toRadians(window.revolveAngle)) - Camera.z;
  if (window.jumpFlag == 0) {
    var cos = vec.dot(vec.normalize(up), vec.normalize([Camera.x, Camera.y, Camera.z]));
    // var cos = vec.dot(vec.normalize(up), vec.normalize([Math.cos(toRadians(window.revolveAngle)), 0, Math.sin(toRadians(window.revolveAngle))]))
    var jump_angle = Math.round(Math.acos(cos) * (180 / Math.PI));
    // console.log("jump_angle", jump_angle);
    if (window.octAngle % 360 <= 180 && window.octAngle >= 0) {
      jump_angle = 180 + 180 - jump_angle;
      // }
    } else if (window.octAngle < 0 && window.octAngle % 360 <= -180) {
      jump_angle = 180 + 180 - jump_angle;
    }

    // console.log(Math.round(window.octAngle) % 360);
    // console.log("up", vec.normalize(up));
    // console.log(window.velocity);

    window.jumpx = 0;
    window.jumpy = 0;
    window.jumpz = 0;

    if (window.velocity > 4) {
      window.velocity = 4;
      window.gravity = -window.gravity;
    } else if (window.velocity < 0) {
      window.velocity = 0;
      window.gravity = 0;
      window.jumpFlag = 1;
    }
    window.velocity += window.gravity;
    // window.velocity = window
    window.jumpx = Math.cos(toRadians(jump_angle)) * window.velocity * Math.cos(toRadians(window.revolveAngle));
    window.jumpy = Math.sin(toRadians(jump_angle)) * window.velocity;
    window.jumpz = Math.cos(toRadians(jump_angle)) * window.velocity * Math.sin(toRadians(window.revolveAngle));
  }

  Camera.x += window.jumpx;
  Camera.y += window.jumpy;
  Camera.y += window.jumpz;
}

function resizeCanvas() {
  window.canvas.height = window.innerHeight;
  window.canvas.width = window.innerWidth;
}

function Initialize() {
  document.getElementById('backaudio').play();
  window.canvas = document.getElementById("canvas");
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // window.canvas.onmousemove = updateCameraTarget

  window.gl = canvas.getContext("experimental-webgl");
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // setup a GLSL program
  shaders.createShader('material');

  // var temp = -20
  // makeModel('obstacle', 'assets/cube', [revolveRadius * Math.cos(toRadians(temp)), 0, revolveRadius * Math.sin(toRadians(temp))],
  //   [8, 4, 1], //scale
  //   temp, //rotateAngle1
  //   90); //rotateAngle2


  for (var i = 0; i < numObstacles; i++) {
    var temp = Math.random() * 1000 % 360 - 360;
    // var rotationSpeed = Math.random() * (2.5 - 0.5 + 1) + 0.5;
    makeModel('obstacle' + i, 'assets/cubetex', [revolveRadius * Math.cos(toRadians(temp)), 0, revolveRadius * Math.sin(toRadians(temp))], [8, 1, 1], //scale
    temp, //rotateAngle1
    Math.random() * 1000 % 360, //rotateAngle2
    0);
  }

  makeModel('pipe', 'assets/pipe', [0, 0, 0], [scalex, scaley, scalez], [0, 0, 0]); //rotate dummy value = [0, 0, 0]

  requestAnimationFrame(tick);
}
window.Initialize = Initialize;

window.Camera = Camera;

function animate(now) {
  if (window.playFlag) {
    window.score += 1;
  }

  if (window.score == 300) {
    window.prevScore = window.score;
    window.level++;
    window.revolveSpeed *= 1.5;
    for (var i = 0; i < numObstacles; i++) {
      var rotationSpeed = Math.random() * (1.5 - 0.5 + 1) + 0.5;
      models["obstacle" + i].rotationSpeed = rotationSpeed;
    }

    for (i = 0; i < numObstacles2; i++) {
      var temp = Math.random() * 1000 % 360 - 360;
      rotationSpeed = Math.random() * (2.5 - 0.5 + 1) + 0.5;
      makeModel('obstacleBig' + i, 'assets/cubetex', [revolveRadius * Math.cos(toRadians(temp)), 0, revolveRadius * Math.sin(toRadians(temp))], [8, 2, 1], //scale
      temp, //rotateAngle1
      Math.random() * 1000 % 360, //rotateAngle2
      rotationSpeed);
    }
  }

  if (window.score == 2 * window.prevScore && window.score > 150) {
    window.prevScore = window.score;
    window.level++;
    window.revolveSpeed *= 1.5;
    for (i = 0; i < numObstacles; i++) {
      models["obstacle" + i].rotationSpeed *= 1.25;
    }

    for (i = 0; i < numObstacles2; i++) {
      models["obstacleBig" + i].rotationSpeed *= 1.25;
    }
  }

  if (window.revolveSpeed > 50) window.revolveSpeed = 50;

  var score = document.getElementById('score');
  score.innerText = 'SCORE: ' + window.score + '\n\n' + 'LEVEL: ' + window.level;
  now *= 0.001;
  // var timeNow = new Date().getTime();
  // if (lastTime == 0) { lastTime = timeNow; return; }
  window.deltaTime = now - then;
  updateCamera();
  then = now;
}

// var lastTime = 0;
// function animate() {
//   var timeNow = new Date().getTime();
//   if (lastTime == 0) { lastTime = timeNow; return; }
//   // var d = (timeNow - lastTime) / 50;
//   updateCamera();
//   lastTime = timeNow;
// }

function drawScene() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.1, 0.1, 0.1, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  shaders.useShader('material');

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  // Matrices.model = m.multiply(m.translate(table.center), m.scale(table.scale))
  // drawModel(table)

  // Matrices.model = m.multiply(m.translate(models.light.center), m.scale(models.light.scale))
  // drawLight(modelslight)

  for (var i = 0; i < numObstacles; i++) {
    Matrices.model = m.multiply(m.translate(models["obstacle" + i].center), m.multiply(m.rotateY(toRadians(-models["obstacle" + i].rotateAngle1)), m.multiply(m.rotateZ(toRadians(models["obstacle" + i].rotateAngle2 += models["obstacle" + i].rotationSpeed)), m.scale(models["obstacle" + i].scale))));
    drawModel(models["obstacle" + i]);
  }

  if (window.level >= 2) {
    for (i = 0; i < numObstacles2; i++) {
      Matrices.model = m.multiply(m.translate(models["obstacleBig" + i].center), m.multiply(m.rotateY(toRadians(-models["obstacleBig" + i].rotateAngle1)), m.multiply(m.rotateZ(toRadians(models["obstacleBig" + i].rotateAngle2 += models["obstacleBig" + i].rotationSpeed)),
      // m.multiply(m.translate([0, 4, 0]),m.scale(models["obstacleBig" + i].scale)))));
      m.scale(models["obstacleBig" + i].scale))));
      drawModel(models["obstacleBig" + i]);
    }
  }

  // console.log(Camera.x, Camera.y, Camera.z);
  // Matrices.model = m.multiply(m.translate(models.obstacle.center), m.scale(models.obstacle.scale))

  // Matrices.model= m.multiply(m.translate(models.obstacle.center),
  //   m.multiply(m.rotateY(toRadians(-models.obstacle.rotateAngle1)),
  //     m.multiply(m.rotateZ(toRadians(models.obstacle.rotateAngle2)),
  //       m.scale(models.obstacle.scale))));
  // drawModel(models.obstacle)

  Matrices.model = m.multiply(m.translate(models.pipe.center), m.scale(models.pipe.scale));
  drawModel(models.pipe);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  // if (Camera.x > aquariumSize.x || Camera.x < -aquariumSize.x ||
  //   Camera.y > aquariumSize.y || Camera.y < -aquariumSize.y ||
  //   Camera.z > aquariumSize.z || Camera.z < -aquariumSize.z) {
  //   gl.enable(gl.CULL_FACE);
  // }

  gl.disable(gl.CULL_FACE);
  gl.disable(gl.BLEND);
}

function updateCamera() {
  var eye = [Camera.x, Camera.y, Camera.z];
  var target = [Camera.x + Camera.lookx, Camera.y + Camera.looky, Camera.z + Camera.lookz];
  Matrices.view = m.lookAt(eye, target, up);
  Matrices.projection = m.perspective(Math.PI / 2, canvas.width / canvas.height, 0.1, 500);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "view"), false, Matrices.view);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "projection"), false, Matrices.projection);
  // gl.uniform1i(gl.getUniformLocation(program, "isFishLens"), Camera.fishLens && Camera.fishView);
  // return m.multiply(Matrices.projection, Matrices .view);

  var lightPos = [revolveRadius * Math.cos(toRadians(window.revolveAngle - 25)), 0, revolveRadius * Math.sin(toRadians(window.revolveAngle - 25))];
  // var lightPos = target
  var lightPosLoc = gl.getUniformLocation(program, "light.position");
  var viewPosLoc = gl.getUniformLocation(program, "viewPos");
  gl.uniform3f(lightPosLoc, lightPos[0], lightPos[1], lightPos[2]);
  gl.uniform3f(viewPosLoc, target[0], target[1], target[2]);
  var lightColor = [];
  lightColor[0] = 1;
  lightColor[1] = 1;
  lightColor[2] = 1;
  var diffuseColor = vec.multiplyScalar(lightColor, 1); // Decrease the influence
  var ambientColor = vec.multiplyScalar(diffuseColor, 1); // Low influence
  gl.uniform3f(gl.getUniformLocation(program, "light.ambient"), ambientColor[0], ambientColor[1], ambientColor[2]);
  gl.uniform3f(gl.getUniformLocation(program, "light.diffuse"), diffuseColor[0], diffuseColor[1], diffuseColor[2]);
  gl.uniform3f(gl.getUniformLocation(program, "light.specular"), 1.0, 1.0, 1.0);
}

function tick(now) {
  requestAnimationFrame(tick);
  if (!window.program) return;
  animate(now);
  keyImplementation();
  autoMovement();
  drawScene();
  detectCollisions();
}

function detectCollisions() {
  var angle = 0;
  var i = 0;
  for (i = 0; i < numObstacles; i++) {
    // console.log(i);
    angle = Math.atan(models["obstacle" + i].scale[1] / models["obstacle" + i].scale[0]) * 180 / Math.PI;
    if (window.octAngle % 180 >= models["obstacle" + i].rotateAngle2 % 180 - angle && window.octAngle % 180 <= models["obstacle" + i].rotateAngle2 % 180 + angle && window.revolveAngle % 360 <= models["obstacle" + i].rotateAngle1 + 4 && window.revolveAngle % 360 >= models["obstacle" + i].rotateAngle1 - 4) {
      window.playFlag = 0;
      document.getElementById('gameOverContainer').style.visibility = "visible";
      document.getElementById('scoreContainer').style.visibility = "hidden";
      document.getElementById('gameOver').innerText = "GAME OVER \n\n SCORE: " + window.score + "\n\n" + "LEVEL: " + window.level;
      console.log("yes" + i);
    }
  }
  if (window.level >= 2) {
    // console.log("camera.y", Camera.y);
    for (i = 0; i < numObstacles2; i++) {
      // console.log("obstacle.y" + i, models["obstacleBig" + i].center[1] - 4);
      // console.log("dist", Math.abs(models["obstacleBig" + i].center[1] - Camera.y));

      angle = Math.atan(models["obstacleBig" + i].scale[1] / models["obstacleBig" + i].scale[0]) * 180 / Math.PI;
      if (window.octAngle % 180 >= models["obstacleBig" + i].rotateAngle2 % 180 - angle && window.octAngle % 180 <= models["obstacleBig" + i].rotateAngle2 % 180 + angle && window.revolveAngle % 360 <= models["obstacleBig" + i].rotateAngle1 + 4 && window.revolveAngle % 360 >= models["obstacleBig" + i].rotateAngle1 - 4
      // (Math.abs(models["obstacleBig" + i].center[1] - 4 - Camera.y) <= 5)
      ) {
          window.playFlag = 0;
          document.getElementById('gameOverContainer').style.visibility = "visible";
          document.getElementById('scoreContainer').style.visibility = "hidden";
          document.getElementById('gameOver').innerText = "GAME OVER \n\n SCORE: " + window.score + "\n\n" + "LEVEL: " + window.level;
          console.log("yes" + i);
        }
    }
  }
}

},{"./matrix":2,"./models":3,"./shaders":4,"./vector":5}],2:[function(require,module,exports){
'use strict';

var vec = require('./vector');

// 0 1 2 3        0 1 2 3
// 4 5 6 7        4 5 6 7
// 8 9 10 11      8 9 10 11
// 12 13 14 15    12 13 14 15
function matrixMultiply(mat2, mat1) {
  return [mat1[0] * mat2[0] + mat1[1] * mat2[4] + mat1[2] * mat2[8] + mat1[3] * mat2[12], mat1[0] * mat2[1] + mat1[1] * mat2[5] + mat1[2] * mat2[9] + mat1[3] * mat2[13], mat1[0] * mat2[2] + mat1[1] * mat2[6] + mat1[2] * mat2[10] + mat1[3] * mat2[14], mat1[0] * mat2[3] + mat1[1] * mat2[7] + mat1[2] * mat2[11] + mat1[3] * mat2[15], mat1[4] * mat2[0] + mat1[5] * mat2[4] + mat1[6] * mat2[8] + mat1[7] * mat2[12], mat1[4] * mat2[1] + mat1[5] * mat2[5] + mat1[6] * mat2[9] + mat1[7] * mat2[13], mat1[4] * mat2[2] + mat1[5] * mat2[6] + mat1[6] * mat2[10] + mat1[7] * mat2[14], mat1[4] * mat2[3] + mat1[5] * mat2[7] + mat1[6] * mat2[11] + mat1[7] * mat2[15], mat1[8] * mat2[0] + mat1[9] * mat2[4] + mat1[10] * mat2[8] + mat1[11] * mat2[12], mat1[8] * mat2[1] + mat1[9] * mat2[5] + mat1[10] * mat2[9] + mat1[11] * mat2[13], mat1[8] * mat2[2] + mat1[9] * mat2[6] + mat1[10] * mat2[10] + mat1[11] * mat2[14], mat1[8] * mat2[3] + mat1[9] * mat2[7] + mat1[10] * mat2[11] + mat1[11] * mat2[15], mat1[12] * mat2[0] + mat1[13] * mat2[4] + mat1[14] * mat2[8] + mat1[15] * mat2[12], mat1[12] * mat2[1] + mat1[13] * mat2[5] + mat1[14] * mat2[9] + mat1[15] * mat2[13], mat1[12] * mat2[2] + mat1[13] * mat2[6] + mat1[14] * mat2[10] + mat1[15] * mat2[14], mat1[12] * mat2[3] + mat1[13] * mat2[7] + mat1[14] * mat2[11] + mat1[15] * mat2[15]];
}

function matrixMultiply4x1(mat1, mat2) {
  return [mat1[0] * mat2[0] + mat1[1] * mat2[1] + mat1[2] * mat2[2] + mat1[3] * mat1[3], mat1[4] * mat2[0] + mat1[5] * mat2[1] + mat1[6] * mat2[2] + mat1[7] * mat1[3], mat1[8] * mat2[0] + mat1[9] * mat2[1] + mat1[10] * mat2[2] + mat1[11] * mat1[3], mat1[12] * mat2[0] + mat1[13] * mat2[1] + mat1[14] * mat2[2] + mat1[15] * mat1[3]];
}

function multiply(m1, m2) {
  if (m2.length == 4) return matrixMultiply4x1(m1, m2);else return matrixMultiply(m1, m2);
}

function inverse(a) {
  var s0 = a[0] * a[5] - a[4] * a[1];
  var s1 = a[0] * a[6] - a[4] * a[2];
  var s2 = a[0] * a[7] - a[4] * a[3];
  var s3 = a[1] * a[6] - a[5] * a[2];
  var s4 = a[1] * a[7] - a[5] * a[3];
  var s5 = a[2] * a[7] - a[6] * a[3];

  var c5 = a[10] * a[15] - a[14] * a[11];
  var c4 = a[9] * a[15] - a[13] * a[11];
  var c3 = a[9] * a[14] - a[13] * a[10];
  var c2 = a[8] * a[15] - a[12] * a[11];
  var c1 = a[8] * a[14] - a[12] * a[10];
  var c0 = a[8] * a[13] - a[12] * a[9];

  //console.log(c5,s5,s4);

  // Should check for 0 determinant
  var invdet = 1.0 / (s0 * c5 - s1 * c4 + s2 * c3 + s3 * c2 - s4 * c1 + s5 * c0);

  var b = [[], [], [], []];

  b[0] = (a[5] * c5 - a[6] * c4 + a[7] * c3) * invdet;
  b[1] = (-a[1] * c5 + a[2] * c4 - a[3] * c3) * invdet;
  b[2] = (a[13] * s5 - a[14] * s4 + a[15] * s3) * invdet;
  b[3] = (-a[9] * s5 + a[10] * s4 - a[11] * s3) * invdet;

  b[4] = (-a[4] * c5 + a[6] * c2 - a[7] * c1) * invdet;
  b[5] = (a[0] * c5 - a[2] * c2 + a[3] * c1) * invdet;
  b[6] = (-a[12] * s5 + a[14] * s2 - a[15] * s1) * invdet;
  b[7] = (a[8] * s5 - a[10] * s2 + a[11] * s1) * invdet;

  b[8] = (a[4] * c4 - a[5] * c2 + a[7] * c0) * invdet;
  b[9] = (-a[0] * c4 + a[1] * c2 - a[3] * c0) * invdet;
  b[10] = (a[12] * s4 - a[13] * s2 + a[15] * s0) * invdet;
  b[11] = (-a[8] * s4 + a[9] * s2 - a[11] * s0) * invdet;

  b[12] = (-a[4] * c3 + a[5] * c1 - a[6] * c0) * invdet;
  b[13] = (a[0] * c3 - a[1] * c1 + a[2] * c0) * invdet;
  b[14] = (-a[12] * s3 + a[13] * s1 - a[14] * s0) * invdet;
  b[15] = (a[8] * s3 - a[9] * s1 + a[10] * s0) * invdet;

  return b;
}

function perspective(fieldOfViewInRadians, aspect, near, far) {
  var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
  var rangeInv = 1.0 / (near - far);

  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (near + far) * rangeInv, -1, 0, 0, near * far * rangeInv * 2, 0];
}

function makeZToWMatrix(fudgeFactor) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, fudgeFactor, 0, 0, 0, 1];
}

function translate(tx, ty, tz) {
  if (typeof tx != 'number') {
    var old = tx;
    tx = old[0];
    ty = old[1];
    tz = old[2];
  }
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1];
}

function rotateX(angleInRadians) {
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);

  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
}

function rotateY(angleInRadians) {
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);

  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
}

function rotateZ(angleInRadians) {
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);

  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function scale(sx, sy, sz) {
  if (typeof sx != 'number') {
    var old = sx;
    sx = old[0];
    sy = old[1];
    sz = old[2];
  }
  return [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1];
}

function lookAt(eye, target, up) {
  var f = vec.normalize(vec.subtract(target, eye));
  var s = vec.normalize(vec.cross(f, up));
  var u = vec.cross(s, f);

  var result = identity();
  result[4 * 0 + 0] = s[0];
  result[4 * 1 + 0] = s[1];
  result[4 * 2 + 0] = s[2];
  result[4 * 0 + 1] = u[0];
  result[4 * 1 + 1] = u[1];
  result[4 * 2 + 1] = u[2];
  result[4 * 0 + 2] = -f[0];
  result[4 * 1 + 2] = -f[1];
  result[4 * 2 + 2] = -f[2];
  result[4 * 3 + 0] = -vec.dot(s, eye);
  result[4 * 3 + 1] = -vec.dot(u, eye);
  result[4 * 3 + 2] = vec.dot(f, eye);
  return result;
}

function identity() {
  return scale(1, 1, 1);
}

module.exports = {
  multiply: multiply,
  inverse: inverse,
  identity: identity,

  perspective: perspective,
  makeZToWMatrix: makeZToWMatrix,
  lookAt: lookAt,

  translate: translate,
  rotateX: rotateX, rotateY: rotateY, rotateZ: rotateZ,
  scale: scale
};

},{"./vector":5}],3:[function(require,module,exports){
'use strict';

var m = require('./matrix');

function openFile(name, filename) {
  var datastring;
  $.ajax({
    url: filename + '.obj',
    dataType: "text",
    success: function success(data) {
      datastring = data;
      $.ajax({
        url: filename + '.mtl',
        dataType: "text",
        success: function success(mtlstring) {
          createModel(name, datastring, mtlstring);
        }
      });
    }
  });
}

function makeModel(name, filename) {
  var center = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [0, 0, 0];
  var scale = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [1, 1, 1];
  var rotateAngle1 = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
  var rotateAngle2 = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
  var rotationSpeed = arguments[6];

  models[name] = { name: name, center: center, scale: scale, rotateAngle1: rotateAngle1, rotateAngle2: rotateAngle2, rotationSpeed: rotationSpeed };
  openFile(name, filename);
}

function parseMtl(mtlstring) {
  var mtllib = {};
  var lines = mtlstring.split('\n');
  var curmtl = '';
  for (var j = 0; j < lines.length; j++) {
    var words = lines[j].split(' ');
    if (words[0] == 'newmtl') {
      curmtl = words[1];
      mtllib[curmtl] = {};
    } else if (words[0] == 'Kd') {
      mtllib[curmtl].diffuse = [parseFloat(words[1]), parseFloat(words[2]), parseFloat(words[3])];
    } else if (words[0] == 'Ks') {
      mtllib[curmtl].specular = [parseFloat(words[1]), parseFloat(words[2]), parseFloat(words[3])];
    } else if (words[0] == 'Ka') {
      mtllib[curmtl].ambient = [parseFloat(words[1]), parseFloat(words[2]), parseFloat(words[3])];
    } else if (words[0] == 'Ns') {
      mtllib[curmtl].shininess = parseFloat(words[1]);
    } else if (words[0] == 'map_Kd') {
      loadTexture(words[1], mtllib[curmtl]);
    }
  }
  return mtllib;
}

function handleLoadedTexture(texture) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.bindTexture(gl.TEXTURE_2D, null);
}

function loadTexture(src, material) {
  var texture = gl.createTexture();
  texture.image = new Image();
  texture.image.onload = function () {
    handleLoadedTexture(texture);
    material.texture = texture;
  };
  texture.image.src = src;
  return texture;
}

function createModel(name, filedata, mtlstring) //Create object from blender
{
  var model = models[name];
  var mtllib = parseMtl(mtlstring);
  var vertex_buffer_data = [];
  var points = [];
  var minX = 1000000;
  var maxX = -1000000;
  var minY = 1000000;
  var maxY = -1000000;
  var minZ = 1000000;
  var maxZ = -1000000;

  var invertNormals = false;
  var normals = [];
  var normal_buffer_data = [];

  var textures = [];
  var texture_buffer_data = [];

  model.vaos = [];

  var lines = filedata.split('\n');
  lines = lines.map(function (s) {
    return s.trim();
  });
  lines.push('usemtl');
  for (var j = 0; j < lines.length; j++) {
    var words = lines[j].split(' ');
    if (words[0] == "v") {
      var cur_point = {};
      cur_point['x'] = parseFloat(words[1]);
      if (cur_point['x'] > maxX) {
        maxX = cur_point['x'];
      }
      if (cur_point['x'] < minX) {
        minX = cur_point['x'];
      }
      cur_point['y'] = parseFloat(words[2]);
      if (cur_point['y'] > maxY) {
        maxY = cur_point['y'];
      }
      if (cur_point['y'] < minY) {
        minY = cur_point['y'];
      }
      cur_point['z'] = parseFloat(words[3]);
      if (cur_point['z'] > maxZ) {
        maxZ = cur_point['z'];
      }
      if (cur_point['z'] < minZ) {
        minZ = cur_point['z'];
      }
      //console.log(words);
      points.push(cur_point);
    } else if (words[0] == "vn") {
      var _cur_point = {};
      _cur_point['x'] = parseFloat(words[1]);
      _cur_point['y'] = parseFloat(words[2]);
      _cur_point['z'] = parseFloat(words[3]);
      //console.log(words);
      normals.push(_cur_point);
    } else if (words[0] == "vt") {
      var _cur_point2 = {};
      _cur_point2.s = parseFloat(words[1]);
      _cur_point2.t = parseFloat(words[2]);
      textures.push(_cur_point2);
    }
  }
  model.minX = minX;
  model.maxX = maxX;
  model.minY = minY;
  model.maxY = maxY;
  model.minZ = minZ;
  model.maxZ = maxZ;
  //console.log(points);
  // let lines = filedata.split('\n');
  var curmtl = '';
  for (var jj = 0; jj < lines.length; jj++) {
    var _words = lines[jj].split(' ');
    if (_words[0] == "f") {
      for (var wc = 1; wc < 4; wc++) {
        var vxdata = _words[wc].split('/');
        var p = parseInt(vxdata[0]) - 1;
        var t = parseInt(vxdata[1]) - 1;
        var n = parseInt(vxdata[2]) - 1;
        vertex_buffer_data.push(points[p].x);
        vertex_buffer_data.push(points[p].y);
        vertex_buffer_data.push(points[p].z);

        if (!isNaN(t)) {
          texture_buffer_data.push(textures[t].s);
          texture_buffer_data.push(textures[t].t);
        }

        if (invertNormals) {
          normal_buffer_data.push(-normals[n].x);
          normal_buffer_data.push(-normals[n].y);
          normal_buffer_data.push(-normals[n].z);
        } else {
          normal_buffer_data.push(normals[n].x);
          normal_buffer_data.push(normals[n].y);
          normal_buffer_data.push(normals[n].z);
        }
      }
    } else if (_words[0] == 'usemtl') {
      var vao = {};
      vao.numVertex = vertex_buffer_data.length / 3;
      if (vao.numVertex != 0) {
        var vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_buffer_data), gl.STATIC_DRAW);
        vao.vertexBuffer = vertexBuffer;

        var normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normal_buffer_data), gl.STATIC_DRAW);
        vao.normalBuffer = normalBuffer;

        var textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        if (texture_buffer_data.length > 0) {
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture_buffer_data), gl.STATIC_DRAW);
          vao.isTextured = true;
        } else {
          for (var i = 0; i < 2 * vao.numVertex; i++) {
            texture_buffer_data.push(0);
          }gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture_buffer_data), gl.STATIC_DRAW);
          vao.isTextured = false;
        }
        vao.textureBuffer = textureBuffer;

        vao.material = mtllib[curmtl];

        model.vaos.push(vao);
        vertex_buffer_data = [];
        normal_buffer_data = [];
        texture_buffer_data = [];
      } else if (_words[0] == 'invertNormals') {
        invertNormals = !invertNormals;
      }
      curmtl = _words[1];
    }
  }
}

function drawModel(model) {
  if (!model.vaos) return;
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "model"), false, Matrices.model);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelInv"), false, m.inverse(Matrices.model));

  model.vaos.map(drawVAO);
}

function drawLight(model) {
  gl.uniform1i(gl.getUniformLocation(program, "isLight"), 1);
  drawModel(model);
  gl.uniform1i(gl.getUniformLocation(program, "isLight"), 0);
}

function drawVAO(vao) {
  if (!vao.vertexBuffer) return;

  loadMaterial(vao.material);

  gl.bindBuffer(gl.ARRAY_BUFFER, vao.vertexBuffer);
  gl.vertexAttribPointer(program.positionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, vao.normalBuffer);
  gl.vertexAttribPointer(program.normalAttribute, 3, gl.FLOAT, false, 0, 0);

  var isTextured = vao.material.texture && vao.isTextured;
  // console.log(isTextured)
  gl.uniform1i(gl.getUniformLocation(program, "isTextured"), isTextured);
  gl.bindBuffer(gl.ARRAY_BUFFER, vao.textureBuffer);
  gl.vertexAttribPointer(program.textureAttribute, 2, gl.FLOAT, false, 0, 0);
  if (isTextured) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, vao.material.texture);
    gl.uniform1i(gl.getUniformLocation(program, "sampler"), 0);
  }

  // draw
  gl.drawArrays(gl.TRIANGLES, 0, vao.numVertex);
}

function loadMaterial(material) {
  if (!material) material = {
    ambient: [1, 1, 1],
    diffuse: [1, 1, 1],
    specular: [1, 1, 1],
    shininess: 0
  };
  // Set material properties
  gl.uniform3f(gl.getUniformLocation(program, "material.ambient"), material.ambient[0], material.ambient[1], material.ambient[2]);
  gl.uniform3f(gl.getUniformLocation(program, "material.diffuse"), material.diffuse[0], material.diffuse[1], material.diffuse[2]);
  gl.uniform3f(gl.getUniformLocation(program, "material.specular"), material.specular[0], material.specular[1], material.specular[2]);
  gl.uniform1f(gl.getUniformLocation(program, "material.shininess"), material.shininess);
}

module.exports = {
  makeModel: makeModel,
  createModel: createModel,
  drawModel: drawModel,
  drawLight: drawLight
};

},{"./matrix":2}],4:[function(require,module,exports){
"use strict";

var shaders = {};

function compileShader(gl, shaderSource, shaderType) {
  // Create the shader object
  var shader = gl.createShader(shaderType);

  // Set the shader source code.
  gl.shaderSource(shader, shaderSource);

  // Compile the shader
  gl.compileShader(shader);

  // Check if it compiled
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    // Something went wrong during compilation; get the error
    throw "could not compile shader:" + gl.getShaderInfoLog(shader);
  }

  return shader;
}

function createProgram(gl, name, vertexShader, fragmentShader) {
  // create a program.
  var progra = gl.createProgram();

  // attach the shaders.
  gl.attachShader(progra, vertexShader);
  gl.attachShader(progra, fragmentShader);

  // link the program.
  gl.linkProgram(progra);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  // Check if it linked.
  var success = gl.getProgramParameter(progra, gl.LINK_STATUS);
  if (!success) {
    // something went wrong with the link
    throw "program filed to link:" + gl.getProgramInfoLog(progra);
  }

  window.program = progra;
  program.positionAttribute = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(program.vertexAttribute);

  program.normalAttribute = gl.getAttribLocation(program, "a_normal");
  gl.enableVertexAttribArray(program.normalAttribute);

  program.textureAttribute = gl.getAttribLocation(program, "a_texture");
  gl.enableVertexAttribArray(program.textureAttribute);

  shaders[name] = progra;
}

function openFile(name, filename) {
  $.get(filename + '.vs', function (vxShaderData) {
    var vxShader = compileShader(gl, vxShaderData, gl.VERTEX_SHADER);
    $.get(filename + '.frag', function (fragShaderData) {
      // console.log(vxShaderData, fragShaderData)
      var fragShader = compileShader(gl, fragShaderData, gl.FRAGMENT_SHADER);
      createProgram(gl, name, vxShader, fragShader);
    }, 'text');
  }, 'text');
}

function createShader(shadername) {
  openFile(shadername, 'shaders/' + shadername);
}

function useShader(shadername) {
  window.program = shaders[shadername];
  gl.useProgram(window.program);
}

module.exports = {
  compileShader: compileShader,
  createShader: createShader,
  useShader: useShader
};

},{}],5:[function(require,module,exports){
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function dot(_ref, _ref2) {
  var _ref4 = _slicedToArray(_ref, 3),
      x = _ref4[0],
      y = _ref4[1],
      z = _ref4[2];

  var _ref3 = _slicedToArray(_ref2, 3),
      p = _ref3[0],
      q = _ref3[1],
      r = _ref3[2];

  return x * p + y * q + z * r;
}

function cross(_ref5, _ref6) {
  var _ref8 = _slicedToArray(_ref5, 3),
      ux = _ref8[0],
      uy = _ref8[1],
      uz = _ref8[2];

  var _ref7 = _slicedToArray(_ref6, 3),
      vx = _ref7[0],
      vy = _ref7[1],
      vz = _ref7[2];

  var x = uy * vz - uz * vy;
  var y = uz * vx - ux * vz;
  var z = ux * vy - uy * vx;
  return [x, y, z];
}

function add(_ref9, _ref10) {
  var _ref12 = _slicedToArray(_ref9, 3),
      x = _ref12[0],
      y = _ref12[1],
      z = _ref12[2];

  var _ref11 = _slicedToArray(_ref10, 3),
      p = _ref11[0],
      q = _ref11[1],
      r = _ref11[2];

  return [x + p, y + q, z + r];
}

function subtract(_ref13, _ref14) {
  var _ref16 = _slicedToArray(_ref13, 3),
      x = _ref16[0],
      y = _ref16[1],
      z = _ref16[2];

  var _ref15 = _slicedToArray(_ref14, 3),
      p = _ref15[0],
      q = _ref15[1],
      r = _ref15[2];

  return [x - p, y - q, z - r];
}

function abs(_ref17) {
  var _ref18 = _slicedToArray(_ref17, 3),
      x = _ref18[0],
      y = _ref18[1],
      z = _ref18[2];

  return Math.sqrt(x * x + y * y + z * z);
}

function normalize(_ref19) {
  var _ref20 = _slicedToArray(_ref19, 3),
      x = _ref20[0],
      y = _ref20[1],
      z = _ref20[2];

  var t = abs([x, y, z]);
  return [x / t, y / t, z / t];
}

function multiplyScalar(_ref21, c) {
  var _ref22 = _slicedToArray(_ref21, 3),
      x = _ref22[0],
      y = _ref22[1],
      z = _ref22[2];

  return [x * c, y * c, z * c];
}

module.exports = {
  dot: dot,
  cross: cross,
  add: add,
  subtract: subtract,
  abs: abs,
  normalize: normalize,
  multiplyScalar: multiplyScalar
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbWFpbi5qcyIsInNyYy9tYXRyaXguanMiLCJzcmMvbW9kZWxzLmpzIiwic3JjL3NoYWRlcnMuanMiLCJzcmMvdmVjdG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFJLFVBQVUsUUFBUSxXQUFSLENBQWQ7O2VBQzBDLFFBQVEsVUFBUixDO0lBQXBDLFMsWUFBQSxTO0lBQVcsUyxZQUFBLFM7SUFBVyxTLFlBQUEsUzs7QUFDNUIsSUFBSSxJQUFJLFFBQVEsVUFBUixDQUFSO0FBQ0EsSUFBSSxNQUFNLFFBQVEsVUFBUixDQUFWO0FBQ0E7O0FBRUEsT0FBTyxRQUFQLEdBQWtCLENBQWxCO0FBQ0EsT0FBTyxRQUFQLEdBQWtCLENBQWxCO0FBQ0EsT0FBTyxTQUFQLEdBQW1CLENBQW5CO0FBQ0EsT0FBTyxXQUFQLEdBQXFCLENBQXJCO0FBQ0EsT0FBTyxLQUFQLEdBQWUsQ0FBZjtBQUNBLE9BQU8sS0FBUCxHQUFlLENBQWY7QUFDQSxPQUFPLE9BQVAsR0FBaUIsS0FBakI7QUFDQSxPQUFPLFFBQVAsR0FBa0IsQ0FBbEI7QUFDQSxPQUFPLEtBQVAsR0FBZSxDQUFmO0FBQ0EsT0FBTyxLQUFQLEdBQWUsQ0FBZjtBQUNBLE9BQU8sS0FBUCxHQUFlLENBQWY7O0FBRUEsT0FBTyxLQUFQLEdBQWUsQ0FBZjtBQUNBLE9BQU8sS0FBUCxHQUFlLENBQWY7QUFDQSxPQUFPLFNBQVAsR0FBbUIsQ0FBQyxFQUFwQjtBQUNBLElBQUksZUFBZSxDQUFuQjtBQUNBLElBQUksZ0JBQWdCLENBQXBCO0FBQ0EsSUFBSSxPQUFPLENBQVg7O0FBRUEsSUFBSSxTQUFTLENBQWI7QUFDQSxJQUFJLFNBQVMsQ0FBYjtBQUNBLElBQUksU0FBUyxDQUFiOztBQUVBLElBQUksS0FBSyxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxDQUFUO0FBQ0EsSUFBSSxjQUFjLE9BQU8s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c0M7QUFBQTtBQUFBLE1BQWIsQ0FBYTtBQUFBLE1BQVYsQ0FBVTtBQUFBLE1BQVAsQ0FBTzs7QUFDcEMsU0FBTyxDQUFDLElBQUUsQ0FBSCxFQUFNLElBQUUsQ0FBUixFQUFXLElBQUUsQ0FBYixDQUFQO0FBQ0Q7O0FBRUQsT0FBTyxPQUFQLEdBQWlCO0FBQ2YsVUFEZTtBQUVmLGNBRmU7QUFHZixVQUhlO0FBSWYsb0JBSmU7QUFLZixVQUxlO0FBTWYsc0JBTmU7QUFPZjtBQVBlLENBQWpCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc31yZXR1cm4gZX0pKCkiLCJ2YXIgc2hhZGVycyA9IHJlcXVpcmUoJy4vc2hhZGVycycpXG52YXIgeyBkcmF3TW9kZWwsIG1ha2VNb2RlbCwgZHJhd0xpZ2h0IH0gPSByZXF1aXJlKCcuL21vZGVscycpXG52YXIgbSA9IHJlcXVpcmUoJy4vbWF0cml4JylcbnZhciB2ZWMgPSByZXF1aXJlKCcuL3ZlY3RvcicpXG4vLyB2YXIgbXQgPSByZXF1aXJlKCdtb3VzZXRyYXAnKVxuXG53aW5kb3cucGxheUZsYWcgPSAxO1xud2luZG93Lmp1bXBGbGFnID0gMTtcbndpbmRvdy5ncmF5U2NhbGUgPSAwO1xud2luZG93Lm5pZ2h0VmlzaW9uID0gMDtcbndpbmRvdy5nRmxhZyA9IDE7XG53aW5kb3cubkZsYWcgPSAxO1xud2luZG93LmdyYXZpdHkgPSAwLjAwMTtcbndpbmRvdy52ZWxvY2l0eSA9IDE7XG53aW5kb3cuanVtcHggPSAwO1xud2luZG93Lmp1bXB5ID0gMDtcbndpbmRvdy5qdW1weiA9IDA7XG5cbndpbmRvdy5sZXZlbCA9IDE7XG53aW5kb3cuc2NvcmUgPSAwO1xud2luZG93LnByZXZTY29yZSA9IC0xMDtcbnZhciBudW1PYnN0YWNsZXMgPSA3O1xudmFyIG51bU9ic3RhY2xlczIgPSA1O1xudmFyIHRoZW4gPSAwO1xuXG52YXIgc2NhbGV4ID0gMTtcbnZhciBzY2FsZXkgPSAxO1xudmFyIHNjYWxleiA9IDE7XG5cbnZhciB1cCA9IFswLCAxLCAwXTtcbnZhciBvdXRlclJhZGl1cyA9IDUwLjAgKiBzY2FsZXg7XG53aW5kb3cucmV2b2x2ZUFuZ2xlID0gMDtcbnZhciByZXZvbHZlUmFkaXVzID0gb3V0ZXJSYWRpdXM7XG53aW5kb3cucmV2b2x2ZVNwZWVkID0gMTg7XG5cbndpbmRvdy5vY3RSYWRpdXMgPSA1ICogc2NhbGV4Oy8vMC4yNVxud2luZG93Lm9jdEFuZ2xlID0gMjcwO1xud2luZG93Lm9jdFNwZWVkID0gMjAwO1xud2luZG93Lm9jdFN0ZXBzQSA9IDA7XG53aW5kb3cub2N0U3RlcHNEID0gMDtcblxudmFyIENhbWVyYSA9IHtcbiAgeDogcmV2b2x2ZVJhZGl1cyxcbiAgeTogMCxcbiAgejogMCxcbiAgbG9va3g6IDAsXG4gIGxvb2t5OiAwLFxuICBsb29rejogMCxcbiAgdGVtcHg6IDAsXG4gIHRlbXB6OiAwLFxuICBtb3VzZVVwZGF0ZTogZmFsc2UsXG4gIGZpc2hMZW5zOiBmYWxzZSxcbiAgZmlzaFZpZXc6IGZhbHNlLFxuICBtb3VzZVg6IDAsXG4gIG1vdXNlWTogMCxcbn1cblxuZnVuY3Rpb24gdG9SYWRpYW5zIChhbmdsZSkge1xuICByZXR1cm4gYW5nbGUgKiAoTWF0aC5QSSAvIDE4MCk7XG59XG5cbndpbmRvdy5NYXRyaWNlcyA9IHt9XG53aW5kb3cubW9kZWxzID0ge31cblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBrZXlDaGVja2VyKVxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywga2V5Q2hlY2tlcilcblxud2luZG93LmtleU1hcCA9IHt9XG5mdW5jdGlvbiBrZXlDaGVja2VyIChrZXkpIHtcbiAgd2luZG93LmtleU1hcFtrZXkua2V5Q29kZV0gPSAoa2V5LnR5cGUgPT0gXCJrZXlkb3duXCIpXG59XG5cbmZ1bmN0aW9uIGtleUltcGxlbWVudGF0aW9uICgpIHtcbiAgaWYgKHdpbmRvdy5rZXlNYXBbNjVdKSB7XG4gICAgd2luZG93Lm9jdFN0ZXBzQSAtPSAxO1xuICB9XG4gIGlmICh3aW5kb3cua2V5TWFwWzY4XSkge1xuICAgIHdpbmRvdy5vY3RTdGVwc0QgLT0gMTtcbiAgfVxuICBpZiAod2luZG93LmtleU1hcFs4N10pIHtcbiAgICB3aW5kb3cucmV2b2x2ZUFuZ2xlIC09IDAuNztcbiAgfVxuICBpZiAod2luZG93LmtleU1hcFs4M10pIHtcbiAgICB3aW5kb3cucmV2b2x2ZUFuZ2xlICs9IDAuNztcbiAgfVxuICBpZiAod2luZG93LmtleU1hcFszMl0gJiYgd2luZG93Lmp1bXBGbGFnKSB7XG4gICAgd2luZG93LnZlbG9jaXR5ID0gMDtcbiAgICB3aW5kb3cuZ3Jhdml0eSA9IDAuMTtcbiAgICB3aW5kb3cuanVtcEZsYWcgPSAwO1xuICAgIC8vIGNvbnNvbGUubG9nKFwianVtcFwiKVxuICB9XG4gIGlmICh3aW5kb3cua2V5TWFwWzcxXSAmJiB3aW5kb3cuZ0ZsYWcpIHtcbiAgICB3aW5kb3cuZ3JheVNjYWxlID0gIXdpbmRvdy5ncmF5U2NhbGU7XG4gICAgd2luZG93LmdGbGFnID0gMDtcbiAgICBnbC51bmlmb3JtMWkoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sICdncmF5U2NhbGUnKSwgd2luZG93LmdyYXlTY2FsZSk7XG4gICAgLy8gY29uc29sZS5sb2coJ2cnKTtcbiAgICAvLyBjb25zb2xlLmxvZyh3aW5kb3cuZ3JheVNjYWxlKTtcbiAgfVxuICBpZiAoIXdpbmRvdy5rZXlNYXBbNzFdKSB7XG4gICAgd2luZG93LmdGbGFnID0gMTtcbiAgfVxuXG4gIGlmICh3aW5kb3cua2V5TWFwWzc4XSAmJiB3aW5kb3cubkZsYWcpIHtcbiAgICB3aW5kb3cubmlnaHRWaXNpb24gPSAhd2luZG93Lm5pZ2h0VmlzaW9uO1xuICAgIHdpbmRvdy5uRmxhZyA9IDA7XG4gICAgZ2wudW5pZm9ybTFpKGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCAnbmlnaHRWaXNpb24nKSwgd2luZG93Lm5pZ2h0VmlzaW9uKTtcbiAgICBjb25zb2xlLmxvZygnbicpO1xuICAgIC8vIGNvbnNvbGUubG9nKHdpbmRvdy5uaWdodFZpc2lvbik7XG4gIH1cbiAgaWYgKCF3aW5kb3cua2V5TWFwWzc4XSkge1xuICAgIHdpbmRvdy5uRmxhZyA9IDE7XG4gIH1cbiAgLy8gaWYod2luZG93LmtleU1hcFszMl0gPT0gZmFsc2UpIHtcbiAgLy8gICB3aW5kb3cuanVtcEZsYWcgPSAxO1xuICAvLyB9XG59XG5cbmZ1bmN0aW9uIGF1dG9Nb3ZlbWVudCgpIHtcblxuICBDYW1lcmEueCA9IHJldm9sdmVSYWRpdXMgKiBNYXRoLmNvcyh0b1JhZGlhbnMod2luZG93LnJldm9sdmVBbmdsZSkpO1xuICBDYW1lcmEueiA9IHJldm9sdmVSYWRpdXMgKiBNYXRoLnNpbih0b1JhZGlhbnMod2luZG93LnJldm9sdmVBbmdsZSkpO1xuICBcbiAgd2luZG93Lm9jdEFuZ2xlICs9IE1hdGgucm91bmQod2luZG93Lm9jdFN0ZXBzQSAtIHdpbmRvdy5vY3RTdGVwc0QpICogd2luZG93LmRlbHRhVGltZSAqIHdpbmRvdy5vY3RTcGVlZDtcbiAgdmFyIHRlbXB4ID0gd2luZG93Lm9jdFJhZGl1cyAqIE1hdGguY29zKHRvUmFkaWFucyh3aW5kb3cub2N0QW5nbGUpKSAqIE1hdGguY29zKHRvUmFkaWFucyh3aW5kb3cucmV2b2x2ZUFuZ2xlKSk7XG4gIENhbWVyYS55ID0gd2luZG93Lm9jdFJhZGl1cyAqIE1hdGguc2luKHRvUmFkaWFucyh3aW5kb3cub2N0QW5nbGUpKTtcbiAgdmFyIHRlbXB6ID0gd2luZG93Lm9jdFJhZGl1cyAqIE1hdGguY29zKHRvUmFkaWFucyh3aW5kb3cub2N0QW5nbGUpKSAqIE1hdGguc2luKHRvUmFkaWFucyh3aW5kb3cucmV2b2x2ZUFuZ2xlKSk7XG4gIC8vIGNvbnNvbGUubG9nKFwidGVtcHhcIiwgd2luZG93Lmp1bXB4KTtcbiAgLy8gY29uc29sZS5sb2coXCJ0ZW1welwiLCB3aW5kb3cuanVtcHkpO1xuICAvLyBjb25zb2xlLmxvZyh3aW5kb3cub2N0QW5nbGUpO1xuXG4gIENhbWVyYS54ICs9IHRlbXB4O1xuICBDYW1lcmEueiArPSB0ZW1wejtcbiAgd2luZG93Lm9jdFN0ZXBzQSA9IDA7XG4gIHdpbmRvdy5vY3RTdGVwc0QgPSAwO1xuXG4gIC8vIHZhciBsb29rID0gdmVjLmNyb3NzKFtDYW1lcmEueCwgQ2FtZXJhLnksIENhbWVyYS56XSwgWzAsIDEsIDBdKTtcbiAgdmFyIGxvb2sgPSB2ZWMubm9ybWFsaXplKHZlYy5jcm9zcyh2ZWMubm9ybWFsaXplKFtDYW1lcmEueCwgQ2FtZXJhLnksIENhbWVyYS56XSksIFswLCAxLCAwXSkpO1xuICBDYW1lcmEubG9va3ggPSAtbG9va1swXTtcbiAgQ2FtZXJhLmxvb2t5ID0gLWxvb2tbMV07XG4gIENhbWVyYS5sb29reiA9IC1sb29rWzJdO1xuICBcbiAgLy8gd2luZG93Lm9jdEFuZ2xlICs9IHdpbmRvdy5vY3RTcGVlZCAqIHdpbmRvdy5kZWx0YVRpbWU7XG4gIC8vIHdpbmRvdy5vY3RBbmdsZSA9IHdpbmRvdy5vY3RBbmdsZSAlIDM2MDtcbiAgaWYod2luZG93LnBsYXlGbGFnID09IDEpIHtcbiAgICB3aW5kb3cucmV2b2x2ZUFuZ2xlIC09IHdpbmRvdy5yZXZvbHZlU3BlZWQgKiB3aW5kb3cuZGVsdGFUaW1lO1xuICB9XG4gIENhbWVyYS50ZW1weCA9IHRlbXB4O1xuICBDYW1lcmEudGVtcHogPSB0ZW1wejtcbiAgdXBbMF0gPSBNYXRoLnJvdW5kKC10ZW1weCk7XG4gIHVwWzFdID0gTWF0aC5yb3VuZCgtQ2FtZXJhLnkpO1xuICB1cFsyXSA9IE1hdGgucm91bmQoLXRlbXB6KTtcbiAgXG4gIC8vIHZhciB0ZW1wX3VwID0gWzAsIDAsIDBdO1xuICAvLyB0ZW1wX3VwWzBdID0gTWF0aC5jb3ModG9SYWRpYW5zKHdpbmRvdy5yZXZvbHZlQW5nbGUpKSAtIENhbWVyYS54O1xuICAvLyB0ZW1wX3VwWzFdID0gLUNhbWVyYS55O1xuICAvLyB0ZW1wX3VwWzJdID0gTWF0aC5zaW4odG9SYWRpYW5zKHdpbmRvdy5yZXZvbHZlQW5nbGUpKSAtIENhbWVyYS56O1xuICBpZiAod2luZG93Lmp1bXBGbGFnID09IDApIHtcbiAgICB2YXIgY29zID0gdmVjLmRvdCh2ZWMubm9ybWFsaXplKHVwKSwgdmVjLm5vcm1hbGl6ZShbQ2FtZXJhLngsIENhbWVyYS55LCBDYW1lcmEuel0pKVxuICAgIC8vIHZhciBjb3MgPSB2ZWMuZG90KHZlYy5ub3JtYWxpemUodXApLCB2ZWMubm9ybWFsaXplKFtNYXRoLmNvcyh0b1JhZGlhbnMod2luZG93LnJldm9sdmVBbmdsZSkpLCAwLCBNYXRoLnNpbih0b1JhZGlhbnMod2luZG93LnJldm9sdmVBbmdsZSkpXSkpXG4gICAgdmFyIGp1bXBfYW5nbGUgPSBNYXRoLnJvdW5kKE1hdGguYWNvcyhjb3MpICogKDE4MCAvIE1hdGguUEkpKTtcbiAgICAvLyBjb25zb2xlLmxvZyhcImp1bXBfYW5nbGVcIiwganVtcF9hbmdsZSk7XG4gICAgaWYoKHdpbmRvdy5vY3RBbmdsZSAlIDM2MCkgPD0gMTgwICYmIHdpbmRvdy5vY3RBbmdsZSA+PSAwKSB7XG4gICAgICBqdW1wX2FuZ2xlID0gMTgwICsgMTgwIC0ganVtcF9hbmdsZTtcbiAgICAvLyB9XG4gICAgfSBlbHNlIGlmICh3aW5kb3cub2N0QW5nbGUgPCAwICYmICh3aW5kb3cub2N0QW5nbGUgJSAzNjApIDw9IC0xODApIHtcbiAgICAgIGp1bXBfYW5nbGUgPSAxODAgKyAxODAgLSBqdW1wX2FuZ2xlO1xuICAgIH1cblxuICAgIC8vIGNvbnNvbGUubG9nKE1hdGgucm91bmQod2luZG93Lm9jdEFuZ2xlKSAlIDM2MCk7XG4gICAgLy8gY29uc29sZS5sb2coXCJ1cFwiLCB2ZWMubm9ybWFsaXplKHVwKSk7XG4gICAgLy8gY29uc29sZS5sb2cod2luZG93LnZlbG9jaXR5KTtcblxuICAgIHdpbmRvdy5qdW1weCA9IDA7XG4gICAgd2luZG93Lmp1bXB5ID0gMDtcbiAgICB3aW5kb3cuanVtcHogPSAwO1xuXG4gICAgaWYgKHdpbmRvdy52ZWxvY2l0eSA+IDQpIHtcbiAgICAgIHdpbmRvdy52ZWxvY2l0eSA9IDQ7XG4gICAgICB3aW5kb3cuZ3Jhdml0eSA9IC13aW5kb3cuZ3Jhdml0eTtcbiAgICB9IGVsc2UgaWYgKHdpbmRvdy52ZWxvY2l0eSA8IDApIHtcbiAgICAgIHdpbmRvdy52ZWxvY2l0eSA9IDA7XG4gICAgICB3aW5kb3cuZ3Jhdml0eSA9IDA7XG4gICAgICB3aW5kb3cuanVtcEZsYWcgPSAxO1xuICAgIH1cbiAgICB3aW5kb3cudmVsb2NpdHkgKz0gd2luZG93LmdyYXZpdHk7XG4gICAgLy8gd2luZG93LnZlbG9jaXR5ID0gd2luZG93XG4gICAgd2luZG93Lmp1bXB4ID0gTWF0aC5jb3ModG9SYWRpYW5zKGp1bXBfYW5nbGUpKSAqIHdpbmRvdy52ZWxvY2l0eSAqIE1hdGguY29zKHRvUmFkaWFucyh3aW5kb3cucmV2b2x2ZUFuZ2xlKSk7XG4gICAgd2luZG93Lmp1bXB5ID0gTWF0aC5zaW4odG9SYWRpYW5zKGp1bXBfYW5nbGUpKSAqIHdpbmRvdy52ZWxvY2l0eTtcbiAgICB3aW5kb3cuanVtcHogPSBNYXRoLmNvcyh0b1JhZGlhbnMoanVtcF9hbmdsZSkpICogd2luZG93LnZlbG9jaXR5ICogTWF0aC5zaW4odG9SYWRpYW5zKHdpbmRvdy5yZXZvbHZlQW5nbGUpKTtcbiAgfVxuXG4gIENhbWVyYS54ICs9IHdpbmRvdy5qdW1weDtcbiAgQ2FtZXJhLnkgKz0gd2luZG93Lmp1bXB5O1xuICBDYW1lcmEueSArPSB3aW5kb3cuanVtcHo7XG5cblxufVxuXG5mdW5jdGlvbiByZXNpemVDYW52YXMoKSB7XG4gIHdpbmRvdy5jYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICB3aW5kb3cuY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG59XG5cbmZ1bmN0aW9uIEluaXRpYWxpemUoKVxue1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmFja2F1ZGlvJykucGxheSgpXG4gIHdpbmRvdy5jYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcbiAgcmVzaXplQ2FudmFzKCk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCByZXNpemVDYW52YXMpXG5cbiAgLy8gd2luZG93LmNhbnZhcy5vbm1vdXNlbW92ZSA9IHVwZGF0ZUNhbWVyYVRhcmdldFxuXG4gIHdpbmRvdy5nbCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiZXhwZXJpbWVudGFsLXdlYmdsXCIpO1xuICBnbC5jbGVhckNvbG9yKDAuMCwgMC4wLCAwLjAsIDEuMCk7XG5cbiAgLy8gc2V0dXAgYSBHTFNMIHByb2dyYW1cbiAgc2hhZGVycy5jcmVhdGVTaGFkZXIoJ21hdGVyaWFsJylcbiAgXG4gIC8vIHZhciB0ZW1wID0gLTIwXG4gIC8vIG1ha2VNb2RlbCgnb2JzdGFjbGUnLCAnYXNzZXRzL2N1YmUnLCBbcmV2b2x2ZVJhZGl1cyAqIE1hdGguY29zKHRvUmFkaWFucyh0ZW1wKSksIDAsIHJldm9sdmVSYWRpdXMgKiBNYXRoLnNpbih0b1JhZGlhbnModGVtcCkpXSxcbiAgLy8gICBbOCwgNCwgMV0sIC8vc2NhbGVcbiAgLy8gICB0ZW1wLCAvL3JvdGF0ZUFuZ2xlMVxuICAvLyAgIDkwKTsgLy9yb3RhdGVBbmdsZTJcbiAgICBcblxuXG4gIGZvcih2YXIgaSA9IDA7IGkgPCBudW1PYnN0YWNsZXM7IGkrKykge1xuICAgIHZhciB0ZW1wID0gKE1hdGgucmFuZG9tKCkgKiAxMDAwICUgMzYwKSAtIDM2MDtcbiAgICAvLyB2YXIgcm90YXRpb25TcGVlZCA9IE1hdGgucmFuZG9tKCkgKiAoMi41IC0gMC41ICsgMSkgKyAwLjU7XG4gICAgbWFrZU1vZGVsKCdvYnN0YWNsZScgKyBpLCAnYXNzZXRzL2N1YmV0ZXgnLCBbcmV2b2x2ZVJhZGl1cyAqIE1hdGguY29zKHRvUmFkaWFucyh0ZW1wKSksIDAsIHJldm9sdmVSYWRpdXMgKiBNYXRoLnNpbih0b1JhZGlhbnModGVtcCkpXSxcbiAgICAgIFs4LCAxLCAxXSwgLy9zY2FsZVxuICAgICAgdGVtcCwgLy9yb3RhdGVBbmdsZTFcbiAgICAgIE1hdGgucmFuZG9tKCkgKiAxMDAwICUgMzYwLCAvL3JvdGF0ZUFuZ2xlMlxuICAgICAgMClcbiAgfVxuXG4gIG1ha2VNb2RlbCgncGlwZScsICdhc3NldHMvcGlwZScsWzAsIDAsIDBdLFtzY2FsZXgsIHNjYWxleSwgc2NhbGV6XSwgWzAsIDAsIDBdKS8vcm90YXRlIGR1bW15IHZhbHVlID0gWzAsIDAsIDBdXG5cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRpY2spO1xufVxud2luZG93LkluaXRpYWxpemUgPSBJbml0aWFsaXplXG5cbndpbmRvdy5DYW1lcmEgPSBDYW1lcmFcblxuZnVuY3Rpb24gYW5pbWF0ZShub3cpIHtcbiAgaWYod2luZG93LnBsYXlGbGFnKSB7XG4gICAgd2luZG93LnNjb3JlICs9IDE7XG4gIH1cbiAgXG4gIGlmKHdpbmRvdy5zY29yZSA9PSAzMDApIHtcbiAgICB3aW5kb3cucHJldlNjb3JlID0gd2luZG93LnNjb3JlO1xuICAgIHdpbmRvdy5sZXZlbCsrO1xuICAgIHdpbmRvdy5yZXZvbHZlU3BlZWQgKj0gMS41O1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBudW1PYnN0YWNsZXM7IGkrKykge1xuICAgICAgdmFyIHJvdGF0aW9uU3BlZWQgPSBNYXRoLnJhbmRvbSgpICogKDEuNSAtIDAuNSArIDEpICsgMC41O1xuICAgICAgbW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnJvdGF0aW9uU3BlZWQgPSByb3RhdGlvblNwZWVkO1xuICAgIH1cblxuICAgIGZvcihpID0gMDsgaSA8IG51bU9ic3RhY2xlczI7IGkrKykge1xuICAgICAgdmFyIHRlbXAgPSAoTWF0aC5yYW5kb20oKSAqIDEwMDAgJSAzNjApIC0gMzYwO1xuICAgICAgcm90YXRpb25TcGVlZCA9IE1hdGgucmFuZG9tKCkgKiAoMi41IC0gMC41ICsgMSkgKyAwLjU7XG4gICAgICBtYWtlTW9kZWwoJ29ic3RhY2xlQmlnJyArIGksICdhc3NldHMvY3ViZXRleCcsIFtyZXZvbHZlUmFkaXVzICogTWF0aC5jb3ModG9SYWRpYW5zKHRlbXApKSwgMCwgcmV2b2x2ZVJhZGl1cyAqIE1hdGguc2luKHRvUmFkaWFucyh0ZW1wKSldLFxuICAgICAgICBbOCwgMiwgMV0sIC8vc2NhbGVcbiAgICAgICAgdGVtcCwgLy9yb3RhdGVBbmdsZTFcbiAgICAgICAgTWF0aC5yYW5kb20oKSAqIDEwMDAgJSAzNjAsIC8vcm90YXRlQW5nbGUyXG4gICAgICAgIHJvdGF0aW9uU3BlZWQpXG4gICAgfVxuICB9XG5cbiAgaWYgKHdpbmRvdy5zY29yZSA9PSAyICogd2luZG93LnByZXZTY29yZSAmJiB3aW5kb3cuc2NvcmUgPiAxNTApIHtcbiAgICB3aW5kb3cucHJldlNjb3JlID0gd2luZG93LnNjb3JlO1xuICAgIHdpbmRvdy5sZXZlbCsrO1xuICAgIHdpbmRvdy5yZXZvbHZlU3BlZWQgKj0gMS41O1xuICAgIGZvciAoaSA9IDA7IGkgPCBudW1PYnN0YWNsZXM7IGkrKykge1xuICAgICAgbW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnJvdGF0aW9uU3BlZWQgKj0gMS4yNTtcbiAgICB9XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbnVtT2JzdGFjbGVzMjsgaSsrKSB7XG4gICAgICBtb2RlbHNbXCJvYnN0YWNsZUJpZ1wiICsgaV0ucm90YXRpb25TcGVlZCAqPSAxLjI1O1xuICAgIH1cbiAgfVxuXG4gIGlmKHdpbmRvdy5yZXZvbHZlU3BlZWQgPiA1MClcbiAgICB3aW5kb3cucmV2b2x2ZVNwZWVkID0gNTA7XG5cbiAgdmFyIHNjb3JlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Njb3JlJylcbiAgc2NvcmUuaW5uZXJUZXh0ID0gJ1NDT1JFOiAnICsgd2luZG93LnNjb3JlICsgJ1xcblxcbicgKyAnTEVWRUw6ICcgKyB3aW5kb3cubGV2ZWw7XG4gIG5vdyAqPSAwLjAwMVxuICAvLyB2YXIgdGltZU5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAvLyBpZiAobGFzdFRpbWUgPT0gMCkgeyBsYXN0VGltZSA9IHRpbWVOb3c7IHJldHVybjsgfVxuICB3aW5kb3cuZGVsdGFUaW1lID0gbm93IC0gdGhlbjsgIFxuICB1cGRhdGVDYW1lcmEoKTtcbiAgdGhlbiA9IG5vdztcbn1cblxuLy8gdmFyIGxhc3RUaW1lID0gMDtcbi8vIGZ1bmN0aW9uIGFuaW1hdGUoKSB7XG4vLyAgIHZhciB0aW1lTm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4vLyAgIGlmIChsYXN0VGltZSA9PSAwKSB7IGxhc3RUaW1lID0gdGltZU5vdzsgcmV0dXJuOyB9XG4vLyAgIC8vIHZhciBkID0gKHRpbWVOb3cgLSBsYXN0VGltZSkgLyA1MDtcbi8vICAgdXBkYXRlQ2FtZXJhKCk7XG4vLyAgIGxhc3RUaW1lID0gdGltZU5vdztcbi8vIH1cblxuZnVuY3Rpb24gZHJhd1NjZW5lKCkge1xuICBnbC52aWV3cG9ydCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICBnbC5jbGVhckNvbG9yKDAuMSwgMC4xLCAwLjEsIDEuMCk7XG4gIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUKTtcbiAgc2hhZGVycy51c2VTaGFkZXIoJ21hdGVyaWFsJylcbiAgXG4gIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgZ2wuZGVwdGhGdW5jKGdsLkxFUVVBTCk7XG4gIFxuICAvLyBNYXRyaWNlcy5tb2RlbCA9IG0ubXVsdGlwbHkobS50cmFuc2xhdGUodGFibGUuY2VudGVyKSwgbS5zY2FsZSh0YWJsZS5zY2FsZSkpXG4gIC8vIGRyYXdNb2RlbCh0YWJsZSlcblxuICAvLyBNYXRyaWNlcy5tb2RlbCA9IG0ubXVsdGlwbHkobS50cmFuc2xhdGUobW9kZWxzLmxpZ2h0LmNlbnRlciksIG0uc2NhbGUobW9kZWxzLmxpZ2h0LnNjYWxlKSlcbiAgLy8gZHJhd0xpZ2h0KG1vZGVsc2xpZ2h0KVxuXG4gIGZvcih2YXIgaSA9IDA7IGkgPCBudW1PYnN0YWNsZXM7IGkrKykge1xuICAgIE1hdHJpY2VzLm1vZGVsID0gbS5tdWx0aXBseShtLnRyYW5zbGF0ZShtb2RlbHNbXCJvYnN0YWNsZVwiICsgaV0uY2VudGVyKSxcbiAgICAgIG0ubXVsdGlwbHkobS5yb3RhdGVZKHRvUmFkaWFucygtbW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnJvdGF0ZUFuZ2xlMSkpLFxuICAgICAgICBtLm11bHRpcGx5KG0ucm90YXRlWih0b1JhZGlhbnMobW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnJvdGF0ZUFuZ2xlMiArPSBtb2RlbHNbXCJvYnN0YWNsZVwiICsgaV0ucm90YXRpb25TcGVlZCkpLFxuICAgICAgICAgIG0uc2NhbGUobW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnNjYWxlKSkpKTtcbiAgICBkcmF3TW9kZWwobW9kZWxzW1wib2JzdGFjbGVcIiArIGldKTtcbiAgfVxuXG4gIGlmKHdpbmRvdy5sZXZlbCA+PSAyKSB7XG4gICAgZm9yKGkgPSAwOyBpIDwgbnVtT2JzdGFjbGVzMjsgaSsrKSB7XG4gICAgICBNYXRyaWNlcy5tb2RlbCA9IG0ubXVsdGlwbHkobS50cmFuc2xhdGUobW9kZWxzW1wib2JzdGFjbGVCaWdcIiArIGldLmNlbnRlciksXG4gICAgICAgIG0ubXVsdGlwbHkobS5yb3RhdGVZKHRvUmFkaWFucygtbW9kZWxzW1wib2JzdGFjbGVCaWdcIiArIGldLnJvdGF0ZUFuZ2xlMSkpLFxuICAgICAgICAgIG0ubXVsdGlwbHkobS5yb3RhdGVaKHRvUmFkaWFucyhtb2RlbHNbXCJvYnN0YWNsZUJpZ1wiICsgaV0ucm90YXRlQW5nbGUyICs9IG1vZGVsc1tcIm9ic3RhY2xlQmlnXCIgKyBpXS5yb3RhdGlvblNwZWVkKSksXG4gICAgICAgICAgICAvLyBtLm11bHRpcGx5KG0udHJhbnNsYXRlKFswLCA0LCAwXSksbS5zY2FsZShtb2RlbHNbXCJvYnN0YWNsZUJpZ1wiICsgaV0uc2NhbGUpKSkpKTtcbiAgICAgICAgICAgIG0uc2NhbGUobW9kZWxzW1wib2JzdGFjbGVCaWdcIiArIGldLnNjYWxlKSkpKTtcbiAgICAgIGRyYXdNb2RlbChtb2RlbHNbXCJvYnN0YWNsZUJpZ1wiICsgaV0pO1xuICAgIH1cbiAgfVxuICAgIFxuICAvLyBjb25zb2xlLmxvZyhDYW1lcmEueCwgQ2FtZXJhLnksIENhbWVyYS56KTtcbiAgLy8gTWF0cmljZXMubW9kZWwgPSBtLm11bHRpcGx5KG0udHJhbnNsYXRlKG1vZGVscy5vYnN0YWNsZS5jZW50ZXIpLCBtLnNjYWxlKG1vZGVscy5vYnN0YWNsZS5zY2FsZSkpXG4gIFxuICAvLyBNYXRyaWNlcy5tb2RlbD0gbS5tdWx0aXBseShtLnRyYW5zbGF0ZShtb2RlbHMub2JzdGFjbGUuY2VudGVyKSxcbiAgLy8gICBtLm11bHRpcGx5KG0ucm90YXRlWSh0b1JhZGlhbnMoLW1vZGVscy5vYnN0YWNsZS5yb3RhdGVBbmdsZTEpKSxcbiAgLy8gICAgIG0ubXVsdGlwbHkobS5yb3RhdGVaKHRvUmFkaWFucyhtb2RlbHMub2JzdGFjbGUucm90YXRlQW5nbGUyKSksXG4gIC8vICAgICAgIG0uc2NhbGUobW9kZWxzLm9ic3RhY2xlLnNjYWxlKSkpKTtcbiAgLy8gZHJhd01vZGVsKG1vZGVscy5vYnN0YWNsZSlcblxuICBNYXRyaWNlcy5tb2RlbCA9IG0ubXVsdGlwbHkobS50cmFuc2xhdGUobW9kZWxzLnBpcGUuY2VudGVyKSwgbS5zY2FsZShtb2RlbHMucGlwZS5zY2FsZSkpXG4gIGRyYXdNb2RlbChtb2RlbHMucGlwZSlcblxuICBnbC5lbmFibGUoZ2wuQkxFTkQpO1xuICBnbC5ibGVuZEZ1bmMoZ2wuT05FLCBnbC5PTkUpO1xuICAvLyBpZiAoQ2FtZXJhLnggPiBhcXVhcml1bVNpemUueCB8fCBDYW1lcmEueCA8IC1hcXVhcml1bVNpemUueCB8fFxuICAvLyAgIENhbWVyYS55ID4gYXF1YXJpdW1TaXplLnkgfHwgQ2FtZXJhLnkgPCAtYXF1YXJpdW1TaXplLnkgfHxcbiAgLy8gICBDYW1lcmEueiA+IGFxdWFyaXVtU2l6ZS56IHx8IENhbWVyYS56IDwgLWFxdWFyaXVtU2l6ZS56KSB7XG4gIC8vICAgZ2wuZW5hYmxlKGdsLkNVTExfRkFDRSk7XG4gIC8vIH1cblxuICBnbC5kaXNhYmxlKGdsLkNVTExfRkFDRSk7XG4gIGdsLmRpc2FibGUoZ2wuQkxFTkQpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVDYW1lcmEoKSB7XG4gIHZhciBleWUgPSBbQ2FtZXJhLngsIENhbWVyYS55LCBDYW1lcmEuel1cbiAgdmFyIHRhcmdldCA9IFtDYW1lcmEueCArIENhbWVyYS5sb29reCwgQ2FtZXJhLnkgKyBDYW1lcmEubG9va3ksIENhbWVyYS56ICsgQ2FtZXJhLmxvb2t6XVxuICBNYXRyaWNlcy52aWV3ID0gbS5sb29rQXQoZXllLCB0YXJnZXQsIHVwKTtcbiAgTWF0cmljZXMucHJvamVjdGlvbiA9IG0ucGVyc3BlY3RpdmUoTWF0aC5QSS8yLCBjYW52YXMud2lkdGggLyBjYW52YXMuaGVpZ2h0LCAwLjEsIDUwMCk7XG4gIGdsLnVuaWZvcm1NYXRyaXg0ZnYoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwidmlld1wiKSwgZmFsc2UsIE1hdHJpY2VzLnZpZXcpO1xuICBnbC51bmlmb3JtTWF0cml4NGZ2KGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcInByb2plY3Rpb25cIiksIGZhbHNlLCBNYXRyaWNlcy5wcm9qZWN0aW9uKTtcbiAgLy8gZ2wudW5pZm9ybTFpKGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcImlzRmlzaExlbnNcIiksIENhbWVyYS5maXNoTGVucyAmJiBDYW1lcmEuZmlzaFZpZXcpO1xuICAvLyByZXR1cm4gbS5tdWx0aXBseShNYXRyaWNlcy5wcm9qZWN0aW9uLCBNYXRyaWNlcyAudmlldyk7XG5cbiAgdmFyIGxpZ2h0UG9zID0gW1xuICAgIHJldm9sdmVSYWRpdXMgKiBNYXRoLmNvcyh0b1JhZGlhbnMod2luZG93LnJldm9sdmVBbmdsZSAtIDI1KSksIDAsXG4gICAgcmV2b2x2ZVJhZGl1cyAqIE1hdGguc2luKHRvUmFkaWFucyh3aW5kb3cucmV2b2x2ZUFuZ2xlIC0gMjUpKVxuICBdXG4gIC8vIHZhciBsaWdodFBvcyA9IHRhcmdldFxuICB2YXIgbGlnaHRQb3NMb2MgPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJsaWdodC5wb3NpdGlvblwiKTtcbiAgdmFyIHZpZXdQb3NMb2MgICAgID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwidmlld1Bvc1wiKTtcbiAgZ2wudW5pZm9ybTNmKGxpZ2h0UG9zTG9jLCBsaWdodFBvc1swXSwgbGlnaHRQb3NbMV0sIGxpZ2h0UG9zWzJdKTtcbiAgZ2wudW5pZm9ybTNmKHZpZXdQb3NMb2MsIHRhcmdldFswXSwgdGFyZ2V0WzFdLCB0YXJnZXRbMl0pO1xuICB2YXIgbGlnaHRDb2xvciA9IFtdO1xuICBsaWdodENvbG9yWzBdID0gMTtcbiAgbGlnaHRDb2xvclsxXSA9IDE7XG4gIGxpZ2h0Q29sb3JbMl0gPSAxO1xuICB2YXIgZGlmZnVzZUNvbG9yID0gdmVjLm11bHRpcGx5U2NhbGFyKGxpZ2h0Q29sb3IsIDEpOyAvLyBEZWNyZWFzZSB0aGUgaW5mbHVlbmNlXG4gIHZhciBhbWJpZW50Q29sb3IgPSB2ZWMubXVsdGlwbHlTY2FsYXIoZGlmZnVzZUNvbG9yLCAxKTsgLy8gTG93IGluZmx1ZW5jZVxuICBnbC51bmlmb3JtM2YoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwibGlnaHQuYW1iaWVudFwiKSwgIGFtYmllbnRDb2xvclswXSwgYW1iaWVudENvbG9yWzFdLCBhbWJpZW50Q29sb3JbMl0pO1xuICBnbC51bmlmb3JtM2YoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwibGlnaHQuZGlmZnVzZVwiKSwgIGRpZmZ1c2VDb2xvclswXSwgZGlmZnVzZUNvbG9yWzFdLCBkaWZmdXNlQ29sb3JbMl0pO1xuICBnbC51bmlmb3JtM2YoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwibGlnaHQuc3BlY3VsYXJcIiksIDEuMCwgMS4wLCAxLjApOyAgXG59XG5cbmZ1bmN0aW9uIHRpY2sobm93KSB7XG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcbiAgaWYgKCF3aW5kb3cucHJvZ3JhbSkgcmV0dXJuO1xuICBhbmltYXRlKG5vdyk7XG4gIGtleUltcGxlbWVudGF0aW9uKCk7XG4gIGF1dG9Nb3ZlbWVudCgpO1xuICBkcmF3U2NlbmUoKTtcbiAgZGV0ZWN0Q29sbGlzaW9ucygpOyAgXG59XG5cbmZ1bmN0aW9uIGRldGVjdENvbGxpc2lvbnMgKCkge1xuICB2YXIgYW5nbGUgPSAwO1xuICB2YXIgaSA9IDA7XG4gIGZvcihpID0gMDsgaSA8IG51bU9ic3RhY2xlczsgaSsrKSB7XG4gICAgLy8gY29uc29sZS5sb2coaSk7XG4gICAgYW5nbGUgPSBNYXRoLmF0YW4obW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnNjYWxlWzFdIC8gbW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnNjYWxlWzBdKSAqIDE4MCAvIE1hdGguUEk7XG4gICAgaWYoKHdpbmRvdy5vY3RBbmdsZSAlIDE4MCA+PSAobW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnJvdGF0ZUFuZ2xlMiAlIDE4MCAtIGFuZ2xlKSAmJlxuICAgIHdpbmRvdy5vY3RBbmdsZSAlIDE4MCA8PSAobW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnJvdGF0ZUFuZ2xlMiAlIDE4MCArIGFuZ2xlKSkgJiZcbiAgICAoKHdpbmRvdy5yZXZvbHZlQW5nbGUgJSAzNjAgPD0gbW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnJvdGF0ZUFuZ2xlMSArIDQpICYmIHdpbmRvdy5yZXZvbHZlQW5nbGUgJSAzNjAgPj0gbW9kZWxzW1wib2JzdGFjbGVcIiArIGldLnJvdGF0ZUFuZ2xlMSAtIDQpXG4gICAgKSB7XG4gICAgICB3aW5kb3cucGxheUZsYWcgPSAwO1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dhbWVPdmVyQ29udGFpbmVyJykuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Njb3JlQ29udGFpbmVyJykuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ2FtZU92ZXInKS5pbm5lclRleHQgPSBcIkdBTUUgT1ZFUiBcXG5cXG4gU0NPUkU6IFwiICsgd2luZG93LnNjb3JlICsgXCJcXG5cXG5cIiArIFwiTEVWRUw6IFwiICsgd2luZG93LmxldmVsO1xuICAgICAgY29uc29sZS5sb2coXCJ5ZXNcIiArIGkpO1xuXG4gICAgfVxuICB9XG4gIGlmKHdpbmRvdy5sZXZlbCA+PSAyKSB7XG4gICAgLy8gY29uc29sZS5sb2coXCJjYW1lcmEueVwiLCBDYW1lcmEueSk7XG4gICAgZm9yKGkgPSAwOyBpIDwgbnVtT2JzdGFjbGVzMjsgaSsrKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZyhcIm9ic3RhY2xlLnlcIiArIGksIG1vZGVsc1tcIm9ic3RhY2xlQmlnXCIgKyBpXS5jZW50ZXJbMV0gLSA0KTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwiZGlzdFwiLCBNYXRoLmFicyhtb2RlbHNbXCJvYnN0YWNsZUJpZ1wiICsgaV0uY2VudGVyWzFdIC0gQ2FtZXJhLnkpKTtcblxuICAgICAgYW5nbGUgPSBNYXRoLmF0YW4obW9kZWxzW1wib2JzdGFjbGVCaWdcIiArIGldLnNjYWxlWzFdIC8gbW9kZWxzW1wib2JzdGFjbGVCaWdcIiArIGldLnNjYWxlWzBdKSAqIDE4MCAvIE1hdGguUEk7XG4gICAgICBpZigod2luZG93Lm9jdEFuZ2xlICUgMTgwID49IChtb2RlbHNbXCJvYnN0YWNsZUJpZ1wiICsgaV0ucm90YXRlQW5nbGUyICUgMTgwIC0gYW5nbGUpICYmXG4gICAgd2luZG93Lm9jdEFuZ2xlICUgMTgwIDw9IChtb2RlbHNbXCJvYnN0YWNsZUJpZ1wiICsgaV0ucm90YXRlQW5nbGUyICUgMTgwICsgYW5nbGUpKSAmJlxuICAgICgod2luZG93LnJldm9sdmVBbmdsZSAlIDM2MCA8PSBtb2RlbHNbXCJvYnN0YWNsZUJpZ1wiICsgaV0ucm90YXRlQW5nbGUxICsgNCkgJiYgd2luZG93LnJldm9sdmVBbmdsZSAlIDM2MCA+PSBtb2RlbHNbXCJvYnN0YWNsZUJpZ1wiICsgaV0ucm90YXRlQW5nbGUxIC0gNClcbiAgICAvLyAoTWF0aC5hYnMobW9kZWxzW1wib2JzdGFjbGVCaWdcIiArIGldLmNlbnRlclsxXSAtIDQgLSBDYW1lcmEueSkgPD0gNSlcbiAgICAgICkge1xuICAgICAgICB3aW5kb3cucGxheUZsYWcgPSAwO1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ2FtZU92ZXJDb250YWluZXInKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY29yZUNvbnRhaW5lcicpLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ2FtZU92ZXInKS5pbm5lclRleHQgPSBcIkdBTUUgT1ZFUiBcXG5cXG4gU0NPUkU6IFwiICsgd2luZG93LnNjb3JlICsgXCJcXG5cXG5cIiArIFwiTEVWRUw6IFwiICsgd2luZG93LmxldmVsO1xuICAgICAgICBjb25zb2xlLmxvZyhcInllc1wiICsgaSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCJ2YXIgdmVjID0gcmVxdWlyZSgnLi92ZWN0b3InKVxuXG4vLyAwIDEgMiAzICAgICAgICAwIDEgMiAzXG4vLyA0IDUgNiA3ICAgICAgICA0IDUgNiA3XG4vLyA4IDkgMTAgMTEgICAgICA4IDkgMTAgMTFcbi8vIDEyIDEzIDE0IDE1ICAgIDEyIDEzIDE0IDE1XG5mdW5jdGlvbiBtYXRyaXhNdWx0aXBseShtYXQyLCBtYXQxKVxue1xuICByZXR1cm4gW1xuICAgIG1hdDFbMF0qbWF0MlswXSttYXQxWzFdKm1hdDJbNF0rbWF0MVsyXSptYXQyWzhdK21hdDFbM10qbWF0MlsxMl0sXG4gICAgbWF0MVswXSptYXQyWzFdK21hdDFbMV0qbWF0Mls1XSttYXQxWzJdKm1hdDJbOV0rbWF0MVszXSptYXQyWzEzXSxcbiAgICBtYXQxWzBdKm1hdDJbMl0rbWF0MVsxXSptYXQyWzZdK21hdDFbMl0qbWF0MlsxMF0rbWF0MVszXSptYXQyWzE0XSxcbiAgICBtYXQxWzBdKm1hdDJbM10rbWF0MVsxXSptYXQyWzddK21hdDFbMl0qbWF0MlsxMV0rbWF0MVszXSptYXQyWzE1XSxcbiAgICBtYXQxWzRdKm1hdDJbMF0rbWF0MVs1XSptYXQyWzRdK21hdDFbNl0qbWF0Mls4XSttYXQxWzddKm1hdDJbMTJdLFxuICAgIG1hdDFbNF0qbWF0MlsxXSttYXQxWzVdKm1hdDJbNV0rbWF0MVs2XSptYXQyWzldK21hdDFbN10qbWF0MlsxM10sXG4gICAgbWF0MVs0XSptYXQyWzJdK21hdDFbNV0qbWF0Mls2XSttYXQxWzZdKm1hdDJbMTBdK21hdDFbN10qbWF0MlsxNF0sXG4gICAgbWF0MVs0XSptYXQyWzNdK21hdDFbNV0qbWF0Mls3XSttYXQxWzZdKm1hdDJbMTFdK21hdDFbN10qbWF0MlsxNV0sXG4gICAgbWF0MVs4XSptYXQyWzBdK21hdDFbOV0qbWF0Mls0XSttYXQxWzEwXSptYXQyWzhdK21hdDFbMTFdKm1hdDJbMTJdLFxuICAgIG1hdDFbOF0qbWF0MlsxXSttYXQxWzldKm1hdDJbNV0rbWF0MVsxMF0qbWF0Mls5XSttYXQxWzExXSptYXQyWzEzXSxcbiAgICBtYXQxWzhdKm1hdDJbMl0rbWF0MVs5XSptYXQyWzZdK21hdDFbMTBdKm1hdDJbMTBdK21hdDFbMTFdKm1hdDJbMTRdLFxuICAgIG1hdDFbOF0qbWF0MlszXSttYXQxWzldKm1hdDJbN10rbWF0MVsxMF0qbWF0MlsxMV0rbWF0MVsxMV0qbWF0MlsxNV0sXG4gICAgbWF0MVsxMl0qbWF0MlswXSttYXQxWzEzXSptYXQyWzRdK21hdDFbMTRdKm1hdDJbOF0rbWF0MVsxNV0qbWF0MlsxMl0sXG4gICAgbWF0MVsxMl0qbWF0MlsxXSttYXQxWzEzXSptYXQyWzVdK21hdDFbMTRdKm1hdDJbOV0rbWF0MVsxNV0qbWF0MlsxM10sXG4gICAgbWF0MVsxMl0qbWF0MlsyXSttYXQxWzEzXSptYXQyWzZdK21hdDFbMTRdKm1hdDJbMTBdK21hdDFbMTVdKm1hdDJbMTRdLFxuICAgIG1hdDFbMTJdKm1hdDJbM10rbWF0MVsxM10qbWF0Mls3XSttYXQxWzE0XSptYXQyWzExXSttYXQxWzE1XSptYXQyWzE1XVxuICBdO1xufVxuXG5mdW5jdGlvbiBtYXRyaXhNdWx0aXBseTR4MShtYXQxLCBtYXQyKVxue1xuICByZXR1cm4gW1xuICAgIG1hdDFbMF0qbWF0MlswXSttYXQxWzFdKm1hdDJbMV0rbWF0MVsyXSptYXQyWzJdK21hdDFbM10qbWF0MVszXSxcbiAgICBtYXQxWzRdKm1hdDJbMF0rbWF0MVs1XSptYXQyWzFdK21hdDFbNl0qbWF0MlsyXSttYXQxWzddKm1hdDFbM10sXG4gICAgbWF0MVs4XSptYXQyWzBdK21hdDFbOV0qbWF0MlsxXSttYXQxWzEwXSptYXQyWzJdK21hdDFbMTFdKm1hdDFbM10sXG4gICAgbWF0MVsxMl0qbWF0MlswXSttYXQxWzEzXSptYXQyWzFdK21hdDFbMTRdKm1hdDJbMl0rbWF0MVsxNV0qbWF0MVszXVxuICBdO1xufVxuXG5mdW5jdGlvbiBtdWx0aXBseShtMSwgbTIpXG57XG4gIGlmIChtMi5sZW5ndGggPT0gNCkgcmV0dXJuIG1hdHJpeE11bHRpcGx5NHgxKG0xLCBtMilcbiAgZWxzZSByZXR1cm4gbWF0cml4TXVsdGlwbHkobTEsIG0yKVxufVxuXG5mdW5jdGlvbiBpbnZlcnNlKGEpXG57XG4gIHZhciBzMCA9IGFbMF0gKiBhWzVdIC0gYVs0XSAqIGFbMV07XG4gIHZhciBzMSA9IGFbMF0gKiBhWzZdIC0gYVs0XSAqIGFbMl07XG4gIHZhciBzMiA9IGFbMF0gKiBhWzddIC0gYVs0XSAqIGFbM107XG4gIHZhciBzMyA9IGFbMV0gKiBhWzZdIC0gYVs1XSAqIGFbMl07XG4gIHZhciBzNCA9IGFbMV0gKiBhWzddIC0gYVs1XSAqIGFbM107XG4gIHZhciBzNSA9IGFbMl0gKiBhWzddIC0gYVs2XSAqIGFbM107XG5cbiAgdmFyIGM1ID0gYVsxMF0gKiBhWzE1XSAtIGFbMTRdICogYVsxMV07XG4gIHZhciBjNCA9IGFbOV0gKiBhWzE1XSAtIGFbMTNdICogYVsxMV07XG4gIHZhciBjMyA9IGFbOV0gKiBhWzE0XSAtIGFbMTNdICogYVsxMF07XG4gIHZhciBjMiA9IGFbOF0gKiBhWzE1XSAtIGFbMTJdICogYVsxMV07XG4gIHZhciBjMSA9IGFbOF0gKiBhWzE0XSAtIGFbMTJdICogYVsxMF07XG4gIHZhciBjMCA9IGFbOF0gKiBhWzEzXSAtIGFbMTJdICogYVs5XTtcblxuICAvL2NvbnNvbGUubG9nKGM1LHM1LHM0KTtcblxuICAvLyBTaG91bGQgY2hlY2sgZm9yIDAgZGV0ZXJtaW5hbnRcbiAgdmFyIGludmRldCA9IDEuMCAvIChzMCAqIGM1IC0gczEgKiBjNCArIHMyICogYzMgKyBzMyAqIGMyIC0gczQgKiBjMSArIHM1ICogYzApO1xuXG4gIHZhciBiID0gW1tdLFtdLFtdLFtdXTtcblxuICBiWzBdID0gKCBhWzVdICogYzUgLSBhWzZdICogYzQgKyBhWzddICogYzMpICogaW52ZGV0O1xuICBiWzFdID0gKC1hWzFdICogYzUgKyBhWzJdICogYzQgLSBhWzNdICogYzMpICogaW52ZGV0O1xuICBiWzJdID0gKCBhWzEzXSAqIHM1IC0gYVsxNF0gKiBzNCArIGFbMTVdICogczMpICogaW52ZGV0O1xuICBiWzNdID0gKC1hWzldICogczUgKyBhWzEwXSAqIHM0IC0gYVsxMV0gKiBzMykgKiBpbnZkZXQ7XG5cbiAgYls0XSA9ICgtYVs0XSAqIGM1ICsgYVs2XSAqIGMyIC0gYVs3XSAqIGMxKSAqIGludmRldDtcbiAgYls1XSA9ICggYVswXSAqIGM1IC0gYVsyXSAqIGMyICsgYVszXSAqIGMxKSAqIGludmRldDtcbiAgYls2XSA9ICgtYVsxMl0gKiBzNSArIGFbMTRdICogczIgLSBhWzE1XSAqIHMxKSAqIGludmRldDtcbiAgYls3XSA9ICggYVs4XSAqIHM1IC0gYVsxMF0gKiBzMiArIGFbMTFdICogczEpICogaW52ZGV0O1xuXG4gIGJbOF0gPSAoIGFbNF0gKiBjNCAtIGFbNV0gKiBjMiArIGFbN10gKiBjMCkgKiBpbnZkZXQ7XG4gIGJbOV0gPSAoLWFbMF0gKiBjNCArIGFbMV0gKiBjMiAtIGFbM10gKiBjMCkgKiBpbnZkZXQ7XG4gIGJbMTBdID0gKCBhWzEyXSAqIHM0IC0gYVsxM10gKiBzMiArIGFbMTVdICogczApICogaW52ZGV0O1xuICBiWzExXSA9ICgtYVs4XSAqIHM0ICsgYVs5XSAqIHMyIC0gYVsxMV0gKiBzMCkgKiBpbnZkZXQ7XG5cbiAgYlsxMl0gPSAoLWFbNF0gKiBjMyArIGFbNV0gKiBjMSAtIGFbNl0gKiBjMCkgKiBpbnZkZXQ7XG4gIGJbMTNdID0gKCBhWzBdICogYzMgLSBhWzFdICogYzEgKyBhWzJdICogYzApICogaW52ZGV0O1xuICBiWzE0XSA9ICgtYVsxMl0gKiBzMyArIGFbMTNdICogczEgLSBhWzE0XSAqIHMwKSAqIGludmRldDtcbiAgYlsxNV0gPSAoIGFbOF0gKiBzMyAtIGFbOV0gKiBzMSArIGFbMTBdICogczApICogaW52ZGV0O1xuXG4gIHJldHVybiBiO1xufVxuXG5mdW5jdGlvbiBwZXJzcGVjdGl2ZShmaWVsZE9mVmlld0luUmFkaWFucywgYXNwZWN0LCBuZWFyLCBmYXIpXG57XG4gIHZhciBmID0gTWF0aC50YW4oTWF0aC5QSSAqIDAuNSAtIDAuNSAqIGZpZWxkT2ZWaWV3SW5SYWRpYW5zKTtcbiAgdmFyIHJhbmdlSW52ID0gMS4wIC8gKG5lYXIgLSBmYXIpO1xuXG4gIHJldHVybiBbXG4gICAgZiAvIGFzcGVjdCwgMCwgMCwgMCxcbiAgICAwLCBmLCAwLCAwLFxuICAgIDAsIDAsIChuZWFyICsgZmFyKSAqIHJhbmdlSW52LCAtMSxcbiAgICAwLCAwLCBuZWFyICogZmFyICogcmFuZ2VJbnYgKiAyLCAwXG4gIF07XG59XG5cbmZ1bmN0aW9uIG1ha2VaVG9XTWF0cml4KGZ1ZGdlRmFjdG9yKVxue1xuICByZXR1cm4gW1xuICAgIDEsIDAsIDAsIDAsXG4gICAgMCwgMSwgMCwgMCxcbiAgICAwLCAwLCAxLCBmdWRnZUZhY3RvcixcbiAgICAwLCAwLCAwLCAxLFxuICBdO1xufVxuXG5mdW5jdGlvbiB0cmFuc2xhdGUodHgsIHR5LCB0eilcbntcbiAgaWYgKHR5cGVvZiB0eCAhPSAnbnVtYmVyJylcbiAge1xuICAgIGxldCBvbGQgPSB0eFxuICAgIHR4ID0gb2xkWzBdXG4gICAgdHkgPSBvbGRbMV1cbiAgICB0eiA9IG9sZFsyXVxuICB9XG4gIHJldHVybiBbXG4gICAgMSwgIDAsICAwLCAgMCxcbiAgICAwLCAgMSwgIDAsICAwLFxuICAgIDAsICAwLCAgMSwgIDAsXG4gICAgdHgsIHR5LCB0eiwgMVxuICBdO1xufVxuXG5mdW5jdGlvbiByb3RhdGVYKGFuZ2xlSW5SYWRpYW5zKVxue1xuICB2YXIgYyA9IE1hdGguY29zKGFuZ2xlSW5SYWRpYW5zKTtcbiAgdmFyIHMgPSBNYXRoLnNpbihhbmdsZUluUmFkaWFucyk7XG5cbiAgcmV0dXJuIFtcbiAgICAxLCAwLCAwLCAwLFxuICAgIDAsIGMsIHMsIDAsXG4gICAgMCwgLXMsIGMsIDAsXG4gICAgMCwgMCwgMCwgMVxuICBdO1xufVxuXG5mdW5jdGlvbiByb3RhdGVZKGFuZ2xlSW5SYWRpYW5zKVxue1xuICB2YXIgYyA9IE1hdGguY29zKGFuZ2xlSW5SYWRpYW5zKTtcbiAgdmFyIHMgPSBNYXRoLnNpbihhbmdsZUluUmFkaWFucyk7XG5cbiAgcmV0dXJuIFtcbiAgICBjLCAwLCAtcywgMCxcbiAgICAwLCAxLCAwLCAwLFxuICAgIHMsIDAsIGMsIDAsXG4gICAgMCwgMCwgMCwgMVxuICBdO1xufVxuXG5mdW5jdGlvbiByb3RhdGVaKGFuZ2xlSW5SYWRpYW5zKSB7XG4gIHZhciBjID0gTWF0aC5jb3MoYW5nbGVJblJhZGlhbnMpO1xuICB2YXIgcyA9IE1hdGguc2luKGFuZ2xlSW5SYWRpYW5zKTtcblxuICByZXR1cm4gW1xuICAgIGMsIHMsIDAsIDAsXG4gICAgLXMsIGMsIDAsIDAsXG4gICAgMCwgMCwgMSwgMCxcbiAgICAwLCAwLCAwLCAxLFxuICBdO1xufVxuXG5mdW5jdGlvbiBzY2FsZShzeCwgc3ksIHN6KSB7XG4gIGlmICh0eXBlb2Ygc3ggIT0gJ251bWJlcicpIHtcbiAgICBsZXQgb2xkID0gc3hcbiAgICBzeCA9IG9sZFswXVxuICAgIHN5ID0gb2xkWzFdXG4gICAgc3ogPSBvbGRbMl1cbiAgfVxuICByZXR1cm4gW1xuICAgIHN4LCAwLCAgMCwgIDAsXG4gICAgMCwgc3ksICAwLCAgMCxcbiAgICAwLCAgMCwgc3osICAwLFxuICAgIDAsICAwLCAgMCwgIDEsXG4gIF07XG59XG5cbmZ1bmN0aW9uIGxvb2tBdChleWUsIHRhcmdldCwgdXApe1xuICB2YXIgZiA9IHZlYy5ub3JtYWxpemUodmVjLnN1YnRyYWN0KHRhcmdldCwgZXllKSk7XG4gIHZhciBzID0gdmVjLm5vcm1hbGl6ZSh2ZWMuY3Jvc3MoZiwgdXApKTtcbiAgdmFyIHUgPSB2ZWMuY3Jvc3MocywgZik7XG5cbiAgdmFyIHJlc3VsdCA9IGlkZW50aXR5KCk7XG4gIHJlc3VsdFs0KjAgKyAwXSA9IHNbMF07XG4gIHJlc3VsdFs0KjEgKyAwXSA9IHNbMV07XG4gIHJlc3VsdFs0KjIgKyAwXSA9IHNbMl07XG4gIHJlc3VsdFs0KjAgKyAxXSA9IHVbMF07XG4gIHJlc3VsdFs0KjEgKyAxXSA9IHVbMV07XG4gIHJlc3VsdFs0KjIgKyAxXSA9IHVbMl07XG4gIHJlc3VsdFs0KjAgKyAyXSA9LWZbMF07XG4gIHJlc3VsdFs0KjEgKyAyXSA9LWZbMV07XG4gIHJlc3VsdFs0KjIgKyAyXSA9LWZbMl07XG4gIHJlc3VsdFs0KjMgKyAwXSA9LXZlYy5kb3QocywgZXllKTtcbiAgcmVzdWx0WzQqMyArIDFdID0tdmVjLmRvdCh1LCBleWUpO1xuICByZXN1bHRbNCozICsgMl0gPSB2ZWMuZG90KGYsIGV5ZSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGlkZW50aXR5KCkge1xuICByZXR1cm4gc2NhbGUoMSwgMSwgMSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG11bHRpcGx5LFxuICBpbnZlcnNlLFxuICBpZGVudGl0eSxcblxuICBwZXJzcGVjdGl2ZSxcbiAgbWFrZVpUb1dNYXRyaXgsXG4gIGxvb2tBdCxcblxuICB0cmFuc2xhdGUsXG4gIHJvdGF0ZVgsIHJvdGF0ZVksIHJvdGF0ZVosXG4gIHNjYWxlLFxufVxuIiwidmFyIG0gPSByZXF1aXJlKCcuL21hdHJpeCcpXG5cbmZ1bmN0aW9uIG9wZW5GaWxlKG5hbWUsIGZpbGVuYW1lKXtcbiAgdmFyIGRhdGFzdHJpbmc7XG4gICQuYWpheCh7XG4gICAgdXJsIDogZmlsZW5hbWUgKyAnLm9iaicsXG4gICAgZGF0YVR5cGU6IFwidGV4dFwiLFxuICAgIHN1Y2Nlc3MgOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgZGF0YXN0cmluZyA9IGRhdGE7XG4gICAgICAkLmFqYXgoe1xuICAgICAgICB1cmwgOiBmaWxlbmFtZSArICcubXRsJyxcbiAgICAgICAgZGF0YVR5cGU6IFwidGV4dFwiLFxuICAgICAgICBzdWNjZXNzIDogZnVuY3Rpb24gKG10bHN0cmluZykge1xuICAgICAgICAgIGNyZWF0ZU1vZGVsKG5hbWUsIGRhdGFzdHJpbmcsIG10bHN0cmluZyk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gbWFrZU1vZGVsKG5hbWUsIGZpbGVuYW1lLCBjZW50ZXIgPSBbMCwgMCwgMF0sIHNjYWxlID0gWzEsIDEsIDFdLFxuICByb3RhdGVBbmdsZTEgPSAwLCByb3RhdGVBbmdsZTIgPSAwLCByb3RhdGlvblNwZWVkKSB7XG4gIG1vZGVsc1tuYW1lXSA9IHtuYW1lLCBjZW50ZXIsIHNjYWxlLCByb3RhdGVBbmdsZTEsIHJvdGF0ZUFuZ2xlMiwgcm90YXRpb25TcGVlZH07XG4gIG9wZW5GaWxlKG5hbWUsIGZpbGVuYW1lKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VNdGwobXRsc3RyaW5nKSB7XG4gIHZhciBtdGxsaWIgPSB7fVxuICB2YXIgbGluZXMgPSBtdGxzdHJpbmcuc3BsaXQoJ1xcbicpO1xuICB2YXIgY3VybXRsID0gJydcbiAgZm9yICh2YXIgaj0wOyBqPGxpbmVzLmxlbmd0aDsgaisrKSB7XG4gICAgdmFyIHdvcmRzID0gbGluZXNbal0uc3BsaXQoJyAnKTtcbiAgICBpZiAod29yZHNbMF0gPT0gJ25ld210bCcpIHtcbiAgICAgIGN1cm10bCA9IHdvcmRzWzFdXG4gICAgICBtdGxsaWJbY3VybXRsXSA9IHt9XG4gICAgfSBlbHNlIGlmICh3b3Jkc1swXSA9PSAnS2QnKSB7XG4gICAgICBtdGxsaWJbY3VybXRsXS5kaWZmdXNlID0gW1xuICAgICAgICBwYXJzZUZsb2F0KHdvcmRzWzFdKSxcbiAgICAgICAgcGFyc2VGbG9hdCh3b3Jkc1syXSksXG4gICAgICAgIHBhcnNlRmxvYXQod29yZHNbM10pLFxuICAgICAgXVxuICAgIH0gZWxzZSBpZiAod29yZHNbMF0gPT0gJ0tzJykge1xuICAgICAgbXRsbGliW2N1cm10bF0uc3BlY3VsYXIgPSBbXG4gICAgICAgIHBhcnNlRmxvYXQod29yZHNbMV0pLFxuICAgICAgICBwYXJzZUZsb2F0KHdvcmRzWzJdKSxcbiAgICAgICAgcGFyc2VGbG9hdCh3b3Jkc1szXSksXG4gICAgICBdXG4gICAgfSBlbHNlIGlmICh3b3Jkc1swXSA9PSAnS2EnKSB7XG4gICAgICBtdGxsaWJbY3VybXRsXS5hbWJpZW50ID0gW1xuICAgICAgICBwYXJzZUZsb2F0KHdvcmRzWzFdKSxcbiAgICAgICAgcGFyc2VGbG9hdCh3b3Jkc1syXSksXG4gICAgICAgIHBhcnNlRmxvYXQod29yZHNbM10pLFxuICAgICAgXVxuICAgIH0gZWxzZSBpZiAod29yZHNbMF0gPT0gJ05zJykge1xuICAgICAgbXRsbGliW2N1cm10bF0uc2hpbmluZXNzID0gcGFyc2VGbG9hdCh3b3Jkc1sxXSlcbiAgICB9IGVsc2UgaWYgKHdvcmRzWzBdID09ICdtYXBfS2QnKSB7XG4gICAgICBsb2FkVGV4dHVyZSh3b3Jkc1sxXSwgbXRsbGliW2N1cm10bF0pXG4gICAgfVxuICB9XG4gIHJldHVybiBtdGxsaWJcbn1cblxuZnVuY3Rpb24gaGFuZGxlTG9hZGVkVGV4dHVyZSh0ZXh0dXJlKSB7XG4gIGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRydWUpO1xuICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCB0ZXh0dXJlKTtcbiAgZ2wudGV4SW1hZ2UyRChnbC5URVhUVVJFXzJELCAwLCBnbC5SR0JBLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCB0ZXh0dXJlLmltYWdlKTtcbiAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsLkxJTkVBUik7XG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbC5MSU5FQVJfTUlQTUFQX05FQVJFU1QpO1xuICBnbC5nZW5lcmF0ZU1pcG1hcChnbC5URVhUVVJFXzJEKTtcblxuICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBudWxsKTtcbn1cblxuZnVuY3Rpb24gbG9hZFRleHR1cmUoc3JjLCBtYXRlcmlhbCkge1xuICB2YXIgdGV4dHVyZSA9IGdsLmNyZWF0ZVRleHR1cmUoKTtcbiAgdGV4dHVyZS5pbWFnZSA9IG5ldyBJbWFnZSgpO1xuICB0ZXh0dXJlLmltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBoYW5kbGVMb2FkZWRUZXh0dXJlKHRleHR1cmUpXG4gICAgbWF0ZXJpYWwudGV4dHVyZSA9IHRleHR1cmVcbiAgfVxuICB0ZXh0dXJlLmltYWdlLnNyYyA9IHNyYztcbiAgcmV0dXJuIHRleHR1cmU7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU1vZGVsKG5hbWUsIGZpbGVkYXRhLCBtdGxzdHJpbmcpIC8vQ3JlYXRlIG9iamVjdCBmcm9tIGJsZW5kZXJcbntcbiAgdmFyIG1vZGVsID0gbW9kZWxzW25hbWVdO1xuICB2YXIgbXRsbGliID0gcGFyc2VNdGwobXRsc3RyaW5nKVxuICB2YXIgdmVydGV4X2J1ZmZlcl9kYXRhID0gW107XG4gIHZhciBwb2ludHMgPSBbXTtcbiAgdmFyIG1pblggPSAxMDAwMDAwXG4gIHZhciBtYXhYID0gLTEwMDAwMDBcbiAgdmFyIG1pblkgPSAxMDAwMDAwXG4gIHZhciBtYXhZID0gLTEwMDAwMDBcbiAgdmFyIG1pblogPSAxMDAwMDAwXG4gIHZhciBtYXhaID0gLTEwMDAwMDBcblxuICB2YXIgaW52ZXJ0Tm9ybWFscyA9IGZhbHNlO1xuICB2YXIgbm9ybWFscyA9IFtdO1xuICB2YXIgbm9ybWFsX2J1ZmZlcl9kYXRhID0gW107XG5cbiAgdmFyIHRleHR1cmVzID0gW107XG4gIHZhciB0ZXh0dXJlX2J1ZmZlcl9kYXRhID0gW107XG5cbiAgbW9kZWwudmFvcyA9IFtdO1xuXG4gIHZhciBsaW5lcyA9IGZpbGVkYXRhLnNwbGl0KCdcXG4nKTtcbiAgbGluZXMgPSBsaW5lcy5tYXAocyA9PiBzLnRyaW0oKSlcbiAgbGluZXMucHVzaCgndXNlbXRsJylcbiAgZm9yICh2YXIgaj0wOyBqPGxpbmVzLmxlbmd0aDsgaisrKXtcbiAgICB2YXIgd29yZHMgPSBsaW5lc1tqXS5zcGxpdCgnICcpO1xuICAgIGlmKHdvcmRzWzBdID09IFwidlwiKXtcbiAgICAgIHZhciBjdXJfcG9pbnQgPSB7fTtcbiAgICAgIGN1cl9wb2ludFsneCddPXBhcnNlRmxvYXQod29yZHNbMV0pO1xuICAgICAgaWYoY3VyX3BvaW50Wyd4J10+bWF4WCl7XG4gICAgICAgIG1heFggPSBjdXJfcG9pbnRbJ3gnXVxuICAgICAgfVxuICAgICAgaWYoY3VyX3BvaW50Wyd4J108bWluWCl7XG4gICAgICAgIG1pblggPSBjdXJfcG9pbnRbJ3gnXVxuICAgICAgfVxuICAgICAgY3VyX3BvaW50Wyd5J109cGFyc2VGbG9hdCh3b3Jkc1syXSk7XG4gICAgICBpZihjdXJfcG9pbnRbJ3knXT5tYXhZKXtcbiAgICAgICAgbWF4WSA9IGN1cl9wb2ludFsneSddXG4gICAgICB9XG4gICAgICBpZihjdXJfcG9pbnRbJ3knXTxtaW5ZKXtcbiAgICAgICAgbWluWSA9IGN1cl9wb2ludFsneSddXG4gICAgICB9XG4gICAgICBjdXJfcG9pbnRbJ3onXT1wYXJzZUZsb2F0KHdvcmRzWzNdKTtcbiAgICAgIGlmKGN1cl9wb2ludFsneiddPm1heFope1xuICAgICAgICBtYXhaID0gY3VyX3BvaW50Wyd6J11cbiAgICAgIH1cbiAgICAgIGlmKGN1cl9wb2ludFsneiddPG1pblope1xuICAgICAgICBtaW5aID0gY3VyX3BvaW50Wyd6J11cbiAgICAgIH1cbiAgICAgIC8vY29uc29sZS5sb2cod29yZHMpO1xuICAgICAgcG9pbnRzLnB1c2goY3VyX3BvaW50KTtcbiAgICB9IGVsc2UgaWYgKHdvcmRzWzBdID09IFwidm5cIikge1xuICAgICAgbGV0IGN1cl9wb2ludCA9IHt9O1xuICAgICAgY3VyX3BvaW50Wyd4J109cGFyc2VGbG9hdCh3b3Jkc1sxXSk7XG4gICAgICBjdXJfcG9pbnRbJ3knXT1wYXJzZUZsb2F0KHdvcmRzWzJdKTtcbiAgICAgIGN1cl9wb2ludFsneiddPXBhcnNlRmxvYXQod29yZHNbM10pO1xuICAgICAgLy9jb25zb2xlLmxvZyh3b3Jkcyk7XG4gICAgICBub3JtYWxzLnB1c2goY3VyX3BvaW50KTtcbiAgICB9IGVsc2UgaWYgKHdvcmRzWzBdID09IFwidnRcIikge1xuICAgICAgbGV0IGN1cl9wb2ludCA9IHt9O1xuICAgICAgY3VyX3BvaW50LnMgPSBwYXJzZUZsb2F0KHdvcmRzWzFdKTtcbiAgICAgIGN1cl9wb2ludC50ID0gcGFyc2VGbG9hdCh3b3Jkc1syXSk7XG4gICAgICB0ZXh0dXJlcy5wdXNoKGN1cl9wb2ludCk7XG4gICAgfVxuICB9XG4gIG1vZGVsLm1pblggPSBtaW5YXG4gIG1vZGVsLm1heFggPSBtYXhYXG4gIG1vZGVsLm1pblkgPSBtaW5ZXG4gIG1vZGVsLm1heFkgPSBtYXhZXG4gIG1vZGVsLm1pblogPSBtaW5aXG4gIG1vZGVsLm1heFogPSBtYXhaXG4gIC8vY29uc29sZS5sb2cocG9pbnRzKTtcbiAgLy8gbGV0IGxpbmVzID0gZmlsZWRhdGEuc3BsaXQoJ1xcbicpO1xuICB2YXIgY3VybXRsID0gJydcbiAgZm9yICh2YXIgamo9MDsgamo8bGluZXMubGVuZ3RoOyBqaisrKXtcbiAgICBsZXQgd29yZHMgPSBsaW5lc1tqal0uc3BsaXQoJyAnKTtcbiAgICBpZih3b3Jkc1swXSA9PSBcImZcIikge1xuICAgICAgZm9yIChsZXQgd2MgPSAxOyB3YyA8IDQ7IHdjKyspIHtcbiAgICAgICAgbGV0IHZ4ZGF0YSA9IHdvcmRzW3djXS5zcGxpdCgnLycpXG4gICAgICAgIGxldCBwID0gcGFyc2VJbnQodnhkYXRhWzBdKSAtIDFcbiAgICAgICAgbGV0IHQgPSBwYXJzZUludCh2eGRhdGFbMV0pIC0gMVxuICAgICAgICBsZXQgbiA9IHBhcnNlSW50KHZ4ZGF0YVsyXSkgLSAxXG4gICAgICAgIHZlcnRleF9idWZmZXJfZGF0YS5wdXNoKHBvaW50c1twXS54KVxuICAgICAgICB2ZXJ0ZXhfYnVmZmVyX2RhdGEucHVzaChwb2ludHNbcF0ueSlcbiAgICAgICAgdmVydGV4X2J1ZmZlcl9kYXRhLnB1c2gocG9pbnRzW3BdLnopXG5cbiAgICAgICAgaWYgKCFpc05hTih0KSkge1xuICAgICAgICAgIHRleHR1cmVfYnVmZmVyX2RhdGEucHVzaCh0ZXh0dXJlc1t0XS5zKVxuICAgICAgICAgIHRleHR1cmVfYnVmZmVyX2RhdGEucHVzaCh0ZXh0dXJlc1t0XS50KVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGludmVydE5vcm1hbHMpIHtcbiAgICAgICAgICBub3JtYWxfYnVmZmVyX2RhdGEucHVzaCgtbm9ybWFsc1tuXS54KVxuICAgICAgICAgIG5vcm1hbF9idWZmZXJfZGF0YS5wdXNoKC1ub3JtYWxzW25dLnkpXG4gICAgICAgICAgbm9ybWFsX2J1ZmZlcl9kYXRhLnB1c2goLW5vcm1hbHNbbl0ueilcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBub3JtYWxfYnVmZmVyX2RhdGEucHVzaChub3JtYWxzW25dLngpXG4gICAgICAgICAgbm9ybWFsX2J1ZmZlcl9kYXRhLnB1c2gobm9ybWFsc1tuXS55KVxuICAgICAgICAgIG5vcm1hbF9idWZmZXJfZGF0YS5wdXNoKG5vcm1hbHNbbl0ueilcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAod29yZHNbMF0gPT0gJ3VzZW10bCcpIHtcbiAgICAgIGxldCB2YW8gPSB7fVxuICAgICAgdmFvLm51bVZlcnRleCA9IHZlcnRleF9idWZmZXJfZGF0YS5sZW5ndGggLyAzO1xuICAgICAgaWYgKHZhby5udW1WZXJ0ZXggIT0gMCkge1xuICAgICAgICB2YXIgdmVydGV4QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB2ZXJ0ZXhCdWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheSh2ZXJ0ZXhfYnVmZmVyX2RhdGEpLCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgICAgIHZhby52ZXJ0ZXhCdWZmZXIgPSB2ZXJ0ZXhCdWZmZXJcblxuICAgICAgICB2YXIgbm9ybWFsQnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBub3JtYWxCdWZmZXIpO1xuICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheShub3JtYWxfYnVmZmVyX2RhdGEpLCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgICAgIHZhby5ub3JtYWxCdWZmZXIgPSBub3JtYWxCdWZmZXJcblxuICAgICAgICB2YXIgdGV4dHVyZUJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGV4dHVyZUJ1ZmZlcik7XG4gICAgICAgIGlmICh0ZXh0dXJlX2J1ZmZlcl9kYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgbmV3IEZsb2F0MzJBcnJheSh0ZXh0dXJlX2J1ZmZlcl9kYXRhKSwgZ2wuU1RBVElDX0RSQVcpO1xuICAgICAgICAgIHZhby5pc1RleHR1cmVkID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMip2YW8ubnVtVmVydGV4OyBpKyspIHRleHR1cmVfYnVmZmVyX2RhdGEucHVzaCgwKVxuICAgICAgICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KHRleHR1cmVfYnVmZmVyX2RhdGEpLCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgICAgICAgdmFvLmlzVGV4dHVyZWQgPSBmYWxzZVxuICAgICAgICB9XG4gICAgICAgIHZhby50ZXh0dXJlQnVmZmVyID0gdGV4dHVyZUJ1ZmZlclxuXG4gICAgICAgIHZhby5tYXRlcmlhbCA9IG10bGxpYltjdXJtdGxdXG5cbiAgICAgICAgbW9kZWwudmFvcy5wdXNoKHZhbylcbiAgICAgICAgdmVydGV4X2J1ZmZlcl9kYXRhID0gW11cbiAgICAgICAgbm9ybWFsX2J1ZmZlcl9kYXRhID0gW11cbiAgICAgICAgdGV4dHVyZV9idWZmZXJfZGF0YSA9IFtdXG4gICAgICB9IGVsc2UgaWYgKHdvcmRzWzBdID09ICdpbnZlcnROb3JtYWxzJykge1xuICAgICAgICBpbnZlcnROb3JtYWxzID0gIWludmVydE5vcm1hbHNcbiAgICAgIH1cbiAgICAgIGN1cm10bCA9IHdvcmRzWzFdXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGRyYXdNb2RlbCAobW9kZWwpIHtcbiAgaWYgKCFtb2RlbC52YW9zKSByZXR1cm5cbiAgZ2wudW5pZm9ybU1hdHJpeDRmdihnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJtb2RlbFwiKSwgZmFsc2UsIE1hdHJpY2VzLm1vZGVsKTtcbiAgZ2wudW5pZm9ybU1hdHJpeDRmdihnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJtb2RlbEludlwiKSwgZmFsc2UsIG0uaW52ZXJzZShNYXRyaWNlcy5tb2RlbCkpO1xuXG4gIG1vZGVsLnZhb3MubWFwKGRyYXdWQU8pXG59XG5cbmZ1bmN0aW9uIGRyYXdMaWdodChtb2RlbCkge1xuICBnbC51bmlmb3JtMWkoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwiaXNMaWdodFwiKSwgMSk7XG4gIGRyYXdNb2RlbChtb2RlbCk7XG4gIGdsLnVuaWZvcm0xaShnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJpc0xpZ2h0XCIpLCAwKTtcbn1cblxuZnVuY3Rpb24gZHJhd1ZBTyh2YW8pIHtcbiAgaWYgKCF2YW8udmVydGV4QnVmZmVyKSByZXR1cm47XG5cbiAgbG9hZE1hdGVyaWFsKHZhby5tYXRlcmlhbClcblxuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdmFvLnZlcnRleEJ1ZmZlcilcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihwcm9ncmFtLnBvc2l0aW9uQXR0cmlidXRlLCAzLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuXG4gIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCB2YW8ubm9ybWFsQnVmZmVyKVxuICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHByb2dyYW0ubm9ybWFsQXR0cmlidXRlLCAzLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuXG4gIHZhciBpc1RleHR1cmVkID0gdmFvLm1hdGVyaWFsLnRleHR1cmUgJiYgdmFvLmlzVGV4dHVyZWRcbiAgLy8gY29uc29sZS5sb2coaXNUZXh0dXJlZClcbiAgZ2wudW5pZm9ybTFpKGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcImlzVGV4dHVyZWRcIiksIGlzVGV4dHVyZWQpO1xuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdmFvLnRleHR1cmVCdWZmZXIpXG4gIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIocHJvZ3JhbS50ZXh0dXJlQXR0cmlidXRlLCAyLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuICBpZiAoaXNUZXh0dXJlZCkge1xuICAgIGdsLmFjdGl2ZVRleHR1cmUoZ2wuVEVYVFVSRTApO1xuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHZhby5tYXRlcmlhbC50ZXh0dXJlKTtcbiAgICBnbC51bmlmb3JtMWkoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwic2FtcGxlclwiKSwgMCk7XG4gIH1cblxuICAvLyBkcmF3XG4gIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVTLCAwLCB2YW8ubnVtVmVydGV4KTtcbn1cblxuZnVuY3Rpb24gbG9hZE1hdGVyaWFsKG1hdGVyaWFsKSB7XG4gIGlmICghbWF0ZXJpYWwpIG1hdGVyaWFsID0ge1xuICAgIGFtYmllbnQ6IFsxLCAxLCAxXSxcbiAgICBkaWZmdXNlOiBbMSwgMSwgMV0sXG4gICAgc3BlY3VsYXI6IFsxLCAxLCAxXSxcbiAgICBzaGluaW5lc3M6IDAsXG4gIH07XG4gIC8vIFNldCBtYXRlcmlhbCBwcm9wZXJ0aWVzXG4gIGdsLnVuaWZvcm0zZihnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJtYXRlcmlhbC5hbWJpZW50XCIpLCAgIG1hdGVyaWFsLmFtYmllbnRbMF0sIG1hdGVyaWFsLmFtYmllbnRbMV0sIG1hdGVyaWFsLmFtYmllbnRbMl0pO1xuICBnbC51bmlmb3JtM2YoZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIFwibWF0ZXJpYWwuZGlmZnVzZVwiKSwgICBtYXRlcmlhbC5kaWZmdXNlWzBdLCBtYXRlcmlhbC5kaWZmdXNlWzFdLCBtYXRlcmlhbC5kaWZmdXNlWzJdKTtcbiAgZ2wudW5pZm9ybTNmKGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCBcIm1hdGVyaWFsLnNwZWN1bGFyXCIpLCAgbWF0ZXJpYWwuc3BlY3VsYXJbMF0sIG1hdGVyaWFsLnNwZWN1bGFyWzFdLCBtYXRlcmlhbC5zcGVjdWxhclsyXSk7XG4gIGdsLnVuaWZvcm0xZihnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgXCJtYXRlcmlhbC5zaGluaW5lc3NcIiksIG1hdGVyaWFsLnNoaW5pbmVzcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtYWtlTW9kZWwsXG4gIGNyZWF0ZU1vZGVsLFxuICBkcmF3TW9kZWwsXG4gIGRyYXdMaWdodCxcbn1cbiIsInZhciBzaGFkZXJzID0ge31cblxuZnVuY3Rpb24gY29tcGlsZVNoYWRlcihnbCwgc2hhZGVyU291cmNlLCBzaGFkZXJUeXBlKSB7XG4gIC8vIENyZWF0ZSB0aGUgc2hhZGVyIG9iamVjdFxuICB2YXIgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKHNoYWRlclR5cGUpO1xuXG4gIC8vIFNldCB0aGUgc2hhZGVyIHNvdXJjZSBjb2RlLlxuICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzaGFkZXJTb3VyY2UpO1xuXG4gIC8vIENvbXBpbGUgdGhlIHNoYWRlclxuICBnbC5jb21waWxlU2hhZGVyKHNoYWRlcik7XG5cbiAgLy8gQ2hlY2sgaWYgaXQgY29tcGlsZWRcbiAgdmFyIHN1Y2Nlc3MgPSBnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUyk7XG4gIGlmICghc3VjY2Vzcykge1xuICAgIC8vIFNvbWV0aGluZyB3ZW50IHdyb25nIGR1cmluZyBjb21waWxhdGlvbjsgZ2V0IHRoZSBlcnJvclxuICAgIHRocm93IFwiY291bGQgbm90IGNvbXBpbGUgc2hhZGVyOlwiICsgZ2wuZ2V0U2hhZGVySW5mb0xvZyhzaGFkZXIpO1xuICB9XG5cbiAgcmV0dXJuIHNoYWRlcjtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUHJvZ3JhbShnbCwgbmFtZSwgdmVydGV4U2hhZGVyLCBmcmFnbWVudFNoYWRlcikge1xuICAvLyBjcmVhdGUgYSBwcm9ncmFtLlxuICB2YXIgcHJvZ3JhID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuXG4gIC8vIGF0dGFjaCB0aGUgc2hhZGVycy5cbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYSwgdmVydGV4U2hhZGVyKTtcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYSwgZnJhZ21lbnRTaGFkZXIpO1xuXG4gIC8vIGxpbmsgdGhlIHByb2dyYW0uXG4gIGdsLmxpbmtQcm9ncmFtKHByb2dyYSk7XG5cbiAgZ2wuZGVsZXRlU2hhZGVyKHZlcnRleFNoYWRlcilcbiAgZ2wuZGVsZXRlU2hhZGVyKGZyYWdtZW50U2hhZGVyKVxuXG4gIC8vIENoZWNrIGlmIGl0IGxpbmtlZC5cbiAgdmFyIHN1Y2Nlc3MgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYSwgZ2wuTElOS19TVEFUVVMpO1xuICBpZiAoIXN1Y2Nlc3MpIHtcbiAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZyB3aXRoIHRoZSBsaW5rXG4gICAgdGhyb3cgKFwicHJvZ3JhbSBmaWxlZCB0byBsaW5rOlwiICsgZ2wuZ2V0UHJvZ3JhbUluZm9Mb2cgKHByb2dyYSkpO1xuICB9XG5cbiAgd2luZG93LnByb2dyYW0gPSBwcm9ncmE7XG4gIHByb2dyYW0ucG9zaXRpb25BdHRyaWJ1dGUgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfcG9zaXRpb25cIik7XG4gIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHByb2dyYW0udmVydGV4QXR0cmlidXRlKTtcblxuICBwcm9ncmFtLm5vcm1hbEF0dHJpYnV0ZSA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV9ub3JtYWxcIik7XG4gIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHByb2dyYW0ubm9ybWFsQXR0cmlidXRlKTtcblxuICBwcm9ncmFtLnRleHR1cmVBdHRyaWJ1dGUgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfdGV4dHVyZVwiKTtcbiAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkocHJvZ3JhbS50ZXh0dXJlQXR0cmlidXRlKTtcblxuICBzaGFkZXJzW25hbWVdID0gcHJvZ3JhO1xufVxuXG5mdW5jdGlvbiBvcGVuRmlsZShuYW1lLCBmaWxlbmFtZSl7XG4gICQuZ2V0KGZpbGVuYW1lICsgJy52cycsIGZ1bmN0aW9uICh2eFNoYWRlckRhdGEpIHtcbiAgICB2YXIgdnhTaGFkZXIgPSBjb21waWxlU2hhZGVyKGdsLCB2eFNoYWRlckRhdGEsIGdsLlZFUlRFWF9TSEFERVIpXG4gICAgJC5nZXQoZmlsZW5hbWUgKyAnLmZyYWcnLCBmdW5jdGlvbiAoZnJhZ1NoYWRlckRhdGEpIHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKHZ4U2hhZGVyRGF0YSwgZnJhZ1NoYWRlckRhdGEpXG4gICAgICB2YXIgZnJhZ1NoYWRlciA9IGNvbXBpbGVTaGFkZXIoZ2wsIGZyYWdTaGFkZXJEYXRhLCBnbC5GUkFHTUVOVF9TSEFERVIpXG4gICAgICBjcmVhdGVQcm9ncmFtKGdsLCBuYW1lLCB2eFNoYWRlciwgZnJhZ1NoYWRlcilcbiAgICB9LCAndGV4dCcpO1xuICB9LCAndGV4dCcpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTaGFkZXIoc2hhZGVybmFtZSkge1xuICBvcGVuRmlsZShzaGFkZXJuYW1lLCAnc2hhZGVycy8nICsgc2hhZGVybmFtZSlcbn1cblxuZnVuY3Rpb24gdXNlU2hhZGVyKHNoYWRlcm5hbWUpIHtcbiAgd2luZG93LnByb2dyYW0gPSBzaGFkZXJzW3NoYWRlcm5hbWVdXG4gIGdsLnVzZVByb2dyYW0od2luZG93LnByb2dyYW0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY29tcGlsZVNoYWRlcixcbiAgY3JlYXRlU2hhZGVyLFxuICB1c2VTaGFkZXIsXG59XG4iLCJmdW5jdGlvbiBkb3QoW3gsIHksIHpdLCBbcCwgcSwgcl0pIHtcbiAgcmV0dXJuIHgqcCArIHkqcSArIHoqclxufVxuXG5mdW5jdGlvbiBjcm9zcyhbdXgsIHV5LCB1el0sIFt2eCwgdnksIHZ6XSkge1xuICB2YXIgeCA9IHV5KnZ6IC0gdXoqdnk7XG4gIHZhciB5ID0gdXoqdnggLSB1eCp2ejtcbiAgdmFyIHogPSB1eCp2eSAtIHV5KnZ4O1xuICByZXR1cm4gW3gsIHksIHpdO1xufVxuXG5mdW5jdGlvbiBhZGQoW3gsIHksIHpdLCBbcCwgcSwgcl0pIHtcbiAgcmV0dXJuIFt4ICsgcCwgeSArIHEsIHogKyByXVxufVxuXG5mdW5jdGlvbiBzdWJ0cmFjdChbeCwgeSwgel0sIFtwLCBxLCByXSkge1xuICByZXR1cm4gW3ggLSBwLCB5IC0gcSwgeiAtIHJdXG59XG5cbmZ1bmN0aW9uIGFicyhbeCwgeSwgel0pIHtcbiAgcmV0dXJuIE1hdGguc3FydCh4KnggKyB5KnkgKyB6KnopXG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZShbeCwgeSwgel0pIHtcbiAgdmFyIHQgPSBhYnMoW3gsIHksIHpdKVxuICByZXR1cm4gW3gvdCwgeS90LCB6L3RdXG59XG5cbmZ1bmN0aW9uIG11bHRpcGx5U2NhbGFyKFt4LCB5LCB6XSwgYykge1xuICByZXR1cm4gW3gqYywgeSpjLCB6KmNdXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBkb3QsXG4gIGNyb3NzLFxuICBhZGQsXG4gIHN1YnRyYWN0LFxuICBhYnMsXG4gIG5vcm1hbGl6ZSxcbiAgbXVsdGlwbHlTY2FsYXIsXG59XG4iXX0=
