// the websocket handler
socket = io.connect();

// TODO: UPDATE NEW USER ON CURRENT STATE

socket.on('client_count', function(data){
  var c = data.count;
  console.log(c);
  $('#user-count').text(c + " user"+(c>1?"s":"")+" online.");
});

socket.on('draw', function(data){
  if (video_started){
    draw_line(data.start[0], data.start[1], data.end[0], data.end[1], data.color, octx);
  }
});

