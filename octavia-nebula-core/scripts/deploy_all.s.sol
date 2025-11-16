// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SaraktDigitalID} from "../src/contracts/SaraktDigitalID.sol";
import {SaraktTreasury} from "../src/contracts/SaraktTreasury.sol";
import {SaraktLandV2} from "../src/contracts/SaraktLandV2.sol";
import {DummyToken} from "../src/contracts/DummyToken.sol";
import {FractionalAsset} from "../src/contracts/FractionalAsset.sol";

contract DeployAll is Script {
    struct DeploymentAddresses {
        address digitalID;
        address treasury;
        address land;
        address dummyToken;
    }
    
    DeploymentAddresses public deployed;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy SaraktDigitalID
        console.log("\n=== Deploying SaraktDigitalID ===");
        SaraktDigitalID digitalID = new SaraktDigitalID();
        deployed.digitalID = address(digitalID);
        console.log("SaraktDigitalID deployed at:", deployed.digitalID);
        
        // 2. Deploy DummyToken for testing
        console.log("\n=== Deploying DummyToken ===");
        DummyToken dummyToken = new DummyToken("Sarakt Token", "SAR");
        deployed.dummyToken = address(dummyToken);
        console.log("DummyToken deployed at:", deployed.dummyToken);
        
        // 3. Deploy SaraktTreasury (with DummyToken in supported tokens)
        console.log("\n=== Deploying SaraktTreasury ===");
        address[] memory supportedTokens = new address[](1);
        supportedTokens[0] = deployed.dummyToken;
        SaraktTreasury treasury = new SaraktTreasury(supportedTokens);
        deployed.treasury = address(treasury);
        console.log("SaraktTreasury deployed at:", deployed.treasury);
        
        // 4. Deploy SaraktLandV2 (requires treasury and digitalID)
        console.log("\n=== Deploying SaraktLandV2 ===");
        SaraktLandV2 land = new SaraktLandV2(deployed.treasury, deployed.digitalID);
        deployed.land = address(land);
        console.log("SaraktLandV2 deployed at:", deployed.land);
        
        // Note: Treasury ownership remains with deployer for security
        // Ownership can be transferred later if needed
        console.log("Deployment complete. Treasury ownership: deployer");
        
        vm.stopBroadcast();
        
        // Save addresses to file
        _saveAddresses(deployed);
    }
    
    function _saveAddresses(DeploymentAddresses memory addresses) internal {
        string memory json = string(abi.encodePacked(
            "{\n",
            '  "digitalID": "', _addressToString(addresses.digitalID), '",\n',
            '  "treasury": "', _addressToString(addresses.treasury), '",\n',
            '  "land": "', _addressToString(addresses.land), '",\n',
            '  "dummyToken": "', _addressToString(addresses.dummyToken), '"\n',
            "}\n"
        ));
        
        vm.writeFile("./deployments/addresses.json", json);
        console.log("\nAddresses saved to ./deployments/addresses.json");
        console.log("DigitalID:", _addressToString(addresses.digitalID));
        console.log("Treasury:", _addressToString(addresses.treasury));
        console.log("Land:", _addressToString(addresses.land));
        console.log("DummyToken:", _addressToString(addresses.dummyToken));
    }
    
    function _addressToString(address addr) internal pure returns (string memory) {
        bytes memory data = abi.encodePacked(addr);
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < data.length; i++) {
            str[2+i*2] = alphabet[uint256(uint8(data[i] >> 4))];
            str[3+i*2] = alphabet[uint256(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }
}

