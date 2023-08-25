/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const blob = data.imageBlob
  const reader = new FileReader()
  reader.onload = (e) => {
    postMessage(e.target.result)
  }
  reader.readAsDataURL(blob)
})
