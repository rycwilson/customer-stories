import { Controller } from '@hotwired/stimulus';

// passing the config object via data attributes is problematic due to nested functions (tedious to represent in JSON)
// => import all necessary config factory functions here, then call them with arguments passed in from the parent
import { summernoteConfig as winStoryConfig } from '../customer_wins/win_story';
// import { summernoteConfig as storyConfig } from '../stories/stories.js'
// import { defaultConfig } from '../summernote.js'

interface ConfigFactory {
  (ctrl: SummernoteController, height: number, ...args: any): Summernote.Options;
}

const configFactories: {
  [editor: string]: ConfigFactory | undefined
} = {
  'win-story': winStoryConfig,
  'story': undefined,
  'default': undefined
}

export default class SummernoteController extends Controller<HTMLDivElement> {
  static values = {
    enabled: { type: Boolean, default: false },
    configKey: { type: String, default: 'default' },
    configArgs: { type: Array, default: [220] }   // height is necessary, any others will depend on the specific configuration
  }
  declare enabledValue: boolean;
  declare readonly configKeyValue: string;
  declare configArgsValue: [number, ...any[]];

  declare configFactory: ConfigFactory | undefined;
  
  [key: string]: any; // allow computed property names
  declare $codable: JQuery<HTMLTextAreaElement, any>
  declare $editable: JQuery<HTMLDivElement, any>
  declare $editingArea: JQuery<HTMLDivElement, any>
  declare $editor: JQuery<HTMLDivElement, any>
  declare $statusbar: JQuery<HTMLDivElement, any>
  declare $toolbar: JQuery<HTMLDivElement, any>

  connect() {
    // console.log('connect summernote')
    if (this.enabledValue) this.init();
  }

  // use contenteditable instead of textarea because html can't be rendered in textarea
  init() {
    this.configFactory = configFactories[this.configKeyValue];
    if (this.configFactory) {
      this.element.contentEditable = 'true';
      $(this.element).summernote( this.configFactory(this, ...this.configArgsValue) );
    }  
  }

  onInitComplete(e: CustomEvent) {
    Object.keys(e.detail).forEach(key => this[key] = e.detail[key]);
    this.$editable.on('click', (e) => $(this.element).summernote('saveRange'));
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