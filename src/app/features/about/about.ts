import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [MatCardModule, MatChipsModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  languages = [
    'Some'
  ];

  frameworks = [
    'A few'
  ];

  tools = [
    'A couple'
  ];

  links = [
    { icon: 'code', label: 'GitHub', url: 'https://github.com/AustinATTS', external: true },
    { icon: 'email', label: 'Email', url: 'mailto:admin@toastysoftware.co.uk', external: true },
    { icon: 'chat', label: 'Discord', url: '', display: 'austin_atts', external: false },
    { icon: 'language', label: 'Website', url: 'https://www.austinatts.co.uk', external: true },
    { icon: 'business', label: 'Company', url: 'https://www.toastysoftware.co.uk', external: true },
  ];
}
