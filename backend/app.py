from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import asyncio

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

from agent_core import process_chat_stream, clear_memory

def stream_bridge(message):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    gen = process_chat_stream(message)
    try:
        while True:
            yield loop.run_until_complete(gen.__anext__())
    except StopAsyncIteration:
        pass
    finally:
        loop.close()

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '')

    try:
        return Response(stream_bridge(message), mimetype='text/event-stream')
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error in agent processing: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/clear', methods=['POST'])
def clear():
    try:
        clear_memory()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
