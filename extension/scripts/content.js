(function () {
    const _CANVAS_DATAURL_ORIGINAL_FUNCTION = HTMLCanvasElement.prototype.toDataURL
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
        let result = _CANVAS_DATAURL_ORIGINAL_FUNCTION.apply(this, args)
        window.postMessage({
            type: 'CANVAS_CAPTURE_LOG',
            data: result,
            method: 'toDataURL',
        })
        return result
    }

    const _CANVAS_BLOB_ORIGINAL_FUNCTION = HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
        let newCallback = function (blob) {
            // converting the blob to a data URL
            let reader = new FileReader()
            reader.onload = function (event) {
                window.postMessage({
                    type: 'CANVAS_CAPTURE_LOG',
                    data: event.target.result,
                    method: 'toBlob',
                })
            }
            reader.readAsDataURL(blob)

            return callback(blob)
        }
        return _CANVAS_BLOB_ORIGINAL_FUNCTION.apply(this, [newCallback].concat(args))
    }

    const _2DCONTEXT_IMAGEDATA_ORIGINAL_FUNCTION = CanvasRenderingContext2D.prototype.getImageData
    CanvasRenderingContext2D.prototype.getImageData = function (sx, sy, sw, sh, ...args) {
        let result = _2DCONTEXT_IMAGEDATA_ORIGINAL_FUNCTION.apply(this, [sx, sy, sw, sh].concat(args))

        // convert ImageData to a data URL
        let tmpCanvas = document.createElement('canvas')
        tmpCanvas.width = sw
        tmpCanvas.height = sh
        let tmpContext = tmpCanvas.getContext('2d')
        tmpContext.putImageData(result, 0, 0)
        let dataUrl = _CANVAS_DATAURL_ORIGINAL_FUNCTION.apply(tmpCanvas, [])

        window.postMessage({
            type: 'CANVAS_CAPTURE_LOG',
            data: dataUrl,
            method: `2d.getImageData(${sx}, ${sy}, ${sw}, ${sh})`,
        })
        return result
    }

    function stub(methodName, proto, functionName) {
        const original = proto[functionName]
        proto[functionName] = function (...args) {
            let result = original.apply(this, args)

            window.postMessage({
                type: 'CANVAS_CAPTURE_LOG',
                data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAATCAYAAAA5+OUhAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw1AUhU9TpSKVDmYQdchQneyiIo61CkWoEGqFVh1MXn+hSUOS4uIouBYc/FmsOrg46+rgKgiCPyDODk6KLlLifUmhRYwXHu/jvHsO790HCM0q06yeOKDptplOJqRsblUKvSKAEESMIKIwy5iT5RR86+ueuqnuYjzLv+/PGsgXLAYEJOI4M0ybeIN4ZtM2OO8Ti6ys5InPiSdMuiDxI9dVj984l1wWeKZoZtLzxCKxVOpitYtZ2dSIp4mjeU2nfCHrcZ7zFmetWmfte/IXhgv6yjLXaY0iiUUsQYYEFXVUUIWNGO06KRbSdJ7w8Q+7fplcKrkqYORYQA0aFNcP/ge/Z2sVpya9pHAC6H1xnI8xILQLtBqO833sOK0TIPgMXOkdf60JzH6S3uho0SMgsg1cXHc0dQ+43AGGngzFVFwpSEsoFoH3M/qmHDB4C/SveXNrn+P0AcjQrFI3wMEhMF6i7HWfd/d1z+3fnvb8fgBMkXKX0jDwYQAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+gBBxQcIr5MNVMAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAp0lEQVRIx+1XQQ6AIAxrif//cr1oYgi6DRVBbcIBBiNboQOgD2hpVZgwNgQAqXXW7kDCC/AH0Qum/JIUwJ052pmnwjo4bHD4PmRCAYdPSK0sJmREnNu92awFo0lMDsrYkAkejOmTF5ujBcGA8nRfJ7hpTyrUZQ9ADhIAVybU+ZE3JT2dKDJybn6GUXnpkJc2w3nkCEYLGq3/BA31YUUBZKHPimS5lHEG96koK5ZOPtYAAAAASUVORK5CYII=',
                method: `stub: ${methodName}`,
            })

            return result
        }
    }

    stub('webgl.readPixels', WebGLRenderingContext.prototype, 'readPixels')
    stub('webgl.copyTexImage2D', WebGLRenderingContext.prototype, 'copyTexImage2D')
    stub('webgl.copyTexSubImage2D', WebGLRenderingContext.prototype, 'copyTexSubImage2D')
    stub('webgl2.readPixels', WebGL2RenderingContext.prototype, 'readPixels')
    stub('webgl2.copyTexImage2D', WebGL2RenderingContext.prototype, 'copyTexImage2D')
    stub('webgl2.copyTexSubImage2D', WebGL2RenderingContext.prototype, 'copyTexSubImage2D')
    stub('webgl2.copyTexSubImage2D', WebGL2RenderingContext.prototype, 'copyTexSubImage2D')
})()
