var shaders = require('./shaders')
var { drawModel, makeModel} = require('./models')
var m = require('./matrix')
var vec = require('./vector')

window.playFlag = 1;
window.grayScale = 0;
window.nightVision = 0;
window.gFlag = 1;
window.nFlag = 1;
// window.gravity = 0.001;
window.velocity = 1;
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
var revolveRadius = outerRadius;
window.revolveAngle = 0;
window.revolveSpeed = 18;

window.octRadius = 5 * scalex;//0.25
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
}

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

window.Matrices = {}
window.models = {}

window.addEventListener('keydown', keyChecker)
window.addEventListener('keyup', keyChecker)

window.keyMap = {}
function keyChecker (key) {
  window.keyMap[key.keyCode] = (key.type == "keydown")
}

function keyImplementation () {
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
  if (window.keyMap[71] && window.gFlag) {
    window.grayScale = !window.grayScale;
    window.gFlag = 0;
    gl.uniform1i(gl.getUniformLocation(program, 'grayScale'), window.grayScale);
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
}

function autoMovement() {

  Camera.x = revolveRadius * Math.cos(toRadians(window.revolveAngle));
  Camera.z = revolveRadius * Math.sin(toRadians(window.revolveAngle));
  
  window.octAngle += Math.round(window.octStepsA - window.octStepsD) * window.deltaTime * window.octSpeed;
  var tempx = window.octRadius * Math.cos(toRadians(window.octAngle)) * Math.cos(toRadians(window.revolveAngle));
  Camera.y = window.octRadius * Math.sin(toRadians(window.octAngle));
  var tempz = window.octRadius * Math.cos(toRadians(window.octAngle)) * Math.sin(toRadians(window.revolveAngle));

  Camera.x += tempx;
  Camera.z += tempz;
  window.octStepsA = 0;
  window.octStepsD = 0;

  var look = vec.normalize(vec.cross(vec.normalize([Camera.x, Camera.y, Camera.z]), [0, 1, 0]));
  Camera.lookx = -look[0];
  Camera.looky = -look[1];
  Camera.lookz = -look[2];
  
  if(window.playFlag == 1) {
    window.revolveAngle -= window.revolveSpeed * window.deltaTime;
  }
  Camera.tempx = tempx;
  Camera.tempz = tempz;
  up[0] = Math.round(-tempx);
  up[1] = Math.round(-Camera.y);
  up[2] = Math.round(-tempz);
  if (window.jumpFlag == 0) {
    var cos = vec.dot(vec.normalize(up), vec.normalize([Camera.x, Camera.y, Camera.z]))
    var jump_angle = Math.round(Math.acos(cos) * (180 / Math.PI));
    if((window.octAngle % 360) <= 180 && window.octAngle >= 0) {
      jump_angle = 180 + 180 - jump_angle;
    } else if (window.octAngle < 0 && (window.octAngle % 360) <= -180) {
      jump_angle = 180 + 180 - jump_angle;
    }

    if (window.velocity > 4) {
      window.velocity = 4;
      window.gravity = -window.gravity;
    } else if (window.velocity < 0) {
      window.velocity = 0;
      window.gravity = 0;
    }
    window.velocity += window.gravity;
  }
}

function resizeCanvas() {
  window.canvas.height = window.innerHeight;
  window.canvas.width = window.innerWidth;
}

function Initialize()
{
  document.getElementById('backaudio').play();
  window.canvas = document.getElementById("canvas");
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  window.gl = canvas.getContext("experimental-webgl");
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
  // setup a GLSL program
  shaders.createShader('material')
  
  // pipe model
  makeModel('pipe', 'assets/pipe',[0, 0, 0],[scalex, scaley, scalez], [0, 0, 0])//rotate dummy value = [0, 0, 0]

  //obstacles model
  for(var i = 0; i < numObstacles; i++) {
    var temp = (Math.random() * 1000 % 360) - 360;
    makeModel('obstacle' + i, 'assets/cubetex', [revolveRadius * Math.cos(toRadians(temp)), 0, revolveRadius * Math.sin(toRadians(temp))],
      [8, 1, 1], //scale
      temp, //rotateAngle1
      Math.random() * 1000 % 360, //rotateAngle2
      0)
  }
  //start the animation
  requestAnimationFrame(tick);
}
window.Initialize = Initialize

window.Camera = Camera

function animate(now) {
  if(window.playFlag) {
    window.score += 1;
  }
  
  if(window.score == 300) {
    window.prevScore = window.score;
    window.level++;
    window.revolveSpeed *= 1.5;
    for(var i = 0; i < numObstacles; i++) {
      var rotationSpeed = Math.random() * (1.5 - 0.5 + 1) + 0.5;
      models["obstacle" + i].rotationSpeed = rotationSpeed;
    }

    for(i = 0; i < numObstacles2; i++) {
      var temp = (Math.random() * 1000 % 360) - 360;
      rotationSpeed = Math.random() * (2.5 - 0.5 + 1) + 0.5;
      makeModel('obstacleBig' + i, 'assets/cubetex', [revolveRadius * Math.cos(toRadians(temp)), 0, revolveRadius * Math.sin(toRadians(temp))],
        [8, 2, 1], //scale
        temp, //rotateAngle1
        Math.random() * 1000 % 360, //rotateAngle2
        rotationSpeed)
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

  if(window.revolveSpeed > 50)
    window.revolveSpeed = 50;

  var score = document.getElementById('score')
  score.innerText = 'SCORE: ' + window.score + '\n\n' + 'LEVEL: ' + window.level;
  now *= 0.001
  // var timeNow = new Date().getTime();
  // if (lastTime == 0) { lastTime = timeNow; return; }
  window.deltaTime = now - then;  
  updateCamera();
  then = now;
}

function drawScene() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.1, 0.1, 0.1, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  shaders.useShader('material')
  
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  for(var i = 0; i < numObstacles; i++) {
    Matrices.model = m.multiply(m.translate(models["obstacle" + i].center),
      m.multiply(m.rotateY(toRadians(-models["obstacle" + i].rotateAngle1)),
        m.multiply(m.rotateZ(toRadians(models["obstacle" + i].rotateAngle2 += models["obstacle" + i].rotationSpeed)),
          m.scale(models["obstacle" + i].scale))));
    drawModel(models["obstacle" + i]);
  }

  if(window.level >= 2) {
    for(i = 0; i < numObstacles2; i++) {
      Matrices.model = m.multiply(m.translate(models["obstacleBig" + i].center),
        m.multiply(m.rotateY(toRadians(-models["obstacleBig" + i].rotateAngle1)),
          m.multiply(m.rotateZ(toRadians(models["obstacleBig" + i].rotateAngle2 += models["obstacleBig" + i].rotationSpeed)),
            // m.multiply(m.translate([0, 4, 0]),m.scale(models["obstacleBig" + i].scale)))));
            m.scale(models["obstacleBig" + i].scale))));
      drawModel(models["obstacleBig" + i]);
    }
  }

  Matrices.model = m.multiply(m.translate(models.pipe.center), m.scale(models.pipe.scale))
  drawModel(models.pipe)

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);

  gl.disable(gl.CULL_FACE);
  gl.disable(gl.BLEND);
}

function updateCamera() {
  var eye = [Camera.x, Camera.y, Camera.z]
  var target = [Camera.x + Camera.lookx, Camera.y + Camera.looky, Camera.z + Camera.lookz]
  Matrices.view = m.lookAt(eye, target, up);
  Matrices.projection = m.perspective(Math.PI/2, canvas.width / canvas.height, 0.1, 500);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "view"), false, Matrices.view);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "projection"), false, Matrices.projection);

  var lightPos = [
    revolveRadius * Math.cos(toRadians(window.revolveAngle - 25)), 0,
    revolveRadius * Math.sin(toRadians(window.revolveAngle - 25))
  ]
  // var lightPos = target
  var lightPosLoc = gl.getUniformLocation(program, "light.position");
  var viewPosLoc     = gl.getUniformLocation(program, "viewPos");
  gl.uniform3f(lightPosLoc, lightPos[0], lightPos[1], lightPos[2]);
  gl.uniform3f(viewPosLoc, target[0], target[1], target[2]);
  var lightColor = [];
  lightColor[0] = 1;
  lightColor[1] = 1;
  lightColor[2] = 1;
  var diffuseColor = vec.multiplyScalar(lightColor, 1); // Decrease the influence
  var ambientColor = vec.multiplyScalar(diffuseColor, 1); // Low influence
  gl.uniform3f(gl.getUniformLocation(program, "light.ambient"),  ambientColor[0], ambientColor[1], ambientColor[2]);
  gl.uniform3f(gl.getUniformLocation(program, "light.diffuse"),  diffuseColor[0], diffuseColor[1], diffuseColor[2]);
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

