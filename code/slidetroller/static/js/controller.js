(function() {

  var next = document.getElementById("next");
  var previous = document.getElementById("previous");
  var seek = document.getElementById("seek");
  var logger = document.getElementById("log");

  var log = function(message) {
    logger.value = message + "\n" + logger.value;
  };

  var socket = new WebSocket("ws://" + window.location.host + "/websocket");
  socket.onopen = function() {
    log("WE ARE OPEN.");
    socket.send(JSON.stringify({
      type: "connect"
    }));
  };

  socket.onmessage = function(data) {
    log("NEW DATA: " + data);
  };

  socket.onclose = function(e) {
    log("WE ARE CLOSED: " + e.reason);
  };

  socket.onerror = function() {
    log("THERE WAS AN ERROR.");
  };

  next.onclick = function() {
    socket.send(JSON.stringify({
      type: "next"
    }));
  };

  previous.onclick = function() {
    socket.send(JSON.stringify({
      type: "previous"
    }));
  };

  var interval;

  var changeFunction = function(direction) {
    return function() {
      log("GOING IN DIRECTION " + direction);
      socket.send(JSON.stringify({
        type: direction
      }));
    };
  };

  seek.onchange = function() {
    log("SEEK CHANGED", seek.value);
    var direction = (seek.value < 0) ? "previous" : "next";
    var absolute = Math.sqrt(seek.value * seek.value);
    var speed = 1000 - (absolute * 100);
    clearInterval(interval);
    log(direction, speed);
    var func = changeFunction(direction);
    func();
    interval = setInterval(func, speed);
  };

  seek.onmousedown = function() {
    log("MOUSE DOWN");
  };

  seek.onmouseup = function() {
    clearInterval(interval);
    log("MOUSE UP");
    seek.value = 0;
  };

})();
