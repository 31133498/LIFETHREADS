
export interface DiaryEntry {
  id: string;
  content: string;
  date: string; // ISO string
  images: string[]; // Base64 strings
  mood?: string;
  tags?: string[];
  aiReflection?: string;
  aiImage?: string; // New: AI generated visual reflection
}

export interface UserSettings {
  userName: string;
  avatar: string;
}
