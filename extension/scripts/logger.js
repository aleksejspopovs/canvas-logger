function generateUuid() {
  let chars = []
  const alphabet = '0123456789abcdef'
  for (let i = 0; i < 16; i++) {
    chars.push(alphabet[Math.floor(Math.random() * alphabet.length)])
  }
  return chars.join('')
}

window.addEventListener("message", (event) => {
  // We only accept messages from ourselves
  if (event.source !== window) {
    return;
  }

  if (event.data.type && (event.data.type === 'CANVAS_DATAURL_LOG')) {
    const uuid = generateUuid()
    const data = event.data.result
    const url = document.location.href
    const time = new Date().toJSON()

    let objects = {}
    objects[`log_${time}_${uuid}`] = {url, data, time}
    chrome.storage.local.set(objects)

    console.log(`🎨 LOGGED CANVAS DATA URL ${uuid}`)
  }
}, false);
