// Global variable declarations
var video,
  canvas, drawing,
  ctx, dctx,
  w,h,
  brush_color;

function init_brush_color(){
  brush_color = [90,30,30];
}

function startVideo(){
  navigator.webkitGetUserMedia({video: true, audio: true}, function(localMediaStream) {
    var video = document.querySelector('video');
    video.src = window.URL.createObjectURL(localMediaStream);
    video.onloadedmetadata = function(e) {};
    startProcessLoop();
    }, function(){console.log("couldn't connect to webcam");});

  // cache variables
  video = document.getElementById('video');
  canvas = document.getElementById('canvasVideo');
  drawing = document.getElementById('canvasDrawing');
  ctx = canvas.getContext('2d');
  dctx = drawing.getContext('2d');
  w = canvas.width;
  h = canvas.height;
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
}

function startProcessLoop(){
  window.setInterval(function() {
    
    ctx.drawImage(video, 0, 0, w, h);

    var data = ctx.getImageData(0, 0, w, h).data;

    var coords = processVideoFrame(data);
    var r = 3, g = 3, b = 3;

    var color = 'rgb(' + r + ', ' + g+ ', ' + b + ')';
    if (coords){
      draw(coords[0],coords[1], dctx, color); // TODO call processed pixels here
    }

  }, 50);
}

function processVideoFrame(data){
  for (var x = 0; x < w; x+=4){
    for (var y = 0; y < h; y+=4){
      var i = 4*xy_to_index(x,y);
      // add average color of blocks here
      if (colorInRange(data[i+0], data[i+1], data[i+2], 60)){
        dctx.arc(x, y, 5, 0 , 2 * Math.PI, false);
        return [x, y];
      }
    }
  }
  return false;
}

function xy_to_index(x,y){
  return y*w + x;
}

function colorInRange(r,g,b,range){
  var brushColorValue = (brush_color[0]-r)*(brush_color[0]-r) + (brush_color[1]-g)*(brush_color[1]-g) + (brush_color[2]-b)*(brush_color[2]-b);
  if (brushColorValue < range){
    return true;
  } else{
    return false;
  }
}

// The mousemove event handler.
var started = false;

function draw (x,y,context,color) {
  if (!started) {
    context.fillStyle = color;
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(x, y);
    started = true;
  } else {
    context.lineTo(x, y);
    context.stroke();
  }
}

// finally start the application
init_brush_color();
startVideo();


