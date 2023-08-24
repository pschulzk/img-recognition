import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChange, ViewChild } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { ColorUtils, FbnImageRecognitionDetection, rowCollapseAnimation } from '@fbn/fbn-imgrec'
import { UntilDestroy } from '@ngneat/until-destroy'
import { FbnObjectFrameComponentData, ObjectFrameComponent } from '../object-frame/object-frame.component'

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
  ],
})
export class ImageViewerComponent implements OnChanges {

  @Input() isLoading = false

  @Input() config?: ImageViewerConfig

  @Output() clickPlaceholder = new EventEmitter<void>()
  
  @ViewChild('userImage', { static: false, read: ElementRef }) userImage?: ElementRef<HTMLImageElement>

  visualObjects: FbnObjectFrameComponentData[] = []

  objectFrameIsHovered = false
  objectFrameIsEnlarged = false

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

  toggleEnlarge(objectData: FbnObjectFrameComponentData): void {
    if (!this.userImage?.nativeElement || !this.config?.imageInstance) {
      return
    }
  
    const isLandscape = objectData.width > objectData.height
    const widthHeightDifference = Math.abs(objectData.width - objectData.height)
    const isNearlySquare = widthHeightDifference < 40
    const margin = isNearlySquare ? 200 : 50 // Constant margin in pixels
    const { computedImageWidth, computedImageHeight } = this.getContainedSize(this.userImage.nativeElement)
  
    if (objectData.enlarged) {
      // revert to original size
      objectData.width = objectData.data.box.w * computedImageWidth
      objectData.height = objectData.data.box.h * computedImageHeight
      objectData.left = (objectData.data.box.x * computedImageWidth) - ((objectData.data.box.w * computedImageWidth) / 2)
      objectData.bottom = computedImageHeight - ((objectData.data.box.y * computedImageHeight) + (objectData.data.box.h * computedImageHeight) / 2)
      objectData.enlarged = false
      this.objectFrameIsEnlarged = false
    } else {
      if (isLandscape) {
        // get factor of how much computedImageWidth is larger than objectData.width
        const ratio = (computedImageWidth - margin * 2) / objectData.width
        const targetWidth = computedImageWidth - margin * 2
        const targetHeight = objectData.height * ratio
  
        objectData.width = targetWidth
        objectData.height = targetHeight
        // Calculate centering for landscape frames
        objectData.left = (computedImageWidth - targetWidth) / 2
        objectData.bottom = (computedImageHeight - targetHeight) / 2
      } else {
        // get factor of how much computedImageHeight is larger than objectData.height
        const ratio = (computedImageHeight - margin * 2) / objectData.height
        const targetHeight = computedImageHeight - margin * 2
        const targetWidth = objectData.width * ratio
  
        objectData.width = targetWidth
        objectData.height = targetHeight
        // Center horizontally and vertically for portrait frames
        objectData.left = (computedImageWidth - targetWidth) / 2
        objectData.bottom = (computedImageHeight - targetHeight) / 2
      }
      objectData.enlarged = true
      this.objectFrameIsEnlarged = true
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
