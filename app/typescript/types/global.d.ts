declare module 'tom-select/dist/js/plugins/clear_button';
declare module 'tom-select/dist/js/plugins/remove_button';
declare module 'tom-select/dist/js/plugins/drag_drop';
declare module 'bootoast';

declare namespace ImagesLoaded {
  // extend to include properties that aren't included in @types/imagesloaded
  interface ImagesLoaded {
    elements: HTMLElement[];
    hasAnyBroken: boolean;
    images: ImagesLoaded.LoadingImage[];
    progressedCount: number;
    isComplete: boolean;
    options: ImagesLoaded.ImagesLoadedOptions;
  }
}

declare var CSP: CustomerStoriesApp;

interface Window {
  $: object;
  jQuery: object;
  Stimulus: import("@hotwired/stimulus").Application;
}

interface CustomerStoriesApp {
  customerWins: CustomerWin[] | undefined;
  contributions: Contribution[] | undefined;
  stories: Story[] | undefined;
  storyContributions: { [key: number]: Contribution[] };
  promotedStories: PromotedStory[] | undefined;
  visitors: any;
  activity: any;
  currentUser: User | null;
  authToken: string;
  // screenSize: string;
  init(): void;
}

type ResourceName = (
  'customerWins' |
  'contributions' |
  'storyContributions' |
  'stories' |
  'promotedStories' |
  'visitors' |
  'activity'
)

type FlashHash = Partial<{ readonly [key in 'notice' | 'alert' | 'info' | 'warning']: string }>;
type Toast = { flash?: FlashHash, errors?: string[] }
type RowView = {
  page?: number;
  position?: number;
  turboFrame?: { id: string, src: string };
  html?: string;
  actionsDropdownHtml?: string;
}
type DashboardFilters = { curator?: number | null };
type CustomerWinsFilters = DashboardFilters & {
  'show-wins-with-story': boolean,
  success?: number
};
type ContributionsFilters = DashboardFilters & { 
  'show-completed': boolean, 
  'show-published': boolean,
  contribution?: number
};
type PromotedStoriesFilters = DashboardFilters & {};
type VisitorsFilters = DashboardFilters & {
  'date-range': string, 
  'show-visitor-source': boolean,
  story?: number,
  category?: number,
  product?: number
};

type ResourceControllerWithDatatable = (
  CustomerWinsController | ContributionsController | PromotedStoriesController
);
type AdImage = 'SquareImage' | 'LandscapeImage' | 'SquareLogo' | 'LandscapeLogo';
type ScreenSize = 'xs' | 'sm' | 'md-lg';
type TomSelectInput = HTMLSelectElement & TomInput;
type TomSelectKind = 'search' | 'curator' | 'status' | 'customer' | 'category' | 'product' | 'story' | 'storyTag' | 'contributor' | 'referrer' | 'invitationTemplate' | 'dateRange';

interface StringIndexable {
  [key: string]: any;
}
interface JQuery<HTMLElement>{
  tab: (action: string) => void;
  popover: (options: object) => void;
  modal: (action: string) => void;
}

interface JQueryStatic {
  summernote: {
    ui: any,
    plugins: any,
    range: any,
    interface: any, 
  }
}

interface TurboFrameAttributes {
  id: string;
  src?: string;
  loading?: string;
  target?: string;
  disable?: boolean;  
  dataset: {
    placeholder?: string;
  }
}

interface User {
  id: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  email?: string;
}

interface CustomerWin {
  id: number;
  name: string;
  curator: User; 
  customer: Customer; 
  display_status: string;
  timestamp: number;
  path: string;
  edit_path: string;
  actions_dropdown_html: string; // added during table config
  story?: Story;
  new_story_path?: string;
}

// CustomerWin data from server is transformed to CustomerWinRowData for DatatableRowController
interface CustomerWinRowData {
  id: number;
  curator: User;
  customer: Customer;
  status: string;
  path: string;
  editPath: string;
  story?: Story;
  newStoryPath?: string;
}

interface Customer {
  id: number;
  name: string;
}

interface Story {
  id: number;
  title: string;
  published?: boolean;
  slug?: string;
  csp_story_path?: string;
  edit_path?: string;
}

interface AdwordsAd {
  id: number;
  status: string;
  approvalStatus: string;
  longHeadline: string;
  mainColor: string;
  accentColor: string;
  storyId: number;
  customer: Customer;
  story: { id: number, title: string };
  curator: { id: number, name: string };
  path: string;
  editPath: string;
}

interface AdwordsAdRowData {
  id: number;
  path: string;
  editPath: string;
}

interface Contribution {
  // attributes
  id: number;
  status?: string;
  contribution?: string;
  feedback?: string;
  submittedAt?: string;
  request_subject?: string;
  request_body?: string;
  request_sent_at?: string;
  
  // methods
  display_status?: string;
  timestamp?: number;
  
  path?: string;
  edit_path?: string;

  // associations
  customer?: Customer
  customer_win?: CustomerWin;
  curator?: User;
  story?: Story;
  contributor?: User;
  referrer?: User;
  invitation_template?: InvitationTemplate;
  invitation?: { path: string };
  answers?: ContributorAnswer[];
}

interface ContributionRowData {
  id: number;
  status: string;
  path: string;
  editPath: string;
  invitationTemplate?: InvitationTemplate;
  invitation?: { path: string };
  story?: Story;
}

interface InvitationTemplate {
  id: number;
  name: string;
  path?: string;
}

interface ContributorQuestion {
  id?: number;
  question?: string;
}

interface ContributorAnswer {
  answer: string;
  contribution_id: number;
  contributor_question_id: number;
  question: ContributorQuestion;
}

  interface HTMLElementEventMap {
    // rails-ujs events
    // 'ajax:before': CustomEvent,                 
    // 'ajax:beforeSend': CustomEvent,    
    // 'ajax:send': CustomEvent,         
    // 'ajax:stopped': CustomEvent,               
    // 'ajax:success': CustomEvent,                
    // 'ajax:error': CustomEvent,                 
    // 'ajax:complete': CustomEvent,          
         
    // turbo events
    'turbo:load': TurboLoadEvent;
    'turbo:click': TurboClickEvent;
    'turbo:before-visit': TurboBeforeVisitEvent;
    'turbo:visit': TurboVisitEvent;
    'turbo:submit-start': TurboSubmitStartEvent;
    'turbo:submit-end': TurboSubmitEndEvent;
    'turbo:before-render': TurboBeforeRenderEvent;
    'turbo:render': TurboRenderEvent;
    'turbo:frame-load': TurboFrameLoadEvent;
    'turbo:before-frame-render': TurboBeforeFrameRenderEvent;
    'turbo:frame-render': TurboFrameRenderEvent;
    'turbo:before-fetch-request': CustomEvent;
    'turbo:before-fetch-response': CustomEvent;
    'turbo:before-cache': CustomEvent;
  }