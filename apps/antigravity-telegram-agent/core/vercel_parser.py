import json
import logging
from pathlib import Path
import tools

logger = logging.getLogger("ATA.vercel_parser")

def parse_vercel_status() -> str:
    """
    Parses Vercel project configuration locally (0-token consumption).
    Returns a beautiful markdown status summary of the Vercel linkage and deployment link.
    """
    cwd = tools.get_active_workspace()
    
    vercel_dir = cwd / ".vercel"
    project_json = vercel_dir / "project.json"
    vercel_config = cwd / "vercel.json"
    package_json = cwd / "package.json"
    
    project_name = cwd.name
    org_id = "N/A"
    project_id = "N/A"
    is_linked = False
    
    # Read package.json to get accurate name
    if package_json.exists():
        try:
            pkg_data = json.loads(package_json.read_text(encoding="utf-8"))
            project_name = pkg_data.get("name", project_name)
        except Exception:
            pass
            
    # Read .vercel/project.json
    if project_json.exists():
        try:
            proj_data = json.loads(project_json.read_text(encoding="utf-8"))
            org_id = proj_data.get("orgId", "N/A")
            project_id = proj_data.get("projectId", "N/A")
            is_linked = True
        except Exception as e:
            logger.error(f"Error parsing .vercel/project.json: {e}")
            
    # Check if vercel.json is present
    has_vercel_config = vercel_config.exists()
    
    # Format public deployment link guess (standard Vercel naming)
    vercel_domain = f"https://{project_name}.vercel.app"
    
    status_emoji = "✅ Connected to Vercel" if is_linked else "⚠️ Unlinked (Not connected)"
    
    report = (
        f"▲ **Vercel Integration Status ({cwd.name})**\n\n"
        f"- **Status**: {status_emoji}\n"
        f"- **Project Name**: `{project_name}`\n"
        f"- **Vercel Link**: [Go to App]({vercel_domain})\n"
        f"- **Vercel Config (vercel.json)**: {'✅ Found' if has_vercel_config else '❌ Not Found'}\n\n"
        f"**Metadata ID Details**:\n"
        f"- Organization ID: `{org_id}`\n"
        f"- Project ID: `{project_id}`\n\n"
        f"*Tips: You can run `/vibe vercel deploy` to deploy this app directly to production!*"
    )
    return report
