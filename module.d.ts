export {}

declare global {
  // https://stackoverflow.com/questions/38906359/create-a-global-variable-in-typescript#answer-56984941
  var CSP: CustomerStoriesApp;

  interface Window {
    $: JQueryStatic;
    jQuery: JQueryStatic;
    Stimulus: object;
    DataTable: object;
    TomSelect: object;
    ContributionController: typeof ContributionController;

  }
  interface CustomerStoriesApp {
    customerWins: CustomerWin[] | undefined;
    contributions: Contribution[] | undefined;
    currentUser: User | null;
    // screenSize: string;
    init(): void;
  }

  interface JQuery {
    tab: (action: string) => void;
    popover: (options: object) => void;
  }

  interface HTMLSelectElement {
    tomselect: TomSelect;
  }

  interface TurboFrameAttributes {
    id: string;
    src?: string;
    loading?: string;
    target?: string;
    disable?: boolean;  
    dataTurboAction?: string;
    dataAutoScrollBlock?: boolean | { block?: string, behavior?: string, inline?: string };

    // this applies to turbo-frame elements
    dataset: {
      placeholder?: string;
    }
  }

  interface Customer {
    id?: number;
    name?: string;
    slug?: string;
  }

  interface CustomerWin {
    id: number;
    name: string;
    customer_id: number; 
    curator_id: number; 
    curator: object; 
    customer: Customer; 
    story: { 
      id: number; 
      title: string; 
      published: boolean; 
      slug: string; 
      csp_story_path: string; 
    }
  }

  interface Story {
    id: number;
    title: string;
    published: boolean;
    slug: string;
    csp_story_path: string;
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
    answers?: Answer[];
  }

  interface InvitationTemplate {
    id: number;
    name: string;
  }

  interface Question {
    id?: number;
    question?: string;
  }

  interface Answer {
    answer: string;
    contributor_question_id: number;
    question: Question;
  }
}