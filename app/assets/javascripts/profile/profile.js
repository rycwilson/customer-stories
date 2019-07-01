
function profileEdit () {

  // if (!CSP.current_user.is_curator) {
  //   $('header').css('background-color', 'white');
  //   $('header').css('border-color', '#dddddd');
  // }

  $('.dropdown.user-profile').addClass('active');
  $(document)
    .one('turbolinks:before-visit', function () {
      if ($('.dropdown.user-profile').hasClass('active')) {
        $('.dropdown.user-profile').removeClass('active');
      }
    })
    .one('click', '.nav-workflow', function () {
      if ($('.dropdown.user-profile').hasClass('active')) {
        $('.dropdown.user-profile').removeClass('active');
      }
    });

}

function attachProfileListeners () {

  $(document)
    .on('click', '.btn.linkedin-edit',
      function () {
        $('.linkedin-connect').toggle();
      })
    .on('click', '#remove-li-profile-modal .btn-ok',
      function () {
        $('.linkedin-url').toggleClass('url-present url-absent');
        $('#user_linkedin_url').val('');
        $('.linkedin-container').css('opacity', '0.5').css('pointer-events', 'none');
        // $(document).one('hidden.bs.modal', '#remove-li-profile-modal',
        //   function () {
        //   });
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
      })
    .on('click', 'button[type="submit"][form="user-profile-form"]', function (e) {
      var $form = $('#user-profile-form'), $button = $(this);
      if ($form.data('submitted')) {
        e.preventDefault();
        return false;
      }
      $form.data('submitted', '1');
      $button.find('span, .fa-spin').toggle();
    });

}





