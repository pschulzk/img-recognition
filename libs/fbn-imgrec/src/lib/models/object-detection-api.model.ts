export interface FbnHealthCheckResponse {
  /** status of the service */
  status: 'pass' | 'fail',
}

export interface FbnVideoUploadResponse {
  /** message indicating functional details */
  description: string,
  /** uploaded video file uuid */
  fileId: string,
}

export interface FbnVideoRecognitionResponse {
  frames: {
    /** index of video frame starting with 0 */
    frameIndex: number,
    detections: FbnImageRecognitionDetection[],
  }[],
}

export interface FbnImageRecognitionResponse {
  detections: FbnImageRecognitionDetection[]
}

export interface FbnImageRecognitionDetection {
  /** size and position in percentage ranging from 0 to 1 */
  box: {
    h: number,
    w: number,
    x: number,
    y: number,
  },
  /** guessed kind of detected object */
  class_name: string,
  /** confidence the detected object is classified */
  confidence: number,
  /** for debugging purposes */
  class_index?: number,
  /** unique detection uuid */
  id: string
}
