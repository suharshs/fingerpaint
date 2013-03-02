host = '#{ host }'
socket = io.connect host
test = 5

# TODO: UPDATE NEW USER ON CURRENT STATE

socket.on 'client_count', (data) ->
  console.log data.count

socket.on 'draw', (data) ->
  console.log data