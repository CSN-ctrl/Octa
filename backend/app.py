from flask import Flask, request, jsonify, send_from_directory
import os
import config
from supabase_client import get_users, add_user
from ipfs_handler import upload_to_ipfs

app = Flask(__name__, static_folder="../frontend/dist", static_url_path="")

@app.route("/api/health")
def health():
    return jsonify({"status": "alive"})

@app.route("/api/users", methods=["GET"])
def users():
    return jsonify(get_users())

@app.route("/api/users", methods=["POST"])
def create_user():
    user_data = request.json
    return jsonify(add_user(user_data))

@app.route("/api/upload", methods=["POST"])
def upload_file():
    file = request.files["file"]
    tmp_path = f"/tmp/{file.filename}"
    file.save(tmp_path)
    ipfs_hash = upload_to_ipfs(tmp_path)
    return jsonify({"ipfs_hash": ipfs_hash})

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
