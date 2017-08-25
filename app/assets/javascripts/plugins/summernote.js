
function initSummernote () {

  $('#email-confirmation-editor').summernote({
    focus: false,  // this does not appear to work
    toolbar: [
      // ['style', ['style']],
      ['font', ['bold', 'italic', 'underline']], //, 'clear']],
      // ['fontname', ['fontname']],
      // ['color', ['color']],
      ['para', ['ul', 'ol', 'paragraph']],
      // ['height', ['height']],
      // ['table', ['table']],
      // ['insert', ['link', 'picture', 'hr']],
      // ['view', ['codeview']],
      // ['help', ['help']]
    ],
  });

  $('#email-template-editor').summernote({
    toolbar: [
      // ['style', ['style']],
      ['font', ['bold', 'italic', 'underline']], //, 'clear']],
      ['fontname', ['fontname']],
      ['fontsize', ['fontsize']],
      // ['color', ['color']],
      ['para', ['ul', 'ol', 'paragraph']],
      ['height', ['height']],
      // ['table', ['table']],
      ['insert', ['link', 'picture', 'hr']],
      ['view', ['codeview']],
      // ['help', ['help']]
    ],
  });

  $('#story-content-editor').summernote({
    toolbar: [
      ['style', ['style']],
      ['font', ['bold', 'italic', 'underline']], //, 'clear']],
      ['fontname', ['fontname']],
      ['fontsize', ['fontsize']],
      // ['color', ['color']],
      ['para', ['ul', 'ol', 'paragraph']],
      ['height', ['height']],
      ['table', ['table']],
      ['insert', ['link', 'picture', 'hr']],
      ['view', ['codeview']],
      ['help', ['help']]
    ],
  });

  // if ($('body').hasClass('stories edit')) {
  //   var $storyContentEditor = $('#story-content-editor'),
  //       $summernote = $storyContentEditor.next(),
  //       $editor = $summernote.find('.note-editable'),
  //       $toolbarButtons = $summernote.find('.note-toolbar > .note-btn-group > button, .note-toolbar > .note-btn-group > .note-btn-group > button');
  //   // disable the editor until edit button is clicked
  //   $editor.attr('contenteditable', 'false')
  //          .css({
  //           'background-color': '#f5f5f5',
  //           'pointer-events': 'none'
  //          });
  //   $toolbarButtons.css({
  //                   'background-color': '#f5f5f5',
  //                   'pointer-events': 'none'
  //                  });
  // }
}

function initEmailRequestEditor () {
  $('#email-request-editor').summernote({
    toolbar: [
      // ['style', ['style']],
      ['font', ['bold', 'italic', 'underline']], //, 'clear']],
      ['fontname', ['fontname']],
      ['fontsize', ['fontsize']],
      // ['color', ['color']],
      ['para', ['ul', 'ol', 'paragraph']],
      ['height', ['height']],
      // ['table', ['table']],
      ['insert', ['link', 'picture', 'hr']],
      ['view', ['codeview']],
      // ['help', ['help']]
    ],
  });
}