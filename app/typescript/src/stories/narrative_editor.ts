import type SummernoteController from '../controllers/summernote_controller';
import { onInit as baseInit } from '../summernote';

export function summernoteConfig(ctrl: SummernoteController, height: number): Summernote.Options {
  return {
    minHeight: 500,
    toolbar: [
      ['style', ['style']],
      ['font', ['bold', 'italic', 'underline']], //, 'clear']],
      // ['fontname', ['fontname']],
      // ['fontsize', ['fontsize']],
      // ['color', ['color']],
      ['para', ['ul', 'ol', 'paragraph']],
      ['height', ['height']],
      ['table', ['table']],
      ['insert', ['link', 'picture', 'hr']],
      ['view', ['codeview']],
      ['help', ['help']],
      // ['customButton', ['showContributions']]
    ] as Summernote.toolbarDef,
    callbacks: {
      onInit: baseInit(ctrl, () => {
        // ctrl.$editor
        //   .find('.modal.note-modal')
        //     .addClass('image-dialog')  // add a missing class name
        //     .end()
        //   .find('.note-group-select-from-files')
        //     .find('label')
        //       .text('Select a file')
        //       .attr('for', 'summernote-file-input')
        //       .end()
        //     .find('input')
        //       .attr('id', 'summernote-file-input')
        //       .hide()
        //       .end()
        //     .after('<div class="or"><h5><span>OR</span></h5></div>')
        //     .end()
        //   .find('.note-image-btn')
        //     .toggleClass('btn-primary btn-success')
        //     .text('Insert');
          
        // ctrl.$editingArea.prepend(`
        //   <div id="show-contributions" class="collapse">
        //     <div>
        //       <div class="btn-group">
        //         <label>Group by</label>
        //         <label class="radio-inline" style="font-weight: normal">
        //           <input type="radio" name="group-contributions-by" value="question" checked>
        //           Question
        //         </label>
        //         <label class="radio-inline" style="font-weight: normal">
        //           <input type="radio" name="group-contributions-by" value="contributor">
        //           Contributor
        //         </label>
        //       </div>
        //       <div class="questions"></div>
        //       <div class="contributors hidden"></div>
        //     </div>
        //   </div>
        // `);
      }),
      onImageUpload: function (files) {
        // this will trigger $.fileupload
        // https://stackoverflow.com/questions/1696877
        $('#narrative__img-upload')[0].files = files;
        $('#narrative__img-upload').trigger('change');
      }
    }
  }
}