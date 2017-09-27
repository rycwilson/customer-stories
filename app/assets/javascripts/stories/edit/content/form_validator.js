
function storyFormValidator () {

  $('#story-content-form').validator({
    custom: {
      'summary-range': function ($summary) {
        var minWords = parseInt( $summary.data('summary-range').split('-')[0], 10 ),
            maxWords = parseInt( $summary.data('summary-range').split('-')[1], 10 );

        if ($summary.val() !== '') {
          if ( $summary.val().split(' ').length < minWords ) {
            return "Must be at least " + minWords.toString() + " words";
          }
          if ( $summary.val().split(' ').length > maxWords ) {
            return "Must be no more than "+ maxWords.toString() + " words";
          }
        }

      }
    }
  });

}