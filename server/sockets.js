// # Socket Connection Handler

// ##### [Back to Table of Contents](./tableofcontents.html)

// Import board model from [board.js](../documentation/board.html)
var Board = require('../db/board');

// **boardUrl:** *String* <br>
// **board:** *Mongoose board model* <br>
// **io:** *Export of our Socket.io connection from [server.js](../documentation/server.html)*
var connect = function(boardUrl, board, io) {
  // Set the Socket.io namespace to the boardUrl.
  var whiteboard = io.of(boardUrl);

  whiteboard.once('connection', function(socket) {
    // Send the current state of the board to the client immediately on joining.
    socket.emit('join', board);

    socket.on('start', function(pen) {

      // **A stroke is essentially a continous line drawn by the user.**
      socket.stroke = {
        pen: pen,
        path: []
      };
    });

    socket.on('rewind', function(value) {

      //Get the board that the socket is connected to.

      var id = socket.nsp.name.slice(1);

      //find the current board

      Board.boardModel.findOne({id: id}, function(err, board) {
        if (err) {console.error(err);}
        //send rewind intent and board back to all users in room
        whiteboard.emit('rewind', board, value);
      });
    })

    socket.on('clear', function() {
      //Get the board that the socket is connected to.
      var id = socket.nsp.name.slice(1);
      //remove all data associated with board from DB
      Board.boardModel.remove({id:id}, function(err, data) {
        // Tell all associated boards to clear themselves
        whiteboard.emit('clearDone', null);
      })
    })

    socket.on('drag', function(coords) {
      //Push coordinates into the stroke's drawing path.
      socket.stroke.path.push(coords);
      // This payload will be sent back to all sockets *except the socket
      // that initiated the draw event.*
      var payload = {
        pen: socket.stroke.pen,
        coords: coords
      };

      //Broadcast new line coords to everyone but the person who drew it.
      socket.broadcast.emit('drag', payload);
    });

    socket.on('type', function(textBoxInfo) {
      //Get the board that the socket is connected to.
      var id = socket.nsp.name.slice(1);


      //Update the board with the new textbox info.

      Board.boardModel.update({id: id},{$push: {strokes: textBoxInfo} },{upsert:true},function(err, board){
        if(err){ console.log(err); }
        else {
          console.log("Successfully added");
        }
      });

      // Emit end event to everyone but the person who stopped typing.

      socket.broadcast.emit('endText', textBoxInfo);
      delete socket.stroke;
    })

    socket.on('endText', function(textBoxInfo) {
      //Get the board that the socket is connected to.
      var id = socket.nsp.name.slice(1);

      //Update the board with the new textbox info.

      Board.boardModel.update({id: id},{$push: {strokes: textBoxInfo} },{upsert:true},function(err, board){
        if(err){ console.log(err); }
        else {
          console.log("Successfully added");
        }
      });

      // Emit end event to everyone but the person who stopped typing.

      socket.broadcast.emit('endText', textBoxInfo);
      delete socket.stroke;

    })

    // undo
    socket.on('undo', function() {
      //Get the board that the socket is connected to.
      var id = socket.nsp.name.slice(1);

       Board.boardModel.update({id: id},{$pop: {strokes: 1} },function(err, board){
          if(err){ console.log(err); }
          else {
            Board.boardModel.findOne({id: id}, function(err, board) {
            // send undo event to all boards
            //TODO add error handling
              whiteboard.emit('undo', board);
              console.log("Successfully performed undo");
            })

          }
        });


    });

    socket.on('refresh', function() {
      var id = socket.nsp.name.slice(1);

      Board.boardModel.findOne({id: id}, function(err, board) {
        if (err) {console.error(err);}
        //send rewind intent and board back to all users in room
        whiteboard.emit('refresh', board);
      });

    });

    //When stroke is finished, add it to our db.
    socket.on('end', function(data) {
      //Get the board that the socket is connected to.
      var id = socket.nsp.name.slice(1);

        var finishedStroke = socket.stroke;
        // check for null data (TODO: make sure this check doesn't cause any other bugs)
        if (finishedStroke) {
          //Update the board with the new stroke.
          Board.boardModel.update({id: id},{$push: {strokes: finishedStroke} },{upsert:true},function(err, board){
            if(err){ console.log(err); }
            else {
              console.log("Successfully added");
            }
          });


        // Emit end event to everyone but the person who stopped drawing.
        socket.broadcast.emit('end', null);

        //Delete the stroke object to make room for the next stroke.
        delete socket.stroke;

        }
    });
  });
};

// Required by [server.js](../documentation/server.html)
module.exports = connect;
