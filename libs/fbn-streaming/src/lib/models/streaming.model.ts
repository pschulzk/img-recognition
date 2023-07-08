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
