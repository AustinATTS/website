export interface Attachment {
  name: string;
  url: string;
  storagePath: string;
  type: string;
  size: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  authorUid: string;
  date: string;
  tags: string[];
  imageUrl?: string;
  attachments?: Attachment[];
}

export interface BlogComment {
  id: string;
  postId: string;
  author: string;
  authorUid: string;
  content: string;
  createdAt: string;
  attachments?: Attachment[];
}
