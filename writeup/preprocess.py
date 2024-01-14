import html
import re

from dataclasses import dataclass

IMAGE_RE = r'^!\[(?P<alt>([^]]*\\\])*[^]]*)\]\((?P<src>[^)]*)\)$'

@dataclass
class Image:
	src: str
	alt: str

	def to_html(self):
		src_hosted = self.src
		src_htmlsafe = html.escape(src_hosted, quote=True)
		alt_htmlsafe = html.escape(self.alt, quote=True)
		return f'''<img
  src="{src_htmlsafe}"
  alt="{alt_htmlsafe}"
  title="{alt_htmlsafe}"
  style="background: white; border: 1px solid">
'''

lines = []
image_group = None
for line in open('index.md'):
	if match := re.match(IMAGE_RE, line):
		if image_group is None:
			image_group = []
		image_group.append(Image(match['src'], match['alt']))
	else:
		if image_group is not None:
			lines.append(image_group)
			image_group = None
		lines.append(line)

if image_group is not None:
	lines.append(image_group)

for line in lines:
	if isinstance(line, list):
		for img in line:
			print(img.to_html(), end='')
	else:
		print(line, end='')
