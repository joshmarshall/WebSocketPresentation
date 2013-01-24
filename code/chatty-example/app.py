import wsgi_helpers

from gevent.pywsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler


# Holds an in-memory list of all currently listening subscribers
_SUBSCRIBERS = []


def handle_websocket(environ, start_response):
    """A half-duplex, simple broadcast websocket handler."""

    # Extract the websocket connection to use for sending and receiving
    websocket = environ["wsgi.websocket"]

    try:
        # Adding the current user to the list of subscribers
        _SUBSCRIBERS.append(websocket)

        while True:
            packet = websocket.receive()
            if packet is None:
                break
            for subscriber in _SUBSCRIBERS:
                subscriber.send(packet)

    # No matter what happens, we need to remove the user from the list
    # of subscribers so we don't keep hammering a dead connection
    finally:
        _SUBSCRIBERS.remove(websocket)


router = wsgi_helpers.Router([
    ("/", wsgi_helpers.handle_file("views/index.htm")),
    ("/favicon.ico", wsgi_helpers.handle_file("static/favicon.ico")),
    ("/websocket", handle_websocket),
    ("/static/.+", wsgi_helpers.handle_static("/static"))
])


if __name__ == "__main__":
    print "SERVING ON PORT 8080"
    server = WSGIServer(("", 8080), router, handler_class=WebSocketHandler)
    server.serve_forever()
