import { OverlayContainer } from '@angular/cdk/overlay'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core'
import { MatSlideToggleChange } from '@angular/material/slide-toggle'
import { ColorUtils, FbnImageRecognitionDetection, FbnImageRecognitionResponse, rowCollapseAnimation } from '@fbn/fbn-imgrec'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy'
import { BehaviorSubject, finalize } from 'rxjs'
import { ImageRecognitionService } from './services/image-recognition/image-recognition.service'
import { MatDialog, MatDialogConfig } from '@angular/material/dialog'
import { DialogComponent } from './components/dialog/dialog.component'

export interface VisualObjectData {
  data: FbnImageRecognitionDetection
  width: number
  height: number
  left: number
  bottom: number
  color: string
  opacity: number
}


@UntilDestroy()
@Component({
  selector: 'fbn-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [rowCollapseAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  isLoading$ = new BehaviorSubject<boolean>(false)

  imgUrl?: string 

  visualObjects: VisualObjectData[] = []

  @ViewChild('userImage', { static: false, read: ElementRef }) userImage?: ElementRef<HTMLImageElement>
  imageWidth?: number
  imageHeight?: number

  errorHasNoPredictions$ = new BehaviorSubject<boolean>(false)

  isDarkTheme = true

  constructor(
    private imageRecognitionService: ImageRecognitionService,
    private overlay: OverlayContainer,
    private cd: ChangeDetectorRef,
    private dialog: MatDialog,
  ) { }

  identify(index: number, item: VisualObjectData) {
    return item.data.confidence
  }

  imgInputChange(fileInputEvent: Event) {
    this.reset()
    // read uploaded image file from event
    const element = fileInputEvent.currentTarget as HTMLInputElement
    const fileList: FileList | null = element.files
    if (!fileList?.item(0)) {
      throw new Error('No files selected')
    }
    const uploadedImageFile = fileList.item(0) as File

    // generate img src URL
    const reader = new FileReader()
    reader.readAsDataURL(uploadedImageFile) 
    reader.onload = () => { 
      this.imgUrl = reader.result as string
      this.cd.detectChanges()
    }

    // request image recognition meta  data
    this.isLoading$.next(true)
    this.imageRecognitionService.postImage(uploadedImageFile).pipe(
      untilDestroyed(this),
      finalize(() => this.isLoading$.next(false)),
    ).subscribe(
      (res: FbnImageRecognitionResponse) => {
        if (res.detections.length === 0) {
          this.errorHasNoPredictions$.next(true)
          return
        }
        this.errorHasNoPredictions$.next(false)

        if (!this.userImage?.nativeElement) {
          throw new Error('No image element')
        }
        const { imageWidth, imageHeight } = this.getContainedSize(this.userImage.nativeElement)
        this.imageWidth = imageWidth
        this.imageHeight = imageHeight

        this.visualObjects = this.sortByDistanceFromCenter(res.detections).map((detection) => ({
          data: detection,
          width: detection.box.w * imageWidth,
          height: detection.box.h * imageHeight,
          left: (detection.box.x * imageWidth) - ((detection.box.w * imageWidth) / 2),
          bottom: imageHeight - ((detection.box.y * imageHeight) + (detection.box.h * imageHeight) / 2),
          color: ColorUtils.getRandomBrightColor(),
          // if confidence is low than make less visible
          opacity: detection.confidence < 0.8 ? 0.4 : 1,
        }))
      }
    )
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

  reset() {
    this.imgUrl = undefined
    this.visualObjects = []
    this.errorHasNoPredictions$.next(false)
  }

  themeToggleChange(event: MatSlideToggleChange) {
    this.isDarkTheme = event.checked
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

  openDialog() {
    const dialogConfig = new MatDialogConfig<{
      title: string,
      content: string,
    }>()
    dialogConfig.width = '400px'
    dialogConfig.data = {
      title: 'Info',
      content: 'This application is for demoing object recognition in images. Please upload an image of type JPG and see the results.',
    }

    dialogConfig.disableClose = true
    dialogConfig.autoFocus = true

    this.dialog.open(DialogComponent, dialogConfig)

    const darkThemeClassName = 'dark-theme'
    if (this.isDarkTheme) {
      this.overlay.getContainerElement().classList.add(darkThemeClassName)
    } else {
      this.overlay.getContainerElement().classList.remove(darkThemeClassName)
    }
  }
}
