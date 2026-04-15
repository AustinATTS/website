import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-experience',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, RouterLink],
  templateUrl: './experience.html',
  styleUrl: './experience.scss',
})
export class Experience {
  technologies = ['Odoo', 'Python', 'JavaScript', 'XML', 'PostgreSQL', 'Docker', 'Linux'];

  responsibilities = [
    'Developing and customizing Odoo modules for business operations',
    'Building integrations between Odoo and third-party services',
    'Managing and maintaining Odoo-based systems for clients',
    'Full-stack development with Python (Odoo backend) and JavaScript/XML (Odoo frontend)',
    'Database management and optimization with PostgreSQL',
    'Deploying and maintaining production Odoo instances',
  ];

  courseworkProjects = [
    {
      name: 'Panimator',
      unit: 'SCC 111',
      url: 'https://github.com/AustinATTS/panimator',
    },
  ];
}
