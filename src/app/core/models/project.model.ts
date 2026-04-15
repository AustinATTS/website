export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  content: string;
  githubUrl: string;
  language: string;
  topics: string[];
  featured: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}
