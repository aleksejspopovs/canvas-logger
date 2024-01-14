# Illustrating canvas fingerprinting

Canvas fingerprinting is a relatively well-understood and [well-documented](https://en.wikipedia.org/wiki/Canvas_fingerprinting) technique: websites can use [web APIs](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) to access 2D and 3D rendering APIs inside the browser, which instruct the brower to draw lines, gradients, text, and other objects onto raster images. The same sequence of API calls can produce subtly different images depending on your browser, OS, the set of fonts you have installed, your GPU driver, and so on. The images that your browser renders therefore provide a useful signal, and when it is combined with information available through other browser APIs, it [could be used to identify your device uniquely](https://coveryourtracks.eff.org/).

For a technique that relies on asking your browser to paint a picture that expresses its entire unique personality, few sources actually _show_ you much of what these pictures look like. To rectify that, I made [a Chrome extension](https://github.com/aleksejspopovs/canvas-logger) that logs every canvas that a website attempted to read back and browsed the web for a week with the extension enabled. Here's an extremely unscientific account of what I saw.

(Some of the images in this post have been cropped, but only to remove large areas of fully transparent pixels.)

## BrowserLeaks.com

![The text "BrowserLeaks,com <canvas> 1.0" is written in green font with a light green shadow. There is an orange rectangle positioned precisely under the word "<canvas>".](./samples/browserleaks.png)

BrowserLeaks.com seems to have been one of the first public implementations of canvas fingerprinting, appearing online in early 2013. As we're about to see, it seems to have inspired many of the other implementations.

The image is not particularly visually striking, but I want to draw your attention to the orange rectangle under the word `<canvas>`. Take a good look at it, appreciate its color, and try to remember it---you're going to see it again.

Interestingly, the current version of BrowserLeaks.com uses a clever trick that attempts to defeat extensions like mine. BrowserLeaks.com creates a sandboxed iframe where JavaScript (including the hooking code from my extension) will not execute, then accesses it from the parent frame to get a `<canvas>` element whose `toDataURL` method has not been hooked. Once you know about it, though, you can [use the same trick](https://github.com/aleksejspopovs/canvas-logger/blob/dad9f37d3718509151d202b214c8f536c70596e8/extension/scripts/content.js#L67-L108) to hook them too. I have not seen any other site use this trick.

## ClickCease

![The text abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLM, rendered in the same style as the BrowserLeaks.com image above. The orange rectangle is still present in the same position, now located roughly under "stuvwxyzA".](./samples/clickcease.png)

I'm honestly not sure that ClickCease is anybody that matters, but I am including it here because it's funny just how obvious of a ripoff it is. The orange rectangle is still there but no longer under anything specific.

## PayPal

![The text "PayPal.com, <!@#$%>" in the BrowserLeaks.com style. The orange rectangle is now roughly under "<!@#$%>". Under the text are three overlapping circles, like on a Venn diagram. The circles are colored magenta, cyan, and yellow, and where they overlap they blend into four other colors.](./samples/paypal.png)

PayPal has got better alignment on the orange rectangle, keeps the green text with a green shadow, but adds some color composition operations. We're about to see a lot more of this.

## FingerprintJS and variants

![The string "Cwm fjordbank glyphs vext quiz, 😃" is rendered twice, once in blue in a smaller font and once in semi-transparent light green in a larger font. The orange rectangle from BrowserLeaks.com is still present in its original location, now roughly under "hs vext qui". Under the text, the Venn diagram from PayPal has had multiple additional circles and triangles in primary colors added to it, combining into a sort of a Technicolor Rorschach test. (The image has been cropped from its original size of 2000×200, removing a large area of empty space.)](./samples/processed/fingerprintjs-longer-string-cropped.png)

Told you. FingerprintJS is a very common open source fingerprinting library. It uses color blending and emojis to extract more entropy.

(Hey, the orange rectangle is still there! It has the exact same color, size, and almost the same position as the one from BrowserLeaks.com.)

It has been integrated into many commercial products, including at least Arkose, Geetest, Yandex SmartCaptcha, DDoS-Guard, and Sift. The exact version of the library integrated into products varies, so you can see the evolution of the technique as you run into different samples on the web. Most of the changes concern the exact string being rendered:

- A very old version [used a string calling for peace in Ukraine](https://github.com/fingerprintjs/fingerprintjs/blob/0f523619975692cdb91400d0f2f9c2ab26d2cb61/fingerprint2.js#L485) back in 2015. I did not find any instances of this version in the wild, though.

- Before v3 of FingerprintJS, the string was a proper pangram, containing each letter of the English alphabet exactly once, rendered onto a giant and mostly blank 2000×200 canvas. In v3, the string was shortened and the canvas cropped to just the useful part:

![The same image, but the string has been replaced with "Cwm fjordbank 😃 gly", and the Venn diagram is cropped at the bottom slightly.](./samples/fingerprintjs-old.png)

- Having an emoji in the middle of a string turned out to cause [inconsistent amounts of padding on the right in Chrome](https://github.com/fingerprintjs/fingerprintjs/issues/574), so the emoji was moved to the end. I have no samples illustrating this change individually because it happened in the same version of the library (v3.1.0) as the next one.

- Eventually FingerprintJS [split](https://github.com/fingerprintjs/fingerprintjs/commit/d3e359c4fe81f58793751361d495c36d6be7e73d) the canvas fingerprint into two images to separate text, which was still suffering from inconsistent rendering on [some](https://github.com/fingerprintjs/fingerprintjs/issues/583) [platforms](https://github.com/fingerprintjs/fingerprintjs/issues/103), from the more stable blending-based fingerprint:

![Just the string "Cwm fjordbank 😃 gly" rendered twice as before and the orange rectangle.](./samples/fingerprintjs-new-text.png)
![The Venn diagram from before, in an image of its own. Some of the primary colors seem to have been replaced with more pastel tones.](./samples/fingerprintjs-new-shapes.png)

- On CoinMarketCap, the characters 馃槂 are rendered instead of the emoji, but this does not appear to be intentional. Rather, it is a result of the source code having gotten interpreted with the wrong encoding at some point, as `'😃'.encode('utf-8').decode('gbk') == '馃槂'`.

![Same as the first image, but the string ends with "馃槂" instead of "😃". (The image has been cropped from its original size of 2000×200, removing a large area of empty space.)](./samples/processed/coinmarketcap-cropped.png)

FingerprintJS also implements WebGL fingerprinting, which uses 3D rendering primites instead of 2D ones. Depending on the version, it renders one of these two triangles:

![A triangle on a transparent background. The triangle is filled with a gradient that starts out red on the bottom and turns yellow at the top.](./samples/fingerprintjs-webgl-old.png)
![A solid red triangle on a solid blue background. The triangle is cropped, only one of its corners fully visible.](./samples/fingerprintjs-webgl-new.png)

## Amazon and AWS WAF

![A very small image has all of the features of the FingerprintJS image crammed into it and more. The string "Cwm fjordbank glyphs vext quiz" is still here twice, a small part of the orange rectangle is visible in its usual location, and two technicolor three-circle Venn diagrams are visible. There are also three floating-point numbers (-1.42..., -0.575..., 0.817...), a smaller circle filled with a gradient, and a long smooth line that looks like a random scribble.](./samples/amazon.png)

Amazon has its own fingerprinting library that is used both on the retail Amazon.com website and in its AWS WAF product. Though heavily customized, it, too, seems to be based on FingerprintJS. Say hello one last time to our good friend the orange rectangle!

## SHIELD

![The FingerprintJS image where the orange rectangle has turned black and the two instances of the pangram "Cwm fjordbank glyphs vext quiz" have been replaced with three lines: "xtquiz Cwmfjo rlyphsve", "BIG SMILING FACE 😃", and "¯\_(ツ)_/¯" (a shruggie emoticon).](./samples/shield-fingerprintjs.png)

What have they done to you, orange rectangle?! Some transposed letters and a shruggie seems to be most of what SHIELD has to offer when it comes to canvas fingerprinting.

## Akamai

![The orange text "<@nv45. F1n63r,Pr1n71n6!" ("canvas fingerprinting" in leet-speak), a small semi-circle, and a green rectangle located roughly behind "F1n63r".](./samples/akamai-leet.png)

I appreciate the transparency with which Akamai's fingerprinting image announces what's going on. WebKit developers appreciated it too, implementing a quirk that [returns a hardcoded data URL for canvases where the last drawn string is `<@nv45. F1n63r,Pr1n71n6!`](https://github.com/WebKit/WebKit/blob/a99abdd4861553671d45fcd3b11714c82a803421/Source/WebCore/page/Quirks.cpp#L1580-L1623). Firefox's Gecko has [similar logic](https://github.com/mozilla/gecko-dev/blob/f961e5f2a22f4d41733545190892296e64c06858/dom/canvas/CanvasRenderingContext2D.cpp#L4203-L4222) for this and a couple other strings, too.

Akamai also implements some sort of a challenge-response protocol that seems to involve rendering random three-digit numbers to the canvas.

![A very small image, containing only the digits "557".](./samples/akamai-557.png)
![A very small image, containing only the digits "114".](./samples/akamai-114.png)
![A very small image, containing only the digits "920".](./samples/akamai-920.png)

Sometimes, but not always, Akamai also renders this red image. In the top left corner, very faint, nearly transparent letters spell out "Soft Ruddy Foothold 2". I kind of like it.

![Bright red letters spell out "!H71JCaj)\]# 1@#". Behind, in faint semi-transprent red, "Soft Ruddy Foothold 2". Under, three rectangles: red, blue, and gray.](./samples/akamai-rare.png)

## ThreatMetrix

![The string "@Browsers-%fingGPRint$&,<canvas>" is rendered twice: once in very small black font and once in a slightly larger font colored with a gradient that goes from magenta to purple.](./samples/threatmetrix.png)

ThreatMetrix has another one of those self-referential images that tells you exactly what it is. Nice gradient on there.

I think they're doing something clever with their iframes, because, while my extension successfully hooked the toDataURL call, the message it sent to itself with postMessage never arrived.

## Cloudflare Turnstile

![A number of curvy arcs, filled with various shades of green. One of the arcs has a faint orange shadow. In the bottom right, the string "&Xq".](./samples/cloudflare.png)

This one's kind of cool-looking, I have to admit. It's a shame it's Cloudflare's.

Turnstile is the only CAPTCHA solution that seems to actually detect that something's wrong when my canvas logging extension is running. All of my challenges fail with "Error: 600010". The code is heavily obfuscated, so I didn't get around to figuring out how they detect it. It's got to be interesting, so maybe that's a task for another day.

## Shape Security

![The string "Hel$&?6%){mZ+#@" is rendered in the most basic font imaginable, black against a transparent background.](./samples/shape-string.png)
![A triangle is filled with a gradient where the three corners are all different colors (red, green, and blue), as commonly seen in tutorials for OpenGL and other 3D rendering APIs.](./samples/shape-webgl.png)

Shape Security (now owned by F5) has got the most fun canvas-based bot detection mechanisms. Sure, their text-based fingerprinting image looks pretty basic, and the WebGL triangle is not far ahead, but check these out:

![An image is filled with dozens of haphazardly placed shapes of different kinds, sizes, and colors. Circles, rectangles, and five-pointed stars are colored in pleasant shades of red, green, and blue, and some have gradients.](./samples/shape-shapes-1.png)
![Another image in the same style. The arrangement of shapes is completely different, and the dimensions of the image are slightly different.](./samples/shape-shapes-2.png)
![A third image in this style. Again, completely different arrangement of shapes and slightly different dimensions.](./samples/shape-shapes-3.png)

I haven't spent any time reverse engineering this, but many teenagers trying to buy fancy sneakers have, and what I understand from reading their notes is that this is a challenge-response protocol where Shape's server sends you obfuscated bytecode for their custom VM that proceeds to draw these pictures and sends them back, presumably to be compared against what the server expects them to look like. It's not quite fingerprinting in the classical sense, since the image is different on every page load, but it means that writing a bot for a Shape-protected website requires access to some sort of a drawing API. Neat!

![A small square. A string beginning "\uD" has been rendered onto it but is heavily cropped.](./samples/shape-emoji-1.png)
![Same but the string begins "\u2".](./samples/shape-emoji-2.png)
![The 😎 emoji rendered in a small square. The bottom and right sides of the emoji are cropped slightly.](./samples/shape-emoji-3.png)
![Same for the 🇬🇪 emoji.](./samples/shape-emoji-4.png)
![Same for the 🍼 emoji.](./samples/shape-emoji-5.png)
![Same for the 6️⃣ emoji.](./samples/shape-emoji-6.png)
![Same for the 📊 emoji.](./samples/shape-emoji-7.png)
![Same for the ⛎ emoji.](./samples/shape-emoji-8.png)
![Same for the ⛎ emoji.](./samples/shape-emoji-9.png)

Shape also fingerprints your emoji font by drawing multiple emojis and then reading back just a single pixel or two in specific, pre-determined locations. I imagine that Emoji fonts are  are usually provided by the OS and get subtly modified between different OS releases (I am surprised not to see [the gun emoji](https://blog.emojipedia.org/apple-and-the-gun-emoji/) among those probed), and sampling individual pixels could be more effective for emoji than the more traditional font fingerprinting techniques that [rely on font metrics](https://browserleaks.com/fonts).

Notice the first two images, where instead of an emoji we see the beginning of a string like `\u2615`, which is one way to write the emoji ☕ in JavaScript.  At first I thought that my system lacked support for this emoji and what I was seeing was some sort of fallback behavior, but when I traced the code I realized that it really was printing the literal six-character string `"\\u2615"`. I am assuming this is meant to confuse people reverse engineering this (it sure confused me) and trick them into double-decoding the input.

Finally, Shape does something odd: it renders the string `Hel$&?6%){mZ+#@👺` at coordinates (105, 105) of a canvas that is only 5×5 pixels large. Naturally, the image comes back empty, so its contents themselves provide no useful information. I think this is being used as some sort of a side channel for the anti-tracking protections in Firefox, where writing a string that begins with `Hel$&?6%` [gets your canvas marked as being involved in fingerprinting](https://github.com/mozilla/gecko-dev/blob/f961e5f2a22f4d41733545190892296e64c06858/dom/canvas/CanvasRenderingContext2D.cpp#L4217).

## Anura

![An image that looks like an early 2000s elementary school student's first foray into WordArt. The background is striped diagonally in light gray, and the image has a border that is also striped diagonally in black. In the middle, a red rectangle and thin blue, gray, and yellow stripes. Strings "ϋϱϥϨϙϬ...", "Sympathizing would fix Quaker objectives", "{CD24:PD24}", "WebGL 2.0 (OpenGL ES 3.0 Chromium)", and "ANGLE (Intel, Mesa Intel(R) Xe Graphics (TGL GT2), OpenGL 4.6)" are rendered with shadows in mismatched colors. In the middle of the image, a very large zero, a large orange circle, a light blue star, and, in toxic purple and lime green, the text "ANURA RULES!" appears, rotated slightly by around 12°.](./samples/anura.png)

I am in love with this one. This was made by somebody with true respect for their craft. I would like the Federal Reserve to recall all dollar banknotes and replace them with whatever this is.

## DataDome

![Many different shapes in shapes of red, orange, and purple are arranged haphazardly, stretched and overlapping. Circles, arcs, the ▶️ emoji, the characters "}" and "4" are visible.](./samples/datadome-2.png)
![Another similar image, but the shapes are completely different and arranged differently. The characters "1", "SC, "4", and "F" are visible](./samples/datadome-3.png)

There's a lot going on with DataDome! This is another challenge-response situation where you get a new picture each time. This one takes a snapshot of each individual step as the picture is drawn. 

![A horizontal orange arc appears in the middle of the image.](./samples/datadome-1-a.png)
![A thin vertical green arc appears on top of the previous image.](./samples/datadome-1-b.png)
![A pink twisty shape is overlaid on top of the previous image.](./samples/datadome-1-c.png)
![A single black line is added to the left of the previous shapes.](./samples/datadome-1-d.png)
![A cyan-green arc appears in the top right corner.](./samples/datadome-1-e.png)
![The ▶️ emoji and some character, possibly "1" or "I" are added to the top of the image. The tops of the characters are cropped.](./samples/datadome-1-f.png)
![Another "1" charcter has been added to the image. It comes with a faint sort of a shadow that overlaps the rest of the image.](./samples/datadome-1-g.png)

DataDome also printed this cool warning to my console:

![A screenshot of the Chrome Developer Tools, with a log entry saying "Warning: Please close the DevTools panel before solving the captcha!".](./samples/datadome-console.png)

## PerimeterX

![A very long string of emoji, all of them depicting faces or people, rendered in a small font.](./samples/px-emoji.png)
![A very long string of random non-Latin characters, including other scripts and emoji, is rendered in a very small font. Many of the characters have failed to render and appear simply as the "tofu" replacement character.](./samples/px-unicode.png)
![A very wide image of a triangle filled with a red-yellow gradient. (The image has been cropped from its original size of 2000×200, removing large areas of empty space to the left and right of the triangle.)](./samples/processed/px-wide-triangle-cropped.png)

PerimeterX seems to be getting most of its canvas-based signal from emoji and other Unicode characters, as well as a very wide version of the WebGL triangle we've seen before.

## hCaptcha

![The 😃 is neatly centered in a small square image.](./samples/hcaptcha-1-emoji.png)
![The string of emojis ❤️🤪🎉👋 appears in the middle of a large image with lots of empty space around it.](./samples/hcaptcha-4-emoji.png)

hCaptcha also renders emoji. It also renders some small 2×2 squares whose purpose I could not immediately identify.

## Conviva

![The string "Conviva" is rendered in dark green with a light green shadow in the very top right of an otherwise empty image. The text is heavily cropped, only its bottom half is visible. Under the string there is a small red rectangle.](./samples/conviva.png)

<span style="display: inline-block; clip-path: inset(0.4lh 2em 0px 0px); text-align: center;">
NICE CROPPING,<br>SHITLORD
</span>
