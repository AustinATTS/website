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
  selector: 'app-login',
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
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = signal<string>('');
  submitting = signal<boolean>(false);
  hidePassword = signal<boolean>(true);
  socialLoading = signal<string>('');

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) {
      this.error.set('Please fill in all fields.');
      return;
    }
    this.error.set('');
    this.submitting.set(true);
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/']);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.';
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
