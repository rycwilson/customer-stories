import { Controller } from '@hotwired/stimulus';
import { type SummernoteKind } from '../summernote';

// passing the config object via data attributes is problematic due to nested functions (tedious to represent in JSON)
// => import all necessary config factory functions here, then call them with arguments passed in from the parent
import { summernoteConfig as winStoryConfig } from '../customer_wins/win_story';
import { summernoteConfig as storyConfig } from '../stories/summernote_config';
import { summernoteConfig as invitationTemplateConfig } from '../invitation_templates';
import { summernoteConfig as contributorInvitationConfig } from '../contributor_invitations';
// import { defaultConfig } from '../summernote.js'

interface EditorConfig {
  (ctrl: SummernoteController, height: number, ...args: any): Summernote.Options;
}

const config: { [key in SummernoteKind]: EditorConfig | undefined } = {
  'winStory': winStoryConfig,
  'story': storyConfig,
  'invitationTemplate': invitationTemplateConfig,
  'contributorInvitation' : contributorInvitationConfig,
  'default': undefined
}

export default class SummernoteController extends Controller<HTMLDivElement> {
  static values = {
    enabled: { type: Boolean, default: false },
    configKey: { type: String, default: 'default' },
    configArgs: { type: Array, default: [220] }   // height is necessary, any others will depend on the specific configuration
  }
  declare enabledValue: boolean;
  declare readonly configKeyValue: SummernoteKind;
  declare readonly configArgsValue: [number, ...any[]];

  declare config: EditorConfig | undefined;
  
  declare $note: JQuery<HTMLTextAreaElement | HTMLDivElement, any>
  declare $codable: JQuery<HTMLTextAreaElement, any>
  declare $editable: JQuery<HTMLElement, any>
  declare $editingArea: JQuery<HTMLElement, any>
  declare $editor: JQuery<HTMLElement, any>
  declare $statusbar: JQuery<HTMLElement, any>
  declare $toolbar: JQuery<HTMLElement, any>

  connect() {
    if (this.enabledValue) this.init();
  }
  
  disconnect() {
    if ('summernote' in $(this.element).data()) this.destroy();
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