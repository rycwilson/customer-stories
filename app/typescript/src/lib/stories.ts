import { Resource } from '.';

export interface Story {
  id: number;
  title: string;
  published?: boolean;
  slug?: string;
  csp_story_path?: string;
  edit_path?: string;
}

export interface StoryRowData {
  id: number;
  title: string;
}

export type StoriesFilters = DashboardFilters & {
  status?: string,
  customer?: number,
  category?: number,
  product?: number
};

// enum Columns {
//   Customer = 1,
//   Title,
//   Curator,
//   Status,
//   Actions
// }

export default class Stories extends Resource {
  // async init() {
  // }
}
