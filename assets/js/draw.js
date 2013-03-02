// Global variable declarations
var video,
  canvas, drawing,
  ctx, dctx,
  width = 800, height = 600,
  ctx_width,ctx_height,
  dctx_width,dctx_height,
  width_ratio, height_ratio,
  brush_color, color_button;


function init_brush_color(){
  brush_color = [100,150,100];
}

function start_video(){
  navigator.webkitGetUserMedia({video: true, audio: true}, function(localMediaStream) {
    var video = document.querySelector('video');
    video.src = window.URL.createObjectURL(localMediaStream);
    video.onloadedmetadata = function(e) {};
    start_process_loop();
    }, function(){console.log("couldn't connect to webcam");});

  // cache variables
  video = document.getElementById('video');
  canvas = document.getElementById('canvasVideo');
  drawing = document.getElementById('canvasDrawing');
  color_button = document.getElementById('change-color-btn');
  drawing.width = width;
  drawing.height = height;
  canvas.width = width;
  canvas.height = height;
  ctx = canvas.getContext('2d');
  dctx = drawing.getContext('2d');
  ctx_width = canvas.width;
  ctx_height = canvas.height;
  dctx_width = drawing.width;
  dctx_height = drawing.height;
  width_ratio = dctx_width / ctx_width;
  height_ratio = dctx_height / ctx_height;
  ctx.translate(ctx_width, 0);
  ctx.scale(-1, 1);
}

function set_up_color_grabber(){
  // first set up the circle where we will sense the color
  var color = "rbg(" + 0 + "," + 0 + "," + 0 + ")";
  draw_circle(dctx_width - 30, dctx_height - 30,dctx,color,10);
  color_button.onclick = change_color;
}

function change_color(){
  var r = 0,
      g = 0,
      b = 0;
  var data = ctx.getImageData(0, 0, ctx_width, ctx_height).data;
  for (var x = dctx_width - 35; x < dctx_width - 25; x++){
    for (var y = dctx_height - 35; y < dctx_height - 25; y++){
      coord = scale_coord([x,y]);
      var i = 4 * xy_to_index(x,y);
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
  }
  brush_color = [Math.floor(r/100),Math.floor(g/100),Math.floor(b/100)]; // will refactor this later
  started = false; // signal that a new color is not being used
}

function start_process_loop(){
  set_up_color_grabber();

  var offset = 3;
  window.setInterval(function() {
    ctx.drawImage(video, 0, 0, ctx_width, ctx_height);

    var data = ctx.getImageData(0, 0, ctx_width, ctx_height).data;

    var coords = bfs_process(data,offset);

    if (coords){
      offset = 3;
      var r = brush_color[0], g = brush_color[1], b = brush_color[2];
      var color = 'rgb(' + r + ', ' + g+ ', ' + b + ')';
      draw(coords[0],coords[1], dctx, color);
    } else{
      offset = 5;
      started = false; // reset the draw function
    }

  }, 100);
}

var prev_coord = [0,0]; // stores the previous coordinate that was found
// we will start the search from the prev_coord
// for some reason this is actually a lot slower
function bfs_process(data, offset){
  var queue = [prev_coord];
  var visited_list = {};
  visited_list[xy_to_index(prev_coord[0], prev_coord[1])] = true;
  while (queue.length > 0){
    var curr = queue.shift();
    var x = curr[0];
    var y = curr[1];
    var i = 4*xy_to_index(x,y);
    var in_range = color_in_range(data[i+0], data[i+1], data[i+2], 2000);
    if (in_range){
      prev_coord = curr;
      return curr;
    } else {
      bfs_add_neighbor(x-offset, y, queue, visited_list);
      bfs_add_neighbor(x+offset, y, queue, visited_list);
      bfs_add_neighbor(x, y-offset, queue, visited_list);
      bfs_add_neighbor(x, y+offset, queue, visited_list);
    }
  }
  return false;
}

// Add coord at x,y if not visited yet
function bfs_add_neighbor(x, y, queue, visited_list) {
  var lis = [x, y];
  if (!coord_in_canvas(lis))
    return;
  var index = xy_to_index(x,y);
  if ((index in visited_list))
    return;
  queue.push(lis);
  visited_list[index] = true;
}


// checks whether a coord is in the image
function coord_in_canvas(coord){
  var x = coord[0],
    y = coord[1];
  return (x >= 0 && x < ctx_width && y >= 0 && y < ctx_height);
}

function xy_to_index(x,y){
  return y*ctx_width + x;
}

function scale_coord(coord){
  return [coord[0]*width_ratio, coord[1]*height_ratio];
}

function color_in_range(r,g,b,range){
  var rd = brush_color[0] - r;
  var gd = brush_color[1] - g;
  var bd = brush_color[2] - b;
  var brushColorValue = rd*rd + gd*gd + bd*bd;
  return (brushColorValue < range);
}

// The mousemove event handler.
var started = false;

function draw (x,y,context,color) {
  var coord = scale_coord([x,y]);
  x = coord[0];
  y = coord[1];
  if (!started) {
    context.fillStyle = color;
    context.lineWidth = 5;
    context.lineCap = 'round';
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(x + 0.5, y + 0.5);
    started = true;
  } else {
    context.lineTo(x + 0.5, y + 0.5);
    context.stroke();
  }
}

function draw_circle(x,y,context,color, rad){
  context.strokeStyle = color;
  context.beginPath();
  context.arc(x, y, rad, 0 , 2 * Math.PI, false);
  context.stroke();
}

// finally start the application
init_brush_color();
start_video();


