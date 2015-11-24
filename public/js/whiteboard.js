// # Whiteboard Angular Components

// ##### [Back to Table of Contents](./tableofcontents.html)

// Initialize the whiteboard module.

angular.module('whiteboard', ['ui.router'])
  .config(function($stateProvider) {
    $stateProvider
      .state('eraser', {
        controller: 'toolbar'
      });
  })
  // Set App to the root scope.
  .controller('canvas', function($rootScope, $scope, tools) {
    $rootScope.app = App;
  })

// Set toolbar for colour palette and eraser.
.controller('toolbar', function($scope, $element, tools) {
  $scope.changePen = function(option) {
    tools.changePen(option);
    console.log("The user chose the tool", $element);
    $('input').not($('#' + option)).attr('checked', false);
  };
  $scope.clearBoard = function() {
    if (confirm('Are you sure you want to delete all data from current board?')) {
      App.socket.emit('clear');
    }
  };
  $scope.undo = function() {
    App.socket.emit('undo');
  };
})

// Set changePen method.
// Note that an eraser is simply a white pen, not actually erasing [x,y] tuples from the database.
.service('tools', function($rootScope) {
  // check if phonecontroller already instantiated - if so, then don't allow user
  // to create new phone controller (DOUBLE CHECK)

  var changePen = function(option) {
    if (option === 'eraser') {
      console.log("The user is using the eraser.");
      $rootScope.app.pen.lineWidth = 50;
      $rootScope.app.pen.strokeStyle = '#fff';
    } else if (option === 'mobileController') {
      console.log("THe user is using the mobile controller");
      $('.board-frame').append('<div id="editBox"></div>');
      var editBox = $('#editBox').draggable();
      // olive color communicates that the text box 'pen' has been selected, refactor later to be more clear when working on CSS
    } else if (option === 'olive') {
      console.log("The user is using text.");
      $rootScope.app.pen.lineWidth = 5;
      $rootScope.app.pen.strokeStyle = 'olive';
    } else {
      console.log("The user is using the pen.");
      $rootScope.app.pen.lineWidth = 5;
      $rootScope.app.pen.strokeStyle = option;
    }
  };
  return {
    changePen: changePen
  };

});
