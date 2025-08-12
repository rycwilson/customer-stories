import type SummernoteController from './controllers/summernote_controller';

// list of all possible custom buttons
type CustomButton = 'placeholdersDropdown' | 'contributionsDropdown';

// type SummernoteComponent = 'note' | 'codable' | 'editable' | 'editingArea' | 'editor' | 'statusbar' | 'toolbar';
// export type SummernoteComponents = { [key in SummernoteComponent]: JQuery<HTMLElement, any> };


// mirrors the 'layoutInfo' property in the context object that is passed to custom buttons (see win_story.ts)
export interface SummernoteComponents {
  note: JQuery<HTMLTextAreaElement | HTMLDivElement, any>;
  codable: JQuery<HTMLTextAreaElement, any>;
  editable: JQuery<HTMLDivElement, any>;
  editingArea: JQuery<HTMLDivElement, any>;
  editor: JQuery<HTMLDivElement, any>;
  statusbar: JQuery<HTMLDivElement, any>;
  toolbar: JQuery<HTMLDivElement, any>;
}

type PrependKeys<T> = {
  [K in keyof T as `$${string & K}`]: T[K];
}

type $SummernoteComponents = PrependKeys<SummernoteComponents>;

// copied from @types/summernote
type ToolbarDefinition = Array<
| ["style", Summernote.toolbarStyleGroupOptions[]]
| ["font", Summernote.toolbarFontGroupOptions[]]
| ["fontname", Summernote.toolbarFontNameOptions[]]
| ["fontsize", Summernote.toolbarFontsizeGroupOptions[]]
| ["color", Summernote.toolbarColorGroupOptions[]]
| ["para", Summernote.toolbarParaGroupOptions[]]
| ["height", Summernote.toolbarHeightGroupOptions[]]
| ["table", Summernote.toolbarTableGroupOptions[]]
| ["insert", Summernote.toolbarInsertGroupOptions[]]
| ["view", Summernote.toolbarViewGroupOptions[]]
| ["help", Summernote.toolbarHelpGroupOptions[]]
| ["misc", Summernote.miscGroupOptions[]]
| ["customButton", CustomButton[]]
>;

type CustomOptions = {
  toolbar: ToolbarDefinition;
  buttons: Partial<{ [key in CustomButton]: (context: any) => JQuery<HTMLElement, any> }>
}

export type SummernoteKind = 'winStory' | 'story' | 'invitationTemplate' | 'contributorInvitation' | 'default';

export type CustomSummernoteOptions = Summernote.Options & CustomOptions;

export const baseConfig = {
  dialogsInBody: true,
  dialogsFade: true,
  placeholder: 'Nothing here yet...',
  // inheritPlaceholder: true (for textarea)
}

export const baseCallbacks = {
  onInit: function (
    this: JQuery<HTMLElement, any>,
    context: SummernoteComponents,
    ctrl: SummernoteController
  ) {
    for (const [key, component] of Object.entries(context)) {
      ctrl[`$${key}` as keyof $SummernoteComponents] = component;
    }
    // ctrl.$editable.on('click', (e) => $(ctrl.$note).summernote('saveRange'));
    ctrl.dispatch('init', { detail: context });

    // console.log('this in base:', this);
    // console.log('context in base:', context);
    // console.log('ctrl in base:', ctrl);
  },
  // onEnter: function(this: JQuery<HTMLElement>, e: KeyboardEvent) {},
  // onFocus: function(this: JQuery<HTMLElement>, e: FocusEvent) {},
  // onBlur: function(this: JQuery<HTMLElement>, e: FocusEvent) {},
  // onKeyup: function(this: JQuery<HTMLElement>, e: KeyboardEvent) {},
  // onKeydown: function(this: JQuery<HTMLElement>, e: KeyboardEvent) {},
  // onPaste: function(this: JQuery<HTMLElement>, e: ClipboardEvent) {},
  onChange: function (
    this: JQuery<HTMLElement, any>,
    contents: string,
    $editable: JQuery<HTMLElement, any>,
    ctrl: SummernoteController
  ) {
    ctrl.dispatch('change', { detail: { contents } });
  },
  onImageUpload: function(this: JQuery<HTMLElement, any>, files: File[]) {},
  // onImageUploadError: function(this: JQuery<HTMLElement>, msg: string, jqXHR: JQuery.jqXHR) {},
  // onMediaDelete: function(this: JQuery<HTMLElement>, target: JQuery<HTMLElement>) {},
  // onDialogShown: function(this: JQuery<HTMLElement>, dialog: HTMLElement) {},
  // onDialogHidden: function(this: JQuery<HTMLElement>, dialog: HTMLElement) {},
  // onInitCodeview: function(this: JQuery<HTMLElement>) {},
  // onChangeCodeview: function(this: JQuery<HTMLElement>) {},
  // onPopoverShown: function(this: JQuery<HTMLElement>, popover: HTMLElement) {},
  // onPopoverHidden: function(this: JQuery<HTMLElement>, popover: HTMLElement) {},
  // onToolbarClick: function(this: JQuery<HTMLElement>, event: JQuery.Event) {},
};