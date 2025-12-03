import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { AlertComponent } from '../../common/alert/alert.component';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'lib-cookies',
  standalone: true,
  templateUrl: './auth-cookies.component.html',
  imports: [ReactiveFormsModule, NgClass, AlertComponent],
})
export class AuthCookiesComponent implements OnInit {
  connectorForm: FormGroup = new FormGroup({
    apiToken: new FormControl('', Validators.required),
  });

  loading = false;
  errorMsg = '';

  ngOnInit() {
    // Try to load api token from cookie
    const apiToken = this.getCookie('edc-api-token');
    if (apiToken) {
      this.connectorForm.patchValue({ apiToken: apiToken });
    }
  }

  saveApiTokenCookie({ days = 365, path = '/' } = {}) {
    if (this.connectorForm.valid) {
      const token = this.connectorForm.value.apiToken;
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = `edc-api-token=${encodeURIComponent(token)}; Expires=${expires}; Path=${path}; SameSite=Strict; Secure`;
    }
  }

  deleteApiTokenCookie() {
    console.log('Deleting API token acceptance cookie...');
    document.cookie = 'edc-api-token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Strict; Secure';
    this.connectorForm.reset();
  }

  public getCookie(name: string): string | null {
    const target = encodeURIComponent(name) + '=';
    const parts = document.cookie.split(';');
    for (const part of parts) {
      const p = part.trim();
      if (p.startsWith(target)) return decodeURIComponent(p.slice(target.length));
    }
    return null;
  }
}
