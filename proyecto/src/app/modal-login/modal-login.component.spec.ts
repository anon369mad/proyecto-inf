import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalLoginComponent } from './modal-login.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('ModalLoginComponent', () => {
  let component: ModalLoginComponent;
  let fixture: ComponentFixture<ModalLoginComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      declarations: [ModalLoginComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalLoginComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería abrir el modal y mostrar mensaje en consola', () => {
    spyOn(console, 'log');
    component.abrirModal();
    expect(component.mostrarModal).toBeTrue();
    expect(console.log).toHaveBeenCalledWith('Modal abierto');
  });

  it('debería cerrar el modal y limpiar campos', () => {
    component.usuario = 'testuser';
    component.contrasenia = 'testpass';
    component.mostrarModal = true;

    component.cerrarModal();

    expect(component.mostrarModal).toBeFalse();
    expect(component.usuario).toBe('');
    expect(component.contrasenia).toBe('');
  });

  it('debería iniciar sesión y navegar según el rol', () => {
    spyOn(component, 'cerrarModal');
    const mockRespuesta = { id: 1, rol: 'revisor', rut: '12345678-9' };
    component.usuario = 'usuario';
    component.contrasenia = 'clave';

    component.iniciarSesion();

    const req = httpMock.expectOne('http://localhost:8000/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockRespuesta);

    expect(localStorage.getItem('id_usuario')).toBe('1');
    expect(localStorage.getItem('usuario_rol')).toBe('revisor');
    expect(localStorage.getItem('userRut')).toBe('12345678-9');
    expect(component.cerrarModal).toHaveBeenCalled();
  });

  it('debería mostrar un mensaje de éxito en pantalla', () => {
    component['showMessage']('Mensaje OK', 'success');
    const mensaje = document.body.querySelector('div');
    expect(mensaje?.textContent).toContain('Mensaje OK');
    // Limpiar DOM
    document.body.innerHTML = '';
  });
});
