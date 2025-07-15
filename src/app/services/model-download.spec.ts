import { TestBed } from '@angular/core/testing';

import { ModelDownload } from './model-download';

describe('ModelDownload', () => {
  let service: ModelDownload;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModelDownload);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
