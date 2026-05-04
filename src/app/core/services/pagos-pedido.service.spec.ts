import { TestBed } from '@angular/core/testing';

import { PagosPedidoService } from './pagos-pedido.service';

describe('PagosPedidoService', () => {
  let service: PagosPedidoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PagosPedidoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
