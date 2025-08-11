import type SummernoteController from '../controllers/summernote_controller';
import { type SummernoteComponents, baseConfig, baseCallbacks } from '../summernote';

export function summernoteConfig(ctrl: SummernoteController, height: number): Summernote.Options {
  const config: Summernote.Options = {
    height,
    toolbar: [
      // ['style', ['style']],
      ['font', ['bold', 'italic', 'underline']], //, 'clear']],
      // ['fontname', ['fontname']],
      // ['fontsize', ['fontsize']],
      // ['color', ['color']],
      ['para', ['ul', 'ol', 'paragraph']],
      // ['height', ['height']],
      // ['table', ['table']],
      // ['insert', ['link', 'picture', 'hr']],
      // ['view', ['codeview']],
      // ['help', ['help']]
    ],
    callbacks: {
      ...baseCallbacks,
      ...{
        onInit: function (this: JQuery<HTMLElement, any>, context: SummernoteComponents) {
          baseCallbacks.onInit.call(this, context, ctrl);
        }
      }
    }
  }
  return { ...baseConfig, ...config };
}