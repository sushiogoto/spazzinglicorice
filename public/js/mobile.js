  // wrapper for our MobileViewport "classes", "methods" and "objects"
  window.MobileViewport = {};

  // wrapper for "class" Rectangle
  (function(){
    function Rectangle(left, top, width, height){
      this.left = left || 0;
      this.top = top || 0;
            this.width = width || 0;
      this.height = height || 0;
      this.right = this.left + this.width;
      this.bottom = this.top + this.height;
    }

    Rectangle.prototype.set = function(left, top, /*optional*/width, /*optional*/height){
      this.left = left;
            this.top = top;
            this.width = width || this.width;
            this.height = height || this.height;
            this.right = (this.left + this.width);
            this.bottom = (this.top + this.height);
    };

    Rectangle.prototype.within = function(r) {
      return (r.left <= this.left &&
          r.right >= this.right &&
          r.top <= this.top &&
          r.bottom >= this.bottom);
    };

    Rectangle.prototype.overlaps = function(r) {
      return (this.left < r.right &&
          r.left < this.right &&
          this.top < r.bottom &&
          r.top < this.bottom);
    };

    // add "class" Rectangle to our MobileViewport object
    MobileViewport.Rectangle = Rectangle;
  })();

  // wrapper for "class" Camera (avoid global objects)
  (function(){

    // possibles axis to move the camera
    var AXIS = {
      NONE: "none",
      HORIZONTAL: "horizontal",
      VERTICAL: "vertical",
      BOTH: "both"
    };

    // Camera constructor
    function Camera(xView, yView, canvasWidth, canvasHeight, worldWidth, worldHeight)
    {
      // position of camera (left-top coordinate)
      this.xView = xView || 0;
      this.yView = yView || 0;

      // distance from followed object to border before camera starts move
      this.xDeadZone = 0; // min distance to horizontal borders
      this.yDeadZone = 0; // min distance to vertical borders

      // viewport dimensions
      this.wView = canvasWidth;
      this.hView = canvasHeight;

      // allow camera to move in vertical and horizontal axis
      this.axis = AXIS.BOTH;

      // object that should be followed
      this.followed = null;

      // rectangle that represents the viewport
      this.viewportRect = new MobileViewport.Rectangle(this.xView, this.yView, this.wView, this.hView);

      // rectangle that represents the world's boundary (room's boundary)
      this.worldRect = new MobileViewport.Rectangle(0, 0, worldWidth, worldHeight);

    }

    // MobileViewportObject needs to have "x" and "y" properties (as world(or room) position)
    Camera.prototype.follow = function(MobileViewportObject, xDeadZone, yDeadZone)
    {
      this.followed = MobileViewportObject;
      this.xDeadZone = xDeadZone;
      this.yDeadZone = yDeadZone;
    };

    Camera.prototype.update = function()
    {
      // keep following the player (or other desired object)
      if(this.followed !== null)
      {
        if(this.axis == AXIS.HORIZONTAL || this.axis == AXIS.BOTH)
        {
          // moves camera on horizontal axis based on followed object position
          if(this.followed.x - this.xView  + this.xDeadZone > this.wView)
            this.xView = this.followed.x - (this.wView - this.xDeadZone);
          else if(this.followed.x  - this.xDeadZone < this.xView)
            this.xView = this.followed.x  - this.xDeadZone;

        }
        if(this.axis == AXIS.VERTICAL || this.axis == AXIS.BOTH)
        {
          // moves camera on vertical axis based on followed object position
          if(this.followed.y - this.yView + this.yDeadZone > this.hView)
            this.yView = this.followed.y - (this.hView - this.yDeadZone);
          else if(this.followed.y - this.yDeadZone < this.yView)
            this.yView = this.followed.y - this.yDeadZone;
        }

      }

      // update viewportRect
      this.viewportRect.set(this.xView, this.yView);

      // don't let camera leaves the world's boundary
      if(!this.viewportRect.within(this.worldRect))
      {
        if(this.viewportRect.left < this.worldRect.left)
          this.xView = this.worldRect.left;
        if(this.viewportRect.top < this.worldRect.top)
          this.yView = this.worldRect.top;
        if(this.viewportRect.right > this.worldRect.right)
          this.xView = this.worldRect.right - this.wView;
        if(this.viewportRect.bottom > this.worldRect.bottom)
          this.yView = this.worldRect.bottom - this.hView;
      }

    };

    // add "class" Camera to our MobileViewport object
    MobileViewport.Camera = Camera;

  })();

  // wrapper for "class" Player
  (function(){
    function Player(x, y){
      // (x, y) = center of object
      // ATTENTION:
      // it represents the player position on the world(room), not the canvas position
      this.x = x;
      this.y = y;

      // move speed in pixels per second
      this.speed = 200;

      // render properties
      this.width = 50;
      this.height = 50;
    }

    Player.prototype.update = function(step, worldWidth, worldHeight){
      // parameter step is the time between frames ( in seconds )

      // check controls and move the player accordingly
      if(MobileViewport.controls.left)
        this.x -= this.speed * step;
      if(MobileViewport.controls.up)
        this.y -= this.speed * step;
      if(MobileViewport.controls.right)
        this.x += this.speed * step;
      if(MobileViewport.controls.down)
        this.y += this.speed * step;

      // don't let player leaves the world's boundary
      if(this.x - this.width/2 < 0){
        this.x = this.width/2;
      }
      if(this.y - this.height/2 < 0){
        this.y = this.height/2;
      }
      if(this.x + this.width/2 > worldWidth){
        this.x = worldWidth - this.width/2;
      }
      if(this.y + this.height/2 > worldHeight){
        this.y = worldHeight - this.height/2;
      }
    };

    Player.prototype.draw = function(context, xView, yView){
      // draw a simple rectangle shape as our player model
      context.save();
      context.fillStyle = "black";
      // before draw we need to convert player world's position to canvas position
      context.fillRect((this.x-this.width/2) - xView, (this.y-this.height/2) - yView, this.width, this.height);
      context.restore();
    };

    // add "class" Player to our MobileViewport object
    MobileViewport.Player = Player;

  })();

  // wrapper for "class" Map
  (function(){
    function Map(width, height){
      // map dimensions
      this.width = width;
      this.height = height;

      // map texture
      this.image = null;
    }

    // generate an example of a large map
    Map.prototype.generate = function(){
      var ctx = document.getElementById("whiteboard").getContext("2d");

      // store the generate map as this image texture
      this.image = new Image();
      this.image.src = ctx.canvas.toDataURL("image/png");

      // clear context
      ctx = null;
    };

    // draw the map adjusted to camera
    Map.prototype.draw = function(context, xView, yView){
      // easiest way: draw the entire map changing only the destination coordinate in canvas
      // canvas will cull the image by itself (no performance gaps -> in hardware accelerated environments, at least)
      //context.drawImage(this.image, 0, 0, this.image.width, this.image.height, -xView, -yView, this.image.width, this.image.height);

      // didactic way:

      var sx, sy, dx, dy;
      var sWidth, sHeight, dWidth, dHeight;

      // offset point to crop the image
      sx = xView;
      sy = yView;

      // dimensions of cropped image
      sWidth =  context.canvas.width;
      sHeight = context.canvas.height;

      // if cropped image is smaller than canvas we need to change the source dimensions
      if(this.image.width - sx < sWidth){
        sWidth = this.image.width - sx;
      }
      if(this.image.height - sy < sHeight){
        sHeight = this.image.height - sy;
      }

      // location on canvas to draw the croped image
      dx = 0;
      dy = 0;
      // match destination with source to not scale the image
      dWidth = sWidth;
      dHeight = sHeight;

      context.drawImage(this.image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    };

    // add "class" Map to our MobileViewport object
    MobileViewport.Map = Map;

  })();

  // MobileViewport Script
  (function(){
    // prepaire our MobileViewport canvas
    var canvas = document.getElementById("whiteboard");
    var context = canvas.getContext("2d");

    // MobileViewport settings:
    var FPS = 30;
    var INTERVAL = 1000/FPS; // milliseconds
    var STEP = INTERVAL/1000; // seconds

    // setup an object that represents the room
    var room = {
      width: 5000,
      height: 3000,
      map: new MobileViewport.Map(5000, 3000)
    };

    // generate a large image texture for the room
    room.map.generate();

    // setup player
    var player = new MobileViewport.Player(50, 50);

    // setup the magic camera !!!
    var camera = new MobileViewport.Camera(0, 0, canvas.width, canvas.height, room.width, room.height);
    camera.follow(player, canvas.width/2, canvas.height/2);

    // MobileViewport update function
    var update = function(){
      player.update(STEP, room.width, room.height);
      camera.update();
    };

    // MobileViewport draw function
    var draw = function(){
      // clear the entire canvas

      // redraw all objects
      room.map.draw(context, camera.xView, camera.yView);
      player.draw(context, camera.xView, camera.yView);
      // App.draw();
    };

    // MobileViewport Loop
    var MobileViewportLoop = function(){
      context.clearRect(0, 0, canvas.width, canvas.height);
      App.socket.emit('refresh');
      update();
      draw();
      console.log('loopy');
    };

    // <-- configure play/pause capabilities:

    // I'll use setInterval instead of requestAnimationFrame for compatibility reason,
    // but it's easy to change that.

    var runningId = -1;

    MobileViewport.play = function(){
      if(runningId == -1){
        runningId = setInterval(function(){
          MobileViewportLoop();
        }, INTERVAL);
        console.log("play");
      }
    };

    MobileViewport.togglePause = function(){
      if(runningId == -1){
        MobileViewport.play();
      }
      else
      {
        clearInterval(runningId);
        runningId = -1;
        console.log("paused");
      }
    };

    // -->

  })();

  // <-- configure MobileViewport controls:

  MobileViewport.controls = {
    left: false,
    up: false,
    right: false,
    down: false,
  };

  window.addEventListener("keydown", function(e){
    switch(e.keyCode)
    {
      case 37: // left arrow
        MobileViewport.controls.left = true;
        break;
      case 38: // up arrow
        MobileViewport.controls.up = true;
        break;
      case 39: // right arrow
        MobileViewport.controls.right = true;
        break;
      case 40: // down arrow
        MobileViewport.controls.down = true;
        break;
    }
  }, false);

  window.addEventListener("keyup", function(e){
    switch(e.keyCode)
    {
      case 37: // left arrow
        MobileViewport.controls.left = false;
        break;
      case 38: // up arrow
        MobileViewport.controls.up = false;
        break;
      case 39: // right arrow
        MobileViewport.controls.right = false;
        break;
      case 40: // down arrow
        MobileViewport.controls.down = false;
        break;
      case 80: // key P pauses the MobileViewport
        MobileViewport.togglePause();
        break;
    }
  }, false);

  // -->

  // start the MobileViewport when page is loaded
  window.onload = function(){
    MobileViewport.play();
  };