// Bootoast has no type data, so need to declare its existence
declare module 'bootoast';

declare namespace ImagesLoaded {
  // augment to include properties that aren't included in @types/imagesloaded
  interface ImagesLoaded {
    elements: HTMLElement[];
    hasAnyBroken: boolean;
    images: ImagesLoaded.LoadingImage[];
    progressedCount: number;
    isComplete: boolean;
    options: ImagesLoaded.ImagesLoadedOptions;
  }
}

declare const CSP: CustomerStoriesApp;

interface CustomerStoriesApp {
  stories: import('../src/lib').Story[] | undefined;
  contributions: import('../src/lib').Contribution[] | undefined;
  customerWins: import('../src/lib').CustomerWin[] | undefined;
  promotedStories: import('../src/lib').AdwordsAd[] | undefined;
  storyContributions: Record<number, import('../src/lib').Contribution[]>;
  visitors: import('../src/lib/').VisitorsSourceData;
  activity: any;
  currentUser: User | null;
  authToken: string;
  init(): void;
}

type ResourceName = (
  'stories' |
  'contributions' |
  'storyContributions' |
  'customerWins' |
  'promotedStories' |
  'visitors' |
  'activity'
)

type SourceData = (
  import('../src/lib').Story |
  import('../src/lib').CustomerWin |
  import('../src/lib').Contribution |
  import('../src/lib').AdwordsAd
)

type RowData = (
  import('../src/lib').StoryRowData |
  import('../src/lib').CustomerWinRowData |
  import('../src/lib').ContributionRowData |
  import('../src/lib').AdwordsAdRowData
)

type FlashHash = Partial<{ readonly [key in 'notice' | 'alert' | 'info' | 'warning']: string }>;
type Toast = { flash?: FlashHash, errors?: string[] }

type DashboardFilters = { curator?: number | null };

type ScreenSize = 'xs' | 'sm' | 'md-lg';
type TomSelectInput = HTMLSelectElement & TomInput;
type TomSelectKind = 'search' | 'curator' | 'status' | 'customer' | 'category' | 'product' | 'story' | 'storyTag' | 'contributor' | 'referrer' | 'invitationTemplate' | 'dateRange';

type StringCase = 'pascal' | 'kebab' | 'snake' | 'camel' | null;

interface StringIndexable {
  [key: string]: any;
}

interface TurboFrameAttributes {
  id: string;
  src: string;
  loading?: string;
  target?: string;
  disable?: boolean;  
  dataset?: {
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

interface Customer {
  id: number;
  name: string;
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