import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, ViewChild } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
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
    MatIconModule,
  ],
})
export class ObjectViewerComponent implements OnChanges {
  @Input() objectData?: FbnImageRecognitionDetection
  @Input() imageSrc?: string

  @Output() actionClose = new EventEmitter<void>()

  @Output() hasLoaded = new EventEmitter<boolean>()

  @ViewChild('objectViewerContainer', { static: false, read: ElementRef })
    objectViewerContainer?: ElementRef<HTMLDivElement>

  constructor(
    private cd: ChangeDetectorRef,
  ) { }

  ngOnChanges(): void {
    this.hasLoaded.emit(false)
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.close()
  }

  close(): void {
    this.actionClose.emit()
  }
}
