
function resetFormSubmit ($form) {
  $form.data('submitted', '');
}

function toggleFormButton ($form) {
  var $button = $form.find('button[type="submit"]') || $('button[form="' + $form.attr('id') + '"]');
  $button.find('span, .fa-spin').toggle();
}