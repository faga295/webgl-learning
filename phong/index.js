var canvas = document.querySelector("#c");
var gl = canvas.getContext("webgl");
let pre;
let current;
let raf;
canvas.addEventListener("pointerdown", (e) => {
  pre = [e.x, e.y];
});
canvas.addEventListener("pointermove", (e) => {
  current = [e.x, e.y];
  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    if (pre) {
      drawScene(current[0] - pre[0], current[1] - pre[1]);
      pre = current;
    }
    cancelAnimationFrame(raf);
  });
});
canvas.addEventListener("pointerup", () => {
  pre = undefined;
});

webglUtils.resizeCanvasToDisplaySize(gl.canvas);

// const data = [...getGeometry([-30, 0, 0]),...getGeometry(), ...getGeometry([30, 0, 0], ...getGeometry([0, 0, -30]))]
const [data, normalData] = getGeometry();
var programInfo = webglUtils.createProgramInfo(gl, [
  "vertex-shader-3d",
  "fragment-shader-3d",
]);

const arrays = {
  position: { numComponents: 3, data },
  normal: { numComponents: 3, data: normalData },
};

const uniforms = {
  u_matrix: m4.identity(),
  u_lightDirection: m4.normalize([0.5, 0.7, 1]),
};
var program = webglUtils.createProgramFromScripts(gl, [
  "vertex-shader-3d",
  "fragment-shader-3d",
]);

const sphereBufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);
var uniformSetters = webglUtils.createUniformSetters(gl, program);
var attribSetters = webglUtils.createAttributeSetters(gl, program);

function getGeometry(offset = [0, 0, 0]) {
  const count = 30;
  let i = 0;
  const r = 50;
  const data = [];
  const normalData = [];
  function pushPoint(i, j) {
    let sin2 = Math.sin((2 * Math.PI * j) / count);
    let cos2 = Math.cos((2 * Math.PI * j) / count);
    let sin1 = Math.sin((2 * Math.PI * i) / count);
    let cos1 = Math.cos((2 * Math.PI * i) / count);
    normalData.push(cos1 * cos2);
    normalData.push(cos1 * sin2);
    normalData.push(sin1);
    data.push(r * cos1 * cos2 + offset[0]);
    data.push(r * cos1 * sin2 + offset[1]);
    data.push(r * sin1 + offset[2]);
  }
  while (i < count) {
    let j = 0;
    while (j < count) {
      pushPoint(i, j);
      pushPoint(i, j + 1);
      pushPoint(i + 1, j);
      pushPoint(i, j + 1);
      pushPoint(i + 1, j + 1);
      pushPoint(i + 1, j);
      j++;
    }
    i++;
  }
  return [data, normalData];
}
function degToRad(d) {
  return (d * Math.PI) / 180;
}
var then = 0;
var fieldOfViewRadians = degToRad(60);
var modelXRotationRadians = degToRad(0);
var modelYRotationRadians = degToRad(0);
requestAnimationFrame(drawScene);
function drawScene(distanceX = 0, distanceY = 0) {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  modelXRotationRadians += (2 * Math.PI * distanceY) / gl.canvas.clientHeight;
  modelYRotationRadians += (2 * Math.PI * distanceX) / gl.canvas.clientWidth;
  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // Clear the canvas AND the depth buffer.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);
  webglUtils.setBuffersAndAttributes(gl, attribSetters, sphereBufferInfo);
  // 定义裁剪空间
  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

  var cameraPosition = [0, 100, 200];
  var up = [0, 1, 0];
  var target = [0, 0, 0];

  // Compute the camera's matrix using look at.
  var cameraMatrix = m4.lookAt(cameraPosition, target, up);

  // 相机作为原点
  var viewMatrix = m4.inverse(cameraMatrix);

  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  var matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
  matrix = m4.yRotate(matrix, modelYRotationRadians);
  uniforms.u_matrix = matrix;
  webglUtils.setUniforms(uniformSetters, uniforms);

  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  gl.drawArrays(primitiveType, offset, sphereBufferInfo.numElements);
}
