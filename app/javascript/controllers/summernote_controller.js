import { Controller } from '@hotwired/stimulus';

// passing the config object via data attributes is problematic due to nested functions (tedious to represent in JSON)
// => import all necessary config factory functions here, then call them with arguments passed in from the parent
import { summernoteConfig as winStoryConfig } from '../customer_wins/win_story';
// import { summernoteConfig as storyConfig } from '../stories/stories.js'
// import { defaultConfig } from '../summernote.js'

const configFactories = {
  'win-story': winStoryConfig,
  'story': undefined,
  'default': undefined
}

export default class extends Controller {
  static values = {
    enabled: { type: Boolean, default: false },
    configKey: { type: String, default: 'default' },
    configArgs: { type: Array, default: [220] }   // height is necessary, any others will depend on the specific configuration
  }

  configFactory;

  connect() {
    // console.log('connect summernote')
    this.configFactory = this.configKeyValue in configFactories ? 
      configFactories[this.configKeyValue] : 
      configFactories['default'];
    if (this.enabledValue) this.init();
  }

  // use contenteditable instead of textarea because html can't be rendered in textarea
  init() {
    $(this.element).prop('contenteditable', 'true').summernote( this.configFactory(...this.configArgsValue) );
  }

  destroy() {
    $(this.element).summernote('destroy');
  }

  enabledValueChanged(shouldEnable) {
    shouldEnable ? this.init() : this.destroy();
  }
}