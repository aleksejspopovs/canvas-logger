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
})()
