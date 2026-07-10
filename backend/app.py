from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

from agent_core import process_chat, clear_memory

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '')

    try:
        response = process_chat(message)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error in agent processing: {e}")
        response = {
            "reply": "Sorry, I am currently experiencing some difficulties connecting to my AI core.",
            "action_plan": ["Take a deep breath.", "Try again in a few moments.", "Focus on the present."],
            "is_emergency": False
        }
    
    return jsonify(response)

@app.route('/api/clear', methods=['POST'])
def clear():
    try:
        clear_memory()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
