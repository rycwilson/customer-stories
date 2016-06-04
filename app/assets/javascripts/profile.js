// MVP plug-ins
//= require slimscroll/jquery.slimscroll
//= require magnific-popup/dist/jquery.magnific-popup
//= require datatables/media/js/jquery.dataTables
//= require datatables-plugins/integration/bootstrap/3/dataTables.bootstrap
//= require bootstrap-jasny/js/fileinput.js
//= require mvpready-admin

// Select2
//= require select2/dist/js/select2

// AWS S3 upload
//= require jquery-ui/ui/widget.js
//= require jquery-file-upload/js/jquery.fileupload

$(function () {

  // var lastProfileTab = sessionStorage.getItem('lastProfileTab');

  // if (lastProfileTab) {
  //   $('[href="' + lastProfileTab + '"]').tab('show');
  // }
  // if (lastProfileTab) {
  //   $('[href="' + lastProfileTab + '"]').tab('show');
  // }

  initListeners();
  configS3Upload();
  $.getScript('//platform.linkedin.com/in.js');

});

// function navTabs () {
//   $('.mainnav .active').removeClass('active');

//   $('.nav-tabs a').on('click', function (e) {
//     $.get('/companies/')
//   });
// }

function initListeners () {

  $('.nav-stacked a[data-toggle="tab"]').on('shown.bs.tab', function () {
    // password reload should go back to profile
    if ($(this).attr('href') == '#password-tab')
      sessionStorage.setItem('lastProfileTab', '#profile-tab');
    else
      sessionStorage.setItem('lastProfileTab', $(this).attr('href'));
  });

  $('.linkedin-checkbox').on('change', function () {

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

  $('.linkedin-checkbox').on('focus', function () {
    $(this).blur();
  });
}
