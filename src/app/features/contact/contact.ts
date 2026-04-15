import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ContactService } from '../../core/services/contact.service';

@Component({
  selector: 'app-contact',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  private contactService = inject(ContactService);
  private fb = inject(FormBuilder);

  sending = signal(false);
  sent = signal(false);
  errorMessage = signal<string | null>(null);

  contactForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', Validators.required],
    message: ['', Validators.required],
  });

  contactLinks = [
    { icon: 'email', label: 'Email', value: 'admin@toastysoftware.co.uk', href: 'mailto:admin@toastysoftware.co.uk' },
    { icon: 'chat', label: 'Discord', value: 'austin_atts', href: '' },
    { icon: 'code', label: 'GitHub', value: 'AustinATTS', href: 'https://github.com/AustinATTS' },
  ];

  websites = [
    { label: 'Personal Site', url: 'https://www.austinatts.co.uk', display: 'www.austinatts.co.uk' },
    { label: 'Company', url: 'https://www.toastysoftware.co.uk', display: 'www.toastysoftware.co.uk' },
    { label: "Baker's Archive", url: 'https://archive.austinatts.co.uk', display: 'archive.austinatts.co.uk' },
  ];

  async submitForm() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.sending.set(true);
    this.errorMessage.set(null);

    try {
      const v = this.contactForm.value;
      await this.contactService.submitMessage({
        name: v.name,
        email: v.email,
        subject: v.subject,
        message: v.message,
        createdAt: new Date().toISOString(),
        read: false,
      });
      this.sent.set(true);
      this.contactForm.reset();
    } catch {
      this.errorMessage.set('Failed to send message. Please try again.');
    } finally {
      this.sending.set(false);
    }
  }
}
