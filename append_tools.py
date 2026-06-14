content = """

import traceback

def profile_raw_data(args: dict) -> str:
    '''
    Profiles raw data from Google Sheets, CSV, or Excel using Pandas.
    Args:
        args: {"source_type": "google_sheet" | "csv" | "excel", "path_or_url": "str"}
    '''
    import asyncio
    import json
    
    source_type = args.get("source_type")
    path_or_url = args.get("path_or_url")
    
    if not source_type or not path_or_url:
        return "Error: missing source_type or path_or_url in arguments."
        
    try:
        from core.ingestion.files import parse_file
        from core.ingestion.gsheets import parse_google_sheet
        from core.ingestion.profiler import profile_dataframe
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        if source_type == "google_sheet":
            df = loop.run_until_complete(parse_google_sheet(path_or_url))
        elif source_type in ["csv", "excel"]:
            with open(path_or_url, "rb") as file_obj:
                content = file_obj.read()
            df = loop.run_until_complete(parse_file(content, path_or_url))
        else:
            return f"Error: unsupported source_type '{source_type}'"
            
        profile = profile_dataframe(df)
        return json.dumps(profile, indent=2, ensure_ascii=False)
        
    except Exception as e:
        return f"Error profiling raw data: {str(e)}\\n{traceback.format_exc()}"
"""

with open("apps/superapp-business-bot/tools.py", "a", encoding="utf-8") as f:
    f.write(content)
