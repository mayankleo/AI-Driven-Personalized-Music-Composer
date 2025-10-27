from flask import Flask, Response, request, send_file
from flask_socketio import SocketIO,emit
import os
from flask_cors import CORS

from genMusic import generate

app = Flask(__name__)
app.config['SECRET_KEY'] = 'csuwjejdciun1f1v1v59h'
CORS(app,resources={r"/*":{"origins":"*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route("/")
def http_call():
    data = 'This text was fetched using an HTTP call to server on render'
    return data

@app.route('/getfile', methods=['POST'])
def stream_file():
    data = request.json
    file_name = data.get('file_name')
    print("sending file", file_name)
    if not file_name:
        return Response("File name not provided.", status=400)

    filepath = os.path.join('output', file_name)

    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True)
    else:
        return Response("File not found.", status=404)


@socketio.on("connect")
def connected():
    print("client has connected")
    
@socketio.on('data') 
def data_handler(data):
    emit('logs', "request received")
    print("request received", data)
    filename = generate(emit)
    emit('logs', "sending filename")
    print("sending filename", filename)
    emit('data', filename) 
    
@socketio.on('logs') 
def data_handler(logmessage):
    print("cliend log: ", logmessage)


@socketio.on("disconnect")
def disconnected():
    print("user disconnected")
    
if __name__ == '__main__':
    socketio.run(app, port=5000)
