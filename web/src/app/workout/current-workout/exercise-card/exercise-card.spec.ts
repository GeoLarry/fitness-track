import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExerciseCard, ExerciseRow } from './exercise-card';
import { ConfirmService } from '../../../shared/confirm-dialog/confirm.service';

describe('ExerciseCard', () => {
  let component: ExerciseCard;
  let fixture: ComponentFixture<ExerciseCard>;
  let ask: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    ask = vi.fn().mockResolvedValue(true);
    await TestBed.configureTestingModule({
      imports: [ExerciseCard],
      providers: [{ provide: ConfirmService, useValue: { ask } }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExerciseCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('exercise', {
      id: 1, name: 'Bench Press', description: null, instructions: null, typeId: null, equipmentId: null,
      primaryMuscleIds: [], secondaryMuscleIds: [], isCustom: false,
    });
    await fixture.whenStable();
  });

  it('shows the exercise name and starts with one set', () => {
    expect(fixture.nativeElement.textContent).toContain('Bench Press');
    expect(component.rows()).toEqual([{ warmup: false, weight: 0, reps: 0 }]);
  });

  it('puts every warm-up above the sets', () => {
    component.addSet();
    component.addWarmup();
    component.addWarmup();

    expect(component.rows().map(r => r.warmup)).toEqual([true, true, false, false]);
  });

  it('numbers the sets without counting warm-ups', () => {
    component.addWarmup();
    component.addSet();

    expect(component.getSetNumber(1)).toBe(1);
    expect(component.getSetNumber(2)).toBe(2);
  });

  describe('moving rows', () => {
    const set = (weight: number, warmup = false): ExerciseRow => ({ warmup, weight, reps: 5 });
    const moveButtons = (label: string) =>
      [...fixture.nativeElement.querySelectorAll(`button[aria-label="${label}"]`)] as HTMLButtonElement[];

    beforeEach(async () => {
      fixture.componentRef.setInput('rows', [set(20, true), set(30, true), set(60), set(70)]);
      await fixture.whenStable();
    });

    it('swaps a set with its neighbour and renumbers', async () => {
      moveButtons('Move up')[3].click();
      await fixture.whenStable();

      expect(component.rows().map(r => r.weight)).toEqual([20, 30, 70, 60]);
      expect(component.getSetNumber(2)).toBe(1);
      const weights = [...fixture.nativeElement.querySelectorAll('.editable')].map(e => (e as HTMLElement).textContent.trim());
      expect(weights.filter(w => w.endsWith('kg'))).toEqual(['20 kg', '30 kg', '70 kg', '60 kg']);
    });

    it('swaps warm-ups with each other', () => {
      component.moveRow(0, 1);

      expect(component.rows().map(r => r.weight)).toEqual([30, 20, 60, 70]);
    });

    it('never moves a row across the warm-up boundary or past the ends', () => {
      component.moveRow(2, -1);
      component.moveRow(1, 1);
      component.moveRow(0, -1);
      component.moveRow(3, 1);

      expect(component.rows().map(r => r.weight)).toEqual([20, 30, 60, 70]);
    });

    it('disables the arrows that cannot move', () => {
      expect(moveButtons('Move up').map(b => b.disabled)).toEqual([true, false, true, false]);
      expect(moveButtons('Move down').map(b => b.disabled)).toEqual([false, true, false, true]);
    });
  });

  it('goes back to a single empty set when clearing is confirmed', async () => {
    component.addWarmup();
    component.addSet();

    await component.clearCard();

    expect(component.rows()).toEqual([{ warmup: false, weight: 0, reps: 0 }]);
  });

  it('keeps the sets when clearing is refused', async () => {
    component.addSet();
    ask.mockResolvedValue(false);

    await component.clearCard();

    expect(component.rows().length).toBe(2);
  });

  it('deletes a set only when confirmed', async () => {
    component.addSet();
    const [first] = component.rows();

    ask.mockResolvedValue(false);
    await component.deleteRow(first);
    expect(component.rows().length).toBe(2);

    ask.mockResolvedValue(true);
    await component.deleteRow(first);
    expect(component.rows()).not.toContain(first);
  });

  it('removes the exercise only when confirmed', async () => {
    const removed = vi.fn();
    component.remove.subscribe(removed);

    ask.mockResolvedValue(false);
    await component.deleteCard();
    expect(removed).not.toHaveBeenCalled();

    ask.mockResolvedValue(true);
    await component.deleteCard();
    expect(removed).toHaveBeenCalledOnce();
  });

  it('shows the sets it is given and reports edits', () => {
    const changes: ExerciseRow[][] = [];
    component.rows.subscribe(rows => changes.push(rows));
    fixture.componentRef.setInput('rows', [{ warmup: false, weight: 70, reps: 8 }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('70 kg');

    component.rows()[0].reps = 10;
    component.stopEdit();

    expect(changes.at(-1)).toEqual([{ warmup: false, weight: 70, reps: 10 }]);
  });
});
