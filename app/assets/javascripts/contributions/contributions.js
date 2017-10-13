
function attachContributionsListeners () {

  $('#submission-form').on('submit', function () {
    $(this).find('button[type="submit"] span').toggle();
    $(this).find('button[type="submit"] .fa-spinner').toggle();
  });

}