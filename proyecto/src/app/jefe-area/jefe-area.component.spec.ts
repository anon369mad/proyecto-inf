import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JefeAreaComponent } from './jefe-area.component';

describe('JefeAreaComponent', () => {
  let component: JefeAreaComponent;
  let fixture: ComponentFixture<JefeAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JefeAreaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JefeAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
