
function storyFormValidator () {

  $('#story-content-form').validator({

    custom: {
      'max-summary-length': function ($summary) {
        var maxWords = parseInt( $summary.data('max-summary-length'), 10 );
        console.log('words: ', $summary.val().split(' ').length);
        if ( $summary.val().split(' ').length > maxWords ) {
          console.log('max')
          return "Max length exceeded";
        }
      }
    }

  });

}