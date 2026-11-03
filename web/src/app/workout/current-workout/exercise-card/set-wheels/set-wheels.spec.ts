import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { SetWheels, SetWheelsData, hundredthsLabel, joinWeight, splitWeight } from './set-wheels';

describe('SetWheels', () => {
  let fixture: ComponentFixture<SetWheels>;
  let component: SetWheels;
  let dismiss: ReturnType<typeof vi.fn>;

  async function open(values: Pick<SetWheelsData, 'weight' | 'reps'>) {
    dismiss = vi.fn();
    await TestBed.configureTestingModule({
      imports: [SetWheels],
      providers: [
        { provide: MatBottomSheetRef, useValue: { dismiss } },
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: { exerciseName: 'Bench Press', setLabel: 'Set 2', ...values } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SetWheels);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  const text = () => (fixture.nativeElement as HTMLElement).textContent;
  const buttons = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));

  it('splits and joins a weight without rounding errors', () => {
    expect(splitWeight(80.5)).toEqual({ whole: 80, hundredths: 50 });
    expect(splitWeight(41.25)).toEqual({ whole: 41, hundredths: 25 });
    expect(joinWeight(80, 50)).toBe(80.5);
    expect(joinWeight(41, 25)).toBe(41.25);
    expect(joinWeight(0, 0)).toBe(0);
  });

  it('labels the decimals', () => {
    expect([0, 25, 50, 75, 30, 5].map(hundredthsLabel)).toEqual(['.0', '.25', '.5', '.75', '.3', '.05']);
  });

  it('opens at the values of the set and says what Done saves', async () => {
    await open({ weight: 80.5, reps: 8 });

    expect(text()).toContain('Bench Press');
    expect(text()).toContain('Set 2');
    expect(text()).toContain('Done · 80.5 kg × 8');
    expect(component.stepLabels).toEqual(['.0', '.25', '.5', '.75']);
  });

  it('gives back what the wheels show on Done', async () => {
    await open({ weight: 80.5, reps: 8 });

    component.wholeIndex.set(100);
    component.stepIndex.set(1);
    component.repsIndex.set(12);
    await fixture.whenStable();
    expect(text()).toContain('Done · 100.25 kg × 12');

    buttons()[1].click();
    expect(dismiss).toHaveBeenCalledWith({ weight: 100.25, reps: 12 });
  });

  it('gives back nothing on Cancel', async () => {
    await open({ weight: 80.5, reps: 8 });

    buttons()[0].click();

    expect(dismiss).toHaveBeenCalledWith();
  });

  it('keeps a saved value the wheels do not usually offer', async () => {
    await open({ weight: 600.3, reps: 150 });

    expect(component.result()).toEqual({ weight: 600.3, reps: 150 });
    expect(component.stepLabels).toEqual(['.0', '.25', '.3', '.5', '.75']);
  });

  it('treats an empty value as zero', async () => {
    await open({ weight: null as unknown as number, reps: null as unknown as number });

    expect(component.result()).toEqual({ weight: 0, reps: 0 });
  });
});
