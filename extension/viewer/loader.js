const loadEntries = () => {
  const statusElement = document.getElementById('status')
  const rootElement = document.getElementById('log')

  statusElement.innerText = 'Reading storage'

  chrome.storage.local.get(
    null,
    (items) => {
      let sections = {}

      let keys = Object.keys(items)
      keys.sort()
      
      for (let key of keys) {
        let item = items[key]

        let host = new URL(item.url).host || '[none]'
        if (!sections.hasOwnProperty(host)) {
          let hostSection = document.createElement('div')
          
          let hostTitle = document.createElement('h2')
          hostTitle.innerText = host
          hostSection.appendChild(hostTitle)

          let hostList = document.createElement('ul')
          hostSection.appendChild(hostList)
          sections[host] = hostList

          rootElement.append(hostSection)
        }

        let itemElement = document.createElement('li')

        let descElement = document.createElement('p')
        descElement.innerText = `${key} on ${item.url}`
        itemElement.appendChild(descElement)

        let image = document.createElement('img')
        image.src = item.data
        itemElement.appendChild(image)

        let base64 = document.createElement('textarea')
        base64.value = item.data
        itemElement.appendChild(base64)

        sections[host].appendChild(itemElement)
      }

      statusElement.innerText = `${keys.length} canvases loaded`
    }
  );
};

document.addEventListener('DOMContentLoaded', loadEntries);
