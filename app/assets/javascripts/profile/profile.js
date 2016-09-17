
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

  $(document).on('change', '.linkedin-checkbox', function () {

    if ($(this).val() === 'true') {
      $(this).val(false);
    } else {
      $(this).val(true);
    }

    $.ajax({
      url: '/contributions/' + $(this).data('token'),
      method: 'put',
      data: { "linkedin_include_profile": $(this).val() },
      success: function (data, status, xhr) {
        console.log(data, status);
      }
    });

  });

  $(document).on('focus', '.linkedin-checkbox', function () {
    $(this).blur();
  });

}





