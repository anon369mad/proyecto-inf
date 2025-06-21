import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalJefeAreaComponent } from './modal-jefe-area.component';

describe('ModalJefeAreaComponent', () => {
  let component: ModalJefeAreaComponent;
  let fixture: ComponentFixture<ModalJefeAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalJefeAreaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalJefeAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
