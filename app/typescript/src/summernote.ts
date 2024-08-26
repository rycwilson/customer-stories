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

export function onInit(ctrl: SummernoteController, customInit?: VoidFunction) {
  return (components: SummernoteComponents) => {
    for (const [key, component] of Object.entries(components)) {
      ctrl[`$${key}` as keyof $SummernoteComponents] = component;
    }
    ctrl.$editable.on('click', (e) => $(ctrl.$note).summernote('saveRange'));
    ctrl.dispatch('init', { detail: components });
    if (customInit) customInit(); 
  }
}