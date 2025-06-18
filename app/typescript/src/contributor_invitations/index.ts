import type SummernoteController from '../controllers/summernote_controller';
import { baseConfig, onInit as baseInit } from '../summernote';

export function summernoteConfig (ctrl: SummernoteController, height: number): Summernote.Options {
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
      onInit: baseInit(ctrl, () => {
      })
    }
  }
  return { ...baseConfig, ...config };
}