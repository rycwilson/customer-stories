$(function() {

  $('.welcome-toggle').on('click', function (e) {
    e.preventDefault();
    $('.welcome').toggleClass('show hidden');
  });

  $('#login-form').on('submit', function (e) {
    e.preventDefault();
    // $(this).find('#login-email').val() returns undefined
    var loginUser = {
      user: {
        email: $(this).find("[type='email']").val(),
        password: $(this).find('#login-password').val()
      }
    };
    $.post('/login', loginUser, function (res, status) {
      // success
      window.location.replace('/songs');
    })
      .fail(function (res, status) {
        switch (res.status) {
          case 403:
            $('#password-error-msg').text(res.responseText);
            $('#login-password').focus();
            $('#login-password').closest('.form-group')
              .toggleClass('has-error'); break;
          case 404:
            $('#email-error-msg').text(res.responseText);
            $('#login-email').focus();
            $('#login-email').closest('.form-group')
              .toggleClass('has-error');
        }
      });
  });

  $('#signup-form').on('submit', function (e) {
    e.preventDefault();
    var signupUser = {
      user: {
        email: $(this).find("[type='email']").val(),
        password: $(this).find('#signup-password').val(),
        firstName: $(this).find('#login-password').val()
      }
    };
  });

});