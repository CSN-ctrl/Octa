// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SaraktDigitalID} from "../src/contracts/SaraktDigitalID.sol";
import {SaraktTreasury} from "../src/contracts/SaraktTreasury.sol";
import {SaraktLandV2} from "../src/contracts/SaraktLandV2.sol";

contract CheckDeployment is Script {
    function run() external {
        string memory addressesJson = vm.readFile("./deployments/addresses.json");
        
        console.log("=== Checking Contract Deployment Status ===\n");
        
        address digitalID = _parseAddress(addressesJson, "digitalID");
        address treasury = _parseAddress(addressesJson, "treasury");
        address land = _parseAddress(addressesJson, "land");
        
        _checkContract("SaraktDigitalID", digitalID);
        _checkContract("SaraktTreasury", treasury);
        _checkContract("SaraktLandV2", land);
        
        if (digitalID != address(0) && treasury != address(0) && land != address(0)) {
            _verifyIntegration(land, treasury, digitalID);
        }
    }
    
    function _checkContract(string memory name, address addr) internal view {
        console.log("\n---", name, "---");
        if (addr == address(0)) {
            console.log("Status: NOT DEPLOYED");
            return;
        }
        
        console.log("Address:", vm.toString(addr));
        console.log("Code size:", addr.code.length, "bytes");
        
        if (addr.code.length > 0) {
            console.log("Status: DEPLOYED ✓");
        } else {
            console.log("Status: ADDRESS HAS NO CODE ✗");
        }
    }
    
    function _verifyIntegration(address landAddr, address treasuryAddr, address digitalIDAddr) internal view {
        console.log("\n=== Verifying Contract Integration ===");
        
        try SaraktLandV2(landAddr).treasury() returns (address treasury) {
            if (treasury == treasuryAddr) {
                console.log("✓ Land -> Treasury connection: OK");
            } else {
                console.log("✗ Land -> Treasury connection: MISMATCH");
            }
        } catch {
            console.log("✗ Could not read Land.treasury()");
        }
        
        try SaraktLandV2(landAddr).digitalID() returns (address digitalID) {
            if (digitalID == digitalIDAddr) {
                console.log("✓ Land -> DigitalID connection: OK");
            } else {
                console.log("✗ Land -> DigitalID connection: MISMATCH");
            }
        } catch {
            console.log("✗ Could not read Land.digitalID()");
        }
        
        try SaraktLandV2(landAddr).salesActive() returns (bool active) {
            console.log("Sales Active:", active);
        } catch {
            console.log("Could not read salesActive");
        }
        
        try SaraktLandV2(landAddr).plotsSold() returns (uint256 sold) {
            console.log("Plots Sold:", sold);
        } catch {
            console.log("Could not read plotsSold");
        }
    }
    
    function _parseAddress(string memory json, string memory key) internal pure returns (address) {
        bytes memory jsonBytes = bytes(json);
        bytes memory keyBytes = bytes(key);
        bytes memory searchPattern = abi.encodePacked('"', keyBytes, '": "');
        
        // Simple parsing - find the address after the key
        uint256 start = _findSubstring(jsonBytes, searchPattern);
        if (start == type(uint256).max) {
            return address(0);
        }
        
        start += searchPattern.length;
        uint256 end = start;
        while (end < jsonBytes.length && jsonBytes[end] != '"') {
            end++;
        }
        
        bytes memory addrBytes = new bytes(end - start);
        for (uint256 i = 0; i < end - start; i++) {
            addrBytes[i] = jsonBytes[start + i];
        }
        
        return vm.parseAddress(string(addrBytes));
    }
    
    function _findSubstring(bytes memory data, bytes memory pattern) internal pure returns (uint256) {
        if (pattern.length > data.length) {
            return type(uint256).max);
        }
        
        for (uint256 i = 0; i <= data.length - pattern.length; i++) {
            bool match = true;
            for (uint256 j = 0; j < pattern.length; j++) {
                if (data[i + j] != pattern[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                return i;
            }
        }
        
        return type(uint256).max;
    }
}

