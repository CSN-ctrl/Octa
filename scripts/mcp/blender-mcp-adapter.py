#!/usr/bin/env python3
"""
MCP Protocol Adapter for Blender-MCP Server
Converts between MCP JSON-RPC (stdio) and Blender-MCP TCP JSON protocol
"""

import sys
import json
import socket
import threading
import time
import select

class BlenderMCPAdapter:
    def __init__(self, host='localhost', port=9876):
        self.host = host
        self.port = port
        self.socket = None
        self.connected = False
        self.request_id_map = {}  # Map MCP request IDs to blender-mcp commands
        
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
    
    def convert_mcp_to_blender(self, mcp_message):
        """Convert MCP JSON-RPC message to blender-mcp protocol"""
        if mcp_message.get('method') == 'initialize':
            # MCP initialize - return success
            return None  # Don't send to blender, just respond directly
        elif mcp_message.get('method') == 'tools/list':
            # List available tools - map to blender commands
            return None  # Handle separately
        elif mcp_message.get('method') == 'tools/call':
            # Call a tool - extract params
            params = mcp_message.get('params', {})
            tool_name = params.get('name', '')
            arguments = params.get('arguments', {})
            
            # Map MCP tool calls to blender-mcp commands
            # This is a simplified mapping - you may need to adjust based on actual tool names
            blender_command = {
                "type": tool_name,
                "params": arguments
            }
            return blender_command
        else:
            # Try to extract method as command type
            method = mcp_message.get('method', '')
            if method.startswith('blender_') or method.startswith('get_') or method.startswith('execute_'):
                return {
                    "type": method.replace('blender_', '').replace('_', '_'),
                    "params": mcp_message.get('params', {})
                }
            return None
    
    def convert_blender_to_mcp(self, blender_response, mcp_request_id):
        """Convert blender-mcp response to MCP JSON-RPC format"""
        if blender_response.get('status') == 'success':
            return {
                "jsonrpc": "2.0",
                "id": mcp_request_id,
                "result": blender_response.get('result', {})
            }
        else:
            return {
                "jsonrpc": "2.0",
                "id": mcp_request_id,
                "error": {
                    "code": -32000,
                    "message": blender_response.get('message', blender_response.get('error', 'Unknown error'))
                }
            }
    
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
                        # Incomplete JSON, wait for more data
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
        
        # Handle MCP protocol messages
        if method == 'initialize':
            # Respond to initialize
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
            # List available tools
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
            # Call a tool - convert to blender-mcp and send
            params = mcp_message.get('params', {})
            tool_name = params.get('name', '')
            arguments = params.get('arguments', {})
            
            # Store request ID for response mapping
            self.request_id_map[request_id] = tool_name
            
            # Convert to blender-mcp format
            blender_command = {
                "type": tool_name,
                "params": arguments
            }
            
            # Send to blender-mcp server
            blender_response = self.send_to_blender(blender_command)
            
            if blender_response:
                # Convert response back to MCP format
                mcp_response = self.convert_blender_to_mcp(blender_response, request_id)
                return json.dumps(mcp_response) + '\n'
            else:
                # Error response
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
            # Unknown method
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
                # Check if stdin has data
                if select.select([sys.stdin], [], [], 0.1)[0]:
                    data = sys.stdin.read(1)
                    if not data:
                        break
                    buffer += data
                    
                    # Check for complete JSON-RPC message (newline-delimited)
                    if '\n' in buffer:
                        lines = buffer.split('\n')
                        buffer = lines[-1]  # Keep incomplete line in buffer
                        
                        for line in lines[:-1]:
                            if line.strip():
                                response = self.handle_mcp_message(line)
                                if response:
                                    sys.stdout.write(response)
                                    sys.stdout.flush()
                else:
                    # No input, check connection status
                    time.sleep(0.01)
        except KeyboardInterrupt:
            pass
        except Exception as e:
            print(f"Error in main loop: {e}", file=sys.stderr)
        finally:
            self.disconnect()

if __name__ == '__main__':
    # Get host and port from command line args or use defaults
    host = 'localhost'
    port = 9876
    
    if len(sys.argv) > 1:
        host = sys.argv[1]
    if len(sys.argv) > 2:
        port = int(sys.argv[2])
    
    adapter = BlenderMCPAdapter(host, port)
    adapter.run()
