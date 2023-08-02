export interface FbnImageRecognitionResponse {
    detections: FbnImageRecognitionDetection[]
}

export interface FbnImageRecognitionDetection {
    box: {
        h: number,
        w: number,
        x: number,
        y: number,
    },
    class_name: string,
    confidence: number,
    class_index?: number,
}