function detectCollisions () {
  var angle = 0;
  var i = 0;
  for(i = 0; i < numObstacles; i++) {
    // console.log(i);
    angle = Math.atan(models["obstacle" + i].scale[1] / models["obstacle" + i].scale[0]) * 180 / Math.PI;
    if((window.octAngle % 180 >= (models["obstacle" + i].rotateAngle2 % 180 - angle) &&
    window.octAngle % 180 <= (models["obstacle" + i].rotateAngle2 % 180 + angle)) &&
    ((window.revolveAngle % 360 <= models["obstacle" + i].rotateAngle1 + 4) && window.revolveAngle % 360 >= models["obstacle" + i].rotateAngle1 - 4)
    ) {
      window.playFlag = 0;
      document.getElementById('gameOverContainer').style.visibility = "visible";
      document.getElementById('scoreContainer').style.visibility = "hidden";
      document.getElementById('gameOver').innerText = "GAME OVER \n\n SCORE: " + window.score + "\n\n" + "LEVEL: " + window.level;
      console.log("yes" + i);

    }
  }
  if(window.level >= 2) {
    for(i = 0; i < numObstacles2; i++) {
      // console.log("obstacle.y" + i, models["obstacleBig" + i].center[1] - 4);
      // console.log("dist", Math.abs(models["obstacleBig" + i].center[1] - Camera.y));

      angle = Math.atan(models["obstacleBig" + i].scale[1] / models["obstacleBig" + i].scale[0]) * 180 / Math.PI;
      if((window.octAngle % 180 >= (models["obstacleBig" + i].rotateAngle2 % 180 - angle) &&
    window.octAngle % 180 <= (models["obstacleBig" + i].rotateAngle2 % 180 + angle)) &&
    ((window.revolveAngle % 360 <= models["obstacleBig" + i].rotateAngle1 + 4) && window.revolveAngle % 360 >= models["obstacleBig" + i].rotateAngle1 - 4)
    // (Math.abs(models["obstacleBig" + i].center[1] - 4 - Camera.y) <= 5)
      ) {
        window.playFlag = 0;
        document.getElementById('gameOverContainer').style.visibility = "visible";
        document.getElementById('scoreContainer').style.visibility = "hidden";
        document.getElementById('gameOver').innerText = "GAME OVER \n\n SCORE: " + window.score + "\n\n" + "LEVEL: " + window.level;
      }
    }
  }
}
