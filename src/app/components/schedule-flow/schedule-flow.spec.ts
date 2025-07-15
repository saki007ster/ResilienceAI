import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleFlow } from './schedule-flow';

describe('ScheduleFlow', () => {
  let component: ScheduleFlow;
  let fixture: ComponentFixture<ScheduleFlow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleFlow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleFlow);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
