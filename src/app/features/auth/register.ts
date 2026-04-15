import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private auth = inject(AuthService);
  private router = inject(Router);

  displayName = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = signal<string>('');
  submitting = signal<boolean>(false);
  hidePassword = signal<boolean>(true);
  socialLoading = signal<string>('');

  async onSubmit(): Promise<void> {
    if (
      !this.displayName ||
      !this.email ||
      !this.password ||
      !this.confirmPassword
    ) {
      this.error.set('Please fill in all fields.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }
    if (this.password.length < 6) {
      this.error.set('Password must be at least 6 characters.');
      return;
    }

    this.error.set('');
    this.submitting.set(true);
    try {
      await this.auth.register(this.email, this.password, this.displayName);
      this.router.navigate(['/']);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.';
      this.error.set(message);
    } finally {
      this.submitting.set(false);
    }
  }

  async signInWithGoogle(): Promise<void> {
    await this.socialSignIn('google', () => this.auth.signInWithGoogle());
  }

  async signInWithGithub(): Promise<void> {
    await this.socialSignIn('github', () => this.auth.signInWithGithub());
  }

  private async socialSignIn(
    provider: string,
    signInFn: () => Promise<unknown>,
  ): Promise<void> {
    this.error.set('');
    this.socialLoading.set(provider);
    try {
      await signInFn();
      this.router.navigate(['/']);
    } catch (err: unknown) {
      const fallback = `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in failed. Please try again.`;
      const message = err instanceof Error ? err.message : fallback;
      this.error.set(message);
    } finally {
      this.socialLoading.set('');
    }
  }
}
