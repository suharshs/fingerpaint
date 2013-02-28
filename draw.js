// Global variable declarations
var video,
  canvas, drawing,
  ctx, dctx,
  ctx_width,ctx_height,
  dctx_width,dctx_height,
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
  ctx = canvas.getContext('2d');
  dctx = drawing.getContext('2d');
  ctx_width = canvas.width;
  ctx_height = canvas.height;
  dctx_width = drawing.width;
  dctx_height = drawing.height;
  ctx.translate(ctx_width, 0);
  ctx.scale(-1, 1);
  //ctx.globalCompositeOperation = 'xor';
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

  window.setInterval(function() {
    
    ctx.drawImage(video, 0, 0, ctx_width, ctx_height);

    var data = ctx.getImageData(0, 0, ctx_width, ctx_height).data;

    //var coords = process_video_frame(data);
    var coords = bfs_process(data);
    //var coords = process_closest_color(data);
    
    if (coords){
      var r = brush_color[0], g = brush_color[1], b = brush_color[2];
      var color = 'rgb(' + r + ', ' + g+ ', ' + b + ')';
      draw(coords[0],coords[1], dctx, color);
    } else{
      started = false; // reset the draw function
    }

  }, 33);
}

function process_video_frame(data){
  for (var x = 0; x < ctx_width; x+=1){
    for (var y = 0; y < ctx_height; y+=1){
      
      // add average color of blocks here
      if (color_in_range(data[i+0], data[i+1], data[i+2], 70)){
        dctx.arc(x, y, 5, 0 , 2 * Math.PI, false);
        return [x, y];
      }
    }
  }
  return false;
}

function process_closest_color(data){
  var best = [0,0];
  for (var x = 0; x < ctx_width; x+=1){
    for (var y = 0; y < ctx_height; y+=1){
      // add average color of blocks here
      if (color_closer([x,y],best,data)){
        best = [x, y];
      }
    }
  }
  var i = 4*xy_to_index(best[0],best[1]);
  if (color_in_range(data[i+0], data[i+1], data[i+2], 70)){
    return best;
  }
  return false;
}

function color_closer(coord, best, data){
  var i = 4*xy_to_index(coord[0],coord[1]);
  var currColorValue = (brush_color[0]-data[i])*(brush_color[0]-data[i]) + (brush_color[1]-data[i+1])*(brush_color[1]-data[i+1]) + (brush_color[2]-data[i+2])*(brush_color[2]-data[i+2]);
  i = 4*xy_to_index(best[0],best[1]);
  var bestColorValue = (brush_color[0]-data[i])*(brush_color[0]-data[i]) + (brush_color[1]-data[i+1])*(brush_color[1]-data[i+1]) + (brush_color[2]-data[i+2])*(brush_color[2]-data[i+2]);
  return (currColorValue < bestColorValue);
}

var prev_coord = [0,0]; // stores the previous coordinate that was found
// we will start the search from the prev_coord
// for some reason this is actually a lot slower
function bfs_process(data){
  var queue = [prev_coord];
  var visited_list = {};
  visited_list[xy_to_index(prev_coord[0], prev_coord[1])] = true;
  while (queue.length > 0){
    var curr = queue.shift();
    var x = curr[0];
    var y = curr[1];
    var i = 4*xy_to_index(x,y);
    if (color_in_range(data[i+0], data[i+1], data[i+2], 500)){
      prev_coord = curr;
      return curr;
    } else {
      if (coord_in_canvas([x-1,y]) && !(xy_to_index(x-1,y) in visited_list)){
        queue.push([x-1,y]);
        visited_list[xy_to_index(x-1,y)] = true;
      }
      if (coord_in_canvas([x+1,y]) && !(xy_to_index(x+1,y) in visited_list)){
        queue.push([x+1,y]);
        visited_list[xy_to_index(x+1,y)] = true;
      }
      if (coord_in_canvas([x,y-1]) && !(xy_to_index(x,y-1) in visited_list)){
        queue.push([x,y-1]);
        visited_list[xy_to_index(x,y-1)] = true;
      }
      if (coord_in_canvas([x,y+1]) && !(xy_to_index(x,y+1) in visited_list)){
        queue.push([x,y+1]);
        visited_list[xy_to_index(x,y+1)] = true;
      }
    }
  }
  return false;
}

// checks whether a coord is in the image
function coord_in_canvas(coord){
  return (coord[0] >= 0 && coord[0] < ctx_width && coord[1] >= 0 && coord[1] < ctx_height);
}

function xy_to_index(x,y){
  return y*ctx_width + x;
}

function scale_coord(coord){
  return [coord[0]*dctx_width/ctx_width, coord[1]*dctx_height/ctx_height];
}

function color_in_range(r,g,b,range){
  var brushColorValue = (brush_color[0]-r)*(brush_color[0]-r) + (brush_color[1]-g)*(brush_color[1]-g) + (brush_color[2]-b)*(brush_color[2]-b);
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


