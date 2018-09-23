
function initTooltips () {

  $('[data-toggle="tooltip"]:not(#edit-crowdsource [data-toggle="tooltip"])').tooltip();

  $('#edit-crowdsource [data-toggle="tooltip"]').tooltip({
    container: 'body',
    delay: {
      show: 1000,
      hide: 0
    }
  });

}