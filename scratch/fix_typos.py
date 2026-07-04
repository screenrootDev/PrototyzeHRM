import re
import sys

filepath = sys.argv[1]

with open(filepath, 'r') as f:
    content = f.read()

# Fix spli'string' -> split('string')
content = re.sub(r"spli'([^']+)'", r"split('\1')", content)

# Fix closes'string' -> closest('string')
content = re.sub(r"closes'([^']+)'", r"closest('\1')", content)

with open(filepath, 'w') as f:
    f.write(content)

