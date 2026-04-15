import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PollService } from '../../../core/services/poll.service';
import { Poll } from '../../../core/models/poll.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-poll-management',
  imports: [DatePipe, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './poll-management.html',
  styleUrl: './poll-management.scss',
})
export class PollManagement implements OnInit {
  private pollService = inject(PollService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  polls = signal<Poll[]>([]);
  showForm = signal(false);
  editingPoll = signal<Poll | null>(null);
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  pollForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    options: this.fb.array([this.newOption(), this.newOption()]),
    endsAt: [''],
  });

  get optionsArray(): FormArray {
    return this.pollForm.get('options') as FormArray;
  }

  ngOnInit() {
    this.pollService.getPolls().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(polls => this.polls.set(polls));
  }

  private newOption() {
    return this.fb.control('', Validators.required);
  }

  addOption() {
    this.optionsArray.push(this.newOption());
  }

  removeOption(index: number) {
    if (this.optionsArray.length > 2) {
      this.optionsArray.removeAt(index);
    }
  }

  openNewForm() {
    this.editingPoll.set(null);
    this.pollForm.reset({ title: '', description: '', endsAt: '' });
    this.optionsArray.clear();
    this.optionsArray.push(this.newOption());
    this.optionsArray.push(this.newOption());
    this.errorMessage.set(null);
    this.showForm.set(true);
  }

  openEditForm(poll: Poll) {
    this.editingPoll.set(poll);
    this.pollForm.patchValue({ title: poll.title, description: poll.description, endsAt: poll.endsAt ?? '' });
    this.optionsArray.clear();
    for (const opt of poll.options) {
      const ctrl = this.newOption();
      ctrl.setValue(opt.text);
      this.optionsArray.push(ctrl);
    }
    this.errorMessage.set(null);
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingPoll.set(null);
    this.pollForm.reset();
  }

  async savePoll() {
    if (this.pollForm.invalid) { this.pollForm.markAllAsTouched(); return; }
    const user = this.authService.currentUser();
    if (!user) { this.errorMessage.set('You must be logged in.'); return; }
    this.saving.set(true);
    this.errorMessage.set(null);
    const v = this.pollForm.value;
    const optionTexts: string[] = v.options ?? [];
    const editing = this.editingPoll();
    try {
      if (editing) {
        const updatedOptions = optionTexts.map((text: string, i: number) => {
          const existing = editing.options[i];
          return existing ? { ...existing, text } : { id: crypto.randomUUID(), text, votes: 0 };
        });
        await this.pollService.updatePoll(editing.id, { title: v.title, description: v.description, options: updatedOptions, endsAt: v.endsAt || undefined });
      } else {
        const options = optionTexts.map((text: string) => ({ id: crypto.randomUUID(), text, votes: 0 }));
        await this.pollService.createPoll({ title: v.title, description: v.description, author: user.displayName, authorUid: user.uid, options, createdAt: new Date().toISOString(), endsAt: v.endsAt || undefined, closed: false });
      }
      this.cancelForm();
    } catch {
      this.errorMessage.set('Failed to save poll. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  async toggleClosed(poll: Poll) {
    try {
      await this.pollService.updatePoll(poll.id, { closed: !poll.closed });
      this.polls.update(polls => polls.map(p => p.id === poll.id ? { ...p, closed: !p.closed } : p));
    } catch {
    }
  }

  async toggleHidden(poll: Poll) {
    try {
      const newHidden = !poll.hidden;
      await this.pollService.updatePoll(poll.id, { hidden: newHidden });
      this.polls.update(polls => polls.map(p => p.id === poll.id ? { ...p, hidden: newHidden } : p));
    } catch {
    }
  }

  async deletePoll(id: string) {
    try {
      await this.pollService.deletePoll(id);
      this.polls.update(polls => polls.filter(p => p.id !== id));
    } catch {
    }
  }
}
