import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, SimpleChange, ViewChild } from '@angular/core'
import { FbnImageRecognitionDetection, rowCollapseAnimation } from '@fbn/fbn-imgrec'

export interface VisualObjectData {
  data: FbnImageRecognitionDetection
  width: number
  height: number
  left: number
  bottom: number
  color: string
  opacity: number
  enlarged: boolean
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

  @Input() objectData?: VisualObjectData
  @Input() hasLoaded?: boolean = false
  @Input() imageInstance?: HTMLImageElement
  @Input() videoInstance?: HTMLVideoElement
  @Input() computedImageWidth?: number
  @Input() computedImageHeight?: number

  @ViewChild('objectCanvas', { static: false, read: ElementRef }) objectCanvas?: ElementRef<HTMLCanvasElement>

  context: CanvasRenderingContext2D | null = null

  constructor(
    private cd: ChangeDetectorRef,
  ) { }

  ngOnChanges(changes: {
    [key in keyof this]: SimpleChange
  }): void {
    if (changes.hasLoaded?.previousValue !== changes.hasLoaded?.currentValue || changes.objectData?.currentValue) {
      this.drawImageOnCanvas()
    }
  }

  drawImageOnCanvas(): void {
    this.cd.detectChanges()
    if (this.hasLoaded && this.objectCanvas && this.objectData && this.computedImageWidth && this.computedImageHeight && (this.imageInstance || this.videoInstance)) {

      this.context = this.objectCanvas.nativeElement.getContext('2d')
      if (!this.context) {
        throw new Error('Could not get 2d context from canvas')
      }
      const instanceWidth = this.imageInstance?.width || this.videoInstance?.videoWidth
      const instanceHeight = this.imageInstance?.height || this.videoInstance?.videoHeight
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
  
      if (this.imageInstance) {
        // Draw the image on the canvas
        this.context.drawImage(
          this.imageInstance, // The Image instance
          sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle
          destX, destY, destWidth, destHeight // Destination rectangle
        )
      }
      this.cd.detectChanges()
    }
  }
}
