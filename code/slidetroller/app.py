import os
from tornado.ioloop import IOLoop
from tornado.web import Application, RequestHandler
from tornado.websocket import WebSocketHandler


_SUBSCRIBERS = []


class IndexHandler(RequestHandler):

    def get(self):
        self.render("index.htm")


class SocketHandler(WebSocketHandler):

    def open(self):
        print "NEW CONNECTION."
        _SUBSCRIBERS.append(self)

    def on_message(self, data):
        print "NEW MESSAGE " + data
        for subscriber in _SUBSCRIBERS[:]:
            if subscriber == self:
                continue
            try:
                subscriber.write_message(data)
            except Exception:
                _SUBSCRIBERS.remove(subscriber)

    def on_close(self):
        print "CLOSED CONNECTION."
        _SUBSCRIBERS.remove(self)


if __name__ == "__main__":
    app = Application([
        ("/", IndexHandler),
        ("/websocket", SocketHandler),
    ], template_path="views", static_path="static", debug=True)
    port = int(os.environ.get("PORT", 8082))
    app.listen(port)
    print "SERVING ON %s" % (port)
    IOLoop.instance().start()
