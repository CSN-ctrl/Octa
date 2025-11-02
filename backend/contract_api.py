"""
API endpoints for contract management
"""
from fastapi import APIRouter, HTTPException
import traceback

# Import contract manager (works when run from backend directory)
try:
    from .contract_manager import ContractManager
except ImportError:
    from contract_manager import ContractManager

router = APIRouter(prefix="/contracts", tags=["contracts"])

# Global contract manager instance
contract_manager = None

def get_contract_manager():
    """Get or create contract manager instance"""
    global contract_manager
    if contract_manager is None:
        try:
            contract_manager = ContractManager()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to initialize contract manager: {str(e)}")
    return contract_manager

@router.get("/status")
async def get_deployment_status():
    """Get deployment status of all contracts"""
    try:
        manager = get_contract_manager()
        status = manager.get_deployment_status()
        return {
            "success": True,
            "status": status,
            "addresses": manager.addresses
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/addresses")
async def get_contract_addresses():
    """Get all deployed contract addresses"""
    try:
        manager = get_contract_manager()
        # Try to load from deployments file if manager doesn't have them
        if not manager.addresses:
            manager.load_addresses()
        return {
            "success": True,
            "addresses": manager.addresses
        }
    except Exception as e:
        # If contract manager fails, try to read from file directly
        import json
        from pathlib import Path
        project_root = Path(__file__).parent.parent
        addresses_file = project_root / "deployments" / "addresses.json"
        
        if addresses_file.exists():
            try:
                with open(addresses_file, 'r') as f:
                    addresses = json.load(f)
                return {
                    "success": True,
                    "addresses": addresses
                }
            except:
                pass
        
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/deploy")
async def deploy_contracts():
    """Deploy all contracts if not already deployed"""
    try:
        manager = get_contract_manager()
        result = manager.setup_and_deploy()
        return {
            "success": result.get("status") != "error",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deployment failed: {str(e)}\n{traceback.format_exc()}")

@router.post("/compile")
async def compile_contracts():
    """Compile all contracts"""
    try:
        manager = get_contract_manager()
        success = manager.compile_contracts()
        return {
            "success": success,
            "message": "Contracts compiled successfully" if success else "Compilation failed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify")
async def verify_contracts():
    """Verify all deployed contracts"""
    try:
        manager = get_contract_manager()
        verification = manager.verify_contracts()
        return {
            "success": True,
            "verification": verification
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check/{contract_name}")
async def check_contract(contract_name: str):
    """Check if a specific contract is deployed"""
    try:
        manager = get_contract_manager()
        status = manager.get_deployment_status()
        
        if contract_name not in status:
            raise HTTPException(status_code=404, detail=f"Contract {contract_name} not found")
        
        contract_info = status[contract_name]
        return {
            "success": True,
            "contract": contract_name,
            "deployed": contract_info["deployed"],
            "address": contract_info["address"],
            "status": contract_info["status"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

