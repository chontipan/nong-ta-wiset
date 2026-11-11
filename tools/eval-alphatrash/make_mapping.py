"""Pulls COCO class -> bin type out of app.js WASTE_MAPPING. usage: python3 make_mapping.py ../../app.js mapping.json"""
import re, json, sys
s = open(sys.argv[1], encoding='utf-8').read()
a = s.index('const WASTE_MAPPING'); b = s.index('};', a)
json.dump(dict(re.findall(r"'([^']+)':\s*\{\s*type:\s*'(\w+)'", s[a:b])), open(sys.argv[2], 'w'), indent=0)
