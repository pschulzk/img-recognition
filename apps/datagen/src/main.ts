import fs from 'fs'
import { FrameMetaData } from '@fbn/fbn-streaming'

console.log('Hello World')

const PATH_OUTPUT = 'apps/fbn-be/src/assets/test.ndjson'
const nb_frames = 298

const DATA: FrameMetaData[] = []

for (let i = 0; i < nb_frames; i++) {
  DATA.push({
    frameNumber: i + 1,
    visualData: {
      objects: [
        {
          x: i,
          y: i,
        },
      ],
    },
  })
}

fs.writeFile(
  PATH_OUTPUT,
  JSON.stringify(DATA, null, 2),
  err => {
    if (err) {
      console.error(err)
    }
    console.log('File written successfully!')
  }
)
