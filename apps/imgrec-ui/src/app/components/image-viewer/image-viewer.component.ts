import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { ColorUtils, FbnImageRecognitionDetection, rowCollapseAnimation } from '@fbn/fbn-imgrec'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy'
import { BehaviorSubject, combineLatest } from 'rxjs'
import { ObjectFrameComponent, VisualObjectData } from '../object-frame/object-frame.component'

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
export class ImageViewerComponent implements OnInit {

  @Input() isLoading = false

  @Input() set imgUrl(value: string | undefined) {
    this.imgUrl$.next(value)
  }
  get imgUrl(): string | undefined {
    return this.imgUrl$.getValue()
  }
  imgUrl$ = new BehaviorSubject<string | undefined>(undefined)
  @Input() set objectDetections(value: FbnImageRecognitionDetection[]) {
    this.objectDetections$.next(value)
  }
  get objectDetections(): FbnImageRecognitionDetection[] {
    return this.objectDetections$.getValue()
  }
  objectDetections$ = new BehaviorSubject<FbnImageRecognitionDetection[]>([])

  @Output() clickPlaceholder = new EventEmitter<void>()
  
  imageWidth?: number
  imageHeight?: number

  visualObjects: VisualObjectData[] = []
  
  @ViewChild('userImage', { static: false, read: ElementRef }) userImage?: ElementRef<HTMLImageElement>

  ngOnInit(): void {
    // subscribe to both change because they do depend on each other
    combineLatest([
      this.objectDetections$.asObservable(),
      this.imgUrl$.asObservable(),
    ]).pipe(
      untilDestroyed(this),
    ).subscribe(([objectDetections]) => {

      this.visualObjects = []

      if (!this.userImage?.nativeElement) {
        return
      }
      const { imageWidth, imageHeight } = this.getContainedSize(this.userImage.nativeElement)
      this.imageWidth = imageWidth
      this.imageHeight = imageHeight

      this.visualObjects = this.sortByDistanceFromCenter(objectDetections).map((detection) => {
        return {
          data: detection,
          width: detection.box.w * imageWidth,
          height: detection.box.h * imageHeight,
          left: (detection.box.x * imageWidth) - ((detection.box.w * imageWidth) / 2),
          bottom: imageHeight - ((detection.box.y * imageHeight) + (detection.box.h * imageHeight) / 2),
          color: ColorUtils.getRandomBrightColor(),
          // if confidence is low than make less visible
          opacity: detection.confidence < 0.8 ? 0.4 : 1,
        }
      })
    })
  }

  identify(index: number, item: VisualObjectData) {
    return String(item.data.confidence)
  }

  getContainedSize(img: HTMLImageElement): { imageWidth: number, imageHeight: number } {
    const ratio = img.naturalWidth/img.naturalHeight
    let imageWidth = img.height * ratio
    let imageHeight = img.height
    if (imageWidth > img.width) {
      imageWidth = img.width
      imageHeight = img.width/ratio
    }
    return { imageWidth, imageHeight }
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
