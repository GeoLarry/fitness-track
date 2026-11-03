import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  const button = (selector: string) => document.querySelector<HTMLButtonElement>(selector)!;

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  it('shows the question and answers true when confirmed', async () => {
    const answer = TestBed.inject(ConfirmService).ask({ title: 'Delete it?', message: 'It is gone for good.', confirmLabel: 'Delete' });
    await TestBed.inject(MatDialog).openDialogs[0].afterOpened().toPromise();

    const dialog = document.querySelector('.confirm-dialog')!;
    expect(dialog.textContent).toContain('Delete it?');
    expect(dialog.textContent).toContain('It is gone for good.');
    button('.confirm-accept').click();

    expect(await answer).toBe(true);
  });

  it('answers false when cancelled', async () => {
    const answer = TestBed.inject(ConfirmService).ask({ title: 'Delete it?', confirmLabel: 'Delete' });
    await TestBed.inject(MatDialog).openDialogs[0].afterOpened().toPromise();

    button('.confirm-dialog button:not(.confirm-accept)').click();

    expect(await answer).toBe(false);
  });

  it('answers false when closed without a choice', async () => {
    const answer = TestBed.inject(ConfirmService).ask({ title: 'Delete it?', confirmLabel: 'Delete' });

    TestBed.inject(MatDialog).openDialogs[0].close();

    expect(await answer).toBe(false);
  });
});
