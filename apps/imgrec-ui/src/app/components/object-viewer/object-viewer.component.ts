import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { FbnImageRecognitionDetection, rowCollapseAnimation } from '@fbn/fbn-imgrec'

@Component({
  selector: 'fbn-object-viewer',
  templateUrl: './object-viewer.component.html',
  styleUrls: ['./object-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [rowCollapseAnimation],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
})
export class ObjectViewerComponent {
  @Input() objectData?: FbnImageRecognitionDetection
  @Input() imageSrc?: string

  @Output() actionClose = new EventEmitter<void>()

  @Output() hasLoaded = new EventEmitter<boolean>()
  _hasLoaded = false

  @ViewChild('objectViewerContainer', { static: false, read: ElementRef })
    objectViewerContainer?: ElementRef<HTMLDivElement>

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler() {
    this.close()
  }

  close(): void {
    this.actionClose.emit()
  }
}
