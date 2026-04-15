import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Projects } from '../../../core/services/projects.service';
import { Project } from '../../../core/models/project.model';
import { slugify } from '../../../shared/utils/slugify';

@Component({
  selector: 'app-project-management',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
  ],
  templateUrl: './project-management.html',
  styleUrl: './project-management.scss',
})
export class ProjectManagement implements OnInit {
  private projectsService = inject(Projects);
  private fb = inject(FormBuilder);

  projects = signal<Project[]>([]);
  showForm = signal(false);
  editingProject = signal<Project | null>(null);
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  projectForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    description: ['', Validators.required],
    content: [''],
    githubUrl: ['', Validators.required],
    language: [''],
    topics: [''],
    featured: [false],
    imageUrl: [''],
  });

  ngOnInit() {
    this.loadProjects();
  }

  private loadProjects() {
    this.projectsService.getProjects().subscribe(projects => this.projects.set(projects));
  }

  openNewForm() {
    this.editingProject.set(null);
    this.projectForm.reset({
      name: '',
      slug: '',
      description: '',
      content: '',
      githubUrl: '',
      language: '',
      topics: '',
      featured: false,
      imageUrl: '',
    });
    this.errorMessage.set(null);
    this.showForm.set(true);
  }

  openEditForm(project: Project) {
    this.editingProject.set(project);
    this.projectForm.patchValue({
      name: project.name,
      slug: project.slug,
      description: project.description,
      content: project.content ?? '',
      githubUrl: project.githubUrl,
      language: project.language ?? '',
      topics: project.topics?.join(', ') ?? '',
      featured: project.featured ?? false,
      imageUrl: project.imageUrl ?? '',
    });
    this.errorMessage.set(null);
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingProject.set(null);
    this.projectForm.reset();
  }

  onNameChange() {
    if (!this.editingProject()) {
      const name: string = this.projectForm.get('name')?.value ?? '';
      const slug = slugify(name);
      this.projectForm.patchValue({ slug });
    }
  }

  async saveProject() {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMessage.set(null);

    const v = this.projectForm.value;
    const topics = v.topics
      ? v.topics
          .split(',')
          .map((t: string) => t.trim())
          .filter((t: string) => t.length > 0)
      : [];

    try {
      const editing = this.editingProject();
      if (editing) {
        await this.projectsService.updateProject(editing.id, {
          name: v.name,
          slug: v.slug,
          description: v.description,
          content: v.content || '',
          githubUrl: v.githubUrl,
          language: v.language || '',
          topics,
          featured: v.featured ?? false,
          imageUrl: v.imageUrl || undefined,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const now = new Date().toISOString();
        await this.projectsService.createProject({
          name: v.name,
          slug: v.slug,
          description: v.description,
          content: v.content || '',
          githubUrl: v.githubUrl,
          language: v.language || '',
          topics,
          featured: v.featured ?? false,
          imageUrl: v.imageUrl || undefined,
          createdAt: now,
          updatedAt: now,
        });
      }
      this.cancelForm();
      this.loadProjects();
    } catch {
      this.errorMessage.set('Failed to save project. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteProject(id: string) {
    try {
      await this.projectsService.deleteProject(id);
      this.projects.update(projects => projects.filter(p => p.id !== id));
    } catch {
      this.errorMessage.set('Failed to delete project. Please try again.');
    }
  }
}
