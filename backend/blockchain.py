from web3 import Web3
from eth_account import Account
import json
from .config import AVALANCHE_RPC, LAND_CONTRACT, PRIVATE_KEY, CONTRACT_ABI_PATH, CHAIN_ID, GAS_LIMIT, PLOT_PRICE

class BlockchainService:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(AVALANCHE_RPC))
        if not self.w3.is_connected():
            raise Exception("Not connected to subnet")

        with open(CONTRACT_ABI_PATH, 'r') as f:
            self.abi = json.load(f)['abi']

        self.contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(LAND_CONTRACT),
            abi=self.abi
        )
        self.deployer = Account.from_key(PRIVATE_KEY)

    def buy_plot_tx(self, plot_id: int, value_eth: float):
        tx = self.contract.functions.buyPlot(plot_id).build_transaction({
            "from": self.deployer.address,
            "value": self.w3.to_wei(value_eth, "ether"),
            "nonce": self.w3.eth.get_transaction_count(self.deployer.address),
            "gas": GAS_LIMIT,
            "chainId": CHAIN_ID
        })
        signed = self.deployer.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt.transactionHash.hex()