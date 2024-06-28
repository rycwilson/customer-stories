// list of all possible custom buttons
type CustomButton = 'placeholdersDropdown' | 'contributionsDropdown';

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
  buttons: Partial<{ [key in CustomButton]: (context: any) => JQuery<HTMLDivElement, any> }>
}

export type SummernoteEditorKind = 'winStory' | 'story' | 'invitationTemplate' | 'contributorInvitation' | 'default';

export type CustomSummernoteOptions = Summernote.Options & CustomOptions;