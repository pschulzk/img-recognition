import { Component } from '@angular/core'
import { ImageRecognitionService } from './services/image-recognition/image-recognition.service'
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy'

export interface VisualObjectData {
  id: string
  x: number
  y: number
  color: string
  label?: string
}

@UntilDestroy()
@Component({
  selector: 'fbn-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  visualObjects: VisualObjectData[] = []

  constructor(
    private imageRecognitionService: ImageRecognitionService,
  ) { }

  imgInputChange(fileInputEvent: Event) {
    const element = fileInputEvent.currentTarget as HTMLInputElement
    const fileList: FileList | null = element.files
    if (!fileList?.item(0)) {
      throw new Error('No files selected')
    }
    const uploadedImageFile = fileList.item(0) as File

    this.imageRecognitionService.postImage(uploadedImageFile).pipe(
      untilDestroyed(this),
    ).subscribe(
      res => {
        console.log('!!! AppComponent -> res', res)
        // this.visualObjects = res
      }
    )
  }
}
