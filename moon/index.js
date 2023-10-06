    var canvas = document.querySelector("#c");

    canvas.addEventListener('click', () => {
        console.log('click');
    })
    var gl = canvas.getContext("webgl");
    // 创建着色器方法，输入参数：渲染上下文，着色器类型，数据源
    function createShader(gl, type, source) {
        var shader = gl.createShader(type); // 创建着色器对象
        gl.shaderSource(shader, source); // 提供数据源
        gl.compileShader(shader); // 编译 -> 生成着色器
        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
            return shader;
        }
        
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }

    
    var vertexShaderSource = document.querySelector("#vertex-shader-3d").text;
    var fragmentShaderSource = document.querySelector("#fragment-shader-3d").text;
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    function createProgram(gl, vertexShader, fragmentShader) {
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        var success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
            return program;
        }
        
        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }
    var program = createProgram(gl, vertexShader, fragmentShader);
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");
    var textureLocation = gl.getUniformLocation(program, "u_texture");
    var matrixLocation = gl.getUniformLocation(program, "u_matrix");
    var positionBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Put the positions in the buffer
    const [data, textureData] = setGeometry()
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

    // provide texture coordinates for the rectangle.
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    // Set Texcoords.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureData), gl.STATIC_DRAW);

    // Create a texture.
    var texture = gl.createTexture();
    // gl.bindTexture(gl.TEXTURE_2D, texture);
    // // Fill the texture with a 1x1 blue pixel.
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    //                 new Uint8Array([0, 0, 255, 255]));
    // Asynchronously load an image
    const image = new Image()
    image.crossOrigin = "anonymous";
    image.src = "https://lzc-personal-resource.oss-cn-beijing.aliyuncs.com/202310061658446.png"
    image.addEventListener('load', function() {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    });

    // var worldViewProjectionLocation = gl.getUniformLocation(program, "u_worldViewProjection");

    function setGeometry(){
        const count = 30;
        let i = 0;
        const r = 50;
        const data = []
        const textureCoordData = []
        function pushPoint(i, j){
            let sin2 = Math.sin(2 * Math.PI * j/count)
            let cos2 = Math.cos(2 * Math.PI * j/count)
            let sin1 = Math.sin(2 * Math.PI * i / count)
            let cos1 = Math.cos(2 * Math.PI * i / count)
            textureCoordData.push(i / count)
            textureCoordData.push(j / count)
            data.push(r * cos1 * cos2)
            data.push(r * cos1 * sin2)
            data.push(r * sin1)
        
        }
        while(i < count){
            let j = 0;
            while(j < count){
                
                pushPoint(i, j)
                pushPoint(i, j + 1)
                pushPoint(i + 1, j)
                pushPoint(i, j + 1) 
                pushPoint(i + 1, j + 1)
                pushPoint(i + 1, j)
                j++;
            }
            i++;
        }
        return [data, textureCoordData]
    }
    function degToRad(d) {
        return d * Math.PI / 180;
    }
    var then = 0;
    var fieldOfViewRadians = degToRad(60);
    var modelXRotationRadians = degToRad(0);
    var modelYRotationRadians = degToRad(0);
    requestAnimationFrame(drawScene)
    function drawScene(now){
        now *= 0.001;
        // Subtract the previous time from the current time
        var deltaTime = now - then;
        // Remember the current time for the next frame.
        then = now;
        webglUtils.resizeCanvasToDisplaySize(gl.canvas);
        modelXRotationRadians += 1.2 * deltaTime;
        modelYRotationRadians += 0.7 * deltaTime;
        // Tell WebGL how to convert from clip space to pixels
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);

        // Clear the canvas AND the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Tell it to use our program (pair of shaders)
        gl.useProgram(program);

        // Turn on the position attribute
        gl.enableVertexAttribArray(positionLocation);

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 3;          // 3 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            positionLocation, size, type, normalize, stride, offset);
        
        gl.enableVertexAttribArray(texcoordLocation);

        // bind the texcoord buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

        // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            texcoordLocation, size, type, normalize, stride, offset);

        // 定义裁剪空间
        var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        var projectionMatrix =
            m4.perspective(fieldOfViewRadians, aspect, 1, 200);

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
        gl.uniformMatrix4fv(matrixLocation, false, matrix);       // var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
        gl.uniform1i(textureLocation, 0);
        
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 5400;
        gl.drawArrays(primitiveType, offset, count);
        requestAnimationFrame(drawScene)
    }
