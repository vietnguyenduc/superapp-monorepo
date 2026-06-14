import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('dist/assets/index-5ba96adf.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all strings that look like URLs
urls = re.findall(r'https?://[^"\'\s,;)]+', content)
print('URLs found:', urls[:5])

# Check for supabase URL
if 'peslmsctejmvkwzyohke' in content:
    print('OK - Supabase URL found in build')
else:
    print('FAIL - Supabase URL NOT found in build')

# Check for anon key
if 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' in content:
    print('OK - Supabase anon key found in build')
else:
    print('FAIL - Supabase anon key NOT found in build')

# Check what's in the supabase.ts compiled output
idx = content.find('supabase')
if idx >= 0:
    print('Context:', content[max(0,idx-80):idx+120])
