import { TestBed } from '@angular/core/testing';

import { IngresosDiariosService } from './ingresos-diarios.service';

describe('IngresosDiariosService', () => {
  let service: IngresosDiariosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IngresosDiariosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
