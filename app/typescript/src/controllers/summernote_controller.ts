import { Controller } from '@hotwired/stimulus';
import { type SummernoteEditorKind } from '../summernote';

// passing the config object via data attributes is problematic due to nested functions (tedious to represent in JSON)
// => import all necessary config factory functions here, then call them with arguments passed in from the parent
import { summernoteConfig as winStoryConfig } from '../customer_wins/win_story';
import { summernoteConfig as invitationTemplateConfig } from '../invitation_templates';
import { summernoteConfig as contributorInvitationConfig } from '../contributor_invitations';
import { summernoteConfig as storyConfig } from '../stories/summernote_config';
// import { defaultConfig } from '../summernote.js'

interface EditorConfig {
  (ctrl: SummernoteController, height: number, ...args: any): Summernote.Options;
}

const config: { [key in SummernoteEditorKind]: EditorConfig | undefined } = {
  'winStory': winStoryConfig,
  'invitationTemplate': invitationTemplateConfig,
  'contributorInvitation' : contributorInvitationConfig,
  'story': storyConfig,
  'default': undefined
}

export default class SummernoteController extends Controller<HTMLDivElement> {
  static values = {
    enabled: { type: Boolean, default: false },
    configKey: { type: String, default: 'default' },
    configArgs: { type: Array, default: [220] }   // height is necessary, any others will depend on the specific configuration
  }
  declare enabledValue: boolean;
  declare readonly configKeyValue: SummernoteEditorKind;
  declare readonly configArgsValue: [number, ...any[]];

  declare config: EditorConfig | undefined;
  
  [key: string]: any; // allow computed property names
  declare $codable: JQuery<HTMLTextAreaElement, any>
  declare $editable: JQuery<HTMLDivElement, any>
  declare $editingArea: JQuery<HTMLDivElement, any>
  declare $editor: JQuery<HTMLDivElement, any>
  declare $statusbar: JQuery<HTMLDivElement, any>
  declare $toolbar: JQuery<HTMLDivElement, any>

  connect() {
    if (this.enabledValue) this.init();
  }
  
  disconnect() {
    if ('summernote' in $(this.element).data()) this.destroy();
  }
  
  onInitComplete(e: CustomEvent) {
    Object.keys(e.detail).forEach(key => this[key] = e.detail[key]);
    this.$editable.on('click', (e) => $(this.element).summernote('saveRange'));
  }
  
  init() {
    this.config = config[this.configKeyValue];
    if (this.config) {
      // use contenteditable instead of textarea because html can't be rendered in textarea
      this.element.contentEditable = 'true';
      $(this.element).summernote(this.config(this, ...this.configArgsValue));
    }  
  }

  destroy() {
    $(this.element).summernote('destroy');
    this.element.contentEditable = 'false';
  }

  enabledValueChanged(isEnabled: boolean, wasEnabled: boolean) {
    if (wasEnabled === undefined) return;
    isEnabled ? this.init() : this.destroy();
  }
}