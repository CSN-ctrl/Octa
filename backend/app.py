from flask import Flask, request, jsonify, send_from_directory
import os, json
import config
from supabase_client import get_users, add_user
from ipfs_handler import upload_to_ipfs
from blockchain import BlockchainService  # your blockchain.py
from verify_contract import verify_contract_status



app = Flask(__name__, static_folder="../frontend/dist", static_url_path="")
bc = BlockchainService()

@app.route("/api/verify-contract")
def verify_contract():
    status = verify_contract_status()
    return jsonify(status)

# -------------------------
# Health check
# -------------------------
@app.route("/api/health")
def health():
    return jsonify({"status": "alive"})

# -------------------------
# Supabase users
# -------------------------
@app.route("/api/users", methods=["GET"])
def users():
    return jsonify(get_users())

@app.route("/api/users", methods=["POST"])
def create_user():
    user_data = request.json
    return jsonify(add_user(user_data))

# -------------------------
# File upload to IPFS
# -------------------------
@app.route("/api/upload", methods=["POST"])
def upload_file():
    file = request.files["file"]
    tmp_path = f"/tmp/{file.filename}"
    file.save(tmp_path)
    ipfs_hash = upload_to_ipfs(tmp_path)
    os.remove(tmp_path)
    return jsonify({"ipfs_hash": ipfs_hash})

# -------------------------
# Digital ID creation
# -------------------------
@app.route("/api/create-digital-id", methods=["POST"])
def create_digital_id():
    """
    Expects multipart/form-data:
    - name
    - idType
    - wallet
    - avatarFile
    """
    wallet = request.form.get("wallet")
    name = request.form.get("name")
    id_type = request.form.get("idType")
    avatar = request.files.get("avatarFile")

    ipfs_hash = None
    if avatar:
        tmp_avatar = f"/tmp/{avatar.filename}"
        avatar.save(tmp_avatar)
        ipfs_hash = upload_to_ipfs(tmp_avatar)
        os.remove(tmp_avatar)

    # Create metadata
    metadata = {
        "name": name,
        "idType": id_type,
        "avatar": f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}" if ipfs_hash else ""
    }
    tmp_meta = "/tmp/tmp_metadata.json"
    with open(tmp_meta, "w") as f:
        json.dump(metadata, f)
    metadata_cid = upload_to_ipfs(tmp_meta)
    os.remove(tmp_meta)

    # Mint NFT / set metadata on-chain
    tx_hash = bc.mint_digital_id(wallet, metadata_cid)

    return jsonify({"status": "success", "metadataCID": metadata_cid, "tx": tx_hash})

# -------------------------
# Fetch land ownership
# -------------------------
@app.route("/api/land-ownership")
def land_ownership():
    try:
        plots = bc.get_all_plots()
        return jsonify(plots)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------
# Serve frontend
# -------------------------
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

# -------------------------
if __name__ == "__main__":
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
