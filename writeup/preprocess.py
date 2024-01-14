import html
import re

from dataclasses import dataclass

IMAGE_RE = r'^!\[(?P<alt>([^]]*\\\])*[^]]*)\]\((?P<src>[^)]*)\)$'
IMAGE_HOST = 'https://raw.githubusercontent.com/aleksejspopovs/canvas-logger/2a03d3c0d38427d0ab26dbf7fcd1372e006aa651/writeup'

@dataclass
class Image:
	src: str
	alt: str

	def to_html(self):
		src_hosted = '{}/{}'.format(IMAGE_HOST, self.src)
		src_htmlsafe = html.escape(src_hosted, quote=True)
		alt_htmlsafe = html.escape(self.alt, quote=True)

		style = [
			'background: white',
			'border: 1px solid',
			'margin-top: 0px',
			'margin-bottom: 0px',
		]

		if '/datadome-1-' in self.src:
			style.append('width: 150px')

		style_htmlsafe = html.escape('; '.join(style), quote=True)

		return f'''<img
  src="{src_htmlsafe}"
  alt="{alt_htmlsafe}"
  title="{alt_htmlsafe}"
  style="{style_htmlsafe}">
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
		imgs = []
		for img in line:
			imgs.append(img.to_html().strip())
		print('''<div style="
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;">''')
		print(''.join(imgs))
		print('</div>')
	else:
		print(line, end='')
