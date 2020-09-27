import video from 'lib/video';

export default {
  init() {
    video.loadThumbnail();
    // initNarrativeEditor();
    // initContributorsTable();
  },
  addListeners() {
    
  }
}

function initNarrativeEditor () {
  const contributionsTemplate = `
    <div id="show-contributions" class="collapse">
      <div>
        <div class="btn-group">
          <label>Group by</label>
          <label class="radio-inline" style="font-weight: normal">
            <input type="radio" name="group-contributions" value="question" disabled>Question</label>
          <label class="radio-inline" style="font-weight: normal">
            <input type="radio" name="group-contributions" value="contributor" disabled>Contributor</label>
        </div>

        <div class="contributions"></div>

      </div>
    </div>
  `;
  const showContributions = function (context) {
    const ui = $.summernote.ui;
    const button = ui.buttonGroup([
      ui.button({
        className: 'btn btn-default',
        data: {},
        disabled: true,
        tooltip: 'Show/Hide Contributions',
        contents: '<i class="fa fa-fw fa-comments-o"></i>',
        // tooltip: 'Insert a data placeholder'
      })
    ]);
    return button.render();   // return button as jquery object
  };

  $('#narrative-editor').summernote({
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
      ['customButton', ['showContributions']]
    ],
    buttons: {
      showContributions: showContributions
    },
    callbacks: {
      onInit: function (summernote) {
        summernote.editor
          .find('.modal.link-dialog + .modal')
            .addClass('image-dialog')  // add a missing class name
            .end()
          .find('.note-group-select-from-files')
            .find('label')
              .text('Select a file')
              .attr('for', 'summernote-file-input')
              .end()
            .find('input')
              .attr('id', 'summernote-file-input')
              .hide()
              .end()
            .after('<div class="or"><h5><span>OR</span></h5></div>')
            .end()
          .find('.note-image-btn')
            .toggleClass('btn-primary btn-success')
            .text('Insert');
      },
      onImageUpload: function (files) {
        // this will trigger $.fileupload
        // https://stackoverflow.com/questions/1696877
        $('#narrative__img-upload')[0].files = files;
        $('#narrative__img-upload').trigger('change');
      }
    }
  });
  $('#narrative-editor').next().find('.note-editing-area').prepend(contributionsTemplate);
}