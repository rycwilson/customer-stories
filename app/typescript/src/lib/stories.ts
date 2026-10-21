// import type { Api, Config } from 'datatables.net';
import Resource from './resource';

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
  status?: number | string | null,
  customer?: number | string | null,
  category?: number | string | null,
  product?: number | string | null
};

enum Columns {
  Customer = 1,
  Title,
  Curator,
  Status,
  Actions
}

export default class Stories extends Resource {
  static readonly columnIndices = Columns;

  dataTableConfig() {
    return {};
  }

  transformSourceData(_row: Story) {
    return {};
  }

  actionsDropdownTemplate(_row: Story) {
    return ''
  }
}
