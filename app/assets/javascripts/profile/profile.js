
function profileEdit () {
  if (!app.current_user.company_id) {
    $('header').css('background-color', 'white');
    $('header').css('border-color', '#dddddd');
  }
}

function attachProfileHandlers () {

  $(document).on('shown.bs.tab', '.nav-stacked a[data-toggle="tab"]', function () {
    // password reload should go back to profile
    if ($(this).attr('href') == '#password-tab')
      sessionStorage.setItem('lastProfileTab', '#profile-tab');
    else
      sessionStorage.setItem('lastProfileTab', $(this).attr('href'));
  });

  $(document).on('focus', '.contributor-linkedin-checkbox', function () {
    $(this).blur();
  });

  $(document).on('change', '.contributor-linkedin-checkbox', function () {
    if ($(this).find('#contribution_publish_contributor').prop('checked')) {  // unchecked
      $(this).find('#contribution_contributor_unpublished').val(false);
    } else {
      $(this).find('#contribution_contributor_unpublished').val(true);
    }
    $(this).submit();
  });

}





