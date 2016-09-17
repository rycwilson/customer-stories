
function initLinkedIn () {

  // linkedin library
  if (typeof(IN) !== 'object') {
    $.getScript('//platform.linkedin.com/in.js');  // it will parse independently when loaded
  } else {
    IN.parse();
  }

  //  give the  widgets a second to load, then disable their tabbing behavior
  window.setTimeout(function () {
    $("#contribution-connections iframe").each(function () {
      $(this).prop('tabIndex', '-1');
    });
  }, 1000);

}

// function initEmbedly () {
//   if (typeof(embedly) !== 'function') {
//     $.getScript('//cdn.embedly.com/widgets/platform.js');
//   } else {

//   }
// }