(function () {
    const _CANVAS_DATAURL_ORIGINAL_FUNCTION = HTMLCanvasElement.prototype.toDataURL
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
        let result = _CANVAS_DATAURL_ORIGINAL_FUNCTION.apply(this, args)
        window.postMessage({
            type: 'CANVAS_DATAURL_LOG',
            result: result,
        })
        return result
    }
})()
