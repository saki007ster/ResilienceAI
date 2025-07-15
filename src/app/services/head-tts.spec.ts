import { TestBed } from '@angular/core/testing';

import { HeadTts } from './head-tts';

describe('HeadTts', () => {
  let service: HeadTts;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HeadTts);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
