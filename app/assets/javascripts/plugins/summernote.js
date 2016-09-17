
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
}