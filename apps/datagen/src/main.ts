import fs from 'fs'
import { FrameMetaData } from '@fbn/fbn-streaming'

console.log('Hello World')

const PATH_OUTPUT = 'apps/fbn-be/src/assets/test.ndjson'
const nb_frames = 298

fs.writeFile(
  PATH_OUTPUT,
  '',
  err => {
    if (err) {
      console.error(err)
    }
    console.log('File written successfully!')
  }
)

const stream = fs.createWriteStream(PATH_OUTPUT, { flags: 'a' })
stream.once('open', () => {
  for (let i = 0; i < nb_frames; i++) {
    const frameMetaDataRow: FrameMetaData = {
      frameNumber: i + 1,
      visualData: {
        objects: [
          {
            x: i,
            y: i,
            label: 'test 1',
          },
          {
            x: i + 25,
            y: i + 25,
            label: 'test 2',
          },
        ],
      },
    }
    stream.write(JSON.stringify(frameMetaDataRow) + '\r\n')
  }
})
