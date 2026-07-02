// The global augmentations could also be in ./global.d.ts (without need for `declare global`). 
// They're here for the sake of organization.
declare global {
  interface Window {
    $: JQueryStatic;
    jQuery: JQueryStatic;
    Stimulus: import("@hotwired/stimulus").Application;
    CSP: CustomerStoriesApp;
  }

  interface JQuery<HTMLElement> {
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
}

// We need to augment this type since `restorationIdentifier` was not included in its definition.
// See dashboard_controller.ts and company_settings_controller.ts for usage.
declare module '@hotwired/turbo' {
  interface Navigator {
    history: {
      restorationIdentifier: string;
    }
  }
}

// When imported in the relevant files, the datatables.net-rowgroup import is not 
// successfully augmenting the Config type. So we'll add the augmentation here.
// TODO: Upgrade to Datatables 2
declare module 'datatables.net' {
	interface Config {
		rowGroup?: any;
	}

  interface Api<T> {
		rowGroup(): any;
	}
}

// `export {}` makes this a module file so `declare module` blocks are treated as
// augmentations (merged with existing types) rather than ambient replacements
export {}