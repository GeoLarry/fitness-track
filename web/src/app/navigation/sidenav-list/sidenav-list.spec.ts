import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidenavList } from './sidenav-list';

describe('SidenavList', () => {
  let component: SidenavList;
  let fixture: ComponentFixture<SidenavList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidenavList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidenavList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
