init();

function init () {
  canvas = document.getElementById("imageView");
  context = canvas.getContext('2d');
}

// The mousemove event handler.
var started = false;

function ev_mousemove (x,y) {
  if (!started) {
    context.beginPath();
    context.moveTo(x, y);
    started = true;
  } else {
    context.lineTo(x, y);
    context.stroke();
  }
}