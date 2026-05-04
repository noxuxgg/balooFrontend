import { TestBed } from '@angular/core/testing';

import { DetalleTortaService } from './detalle-torta.service';

describe('DetalleTortaService', () => {
  let service: DetalleTortaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetalleTortaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
