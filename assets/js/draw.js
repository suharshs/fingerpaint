// Global variable declarations
var video,
  canvas, drawing,
  ctx, dctx,
  width = window.innerHeight * 4/3, height = window.innerHeight,
  width,height,
  width,height,
  width_ratio, height_ratio,
  brush_color, color_button,
  video_started = false;


function init_brush_color(){
  brush_color = [100,150,100];
}

function init_canvi(){
  // cache variables
  canvas = document.getElementById('canvasVideo');
  drawing = document.getElementById('canvasDrawing');
  others = document.getElementById('othersCanvas');
  crosshair = document.getElementById('crosshair');
  crosshair.width = width;
  crosshair.height = height;
  drawing.width = width;
  drawing.height = height;
  canvas.width = width;
  canvas.height = height;
  others.width = width;
  others.height = height;
  ctx = canvas.getContext('2d');
  dctx = drawing.getContext('2d');
  octx = others.getContext('2d');
  chctx = crosshair.getContext('2d');
  width = canvas.width;
  height = canvas.height;
  width = drawing.width;
  height = drawing.height;
  width_ratio = width / width;
  height_ratio = height / height;
  ctx.translate(width, 0);
  ctx.scale(-1, 1);

  draw_line(width/2,height/2-27,width/2,height/2+27,"rgb(255,255,255)",chctx);
  draw_line(width/2-27,height/2,width/2+27,height/2,"rgb(255,255,255)",chctx);
  draw_circle(width/2,height/2,chctx,"rgb(255,255,255)", 20);
  $("#crosshair").hide();


  $(window).on("keydown",function(e){
    $(".textdiv").fadeOut(1000);
    $(window).off("keydown");
    start_video();
  });
}

function start_video(){
  navigator.getMedia = ( navigator.getUserMedia ||
                    navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);
  navigator.getMedia({video: true, audio: true}, function(localMediaStream) {
    var video = document.querySelector('video');
    video.src = window.URL.createObjectURL(localMediaStream);
    video.onloadedmetadata = function(e) {};
    $(window).on("keydown",function(e){
        $("#crosshair").fadeIn(1000);
        $(window).off("keydown");
    });
    $(window).on("keyup", function(e){
        change_color();
        $("#crosshair").fadeOut(1000);
      $(window).on("keydown",function(e){
          $("#crosshair").fadeIn(1000);
        $(window).off("keydown");
      });
    });
    start_process_loop();
  }, function(err){
    console.log(err);
    $('body').append("Couldn't connect to webcam");
  });

  video = document.getElementById('video');
}


function change_color(){
  var r = 0,
      g = 0,
      b = 0;
  var data = ctx.getImageData(0, 0, width, height).data;
  for (var x = Math.floor(width/2) - 5; x < Math.floor(width/2) + 5; x++){
    for (var y = Math.floor(height/2) - 5; y < Math.floor(height/2) + 5; y++){
      coord = scale_coord([x,y]);
      var i = 4 * xy_to_index(x,y);
      console.log(i);
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
  }
  brush_color = [Math.floor(r/100),Math.floor(g/100),Math.floor(b/100)]; // will refactor this later
  started = false; // signal that a new color is not being used
}

function start_process_loop(){
  video_started = true;

  var offset = 3;
  window.setInterval(function() {
    ctx.drawImage(video, 0, 0, width, height);

    var data = ctx.getImageData(0, 0, width, height).data;

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
  return (x >= 0 && x < width && y >= 0 && y < height);
}

function xy_to_index(x,y){
  return y*width + x;
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
var prev_point;

function draw (x,y,context,color) {
  var coord = scale_coord([x,y]);
  x = coord[0];
  y = coord[1];
  socket.emit('draw', {start: prev_point, end: [x + 0.5, y +0.5], color: color});
  prev_point = [x + 0.5, y +0.5];
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

// this function will process the data recieved from another user
function draw_line(sx,sy,ex,ey,color,context){
  var startcoord = scale_coord([sx,sy]);
  var endcoord = scale_coord([ex,ey]);
  context.strokeStyle = color;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(startcoord[0] + 0.5, startcoord[1] + 0.5);
  context.lineTo(endcoord[0] + 0.5, endcoord[1] + 0.5);
  context.stroke();
}

// finally start the application
init_brush_color();
init_canvi();


