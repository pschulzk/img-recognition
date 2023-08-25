import { CommonModule } from '@angular/common'
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, Output, QueryList, SimpleChange, ViewChild, ViewChildren } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { ColorUtils, FbnImageRecognitionDetection, FbnImageRecognitionDetectionFrame, rowCollapseAnimation } from '@fbn/fbn-imgrec'
import { UntilDestroy } from '@ngneat/until-destroy'
import { FbnObjectFrameComponentData, ObjectFrameComponent } from '../object-frame/object-frame.component'
import { ObjectViewerComponent } from '../object-viewer/object-viewer.component'

export interface VideoViewerConfig {
  /** base64 encoded image URL */
  videoUrl: string | undefined
  /** instantiated `Image` not embedded in DOM with original `width` and `height` */
  videoInstance: HTMLVideoElement | undefined
  /** video frame rate */
  frameRate: number
  /** width of the image in DOM */
  computedImageWidth?: number
  /** height of the image in DOM */
  computedImageHeight?: number
  /** list of detected objects in image */
  objectDetections: FbnImageRecognitionDetectionFrame[] | undefined
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
    ObjectViewerComponent,
  ],
})
export class VideoViewerComponent implements AfterViewInit, OnChanges {

  @Input() isLoading = false

  @Input() config?: VideoViewerConfig

  @Output() clickPlaceholder = new EventEmitter<void>()
  
  @ViewChild('userVideo', { static: false, read: ElementRef }) userVideo?: ElementRef<HTMLVideoElement>

  visualObjects: FbnObjectFrameComponentData[] = []
  currentFrameNumber = 0

  objectFrameIsHovered = false
  objectFrameIsEnlarged = false

  @ViewChildren(ObjectFrameComponent) objectFrames?: QueryList<ObjectFrameComponent>
  objectViewerImageDataUrl?: string
  objectViewerObjectData?: FbnImageRecognitionDetection

  videoIsPlaying = true

  constructor(
    private cd: ChangeDetectorRef,
  ) { }

  ngAfterViewInit(): void {
    if (this.userVideo?.nativeElement && this.config) {
      const { computedImageWidth, computedImageHeight } = this.getContainedSize(this.userVideo.nativeElement)
      this.config.computedImageWidth = computedImageWidth
      this.config.computedImageHeight = computedImageHeight

      this.userVideo.nativeElement.addEventListener('play', () => {
        this.videoOnPlay()
      })
      // On video playing toggle values
      this.userVideo.nativeElement.onplaying = () => {
        this.videoIsPlaying = true
      }
      // On video pause toggle values
      this.userVideo.nativeElement.onpause = () => {
        this.videoIsPlaying = false
      }
    }
  }

  ngOnChanges(changes: {
    [key in keyof this]: SimpleChange
  }): void {
    setTimeout(() => {
      if (changes.config?.previousValue !== changes.config?.currentValue && this.config) {
        // reset value
        this.visualObjects = []
  
        if (!this.userVideo?.nativeElement) {
          return
        }
        
        const { computedImageWidth, computedImageHeight } = this.getContainedSize(this.userVideo.nativeElement)
        this.config.computedImageWidth = computedImageWidth
        this.config.computedImageHeight = computedImageHeight
      }
    })
  }

  identify(index: number, item: FbnObjectFrameComponentData) {
    return item.data.id
  }

  videoOnPlay(): void {
    if (this.userVideo) {
      const video: HTMLVideoElement = this.userVideo.nativeElement
      // this.visualObjects = []
      video.requestVideoFrameCallback((timestamp, videoFrameCallbackMetadata) => this.videoFrameCallback(timestamp, videoFrameCallbackMetadata, video))
    }
  }

  videoFrameCallback(timestamp: DOMHighResTimeStamp, videoFrameCallbackMetadata: VideoFrameCallbackMetadata, videoElement: HTMLVideoElement) {
    if (this.config && this.config.computedImageWidth && this.config.computedImageHeight) {
      const computedImageWidth: number = this.config.computedImageWidth
      const computedImageHeight: number = this.config.computedImageHeight
  
      // update state
      const frameRate = this.config.frameRate
      this.currentFrameNumber = Math.round(videoFrameCallbackMetadata.mediaTime * frameRate)
      if (this.config.objectDetections?.[this.currentFrameNumber]) {
        const frameData = this.config.objectDetections[this.currentFrameNumber]
        // check if the correct frame number
        if (frameData.frame_index === this.currentFrameNumber) {
          // update visualization state
          this.updateVisualObjects(this.sortByDistanceFromCenter(frameData.detections), computedImageWidth, computedImageHeight)
        }
      }
    }

    // recursive function call
    videoElement.requestVideoFrameCallback((timestamp, metadata) => this.videoFrameCallback(timestamp, metadata, videoElement))
  }

