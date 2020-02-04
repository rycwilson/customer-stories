
export function formIsValid($form) {
  let formIsValid = true;
  $form.find('select[required], input[required]')
         .each((index, input) => formIsValid = input.checkValidity());
  return formIsValid;
}

const forms = {

  toggleWorking: ($form, $btn) => {
    var $button;
    $form.attr('data-submitted', 'true');
    if ($btn) {
      $button = $btn;
      /**
       *  promote settings form ...
       *  if multiple submit buttons, use data-submitted to identify which form group was submitted in the response
       */
      $button.attr('data-submitted', 'true');
    } else {
      $button = ($form.find('button[type="submit"]').length && $form.find('button[type="submit"]')) ||
                $('button[form="' + $form.attr('id') + '"]');
    }
    $button.find('.fa-spin, span').toggle();
  },
  
  toggleDone: ($form, useCheckIcon, cb, $btn) => {
    var $button = $btn ? $btn :
        ($form.find('button[type="submit"]').length && $form.find('button[type="submit"]')) ||
        $('button[form="' + $form.attr('id') + '"]');
    if (useCheckIcon) {
      $button.find('.fa-spin, .fa-check').toggle();
      setTimeout(function () {
        $form.attr('data-submitted', '');
        if ($btn) $button.attr('data-submitted', '');
        $button.find('.fa-check, span').toggle();
        if (cb) cb();
      }, 2500);
    } else {
      $form.attr('data-submitted', '');
      if ($btn) $button.attr('data-submitted', '');
      $button.find('.fa-spin, span').toggle();
      if (cb) cb();
    }
  }
  
}