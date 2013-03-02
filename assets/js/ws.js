// the websocket handler
socket = io.connect();

// TODO: UPDATE NEW USER ON CURRENT STATE

socket.on('client_count', function(data){
  console.log(data.count);
});

socket.on('draw', function(data){
  
  console.log(data);
});