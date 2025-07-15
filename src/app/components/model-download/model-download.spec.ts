import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelDownload } from './model-download';

describe('ModelDownload', () => {
  let component: ModelDownload;
  let fixture: ComponentFixture<ModelDownload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelDownload]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelDownload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
