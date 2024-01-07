function groupBy(func, list) {
  let result = []
  let knownGroups = {}

  for (let element of list) {
    let group = func(element)
    if (!knownGroups.hasOwnProperty(group)) {
      knownGroups[group] = []
      result.push([group, knownGroups[group]])
    }
    knownGroups[group].push(element)
  }

  return result
}

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

      let groupedItems = groupBy(
        (item) => (new URL(item.url).host) || '[none]',
        Array.from(keys, (key) => { 
          return {key, ...items[key]}
        }),
      )

      for (let [host, hostItems] of groupedItems) {
        let hostSection = document.createElement('div')
        
        let hostTitle = document.createElement('h2')
        hostTitle.innerText = host
        hostSection.appendChild(hostTitle)

        let hostList = document.createElement('ul')
        hostSection.appendChild(hostList)
       
        rootElement.append(hostSection)

        let knownData = {}

        for (let item of hostItems) {
          let itemElement = document.createElement('li')

          let descElement = document.createElement('p')
          descElement.innerText = `${item.key} on ${item.url} (${item.method || 'toDataURL'})`
          itemElement.appendChild(descElement)

          if (knownData.hasOwnProperty(item.data)) {
            knownData[item.data].appendChild(itemElement)
            continue
          }

          let image = document.createElement('img')
          image.src = item.data
          itemElement.appendChild(image)

          let base64 = document.createElement('textarea')
          base64.value = item.data
          itemElement.appendChild(base64)

          let extraList = document.createElement('ul')
          knownData[item.data] = extraList
          itemElement.append(extraList)

          hostList.appendChild(itemElement)
        }
      }

      statusElement.innerText = `${keys.length} canvases loaded`
    }
  );
};

document.addEventListener('DOMContentLoaded', loadEntries);
