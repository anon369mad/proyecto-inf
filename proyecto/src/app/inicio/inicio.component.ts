import { Component, ViewChild } from '@angular/core';
import { ModalLoginComponent } from '../modal-login/modal-login.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [ModalLoginComponent, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent {
}
