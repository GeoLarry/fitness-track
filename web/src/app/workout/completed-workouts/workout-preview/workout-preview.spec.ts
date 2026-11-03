import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { WorkoutPreview } from './workout-preview';
import { WorkoutService } from '../../workout.service';
import { WorkoutSummary } from '../../../models/workout.model';

describe('WorkoutPreview', () => {
  let fixture: ComponentFixture<WorkoutPreview>;
  let close: ReturnType<typeof vi.fn>;

  const summary: WorkoutSummary = {
    id: 7, name: 'Push day', status: 'Completed', plannedForUtc: null, startedAtUtc: '2026-10-25T17:00:00Z',
    completedAtUtc: '2026-10-25T18:05:00Z', durationSeconds: 3900, exerciseCount: 1, setCount: 2, volumeKg: 1120,
  };

  async function setUp(get: ReturnType<typeof vi.fn>) {
    close = vi.fn();
    await TestBed.configureTestingModule({
      imports: [WorkoutPreview],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: summary },
        { provide: MatDialogRef, useValue: { close } },
        { provide: WorkoutService, useValue: { get } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutPreview);
    await fixture.whenStable();
  }

  it('shows the totals and every set, numbering working sets only', async () => {
    const get = vi.fn().mockResolvedValue({
      exercises: [{
        exerciseId: 40, exerciseName: 'Bench Press', notes: null,
        sets: [
          { isWarmup: true, weightKg: 40, reps: 10, isDone: true },
          { isWarmup: false, weightKg: 70, reps: 8, isDone: true },
          { isWarmup: false, weightKg: 70, reps: 8, isDone: true },
        ],
      }],
    });

    await setUp(get);

    expect(get).toHaveBeenCalledWith(7);
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Push day');
    expect(element.textContent).toContain('1 h 05 min');
    expect(element.textContent).toContain('Bench Press');
    const numbers = [...element.querySelectorAll('.preview-set-number')].map(n => n.textContent.trim());
    expect(numbers).toEqual(['local_fire_department', '1', '2']);
    expect(element.querySelectorAll('.preview-set')[1].textContent).toContain('70 kg × 8');
  });

  it('keeps the totals and shows the error when the sets cannot load', async () => {
    await setUp(vi.fn().mockRejectedValue(new Error('offline')));

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Push day');
    expect(text).not.toContain('Loading');
    expect(fixture.nativeElement.querySelector('.preview-note')).not.toBeNull();
  });

  it('closes with the close button', async () => {
    await setUp(vi.fn().mockResolvedValue({ exercises: [] }));

    fixture.nativeElement.querySelector('button[aria-label="Close"]').click();

    expect(close).toHaveBeenCalled();
  });
});
