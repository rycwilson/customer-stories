
function profileEdit () {
  if (!app.current_user.is_curator) {
    $('header').css('background-color', 'white');
    $('header').css('border-color', '#dddddd');
  }


}

function attachProfileListeners () {

  $(document)
    .on('click', '.btn.linkedin-edit',
      function () {
        $('.linkedin-connect').toggle();
      })
    .on('click', '#remove-li-profile-modal .btn-ok',
      function () {
        $('#user_linkedin_url').val('');
        $('.linkedin-url').toggleClass('url-present url-absent');
        $(document).one('hidden.bs.modal', '#remove-li-profile-modal',
          function () {
            $('.linkedin-container').empty();
          });
        $('#remove-li-profile-modal').modal('hide');
      })
    .on('shown.bs.tab', '.nav-stacked a[data-toggle="tab"]',
      function () {
        // password reload should go back to profile
        if ($(this).attr('href') == '#password-tab')
          sessionStorage.setItem('lastProfileTab', '#profile-tab');
        else
          sessionStorage.setItem('lastProfileTab', $(this).attr('href'));
      })
    .on('change', '.contributor-linkedin-checkbox',
      function () {
        if ($(this).find('#contribution_publish_contributor').prop('checked')) {  // unchecked
          $(this).find('#contribution_contributor_unpublished').val(false);
        } else {
          $(this).find('#contribution_contributor_unpublished').val(true);
        }
        $(this).submit();
      })
    .on('focus', '.contributor-linkedin-checkbox',
      function () {
        $(this).blur();
      });

}





