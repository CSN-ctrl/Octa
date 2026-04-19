#!/bin/bash
# Deploy the blender-mcp adapter to the remote host

cat > /tmp/blender-mcp-adapter.py << 'ADAPTER_EOF'
#!/usr/bin/env python3
"""
MCP Protocol Adapter for Blender-MCP Server
Converts between MCP JSON-RPC (stdio) and Blender-MCP TCP JSON protocol
"""

import sys
import json
import socket
import time
import select

class BlenderMCPAdapter:
    def __init__(self, host='localhost', port=9876):
        self.host = host
        self.port = port
        self.socket = None
        self.connected = False
        self.request_id_map = {}
        
    def connect(self):
        """Connect to the blender-mcp TCP server"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.settimeout(5.0)
            self.socket.connect((self.host, self.port))
            self.socket.settimeout(None)
            self.connected = True
            return True
        except Exception as e:
            print(f"Failed to connect to blender-mcp server: {e}", file=sys.stderr)
            return False
    
    def disconnect(self):
        """Disconnect from the blender-mcp server"""
        if self.socket:
            try:
                self.socket.close()
            except:
                pass
            self.socket = None
        self.connected = False
    
    def send_to_blender(self, command):
        """Send command to blender-mcp server"""
        if not self.connected:
            if not self.connect():
                return None
        
        try:
            command_json = json.dumps(command)
            self.socket.sendall(command_json.encode('utf-8'))
            
            # Receive response
            buffer = b''
            while True:
                try:
                    data = self.socket.recv(8192)
                    if not data:
                        break
                    buffer += data
                    try:
                        response = json.loads(buffer.decode('utf-8'))
                        return response
                    except json.JSONDecodeError:
                        continue
                except socket.timeout:
                    break
                except Exception as e:
                    print(f"Error receiving from blender: {e}", file=sys.stderr)
                    break
        except Exception as e:
            print(f"Error sending to blender: {e}", file=sys.stderr)
            self.connected = False
            return None
    
    def handle_mcp_message(self, mcp_message_str):
        """Handle a single MCP message"""
        try:
            mcp_message = json.loads(mcp_message_str.strip())
        except json.JSONDecodeError:
            return None
        
        request_id = mcp_message.get('id')
        method = mcp_message.get('method')
        
        if method == 'initialize':
            response = {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {}
                    },
                    "serverInfo": {
                        "name": "blender-mcp",
                        "version": "1.0.0"
                    }
                }
            }
            return json.dumps(response) + '\n'
        
        elif method == 'tools/list':
            response = {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "tools": [
                        {
                            "name": "get_scene_info",
                            "description": "Get information about the current Blender scene"
                        },
                        {
                            "name": "get_object_info",
                            "description": "Get detailed information about a specific object"
                        },
                        {
                            "name": "execute_code",
                            "description": "Execute arbitrary Blender Python code"
                        },
                        {
                            "name": "get_viewport_screenshot",
                            "description": "Capture a screenshot of the current 3D viewport"
                        }
                    ]
                }
            }
            return json.dumps(response) + '\n'
        
        elif method == 'tools/call':
            params = mcp_message.get('params', {})
            tool_name = params.get('name', '')
            arguments = params.get('arguments', {})
            
            self.request_id_map[request_id] = tool_name
            
            blender_command = {
                "type": tool_name,
                "params": arguments
            }
            
            blender_response = self.send_to_blender(blender_command)
            
            if blender_response:
                if blender_response.get('status') == 'success':
                    mcp_response = {
                        "jsonrpc": "2.0",
                        "id": request_id,
                        "result": blender_response.get('result', {})
                    }
                else:
                    mcp_response = {
                        "jsonrpc": "2.0",
                        "id": request_id,
                        "error": {
                            "code": -32000,
                            "message": blender_response.get('message', blender_response.get('error', 'Unknown error'))
                        }
                    }
                return json.dumps(mcp_response) + '\n'
            else:
                error_response = {
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "error": {
                        "code": -32000,
                        "message": "Failed to communicate with blender-mcp server"
                    }
                }
                return json.dumps(error_response) + '\n'
        
        else:
            response = {
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {
                    "code": -32601,
                    "message": f"Method not found: {method}"
                }
            }
            return json.dumps(response) + '\n'
    
    def run(self):
        """Main loop - read from stdin, process, write to stdout"""
        buffer = ''
        
        try:
            while True:
                if select.select([sys.stdin], [], [], 0.1)[0]:
                    data = sys.stdin.read(1)
                    if not data:
                        break
                    buffer += data
                    
                    if '\n' in buffer:
                        lines = buffer.split('\n')
                        buffer = lines[-1]
                        
                        for line in lines[:-1]:
                            if line.strip():
                                response = self.handle_mcp_message(line)
                                if response:
                                    sys.stdout.write(response)
                                    sys.stdout.flush()
                else:
                    time.sleep(0.01)
        except KeyboardInterrupt:
            pass
        except Exception as e:
            print(f"Error in main loop: {e}", file=sys.stderr)
        finally:
            self.disconnect()

if __name__ == '__main__':
    host = 'localhost'
    port = 9876
    
    if len(sys.argv) > 1:
        host = sys.argv[1]
    if len(sys.argv) > 2:
        port = int(sys.argv[2])
    
    adapter = BlenderMCPAdapter(host, port)
    adapter.run()
ADAPTER_EOF

# Copy to remote host
ssh arizona@192.168.88.157 "mkdir -p ~/.cursor && cat > ~/.cursor/blender-mcp-adapter.py" < /tmp/blender-mcp-adapter.py
ssh arizona@192.168.88.157 "chmod +x ~/.cursor/blender-mcp-adapter.py"

echo "Adapter script deployed to remote host!"
echo "Location: ~/.cursor/blender-mcp-adapter.py on arizona@192.168.88.157"
