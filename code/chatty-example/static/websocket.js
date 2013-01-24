var Chatty = function(url) {
  this._url = url;
  this._connected = false;
  this._username = $("#username").val() || "guest";
  this.setup_interface();
};

Chatty.prototype.setup_interface = function() {
  var self = this;
  console.log(this._username);
  $("#username").val(this._username);
  $("#username-send").click(function() {
    var old_name = self._username;
    self._username = $("#username").val().trim();
    if (self._username != old_name) {
      self.send({
        type: "event",
        message: "'" + old_name + "' is now '" + self._username + "'.",
        status: "info"
      });
    }
  });
  $("#message-send").click(function() {
    var message = $("#message").val().trim();
    if (message) {
      self.send({
        type: "message",
        message: message
      });
    }
    $("#message").val("");
  });
};

Chatty.prototype.setup_websocket = function() {
  var self = this;

  // Creating new websocket instance connected locally
  this._websocket = new WebSocket(this._url);

  // Setting up behavior for every data packet
  this._websocket.onmessage = function(evt) {
    console.log("NEW MESSAGE:", evt.data);
    self.parse(evt.data);
  };

  // Setting up behavior when we're connected.
  this._websocket.onopen = function(evt) {
    console.log("OPENED.", evt);
    self.open(evt);
  };

  // Setting up behavior when we've disconnected
  this._websocket.onclose = function(evt) {
    console.log("CLOSED.", evt);
    self.close(evt);
  };

  // Setting up error handling.
  this._websocket.onerror = function(evt) {
    console.error("ERROR:", evt);
    self.error(evt);
  };
};

Chatty.prototype.open = function() {
  $(".control").removeClass("disabled");
  $(".connection-status")
    .removeClass("alert-error")
    .addClass("alert-success")
    .text("You are connected.");
  this.send({
    type: "event",
    message: "'" + this._username + "' has connected.",
    status: "success"
  });
  this._connected = true;
};

Chatty.prototype.close = function() {
  $(".control").addClass("disabled");
  $(".connection-status")
    .removeClass("alert-success")
    .addClass("alert-error")
    .text("You are not connected.");
  var self = this;
  if (this._connected) {
    this._connected = false;
    this.event_behavior({
      type: "event",
      message: "You have disconnected.",
      status: "error"
    });
  }
  setTimeout(function() { self.setup_websocket(); }, 5000);
};

Chatty.prototype.send = function(data) {
  data.time = new Date().getTime();
  data.user = this._username;
  var json_package = JSON.stringify(data);
  this._websocket.send(json_package);
};

Chatty.prototype.parse = function(data) {
  var handler, data_package;
  data_package = JSON.parse(data);
  if (!data_package.type) {
    return console.log("MISSING TYPE:", data_package);
  }
  handler = this[data_package.type + "_behavior"];
  if (!handler) {
    return console.log("UNKNOWN TYPE " + data_package.type, data_package);
  }
  return handler.apply(this, [data_package]);
};

Chatty.prototype.event_behavior = function(data) {
  console.log("EVENT: ", data);
  var message = $("<li class='entry event'><span class='label label-" + data.status + "'></span></li>");
  message.children(".label").text(data.message);
  var chatbox = $(".chatbox");
  chatbox.append(message);
  chatbox.scrollTop(chatbox.height());
};

Chatty.prototype.message_behavior = function(data) {
  console.log("MESSAGE: ", data.message);
  var message = $("<li class='entry message'><span class='label label-info user-label'></span>" +
      "<span class='chat-message'></span></li>");
  message.children(".user-label").text(data.user);
  message.children(".chat-message").text(data.message);
  var chatbox = $(".chatbox");
  chatbox.append(message);
  chatbox.scrollTop(chatbox.height());
};


$(function() {

  var chatty = new Chatty("ws://" + window.location.host + "/websocket");
  chatty.setup_websocket();

});
