import { CommonModule } from '@angular/common'
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChange, ViewChild } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { ColorUtils, FbnImageRecognitionDetection, FbnVideoRecognitionResponse, rowCollapseAnimation } from '@fbn/fbn-imgrec'
import { UntilDestroy } from '@ngneat/until-destroy'
import { ObjectFrameComponent, VisualObjectData } from '../object-frame/object-frame.component'

export interface VideoViewerConfig {
  /** base64 encoded image URL */
  videoUrl: string | undefined
  /** instantiated `Image` not embedded in DOM with original `width` and `height` */
  videoInstance: HTMLVideoElement | undefined
  /** width of the image in DOM */
  computedImageWidth?: number
  /** height of the image in DOM */
  computedImageHeight?: number
  /** list of detected objects in image */
  objectDetections: FbnVideoRecognitionResponse | undefined
}

@UntilDestroy()
@Component({
  selector: 'fbn-video-viewer',
  templateUrl: './video-viewer.component.html',
  styleUrls: ['./video-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [rowCollapseAnimation],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ObjectFrameComponent,
  ],
})
export class VideoViewerComponent implements AfterViewInit, OnChanges {

  @Input() isLoading = false

  @Input() config?: VideoViewerConfig

  @Output() clickPlaceholder = new EventEmitter<void>()
  
  @ViewChild('userVideo', { static: false, read: ElementRef }) userVideo?: ElementRef<HTMLVideoElement>

  visualObjects: VisualObjectData[] = []

  objectFrameIsHovered = false
  objectFrameIsEnlarged = false

  constructor(
    private cd: ChangeDetectorRef,
  ) { }

  ngAfterViewInit(): void {
    if (this.userVideo?.nativeElement && this.config) {
      const { computedImageWidth, computedImageHeight } = this.getContainedSize(this.userVideo.nativeElement)
      this.config.computedImageWidth = computedImageWidth
      this.config.computedImageHeight = computedImageHeight

      this.userVideo.nativeElement.addEventListener('play', () => this.videoOnPlay())
      console.log('!!! ngAfterViewInit', computedImageWidth, computedImageHeight)
    }
  }

  ngOnChanges(changes: {
    [key in keyof this]: SimpleChange
  }): void {
    if (changes.config?.previousValue !== changes.config?.currentValue && this.config) {
      // reset value
      this.visualObjects = []

      if (!this.userVideo?.nativeElement) {
        return
      }
      const { computedImageWidth, computedImageHeight } = this.getContainedSize(this.userVideo.nativeElement)
      this.config.computedImageWidth = computedImageWidth
      this.config.computedImageHeight = computedImageHeight
      console.log('!!! ngOnChanges', computedImageWidth, computedImageHeight)
    }
  }

  identify(index: number, item: VisualObjectData) {
    return item.data.id
  }

  videoOnPlay(): void {
    if (this.userVideo) {
      const video: HTMLVideoElement = this.userVideo.nativeElement
      video.requestVideoFrameCallback((timestamp, videoFrameCallbackMetadata) => this.videoFrameCallback(timestamp, videoFrameCallbackMetadata, video))
    }
  }

  videoFrameCallback(timestamp: DOMHighResTimeStamp, videoFrameCallbackMetadata: VideoFrameCallbackMetadata, videoElement: HTMLVideoElement) {
    console.log('!!! this.visualObjects', this.visualObjects)
    if (this.config && this.config.computedImageWidth && this.config.computedImageHeight) {
      const computedImageWidth: number = this.config.computedImageWidth
      const computedImageHeight: number = this.config.computedImageHeight
      console.log(`timestamp: ${ timestamp } | frame: ${ JSON.stringify( videoFrameCallbackMetadata, null, 4 ) }`)
  
      // update state
      const frameRate = this.config.videoInstance?.getVideoPlaybackQuality()?.droppedVideoFrames || 30
      const currentFrameNumber = Math.round(videoFrameCallbackMetadata.mediaTime * frameRate)
      if (this.config.objectDetections?.frames[currentFrameNumber]) {
        const frameData = this.config.objectDetections?.frames[currentFrameNumber]
        // check if the correct frame number
        if (frameData.frameIndex === currentFrameNumber) {
          // update visualization state
          this.visualObjects = this.sortByDistanceFromCenter(frameData.detections).map((detection) => {
            return {
              data: detection,
              width: detection.box.w * computedImageWidth,
              height: detection.box.h * computedImageHeight,
              left: (detection.box.x * computedImageWidth) - ((detection.box.w * computedImageWidth) / 2),
              bottom: computedImageHeight - ((detection.box.y * computedImageHeight) + (detection.box.h * computedImageHeight) / 2),
              color: 'blue',
              // if confidence is low than make less visible
              opacity: detection.confidence < 0.8 ? 0.4 : 1,
              enlarged: false,
            }
          })
          this.cd.detectChanges()
        }
      }
    }

    // recursive function call
    videoElement.requestVideoFrameCallback((timestamp, metadata) => this.videoFrameCallback(timestamp, metadata, videoElement))
  }

  toggleEnlarge(objectData: VisualObjectData): void {
    if (!this.userVideo?.nativeElement || !this.config?.videoInstance) {
      return
    }
  
    const isLandscape = objectData.width > objectData.height
    const widthHeightDifference = Math.abs(objectData.width - objectData.height)
    const isNearlySquare = widthHeightDifference < 40
    const margin = isNearlySquare ? 200 : 50 // Constant margin in pixels
    const { computedImageWidth, computedImageHeight } = this.getContainedSize(this.userVideo.nativeElement)
  
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
  

  private getContainedSize(video: HTMLVideoElement): { computedImageWidth: number, computedImageHeight: number } {
    console.log('!!! video.videoWidth, video.videoHeight', video.videoWidth, video.videoHeight);
    const ratio = video.videoWidth/video.videoHeight
    let computedImageWidth = video.height * ratio
    let computedImageHeight = video.height
    if (computedImageWidth > video.width) {
      computedImageWidth = video.width
      computedImageHeight = video.width/ratio
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
