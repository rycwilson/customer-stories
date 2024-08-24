import type SummernoteController from '../controllers/summernote_controller';
import { onInit as baseInit } from '../summernote';

export function summernoteConfig (ctrl: SummernoteController, height: number): Summernote.Options {
  return {
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
      onInit: baseInit(ctrl, (_ctrl: SummernoteController) => {
      })
    }
  }
}