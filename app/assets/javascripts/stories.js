//= require slimscroll/jquery.slimscroll
//= require mvpready-admin
//= require bootstrap-switch/dist/js/bootstrap-switch

// Select2
//= require select2/dist/js/select2

// Best in Place
//= require best_in_place

$(function () {

  initListeners();
  configPlugins();
  stylingAdjustments();

  console.log($('#embed-iframe')[0].src);

});

function initListeners () {

  $(".best_in_place[data-bip-attribute='embed_url'").bind("ajax:success", function (data, status) {

    $('#embed-iframe').attr('src', $(this)[0].textContent );

  });

}

function configPlugins () {

  // in-place editing
  $('.best_in_place').best_in_place();

  $('#publish-story').bootstrapSwitch({
    size: 'small'
  });
  $('#publish-logo').bootstrapSwitch({
    size: 'small'
  });


  $('.story-tags').select2({
    theme: 'bootstrap',
    placeholder: 'select tags'
  });

}

function stylingAdjustments () {
  // var height = $('#story-quote-well').height();
  // $('#edit-story-quote-attr').css('margin-top', height + 5 + 'px');

  // o1 = $('#story-quote-well').offset();
  // o2 = $(".best_in_place[data-bip-attribute='quote']").offset();
  // o3 = $(".best_in_place[data-bip-attribute='quote_attr']").offset();
  // $('#edit-story-quote').css('margin-top', ((o2.top - o1.top) - 5)  + 'px');
  // $('#edit-story-quote-attr').css('margin-top', ((o3.top - o1.top) - 5) + 'px');
  // console.log(o1, o2);

}




