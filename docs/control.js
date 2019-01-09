(function() {


  var open = function() {
    var host = (window.location.protocol == "file:") ? "localhost" : window.location.hostname;
    console.log("USING HOST: " + host);
    var socket = new WebSocket("ws://" + host + ":8082/websocket");
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
