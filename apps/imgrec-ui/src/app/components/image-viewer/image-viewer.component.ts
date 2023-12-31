import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, Output, QueryList, SimpleChange, ViewChild, ViewChildren } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { ColorUtils, FbnImageRecognitionDetection, rowCollapseAnimation } from '@fbn/fbn-imgrec'
import { UntilDestroy } from '@ngneat/until-destroy'
import { FbnObjectFrameComponentData, ObjectFrameComponent } from '../object-frame/object-frame.component'
import { ObjectViewerComponent } from '../object-viewer/object-viewer.component'

export interface ImageViewerConfig {
  /** base64 encoded image URL */
  imageUrl: string | undefined
  /** instantiated `Image` not embedded in DOM with original `width` and `height` */
  imageInstance: HTMLImageElement | undefined
  /** width of the image in DOM */
  computedImageWidth?: number
  /** height of the image in DOM */
  computedImageHeight?: number
  /** list of detected objects in image */
  objectDetections: FbnImageRecognitionDetection[]
}

@UntilDestroy()
@Component({
  selector: 'fbn-image-viewer',
  templateUrl: './image-viewer.component.html',
  styleUrls: ['./image-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [rowCollapseAnimation],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ObjectFrameComponent,
    ObjectViewerComponent,
  ],
})
export class ImageViewerComponent implements OnChanges {

  @Input() isLoading = false

  @Input() config?: ImageViewerConfig
  
  @ViewChild('userImage', { static: false, read: ElementRef }) userImage?: ElementRef<HTMLImageElement>

  visualObjects: FbnObjectFrameComponentData[] = []

  objectFrameIsHovered = false
  objectFrameIsEnlarged = false

  @ViewChildren(ObjectFrameComponent) objectFrames?: QueryList<ObjectFrameComponent>
  objectViewerObjectData?: FbnImageRecognitionDetection
  objectViewerImageDataUrl?: string
  objectViewerImageDataUrlIsLoading = false

  constructor(
    private cd: ChangeDetectorRef,
  ) { }

  ngOnChanges(changes: {
    [key in keyof this]: SimpleChange
  }): void {
    if (changes.config?.previousValue !== changes.config?.currentValue && this.config) {
      // reset value
      this.visualObjects = []

      if (!this.userImage?.nativeElement) {
        return
      }
      const { computedImageWidth, computedImageHeight } = this.getContainedSize(this.userImage.nativeElement)
      this.config.computedImageWidth = computedImageWidth
      this.config.computedImageHeight = computedImageHeight

      this.visualObjects = this.sortByDistanceFromCenter(this.config.objectDetections).map((detection) => {
        return {
          data: detection,
          width: detection.box.w * computedImageWidth,
          height: detection.box.h * computedImageHeight,
          left: (detection.box.x * computedImageWidth) - ((detection.box.w * computedImageWidth) / 2),
          bottom: computedImageHeight - ((detection.box.y * computedImageHeight) + (detection.box.h * computedImageHeight) / 2),
          color: ColorUtils.getRandomBrightColor(),
          // if confidence is low than make less visible
          opacity: detection.confidence < 0.8 ? 0.4 : 1,
          enlarged: false,
          id: detection.id,
        }
      })
      this.cd.detectChanges()
    }
  }

  identify(index: number, item: FbnObjectFrameComponentData) {
    return item.data.id
  }

  async toggleEnlarge(objectData?: FbnObjectFrameComponentData): Promise<void> {
    if (objectData && !this.objectFrameIsEnlarged) {
      this.objectViewerObjectData = objectData.data
      this.objectFrameIsEnlarged = true
      // delegate generating data url to web worker
      this.objectViewerImageDataUrlIsLoading = true
      this.objectViewerImageDataUrl = await this.objectFrames?.find((objectFrame) => objectFrame.objectData?.id === objectData.id)?.getCanvasDataURL()
      if (!this.objectViewerImageDataUrl) {
        throw new Error('objectDetectionDataUrl not found')
      }
    } else {
      this.objectFrameIsEnlarged = false
      this.objectViewerImageDataUrl = undefined
      this.objectViewerObjectData = undefined
      this.objectFrameIsHovered = false
    }
    this.cd.detectChanges()
  }
  
  private getContainedSize(img: HTMLImageElement): { computedImageWidth: number, computedImageHeight: number } {
    const ratio = img.naturalWidth/img.naturalHeight
    let computedImageWidth = img.height * ratio
    let computedImageHeight = img.height
    if (computedImageWidth > img.width) {
      computedImageWidth = img.width
      computedImageHeight = img.width/ratio
    }
    return { computedImageWidth, computedImageHeight }
  }

  private getDistanceFromCenter(item: FbnImageRecognitionDetection): number {
    // Calculate the center of the item
    const itemCenterX = item.box.x + item.box.w / 2
    const itemCenterY = item.box.y + item.box.h / 2
  
    // Assuming the image grid's center is at (imageGridCenterX, imageGridCenterY)
    const imageGridCenterX = 0 // Replace with the actual center X-coordinate of the image grid
    const imageGridCenterY = 0 // Replace with the actual center Y-coordinate of the image grid
  
    // Calculate the distance from the image grid's center
    const distanceX = Math.abs(itemCenterX - imageGridCenterX)
    const distanceY = Math.abs(itemCenterY - imageGridCenterY)
  
    // Use Euclidean distance formula to get the total distance
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
    return distance
  }
  
  private sortByDistanceFromCenter(items: FbnImageRecognitionDetection[]): FbnImageRecognitionDetection[] {
    return items.sort((a, b) => {
      const distanceA = this.getDistanceFromCenter(a)
      const distanceB = this.getDistanceFromCenter(b)
      return distanceA - distanceB
    })
  }
}
