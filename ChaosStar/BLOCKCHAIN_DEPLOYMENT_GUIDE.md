# ChaosStar Blockchain Deployment Guide
**Date**: 2025-12-19  
**Type**: Avalanche Blockchain Deployment

---

## 🎯 **Understanding the Deployment**

ChaosStar is deployed as a **custom blockchain** on Avalanche, not a standalone application. Here's how it works:

### Architecture
```
Avalanche Primary Network (Port 9650)
    ↓
ChaosStar Subnet
    ↓
ChaosStar Blockchain (Custom VM)
    ↓
RPC Endpoint: http://127.0.0.1:<PORT>/ext/bc/<BLOCKCHAIN_ID>/rpc
```

---

## 🚀 **Deployment Steps**

### Step 1: Start Avalanche Network

```bash
cd /home/hades/Videos/ChaosStar/stuff/chaosstarvm

# Start the local Avalanche network
avalanche --skip-update-check network start

# Wait for network to initialize (30-60 seconds)
```

### Step 2: Deploy ChaosStar Blockchain

**Option A: Using Existing Script**
```bash
# This script starts the VM and all configured nodes
./scripts/start_vm_quick.sh
```

**Option B: Manual Deployment**
```bash
# Deploy the blockchain
avalanche blockchain deploy chaosstar --local

# This will:
# 1. Create a subnet
# 2. Deploy the ChaosStar VM
# 3. Start validators
# 4. Return the RPC endpoint URL
```

### Step 3: Get RPC Endpoint

```bash
# Check blockchain status
avalanche blockchain describe chaosstar

# This will show:
# - Blockchain ID
# - Subnet ID  
# - RPC URL (THIS IS WHAT YOU NEED!)
```

The RPC URL will look like:
```
http://127.0.0.1:9650/ext/bc/2c8ca2dq4SiBngKLZz5p8QejJ29svMDsEW4ZZBHgeRTE5z8smq/rpc
```

---

## 📊 **Understanding the RPC URL**

### Format
```
http://127.0.0.1:9650/ext/bc/<BLOCKCHAIN_ID>/rpc
                ^^^^              ^^^^^^^^^^^^
                 |                      |
          Primary Network      Your Blockchain ID
```

### Components
- **127.0.0.1:9650** - Avalanche Primary Network node
- **ext/bc/** - Blockchain extension endpoint
- **<BLOCKCHAIN_ID>** - Your unique blockchain identifier
- **/rpc** - RPC endpoint

---

## 🔧 **Quick Deployment Script**

I've created `deploy_blockchain.sh` for you:

```bash
cd /home/hades/Videos/ChaosStar/stuff/chaosstarvm
./deploy_blockchain.sh
```

This script will:
1. ✅ Build the VM
2. ✅ Start Avalanche network
3. ✅ Check if blockchain is deployed
4. ✅ Show RPC URL if deployed
5. ✅ Give you next steps

---

## 📝 **Manual Deployment Commands**

### Check Network Status
```bash
avalanche network status
```

### Deploy Blockchain
```bash
avalanche blockchain deploy chaosstar --local
```

### Get Blockchain Info
```bash
avalanche blockchain describe chaosstar
```

### List All Blockchains
```bash
avalanche blockchain list
```

---

## 🌐 **Configure Frontend**

Once you have the RPC URL, update the frontend:

### File: `octavia-nebula-core/.env`
```env
VITE_RPC_URL=http://127.0.0.1:9650/ext/bc/<YOUR_BLOCKCHAIN_ID>/rpc
VITE_CHAIN_ID=chaosstar
```

### File: `octavia-nebula-core/src/config.ts` (if exists)
```typescript
export const RPC_URL = "http://127.0.0.1:9650/ext/bc/<YOUR_BLOCKCHAIN_ID>/rpc"
```

---

## 🎯 **Complete Deployment Flow**

### 1. Start Network
```bash
avalanche network start
# Wait 30 seconds
```

### 2. Deploy Blockchain
```bash
# Option A: Use existing script
./scripts/start_vm_quick.sh

# Option B: Manual deployment
avalanche blockchain deploy chaosstar --local
```

### 3. Get RPC URL
```bash
avalanche blockchain describe chaosstar
# Copy the RPC URL from output
```

### 4. Configure Frontend
```bash
cd octavia-nebula-core
echo "VITE_RPC_URL=<YOUR_RPC_URL>" > .env
```

### 5. Start Frontend
```bash
npm run preview
```

### 6. Access Application
```
Frontend: http://localhost:4173
Blockchain RPC: <YOUR_RPC_URL>
```

---

## 🔍 **Verify Deployment**

### Check Network
```bash
avalanche network status
# Should show: Running
```

### Check Blockchain
```bash
avalanche blockchain describe chaosstar
# Should show blockchain details and RPC URL
```

### Test RPC Endpoint
```bash
# Replace <RPC_URL> with your actual URL
curl -X POST <RPC_URL> \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_blockNumber",
    "params": [],
    "id": 1
  }'
```

---

## 📊 **Node Configuration**

The deployment uses these nodes (from `start_vm_quick.sh`):

1. **chaosstar-local-node-local-network** - Main node
2. **saraktprime-validator** - Sarakt Prime planet
3. **zythera-validator** - Zythera planet
4. **shadow-node** - Shadow settlement
5. **stargate-node** - Stargate bridge
6. **archive-node-1** - Archive node
7. **archive-node-2** - Archive node
8. **pruning-node-1** - Pruning node
9. **pruning-node-2** - Pruning node

Each node will have its own port, but they all connect to the same blockchain.

---

## 🛑 **Stop Deployment**

### Stop Network
```bash
avalanche network stop
```

### Stop Specific Node
```bash
avalanche node local stop <node-name>
```

### Clean Everything
```bash
avalanche network clean
```

---

## 🆘 **Troubleshooting**

### Network Won't Start
```bash
# Check if ports are in use
sudo netstat -tulpn | grep 9650

# Clean and restart
avalanche network clean
avalanche network start
```

### Blockchain Not Deploying
```bash
# Check logs
tail -f ~/.avalanche-cli/logs/*.log

# Try manual deployment
avalanche blockchain deploy chaosstar --local --force
```

### Can't Find RPC URL
```bash
# List all blockchains
avalanche blockchain list

# Describe your blockchain
avalanche blockchain describe chaosstar

# Check network status
avalanche network status
```

---

## 📚 **Additional Resources**

### Avalanche CLI Documentation
- Network commands: `avalanche network --help`
- Blockchain commands: `avalanche blockchain --help`
- Node commands: `avalanche node --help`

### ChaosStar Scripts
- Quick start: `./scripts/start_vm_quick.sh`
- Deploy blockchain: `./deploy_blockchain.sh`
- Check nodes: `./scripts/check_nodes_status.sh`

---

## ✅ **Deployment Checklist**

- [ ] Avalanche network started
- [ ] ChaosStar blockchain deployed
- [ ] RPC URL obtained
- [ ] Frontend configured with RPC URL
- [ ] Frontend started
- [ ] Application accessible

---

## 🎉 **Success Criteria**

Your deployment is successful when:

1. ✅ `avalanche network status` shows "Running"
2. ✅ `avalanche blockchain describe chaosstar` shows blockchain info
3. ✅ You have an RPC URL like: `http://127.0.0.1:9650/ext/bc/<ID>/rpc`
4. ✅ Frontend connects to the RPC URL
5. ✅ You can access the UI at http://localhost:4173

---

**Next**: Run `./deploy_blockchain.sh` to start the deployment!

*Last Updated: 2025-12-19*
