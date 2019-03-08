
function toggleFormWorking ($form) {
  var $button = ($form.find('button[type="submit"]').length && $form.find('button[type="submit"]')) ||
                $('button[form="' + $form.attr('id') + '"]');
  $form.attr('data-submitted', 'true');
  $button.find('.fa-spin, span').toggle();
}

function toggleFormDone ($form, useCheckIcon, cb) {
  var $button = ($form.find('button[type="submit"]').length && $form.find('button[type="submit"]')) ||
                $('button[form="' + $form.attr('id') + '"]');
  if (useCheckIcon) {
    $button.find('.fa-spin, .fa-check').toggle();
    setTimeout(function () {
      $form.data('submitted', '');
      $button.find('.fa-check, span').toggle();
      if (cb) cb();
    }, 2000);
  } else {
    $form.attr('data-submitted', '');
    $button.find('.fa-spin, span').toggle();
    if (cb) cb();
  }
}