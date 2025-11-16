from web3 import Web3
import json
from config import AVALANCHE_RPC, LAND_CONTRACT, CONTRACT_ABI_PATH, CHAIN_ID

def verify_contract_status():
    """
    Verifies connection, address validity, ABI compatibility.
    Returns structured contract status.
    """
    status = {
        "connected": False,
        "valid_address": False,
        "abi_loaded": False,
        "chain_id": None,
        "contract_code": None,
        "verified": False
    }

    try:
        w3 = Web3(Web3.HTTPProvider(AVALANCHE_RPC))
        status["connected"] = w3.is_connected()
        if not status["connected"]:
            return status

        # Verify chain
        status["chain_id"] = w3.eth.chain_id
        if status["chain_id"] != CHAIN_ID:
            return status

        # Load ABI
        with open(CONTRACT_ABI_PATH, 'r') as f:
            abi_json = json.load(f)
            abi = abi_json.get("abi", abi_json)
            status["abi_loaded"] = True

        # Verify contract address
        checksum = Web3.to_checksum_address(LAND_CONTRACT)
        code = w3.eth.get_code(checksum)
        status["contract_code"] = code.hex()

        if len(code) < 4:
            status["valid_address"] = False
            return status
        else:
            status["valid_address"] = True

        # Instantiate contract and test one function if available
        contract = w3.eth.contract(address=checksum, abi=abi)
        if "owner" in [f["name"] for f in abi if f["type"] == "function"]:
            try:
                _ = contract.functions.owner().call()
                status["verified"] = True
            except Exception:
                status["verified"] = False
        else:
            status["verified"] = True  # fallback if no owner() exists

        return status

    except Exception as e:
        status["error"] = str(e)
        return status
