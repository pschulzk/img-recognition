import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { FbnImageRecognitionDetection, rowCollapseAnimation } from '@fbn/fbn-imgrec'

export interface VisualObjectData {
  data: FbnImageRecognitionDetection
  width: number
  height: number
  left: number
  bottom: number
  color: string
  opacity: number
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
export class ObjectFrameComponent {
  @Input()
    objectData?: VisualObjectData
}
