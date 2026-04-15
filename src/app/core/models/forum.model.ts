import { Attachment } from './blog.model';

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  threadCount: number;
}

export interface ForumThread {
  id: string;
  categoryId: string;
  title: string;
  slug?: string;
  author: string;
  authorUid: string;
  createdAt: string;
  lastReplyAt: string;
  replyCount: number;
  pinned: boolean;
}

export interface ForumPost {
  id: string;
  threadId: string;
  author: string;
  authorUid: string;
  content: string;
  createdAt: string;
  attachments?: Attachment[];
}
