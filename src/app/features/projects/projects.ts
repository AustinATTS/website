import { Component, inject, OnInit } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ProjectCard } from '../../shared/components/project-card/project-card';
import { Projects as ProjectsService } from '../../core/services/projects.service';
import { Project } from '../../core/models/project.model';

@Component({
  selector: 'app-projects',
  imports: [MatChipsModule, MatButtonModule, MatIconModule, MatCardModule, ProjectCard],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class ProjectsPage implements OnInit {
  private projectsService = inject(ProjectsService);

  allProjects: Project[] = [];
  filteredProjects: Project[] = [];
  activeFilter = 'All';

  filters = ['All', 'Other'];

  externalLinks = [
    {
      icon: 'language',
      label: 'Personal Site',
      url: 'https://www.austinatts.co.uk',
      display: 'www.austinatts.co.uk',
    },
    {
      icon: 'business',
      label: 'Company Site',
      url: 'https://www.toastysoftware.co.uk',
      display: 'www.toastysoftware.co.uk',
    },
    {
      icon: 'menu_book',
      label: "Baker's Archive",
      url: 'https://archive.austinatts.co.uk',
      display: 'archive.austinatts.co.uk',
    },
    {
      icon: 'store',
      label: 'Split Loaf on Microsoft Store',
      url: 'https://www.microsoft.com/store/apps/9PMHDS2D4NH6',
      display: 'Microsoft Store',
    },
  ];

  ngOnInit(): void {
    this.projectsService.getProjects().subscribe(projects => {
      this.allProjects = projects;
      this.filteredProjects = projects;
    });
  }

  applyFilter(filter: string): void {
    this.activeFilter = filter;

    if (filter === 'All') {
      this.filteredProjects = this.allProjects;
      return;
    }

    const webLanguages = ['HTML', 'SCSS', 'Less', 'JavaScript', 'TypeScript'];
    const breadKeywords = ['bread', 'toast', 'loaf', 'baker', 'bake'];
    const knownFilters = ['C++', 'Python', 'TypeScript', 'Kotlin', 'Web', 'Bread-themed'];

    this.filteredProjects = this.allProjects.filter(project => {
      switch (filter) {
        case 'Web':
          return webLanguages.some(lang =>
            project.language.toLowerCase().includes(lang.toLowerCase())
          );
        case 'Bread-themed':
          return breadKeywords.some(
            kw =>
              project.name.toLowerCase().includes(kw) ||
              project.description.toLowerCase().includes(kw)
          );
        case 'Other':
          return !knownFilters.some(f => {
            if (f === 'Web')
              return webLanguages.some(lang =>
                project.language.toLowerCase().includes(lang.toLowerCase())
              );
            if (f === 'Bread-themed') return false;
            return project.language.toLowerCase().includes(f.toLowerCase());
          });
        default:
          return project.language.toLowerCase().includes(filter.toLowerCase());
      }
    });
  }
}
