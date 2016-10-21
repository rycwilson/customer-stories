
function attachContributionsHandlers () {

  $(document).on('click', '#contribution-submission-prompts', function () {
    var $link = $(this).find('a');
    if ($link.text() == 'helpful pointers') {
      $link.text('hide pointers');
    }
    else {
      $link.text('helpful pointers');
    }
  });

}