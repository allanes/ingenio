from flask import Flask, send_from_directory
import subprocess
import threading
import time
import os
import requests
import signal
import sys
import psutil
from flask_cors import CORS

app = Flask(__name__, static_folder='front/worker_ui')
CORS(app)

streamlit_process = None

def kill_process_on_port(port):
    """Kill any process running on the specified port."""
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            # Get all connections for this process
            connections = proc.connections()
            for conn in connections:
                if conn.laddr.port == port:
                    print(f"Killing process {proc.pid} using port {port}")
                    proc.kill()
                    time.sleep(1)  # Give it a moment to release the port
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass

def start_streamlit():
    global streamlit_process
    # Kill any existing process on port 8501
    kill_process_on_port(8501)
    
    # Start new Streamlit process
    streamlit_process = subprocess.Popen(['streamlit', 'run', 'backend/reports/app.py', '--server.port=8501'])
    return streamlit_process

def wait_for_streamlit():
    max_retries = 30  # 30 seconds timeout
    retries = 0
    while retries < max_retries:
        try:
            response = requests.get('http://localhost:8501')
            if response.status_code == 200:
                print("Streamlit is ready!")
                return True
        except:
            print("Waiting for Streamlit to start...")
            time.sleep(1)
            retries += 1
    
    print("Failed to start Streamlit after 30 seconds")
    return False

def cleanup():
    """Cleanup function to kill all child processes."""
    global streamlit_process
    if streamlit_process:
        print("Stopping Streamlit process...")
        streamlit_process.terminate()
        streamlit_process.wait(timeout=5)
    
    # Kill any remaining processes on our ports
    kill_process_on_port(8501)
    kill_process_on_port(5000)

def signal_handler(signum, frame):
    """Handle termination signals."""
    print("\nShutting down gracefully...")
    cleanup()
    sys.exit(0)

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index2.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Start Streamlit in a separate thread
        streamlit_thread = threading.Thread(target=start_streamlit)
        streamlit_thread.daemon = True
        streamlit_thread.start()
        
        # Wait for Streamlit to be ready
        if not wait_for_streamlit():
            print("Failed to start Streamlit. Exiting...")
            cleanup()
            sys.exit(1)
        
        # Start Flask server
        print("Starting Flask server on http://localhost:5000")
        app.run(host='0.0.0.0', port=5000)
    except Exception as e:
        print(f"Error: {e}")
        cleanup()
        sys.exit(1) 