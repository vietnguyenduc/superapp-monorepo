import asyncio
import sys
import json
import argparse
import shlex
from mcp.client.session import ClientSession
from mcp.client.stdio import stdio_client, StdioServerParameters

async def run_mcp_tool(command, tool_name, tool_args):
    # Parse the server command into executable and args
    parts = shlex.split(command)
    if not parts:
        print(json.dumps({"error": "Empty server command provided"}))
        return

    cmd_name = parts[0]
    cmd_args = parts[1:]
    
    # We must set env=None so it inherits the current environment 
    # (needed for npx, Node, API keys, etc.)
    server_params = StdioServerParameters(
        command=cmd_name,
        args=cmd_args,
        env=None
    )

    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                
                # Parse args if it's a string representing JSON
                if isinstance(tool_args, str):
                    try:
                        tool_args = json.loads(tool_args)
                    except json.JSONDecodeError:
                        print(json.dumps({"error": "tool_args must be a valid JSON string."}))
                        return
                        
                result = await session.call_tool(tool_name, arguments=tool_args)
                
                # Format output result as JSON
                # MCP CallToolResult contains content list, each has type (text/image) and text payload
                out_content = []
                for c in result.content:
                    if getattr(c, "type", "") == "text":
                        out_content.append(c.text)
                    else:
                        out_content.append(str(c))
                        
                out = {"content": "\n".join(out_content)}
                if result.isError:
                    out["isError"] = True
                    
                print(json.dumps(out))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MCP Bridge for Telegram Bot via stdio")
    parser.add_argument("--server", required=True, help="Server command (e.g., 'npx -y @supabase/mcp')")
    parser.add_argument("--tool", required=True, help="Tool name to call")
    parser.add_argument("--args", required=True, help="JSON string of arguments")
    
    args = parser.parse_args()
    asyncio.run(run_mcp_tool(args.server, args.tool, args.args))
