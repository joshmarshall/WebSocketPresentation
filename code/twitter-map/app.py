import base64
import os
import urllib
import wsgi_helpers

import gevent
from gevent.pywsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler
from geventhttpclient.url import URL
from geventhttpclient import HTTPClient


# Basic settings
TWITTER_URL = "https://stream.twitter.com/1.1/statuses/filter.json"
USERNAME = os.environ["TWITTER_USERNAME"]
PASSWORD = os.environ["TWITTER_PASSWORD"]
COORDINATES = "-130.7,24.8,-64,50.4"


# In-memory list of subscribers
_SUBSCRIBERS = []


def monitor_twitter():
    """Open a connection to Twitter and send each message to subscribers."""
    # Construct the Gevent-based HTTP Client
    body = urllib.urlencode({"locations": COORDINATES})
    url = URL(TWITTER_URL + "?" + body)
    headers = {"Authorization": authorization_header()}
    http = HTTPClient.from_url(url)

    # Ensure we have an accepted request
    response = http.request(
        "POST", url.request_uri, body=body, headers=headers)
    if response.status_code != 200:
        raise Exception("Invalid status: %d\n%s" % (
            response.status_code, response.readline()))

    while True:
        try:
            line = response.readline()
        except Exception as exception:
            print "TWITTER FAILED!\n%s" % (exception)
            os.exit(1)
        if line:
            # Send the line to each subscriber if it's not empty
            for subscriber in _SUBSCRIBERS[:]:
                try:
                    subscriber.send(line)
                except:
                    _SUBSCRIBERS.remove(subscriber)
        # Yield control to the server
        gevent.sleep(0)


def handle_websocket(environ, start_response):
    """Simple broadcast websocket handler."""
    websocket = environ["wsgi.websocket"]
    try:
        _SUBSCRIBERS.append(websocket)
        # Just hang around waiting for messages --
        # If this was bidirectional, we'd do receive()
        # calls here.
        while True:
            gevent.sleep(1)
    finally:
        _SUBSCRIBERS.remove(websocket)


router = wsgi_helpers.Router([
    ("/", wsgi_helpers.handle_file("views/index.htm")),
    ("/favicon.ico", wsgi_helpers.handle_file("static/favicon.ico")),
    ("/websocket", handle_websocket),
    ("/static/.*", wsgi_helpers.handle_static("/static"))
])


def authorization_header():
    raw_string = "%s:%s" % (USERNAME, PASSWORD)
    b64_string = base64.b64encode(raw_string)
    auth_header = "Basic %s" % (b64_string)
    return auth_header


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8081))
    print "SERVING ON PORT %d" % (port)
    server = WSGIServer(("", port), router, handler_class=WebSocketHandler)
    gevent.spawn(monitor_twitter)
    server.serve_forever()
