(function () {
    const DO_NOT_HOOK_URLS = [
        'https://www.google.com/maps',
    ]
    const STUB_IMAGE_DATAURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAATCAYAAAA5+OUhAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw1AUhU9TpSKVDmYQdchQneyiIo61CkWoEGqFVh1MXn+hSUOS4uIouBYc/FmsOrg46+rgKgiCPyDODk6KLlLifUmhRYwXHu/jvHsO790HCM0q06yeOKDptplOJqRsblUKvSKAEESMIKIwy5iT5RR86+ueuqnuYjzLv+/PGsgXLAYEJOI4M0ybeIN4ZtM2OO8Ti6ys5InPiSdMuiDxI9dVj984l1wWeKZoZtLzxCKxVOpitYtZ2dSIp4mjeU2nfCHrcZ7zFmetWmfte/IXhgv6yjLXaY0iiUUsQYYEFXVUUIWNGO06KRbSdJ7w8Q+7fplcKrkqYORYQA0aFNcP/ge/Z2sVpya9pHAC6H1xnI8xILQLtBqO833sOK0TIPgMXOkdf60JzH6S3uho0SMgsg1cXHc0dQ+43AGGngzFVFwpSEsoFoH3M/qmHDB4C/SveXNrn+P0AcjQrFI3wMEhMF6i7HWfd/d1z+3fnvb8fgBMkXKX0jDwYQAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+gBBxQcIr5MNVMAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAp0lEQVRIx+1XQQ6AIAxrif//cr1oYgi6DRVBbcIBBiNboQOgD2hpVZgwNgQAqXXW7kDCC/AH0Qum/JIUwJ052pmnwjo4bHD4PmRCAYdPSK0sJmREnNu92awFo0lMDsrYkAkejOmTF5ujBcGA8nRfJ7hpTyrUZQ9ADhIAVybU+ZE3JT2dKDJybn6GUXnpkJc2w3nkCEYLGq3/BA31YUUBZKHPimS5lHEG96koK5ZOPtYAAAAASUVORK5CYII='

    function reportCanvasCapture(data, method, doc) {
        console.trace(`🎨 TRACING CANVAS ${method} ACCESS`)
        window.postMessage({
            type: 'CANVAS_CAPTURE_LOG',
            data: data,
            method: method,
            frameUrl: doc.location.href,
        })
    }

    function patchDocument(doc) {
        doc._HAS_CANVAS_HOOKS = true

        if (DO_NOT_HOOK_URLS.some((prefix) => document.location.href.startsWith(prefix))) {
            return
        }

        const _HTMLCanvasElement = doc.createElement('canvas').constructor

        const _CANVAS_DATAURL_ORIGINAL_FUNCTION = _HTMLCanvasElement.prototype.toDataURL
        _HTMLCanvasElement.prototype.toDataURL = function (...args) {
            let result = _CANVAS_DATAURL_ORIGINAL_FUNCTION.apply(this, args)
            reportCanvasCapture(result, 'toDataURL', doc)
            return result
        }

        const _CANVAS_BLOB_ORIGINAL_FUNCTION = _HTMLCanvasElement.prototype.toBlob
        _HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
            let newCallback = function (blob) {
                // converting the blob to a data URL
                let reader = new FileReader()
                reader.onload = function (event) {
                    reportCanvasCapture(event.target.result, 'toBlob', doc)
                }
                reader.readAsDataURL(blob)

                return callback(blob)
            }
            return _CANVAS_BLOB_ORIGINAL_FUNCTION.apply(this, [newCallback].concat(args))
        }

        const _CanvasRenderingContext2D = doc.createElement('canvas').getContext('2d').constructor
        const _2DCONTEXT_IMAGEDATA_ORIGINAL_FUNCTION = _CanvasRenderingContext2D.prototype.getImageData
        _CanvasRenderingContext2D.prototype.getImageData = function (sx, sy, sw, sh, ...args) {
            let result = _2DCONTEXT_IMAGEDATA_ORIGINAL_FUNCTION.apply(this, [sx, sy, sw, sh].concat(args))

            // convert ImageData to a data URL
            // let tmpCanvas = doc.createElement('canvas')
            // tmpCanvas.width = sw
            // tmpCanvas.height = sh
            // let tmpContext = tmpCanvas.getContext('2d')
            // tmpContext.putImageData(result, 0, 0)
            // let dataUrl = _CANVAS_DATAURL_ORIGINAL_FUNCTION.apply(tmpCanvas, [])

            const dataUrl = _CANVAS_DATAURL_ORIGINAL_FUNCTION.apply(this.canvas, [])

            reportCanvasCapture(dataUrl, `2d.getImageData(${sx}, ${sy}, ${sw}, ${sh})`, doc)
            return result
        }

        /*
            The entire reason that we do this doc.createElement('blah').constructor dance
            instead of acting directly on e.g. HTMLCanvasElement is that that would leave
            one way for a website to get an unmodified instance of HTMLCanvasElement:

            1. Create an iframe with src=about:blank and sandbox=allow-same-origin
            2. Because the iframe is sandboxed, no JavaScript runs inside it, including
               this content script, so the HTMLCanvasElement inside of it is unmodified.
            3. Because of allow-same-origin, the parent document can grab
               iframe.contentDocument, which is a reference to the document inside the
               iframe, and call iframe.contentDocument.createElement('canvas') to get
               a canvas that's been created inside the iframe.

            (https://browserleaks.com/canvas does exactly this.)

            But two can play at this game! To prevent this, we hook HTMLIFrameElement
            .contentDocument to grab the contentDocument and re-run the hooking code on
            it (which is still running inside the parent frame and now using the exact
            same trick to get a reference to HTMLCanvasElement inside the frame) before
            returning it.

            Notice that this is recursive! You could have a sandboxed iframe with a
            sandboxed iframe inside it, but this will still hook the innermost iframe too.

            Hooking HTMLIFrameElement.contentDocument is a little more involved than the
            stuff we do above because it is a getter, not a simple method.
        */
        const _HTMLIFrameElement = doc.createElement('iframe').constructor
        const _IFRAME_CONTENTDOCUMENT_ORIGINAL_FUNCTION = Object
            .getOwnPropertyDescriptor(_HTMLIFrameElement.prototype, 'contentDocument')
            .get
        Object.defineProperty(_HTMLIFrameElement.prototype, 'contentDocument', {
            configurable: true,
            enumerable: true,
            get() {
                let contentDoc = _IFRAME_CONTENTDOCUMENT_ORIGINAL_FUNCTION.apply(this)
                if (!contentDoc._HAS_CANVAS_HOOKS) {
                    patchDocument(contentDoc)
                }
                return contentDoc
            }
        })

        // iframe.contentWindow.document is another way to get to the contentDocument
        // without triggering the contentDocument getter.
        // (or you could also directly go for iframe.contentWindow.HTMLCanvasElement
        // but this hook takes care of that as well)
        const _IFRAME_CONTENTWINDOW_ORIGINAL_FUNCTION = Object
            .getOwnPropertyDescriptor(_HTMLIFrameElement.prototype, 'contentWindow')
            .get
        Object.defineProperty(_HTMLIFrameElement.prototype, 'contentWindow', {
            configurable: true,
            enumerable: true,
            get() {
                let contentWin = _IFRAME_CONTENTWINDOW_ORIGINAL_FUNCTION.apply(this)
                try {
                    if (!contentWin.document._HAS_CANVAS_HOOKS) {
                        patchDocument(contentWin.document)
                    }
                } catch {

                }
                return contentWin
            }
        })

        // TODO: you can still bypass this, though, by accessing the frame as
        // window.frames[0] or window[0], and I don't immediately see how to fix that.

        function stub(methodName, proto, functionName) {
            const original = proto[functionName]
            proto[functionName] = function (...args) {
                let result = original.apply(this, args)

                reportCanvasCapture(STUB_IMAGE_DATAURL, `stub: ${methodName}`, doc)

                return result
            }
        }

        const _WebGLRenderingContext = doc.createElement('canvas').getContext('webgl').constructor
        const _WebGL2RenderingContext = doc.createElement('canvas').getContext('webgl2').constructor

        const _WEBGL_READPIXELS_ORIGINAL_FUNCTION = _WebGLRenderingContext.prototype.readPixels
        _WebGLRenderingContext.prototype.readPixels = function (x, y, w, h, ...args) {
            const result = _WEBGL_READPIXELS_ORIGINAL_FUNCTION.apply(this, [x, y, w, h].concat(args))

            // intercepting the pixels we just read and drawing them back onto a temp canvas
            // seems annoying (you have to account for different pixel formats and datatypes,
            // there isn't a direct writePixels function, etc). so instead let's just call
            // toDataURL to get the whole canvas, and log the cropping params in case we want
            // to look at those manually.
            const dataUrl = _CANVAS_DATAURL_ORIGINAL_FUNCTION.apply(this.canvas, [])
            reportCanvasCapture(dataUrl, `webgl.readPixels(${x}, ${y}, ${w}, ${h})`, doc)

            return result
        }

        const _WEBGL2_READPIXELS_ORIGINAL_FUNCTION = _WebGL2RenderingContext.prototype.readPixels
        _WebGL2RenderingContext.prototype.readPixels = function (x, y, w, h, ...args) {
            const result = _WEBGL2_READPIXELS_ORIGINAL_FUNCTION.apply(this, [x, y, w, h].concat(args))

            const dataUrl = _CANVAS_DATAURL_ORIGINAL_FUNCTION.apply(this.canvas, [])
            reportCanvasCapture(dataUrl, `webgl2.readPixels(${x}, ${y}, ${w}, ${h})`, doc)

            return result
        }

        // stub('webgl.readPixels', _WebGLRenderingContext.prototype, 'readPixels')
        stub('webgl.copyTexImage2D', _WebGLRenderingContext.prototype, 'copyTexImage2D')
        stub('webgl.copyTexSubImage2D', _WebGLRenderingContext.prototype, 'copyTexSubImage2D')
        // stub('webgl2.readPixels', _WebGL2RenderingContext.prototype, 'readPixels')
        stub('webgl2.copyTexImage2D', _WebGL2RenderingContext.prototype, 'copyTexImage2D')
        stub('webgl2.copyTexSubImage2D', _WebGL2RenderingContext.prototype, 'copyTexSubImage2D')
        stub('webgl2.copyTexSubImage2D', _WebGL2RenderingContext.prototype, 'copyTexSubImage2D')
    }

    patchDocument(document)
})()