  imageOverlayOnClicked(): void {
    if (this.userVideo?.nativeElement?.paused) {
      this.playUserVideo()
    } else {
      this.pauseUserVideo()
    }
  }

  objectFrameOnMouseOver(): void {
    this.objectFrameIsHovered = true
    this.pauseUserVideo()
    this.cd.detectChanges()
  }

  objectFrameOnMouseLeave(): void {
    if (this.objectFrameIsEnlarged) {
      return
    }
    this.objectFrameIsHovered = false
    this.playUserVideo()
    this.cd.detectChanges()
  }

  toggleEnlarge(objectData?: FbnObjectFrameComponentData): void {
    if (objectData && !this.objectFrameIsEnlarged) {
      const objectDetectionCanvas = this.objectFrames?.find((objectFrame) => objectFrame.objectData?.id === objectData.id)?.objectCanvas?.nativeElement
      // create image from canvas
      this.objectViewerObjectData = objectData.data
      this.objectViewerImageDataUrl = objectDetectionCanvas?.toDataURL()
      this.pauseUserVideo()
      this.objectFrameIsEnlarged = true
    } else {
      this.objectViewerImageDataUrl = undefined
      this.playUserVideo()
      this.objectFrameIsEnlarged = false
      this.objectFrameIsHovered = false
    }
    this.cd.detectChanges()
  }

  /**
   * Updates the visual object detection in an image or frame in the view.
   * @param nextDetections list of detected objects in image
   * @param computedImageWidth width of the HTMLImageElement embedded in the view DOM in actual rendered pixels
   * @param computedImageHeight height of the HTMLImageElement embedded in the view DOM in actual rendered pixels
   * @param enabledObjectTracking whether to enable object tracking. If enabled, existing objects will be updated and new objects will be added.
   * If disabled, all objects will be reset.
   */
  private updateVisualObjects(
    nextDetections: FbnImageRecognitionDetection[],
    computedImageWidth: number,
    computedImageHeight: number,
    enabledObjectTracking = false,
  ): void {
    const indicesToRemove: number[] = []

    // Update properties of existing objects and retain their instances
    this.visualObjects.forEach((prevDetection, index) => {
      const existingDetection = nextDetections.find(nextDetection => nextDetection.id === prevDetection.id)
      if (existingDetection) {
        prevDetection.data = existingDetection
        prevDetection.width = existingDetection.box.w * computedImageWidth
        prevDetection.height = existingDetection.box.h * computedImageHeight
        prevDetection.left = (existingDetection.box.x * computedImageWidth) - ((existingDetection.box.w * computedImageWidth) / 2)
        prevDetection.bottom = computedImageHeight - ((existingDetection.box.y * computedImageHeight) + (existingDetection.box.h * computedImageHeight) / 2)
        prevDetection.opacity = existingDetection.confidence < 0.8 ? 0.4 : 1
      } else {
        // store indices of objects to remove
        indicesToRemove.push(index)
      }
    })
  
    // remove objects
    indicesToRemove.forEach((index) => {
      this.visualObjects.splice(index, 1)
    })
  
    // Add new detections
    nextDetections.forEach((nextDetection) => {
      const detectionExists = this.visualObjects.some(obj => obj.data.id === nextDetection.id)
      if (!detectionExists) {
        this.visualObjects.push({
          data: nextDetection,
          width: nextDetection.box.w * computedImageWidth,
          height: nextDetection.box.h * computedImageHeight,
          left: (nextDetection.box.x * computedImageWidth) - ((nextDetection.box.w * computedImageWidth) / 2),
          bottom: computedImageHeight - ((nextDetection.box.y * computedImageHeight) + (nextDetection.box.h * computedImageHeight) / 2),
          color: enabledObjectTracking ? ColorUtils.getRandomBrightColor(nextDetection.id): 'white',
          opacity: nextDetection.confidence < 0.8 ? 0.4 : 1,
          enlarged: false,
          id: nextDetection.id,
        })
      }
    })

    this.cd.detectChanges()
  }

  private getContainedSize(video: HTMLVideoElement): { computedImageWidth: number, computedImageHeight: number } {
    const containerWidth = video.offsetWidth
    const containerHeight = video.offsetHeight

    const videoAspect = video.videoWidth / video.videoHeight

    let computedImageWidth, computedImageHeight

    if (containerWidth / containerHeight > videoAspect) {
      computedImageWidth = containerHeight * videoAspect
      computedImageHeight = containerHeight
    } else {
      computedImageWidth = containerWidth
      computedImageHeight = containerWidth / videoAspect
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

  // Play video function
  async playUserVideo() {      
    if (this.userVideo?.nativeElement.paused && !this.videoIsPlaying) {
      return this.userVideo?.nativeElement.play()
    }
  } 

  // Pause video function
  pauseUserVideo() {     
    if (!this.userVideo?.nativeElement.paused && this.videoIsPlaying) {
      this.userVideo?.nativeElement.pause()
    }
  }
}
