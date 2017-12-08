
function toggleFormWorking ($form) {
  var $button = ($form.find('button[type="submit"]').length && $form.find('button[type="submit"]')) ||
                $('button[form="' + $form.attr('id') + '"]');
  $form.data('submitted', '1');
  $button.find('span, .fa-spin').toggle();
}

function toggleFormDone ($form, useCheckIcon) {
  var $button = ($form.find('button[type="submit"]').length && $form.find('button[type="submit"]')) ||
                $('button[form="' + $form.attr('id') + '"]');
  if (useCheckIcon) {
    $button.find('.fa-spin, .fa-check').toggle();
    setTimeout(function () {
      $form.data('submitted', '');
      $button.find('.fa-check, span').toggle();
    }, 2000);
  } else {
    $form.data('submitted', '');
    $button.find('.fa-spin, span').toggle();
  }
}