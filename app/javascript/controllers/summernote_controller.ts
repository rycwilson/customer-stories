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

export default class extends Controller<HTMLDivElement> {
  static values = {
    enabled: { type: Boolean, default: false },
    configKey: { type: String, default: 'default' },
    configArgs: { type: Array, default: [this, 220] }   // height is necessary, any others will depend on the specific configuration
  }

  configFactory;
  codable;
  editable;
  editingArea;
  editor;
  statusbar;
  toolbar;

  connect() {
    // console.log('connect summernote')
    this.configFactory = this.configKeyValue in configFactories ? 
      configFactories[this.configKeyValue] : 
      configFactories['default'];
    if (this.enabledValue) this.init();
  }

  // use contenteditable instead of textarea because html can't be rendered in textarea
  init() {
    this.element.contentEditable = 'true';
    $(this.element).summernote( this.configFactory(this, ...this.configArgsValue) );
  }

  onInitComplete(e) {
    this.codable = e.detail.codable;
    this.editable = e.detail.editable;
    this.editingArea = e.detail.editingArea;
    this.editor = e.detail.editor;
    this.statusbar = e.detail.statusbar;
    this.toolbar = e.detail.toolbar;
    $(this.editable).on('click', (e) => $(this.element).summernote('saveRange'));
    // console.log('codable', codable)
    // console.log('editable', editable)
    // console.log('editingArea', editingArea)
    // console.log('editor', editor)
    // console.log('statusbar', statusbar)
    // console.log('toolbar', toolbar)
  }

  destroy() {
    $(this.element).summernote('destroy');
    this.element.contentEditable = 'false';
  }

  enabledValueChanged(isEnabled, wasEnabled) {
    if (wasEnabled === undefined) return false;
    isEnabled ? this.init() : this.destroy();
  }
}