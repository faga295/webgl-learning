var canvas = document.querySelector("#c");

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
var gl = canvas.getContext("webgl");
var program = webglUtils.createProgramFromScripts(gl, [
  "vertex-shader-3d",
  "fragment-shader-3d",
]);

const [data, textureData] = setGeometry();
const arrays = {
  position: { numComponents: 3, data },
  texcoord: { numComponents: 2, data: textureData },
};
var bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);

var uniformSetters = webglUtils.createUniformSetters(gl, program);
var attribSetters = webglUtils.createAttributeSetters(gl, program);

const texture = gl.createTexture();
const uniforms = {
  u_matrix: m4.identity(),
  u_texture: texture,
};

const image = new Image();
image.crossOrigin = "anonymous";
image.src =
  "https://lzc-personal-resource.oss-cn-beijing.aliyuncs.com/202310061658446.png";
image.addEventListener("load", function () {
  // Now that the image has loaded make copy it to the texture.
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  drawScene();
});

// var worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");

function setGeometry() {
  const count = 30;
  let i = 0;
  const r = 50;
  const data = [];
  const textureCoordData = [];
  function pushPoint(i, j) {
    let sin2 = Math.sin((2 * Math.PI * j) / count);
    let cos2 = Math.cos((2 * Math.PI * j) / count);
    let sin1 = Math.sin((2 * Math.PI * i) / count);
    let cos1 = Math.cos((2 * Math.PI * i) / count);
    textureCoordData.push(i / count);
    textureCoordData.push(j / count);
    data.push(r * cos1 * cos2);
    data.push(r * cos1 * sin2);
    data.push(r * sin1);
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
  return [new Float32Array(data), new Float32Array(textureCoordData)];
}
function degToRad(d) {
  return (d * Math.PI) / 180;
}

var fieldOfViewRadians = degToRad(60);
var modelXRotationRadians = degToRad(0);
var modelYRotationRadians = degToRad(0);
requestAnimationFrame(drawScene);
function drawScene(distanceX = 0, distanceY = 0) {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  modelXRotationRadians += (2 * Math.PI * distanceY) / gl.canvas.height;
  modelYRotationRadians += (2 * Math.PI * distanceX) / gl.canvas.width;
  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // Clear the canvas AND the depth buffer.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  webglUtils.setBuffersAndAttributes(gl, attribSetters, bufferInfo);
  // Turn on the position attribute
  // 定义裁剪空间
  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 200);

  var cameraPosition = [0, 0, 200];
  var up = [0, 1, 0];
  var target = [0, 0, 0];

  // Compute the camera's matrix using look at.
  var cameraMatrix = m4.lookAt(cameraPosition, target, up);

  // 相机作为原点
  var viewMatrix = m4.inverse(cameraMatrix);

  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  var matrix = m4.xRotate(viewProjectionMatrix, modelXRotationRadians);
  matrix = m4.yRotate(matrix, modelYRotationRadians);
  // Set the matrix.
  uniforms.u_matrix = matrix;
  webglUtils.setUniforms(uniformSetters, uniforms);

  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 5400;
  gl.drawArrays(primitiveType, offset, bufferInfo.numElements);
}
