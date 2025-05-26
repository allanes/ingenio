from flask import Flask, send_from_directory
import subprocess
import threading
import time
import os
import requests
from flask_cors import CORS

app = Flask(__name__, static_folder='front/worker_ui')
CORS(app)

# Start Streamlit in a separate process
def start_streamlit():
    subprocess.Popen(['streamlit', 'run', 'backend/reports/app.py', '--server.port=8501'])

# Wait for Streamlit to start
def wait_for_streamlit():
    while True:
        try:
            response = requests.get('http://localhost:8501')
            if response.status_code == 200:
                print("Streamlit is ready!")
                break
        except:
            print("Waiting for Streamlit to start...")
            time.sleep(1)

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index2.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    # Start Streamlit in a separate thread
    streamlit_thread = threading.Thread(target=start_streamlit)
    streamlit_thread.daemon = True
    streamlit_thread.start()
    
    # Wait for Streamlit to be ready
    wait_for_streamlit()
    
    # Start Flask server
    print("Starting Flask server on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000) 