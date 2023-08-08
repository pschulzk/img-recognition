import { Component, HostListener, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'

@Component({
  selector: 'fbn-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss'],
})
export class DialogComponent {

  title = ''
  content = ''
  isDarkTheme = true

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      title: string,
      content: string,
    },
    private dialogRef: MatDialogRef<DialogComponent>,
  ) {}

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.close()
  }

  close() {
    this.dialogRef.close()
  }
}
