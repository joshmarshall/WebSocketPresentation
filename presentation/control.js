(function() {


  var open = function() {
    var socket = new WebSocket("ws://localhost:8080/websocket");
    socket.onopen = function() {
      console.log("CONNECTED!");
    };

    socket.onmessage = function(data) {
      data = JSON.parse(data.data);
      switch (data.type) {
        case "next":
          Reveal.next();
          break;
        case "previous":
          Reveal.prev();
          break;
        default:
          console.log("UNKNOWN TYPE: " + data.type);
          break;
      }
    };

    socket.onclose = function() {
      console.log("CLOSED!");
      setTimeout(open, 5000);
    };
  };

  open();

})();
