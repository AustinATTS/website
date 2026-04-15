import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DatePipe } from '@angular/common';
import { PollService } from '../../core/services/poll.service';
import { AuthService } from '../../core/services/auth.service';
import { Poll } from '../../core/models/poll.model';

@Component({
  selector: 'app-polls',
  imports: [
    ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatProgressBarModule, DatePipe,
  ],
  templateUrl: './polls.html',
  styleUrl: './polls.scss',
})
export class Polls implements OnInit {
  private pollService = inject(PollService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  allPolls = signal<Poll[]>([]);
  userVotes = signal<Record<string, string>>({});
  votingPollId = signal<string | null>(null);

  showForm = signal(false);
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

  currentPolls = computed(() => {
    const now = new Date().toISOString();
    return this.allPolls().filter(p => !p.closed && !p.hidden && (!p.endsAt || p.endsAt > now));
  });

  expiredPolls = computed(() => {
    const now = new Date().toISOString();
    return this.allPolls().filter(p => !p.hidden && (p.closed || (p.endsAt && p.endsAt <= now)));
  });

  ngOnInit() {
    this.pollService.getPolls().subscribe(polls => {
      this.allPolls.set(polls);
      this.loadUserVotes(polls);
    });
  }

  private async loadUserVotes(polls: Poll[]) {
    const user = this.auth.firebaseUser();
    if (!user) return;
    const votes: Record<string, string> = {};
    for (const poll of polls) {
      this.pollService.getUserVote(poll.id, user.uid).subscribe(vote => {
        if (vote) {
          votes[poll.id] = vote.optionId;
          this.userVotes.set({ ...votes });
        }
      });
    }
  }

  totalVotes(poll: Poll): number {
    return poll.options.reduce((sum, o) => sum + o.votes, 0);
  }

  votePercent(poll: Poll, optionVotes: number): number {
    const total = this.totalVotes(poll);
    return total === 0 ? 0 : Math.round((optionVotes / total) * 100);
  }

  async vote(poll: Poll, optionId: string) {
    this.votingPollId.set(poll.id);
    try {
      const uid = await this.auth.ensureAnonymousUser();
      await this.pollService.vote(poll.id, {
        pollId: poll.id,
        optionId,
        userUid: uid,
        votedAt: new Date().toISOString(),
      });
      this.allPolls.update(polls => polls.map(p => {
        if (p.id !== poll.id) return p;
        return {
          ...p,
          options: p.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o),
        };
      }));
      const updated = this.allPolls().find(p => p.id === poll.id);
      if (updated) {
        try {
          await this.pollService.updatePoll(poll.id, { options: updated.options });
        } catch (e) {
          console.warn('Could not persist vote counts to poll document:', e);
        }
      }
      this.userVotes.update(v => ({ ...v, [poll.id]: optionId }));
    } catch (e) {
      console.error('Failed to cast vote:', e);
      this.errorMessage.set(
        'Failed to cast vote. If you are not logged in, make sure Anonymous Authentication is enabled in the Firebase Console.',
      );
    } finally {
      this.votingPollId.set(null);
    }
  }

  hasVoted(pollId: string): boolean {
    return !!this.userVotes()[pollId];
  }

  isExpired(poll: Poll): boolean {
    if (poll.closed) return true;
    if (!poll.endsAt) return false;
    return new Date(poll.endsAt) <= new Date();
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
    this.pollForm.reset({ title: '', description: '', endsAt: '' });
    this.optionsArray.clear();
    this.optionsArray.push(this.newOption());
    this.optionsArray.push(this.newOption());
    this.errorMessage.set(null);
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.pollForm.reset();
  }

  async savePoll() {
    if (this.pollForm.invalid) { this.pollForm.markAllAsTouched(); return; }
    const user = this.auth.currentUser();
    if (!user || user.role !== 'admin') { this.errorMessage.set('Only admins can create polls.'); return; }
    this.saving.set(true);
    this.errorMessage.set(null);
    const v = this.pollForm.value;
    const optionTexts: string[] = v.options ?? [];
    try {
      const options = optionTexts.map((text: string) => ({ id: crypto.randomUUID(), text, votes: 0 }));
      await this.pollService.createPoll({
        title: v.title,
        description: v.description,
        author: user.displayName,
        authorUid: user.uid,
        options,
        createdAt: new Date().toISOString(),
        endsAt: v.endsAt || undefined,
        closed: false,
      });
      this.cancelForm();
      this.pollService.getPolls().subscribe(polls => {
        this.allPolls.set(polls);
        this.loadUserVotes(polls);
      });
    } catch {
      this.errorMessage.set('Failed to create poll. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }
}
