express = require 'express'
stylus = require 'stylus'
routes = require './routes'
socketio = require 'socket.io'

app = express.createServer()
io = socketio.listen(app)

app.use express.logger {format: ':method :url :status :response-time ms'}
app.use require("connect-assets")()
app.set 'view engine', 'jade'
app.use express.static(__dirname + '/public')

# Routes
app.get '/', routes.index

num_sockets = 0

# Socket.IO
io.sockets.on 'connection', (socket) ->
  num_sockets++

  # update clients on the new number of users
  io.sockets.emit 'client_count',
    count: num_sockets
  
  # TODO: UPDATE NEW USER ON CURRENT STATE
  
  # update the users with a new draw
  socket.on 'draw', (data) ->
    socket.broadcast.emit 'draw', data

  socket.on 'disconnect', (data) ->
    num_sockets--
    io.sockets.emit 'client_count',
      count: num_sockets



port = process.env.PORT or 8000
app.listen port, -> console.log "Listening on port " + port
