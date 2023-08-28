import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core'
import { FbnImageRecognitionDetection, rowCollapseAnimation } from '@fbn/fbn-imgrec'

export interface FbnObjectFrameComponentData {
  data: FbnImageRecognitionDetection
  width: number
  height: number
  left: number
  bottom: number
  color: string
  opacity: number
  enlarged: boolean
  id: string
}

@Component({
  selector: 'fbn-object-frame',
  templateUrl: './object-frame.component.html',
  styleUrls: ['./object-frame.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [rowCollapseAnimation],
  standalone: true,
  imports: [CommonModule],
})
export class ObjectFrameComponent implements OnChanges {

  @Input() objectData?: FbnObjectFrameComponentData
  @Input() hasLoaded?: boolean = false
  @Input() imageInstance?: HTMLImageElement
  @Input() videoInstance?: HTMLVideoElement
  @Input() videoDomElement?: HTMLVideoElement
  @Input() computedImageWidth?: number
  @Input() computedImageHeight?: number

  @ViewChild('objectCanvas', { static: false, read: ElementRef })
    objectCanvas?: ElementRef<HTMLCanvasElement>

  context: CanvasRenderingContext2D | null = null

  constructor(
    private cd: ChangeDetectorRef,
  ) {}

  ngOnChanges(): void {
    this.drawImageOnCanvas()
  }

  drawImageOnCanvas(): void {
    this.cd.detectChanges()
    if (this.hasLoaded && this.objectCanvas && this.objectData && this.computedImageWidth && this.computedImageHeight && (this.imageInstance || this.videoDomElement)) {

      this.context = this.objectCanvas.nativeElement.getContext('2d')
      if (!this.context) {
        throw new Error('Could not get 2d context from canvas')
      }
      const instanceWidth = this.imageInstance?.width || this.videoDomElement?.videoWidth
      const instanceHeight = this.imageInstance?.height || this.videoDomElement?.videoHeight
      if (!instanceWidth || !instanceHeight) {
        throw new Error('Could not get instance width or height')
      }
      
      const scaleWidth = instanceWidth / this.computedImageWidth
      const scaleHeight = instanceHeight / this.computedImageHeight
  
      const sourceX = this.objectData.left * scaleWidth
      const sourceY = instanceHeight - ((this.objectData.bottom + this.objectData.height) * scaleHeight)
      const sourceWidth = this.objectData.width * scaleWidth
      const sourceHeight = this.objectData.height * scaleHeight
  
      // Set canvas dimensions based on high-resolution values
      this.objectCanvas.nativeElement.width = sourceWidth * window.devicePixelRatio
      this.objectCanvas.nativeElement.height = sourceHeight * window.devicePixelRatio
  
      const destX = 0
      const destY = 0
      const destWidth = this.objectCanvas.nativeElement.width
      const destHeight = this.objectCanvas.nativeElement.height
  
      // Clear the canvas before drawing
      this.context.clearRect(0, 0, destWidth, destHeight)

      let instance: CanvasImageSource | undefined
      if (this.imageInstance) {
        instance = this.imageInstance
      }
      if (this.videoDomElement) {
        instance = this.videoDomElement
      }
      if (!instance) {
        throw new Error('Could not get instance')
      }
      // Draw the image on the canvas
      this.context.drawImage(
        instance,
        sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle
        destX, destY, destWidth, destHeight // Destination rectangle
      )
      this.cd.detectChanges()
    }
  }

  /**
   * Get the canvas data url. This is done in a web worker to prevent blocking the main thread, since
   * generating data url is rather resource intensive and can cause the UI to freeze.
   * @param canvasToImageQuality The quality of the generated image
  */
  async getCanvasDataURL(canvasToImageQuality = 1): Promise<string> {
    if (!this.objectCanvas) {
      throw new Error('objectCanvas not found')
    }
    const canvasWorker = new Worker(new URL('../../canvas-worker.worker', import.meta.url), { type: 'module' })
    const workerResponse = new Promise<string>((resolve) => {
      canvasWorker.onmessage = (event) => {
        resolve(event.data)
      }
    })
    // prepare image data for web worker
    this.objectCanvas.nativeElement.toBlob((imageBlob) => {
      if (!imageBlob) {
        throw new Error('Image blob not defined')
      }
      canvasWorker.postMessage({
        imageBlob,
      })
    }, 'image/jpeg', canvasToImageQuality)

    return await workerResponse
  }
}
