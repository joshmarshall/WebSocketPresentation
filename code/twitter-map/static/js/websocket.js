$(function() {

  var Tweets = function(map) {
    this._socket = null;
    this._countries = {};
    this._yscale = [Math.sqrt(map[0][1] * map[0][1]), Math.sqrt(map[1][1] * map[1][1])];
    this._xscale = [Math.sqrt(map[0][0] * map[0][0]), Math.sqrt(map[1][0] * map[1][0])];
    this._image = $("#map");
    this._imageX = this._image.offset().left;
    this._imageY = this._image.offset().top;
    this._imageWidth = this._image.width();
    this._imageHeight = this._image.height();
  };

  Tweets.prototype.connect = function() {
    var self = this;
    this._socket = new WebSocket("ws://localhost:8080/websocket");
    this._socket.onopen = function() {
      console.log("OPENED!");
      self.open();
    };

    this._socket.onmessage = function(evt) {
      this._count = (this._count) ? this._count + 1 : 1;
      self.parse(evt.data);
    };

    this._socket.onclose = function() {
      console.log("CLOSED!");
      self.close();
    };
  };

  Tweets.prototype.open = function() {

  };

  Tweets.prototype.parse = function(tweet) {
    tweet = JSON.parse(tweet);
    if (tweet.coordinates && tweet.place && tweet.place.country_code == "US") {
      this.ping(tweet.coordinates.coordinates, tweet.place.full_name);
    }
  };

  Tweets.prototype.close = function() {

  };

  Tweets.prototype.ping = function(coordinates, place) {
    var x = Math.sqrt(coordinates[0] * coordinates[0]);
    var y = Math.sqrt(coordinates[1] * coordinates[1]);
    var mappedX = (x - this._xscale[0]) / (this._xscale[1] - this._xscale[0]);
    var mappedY = (y - this._yscale[1]) / (this._yscale[0] - this._yscale[1]);
    var newX = this._imageX + (mappedX * this._imageWidth);
    var newY = this._imageY + (mappedY * this._imageHeight);
    var ping = $("<img class='ping' src='/static/images/dot.png' width='30' height='30'/>");
    var tag = $("<div class='tag'></div>");
    tag.text(place);
    ping.offset({left: newX - 15, top: newY - 15});
    tag.offset({left: newX + 10, top: newY + 10});
    $(this._image.parent()).append(ping);
    $(this._image.parent()).append(tag);
    ping.animate({ opacity: 0 }, { duration: 1000, complete: function() { ping.remove(); } });
    tag.animate({ opacity: 0 }, { duration: 1000, complete: function() { tag.remove(); } });
  };

  var tweets = new Tweets([[-129,24.8], [-65,50.4]]);
  tweets.connect();

});
