import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExerciseCard } from './exercise-card';

describe('ExerciseCard', () => {
  let component: ExerciseCard;
  let fixture: ComponentFixture<ExerciseCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseCard]
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

  it('keeps warm-ups on top when a set is dragged above them', () => {
    component.addWarmup();
    component.dropRow({ previousIndex: 1, currentIndex: 0 } as Parameters<ExerciseCard['dropRow']>[0]);

    expect(component.rows().map(r => r.warmup)).toEqual([true, false]);
  });

  it('goes back to a single empty set when cleared', () => {
    component.addWarmup();
    component.addSet();
    component.clearCard();

    expect(component.rows()).toEqual([{ warmup: false, weight: 0, reps: 0 }]);
  });
});
