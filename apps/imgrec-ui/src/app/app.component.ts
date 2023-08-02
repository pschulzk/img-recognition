import { Component } from '@angular/core'
import { ImageRecognitionService } from './services/image-recognition/image-recognition.service'

export interface VisualObjectData {
  id: string
  x: number
  y: number
  color: string
  label?: string
}

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
}
