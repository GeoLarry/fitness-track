import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog, ConfirmOptions } from './confirm-dialog';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private dialog = inject(MatDialog);

  // True only when the user confirms; Cancel, Escape and a click outside all count as no.
  async ask(options: ConfirmOptions): Promise<boolean> {
    const dialogRef = this.dialog.open<ConfirmDialog, ConfirmOptions, boolean>(ConfirmDialog, {
      data: options,
      width: '360px',
      maxWidth: 'calc(100vw - 32px)',
    });
    return await firstValueFrom(dialogRef.afterClosed()) === true;
  }
}
