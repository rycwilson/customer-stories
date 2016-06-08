window.App = window.App || {

  init: function () {
    console.log('init');
    $('[data-toggle="tooltip"]').tooltip();

    setTimeout(function () {
      $('#flash').slideUp();
    }, 3000);

  }

};
