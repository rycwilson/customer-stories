import SummernoteController from '../controllers/summernote_controller';

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
      onInit() {}
    }
  }
}