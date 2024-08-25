import type SummernoteController from './controllers/summernote_controller';

// list of all possible custom buttons
type CustomButton = 'placeholdersDropdown' | 'contributionsDropdown';

type SummernoteComponent = 'note' | 'codable' | 'editable' | 'editingArea' | 'editor' | 'statusbar' | 'toolbar';

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

export type SummernoteInstance = { [key in SummernoteComponent]: JQuery<HTMLElement, any> };

export type CustomSummernoteOptions = Summernote.Options & CustomOptions;

export function onInit(ctrl: SummernoteController, customInit?: Function) {
  return (instance: SummernoteInstance) => {
    for (const [key, component] of Object.entries(instance) as [SummernoteComponent, JQuery<HTMLElement, any>][]) {
      ctrl[`$${key}`] = component;
    }
    ctrl.$editable.on('click', (e) => $(ctrl.$note).summernote('saveRange'));
    ctrl.dispatch('init', { detail: instance });
    if (customInit) customInit(); 
  }
}