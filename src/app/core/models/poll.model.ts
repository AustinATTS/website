import { Attachment } from './blog.model';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  author: string;
  authorUid: string;
  options: PollOption[];
  createdAt: string;
  endsAt?: string;
  closed: boolean;
  hidden?: boolean;
  attachments?: Attachment[];
}

export interface PollVote {
  id: string;
  pollId: string;
  optionId: string;
  userUid: string;
  votedAt: string;
}
