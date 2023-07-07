import fs from 'fs'

console.log('Hello World')

const nb_frames = 298

export interface FrameMetaData {
    frameNumber: number
    visualData: FrameVisualData
}

export interface FrameVisualData {
    objects: ObjectData[]
}

export interface ObjectData {
    x: number
    y: number
}

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
  'dist/test.json',
  JSON.stringify(DATA, null, 2),
  err => {
    if (err) {
      console.error(err)
    }
    console.log('File written successfully!')
  }
)
