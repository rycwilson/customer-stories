declare module 'tom-select/dist/js/plugins/clear_button';

declare var CSP: CustomerStoriesApp;

interface Window {
  $: object;
  jQuery: object;
  Stimulus: object;
}

interface CustomerStoriesApp {
  customerWins: CustomerWin[] | undefined;
  contributions: Contribution[] | undefined;
  storyContributions: { [key: number]: Contribution[] };
  promotedStories: PromotedStory[] | undefined;
  currentUser: User | null;
  // screenSize: string;
  init(): void;
}

type ResourceName = 'customerWins' | 'contributions' | 'storyContributions' | 'promotedStories';

type SelectInputType = 'filter' | 'curator' | 'status' | 'customer' | 'category' | 'product' | 'tags' | 'contributor' | 'referrer'; 

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
  linkedin_url?: string;
}

interface CustomerWin {
  id: number;
  name: string;
  customer_id?: number; 
  curator_id?: number; 
  display_status?: string;
  referrer?: User | null;
  contact?: User | null;
  timestamp?: number;
  new_story_path?: string;
  curator: User; 
  customer: Customer; 
  story: Story;
}

interface Customer {
  id?: number;
  name?: string;
  slug?: string;
}

interface Story {
  id: number;
  title: string;
  published: boolean;
  slug: string;
  csp_story_path: string;
}

interface PromotedStory extends Omit<Story, 'published'> {
  published: true;
  ads_status: string;
  ads_long_headline: string;
  ads_images: Array<any>;
  success: { customer: Customer, curator_id: number };
  topic_ad: { id: number, status: string };
  retarget_ad: { id: number, status: string };
}

interface Contribution {
  // attributes
  id: number;
  status?: string;
  contribution?: string;
  feedback?: string;
  submitted_at?: string;
  publish_contributor?: boolean;
  contributor_unpublished?: boolean;
  request_subject?: string;
  request_body?: string;
  request_sent_at?: string;
  
  // methods
  display_status?: string;
  timestamp?: number;

  // associations
  customer?: Customer
  success?: CustomerWin;
  contributor?: User;
  referrer?: User;
  invitation_template?: InvitationTemplate;
  answers?: ContributorAnswer[];
}

interface InvitationTemplate {
  id: number;
  name: string;
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

//   interface HTMLElementEventMap {
//     // rails-ujs events
//     'ajax:before': CustomEvent,                 
//     'ajax:beforeSend': CustomEvent,    
//     'ajax:send': CustomEvent,         
//     'ajax:stopped': CustomEvent,               
//     'ajax:success': CustomEvent,                
//     'ajax:error': CustomEvent,                 
//     'ajax:complete': CustomEvent,          
         
//     // turbo events
//     'turbo:load': TurboLoadEvent;
//     'turbo:click': TurboClickEvent;
//     'turbo:before-visit': TurboBeforeVisitEvent;
//     'turbo:visit': TurboVisitEvent;
//     'turbo:submit-start': TurboSubmitStartEvent;
//     'turbo:submit-end': TurboSubmitEndEvent;
//     'turbo:before-render': TurboBeforeRenderEvent;
//     'turbo:render': TurboRenderEvent;
//     'turbo:frame-load': TurboFrameLoadEvent;
//     'turbo:before-frame-render': TurboBeforeFrameRenderEvent;
//     'turbo:frame-render': TurboFrameRenderEvent;
//     'turbo:before-fetch-request': CustomEvent;
//     'turbo:before-fetch-response': CustomEvent;
//     'turbo:before-cache': CustomEvent;
//   }