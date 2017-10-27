
function newSuccessListeners () {

  var contributorAttrs = ['first_name', 'last_name', 'email', 'sign_up_code', 'password'],
      disableContributorAttrs = function (disabled) {
        contributorAttrs.forEach(function (attr) {
          $('#success_contributions_attributes_0_contributor_attributes_' + attr)
            .prop('disabled', disabled);
        });
      };

  $(document)

    .on('change', '#new-success-form #success_contributions_attributes_0_referrer_id', function () {

      // if creating a new referrer with this success, enable contributor attributes
      if ($(this).val() === '0') {
        $('.create-referrer').removeClass('hidden');
        disableContributorAttrs(false);

      // if not, disable contributor attributes
      // (referrer_id disabled at submit click bleow)
      } else {
        $('.create-referrer').addClass('hidden');
        disableContributorAttrs(true);
      }

    })

    // select customer by id or create a new customer
    .on('change', '#new-success-form select.customer', function () {
      $('#new-success-form #success_customer_id, ' +
          '#new-success-form #success_customer_attributes_id')
        .val( isNaN($(this).val()) ? null : $(this).val() );
      $('#new-success-form #success_customer_attributes_name')
        .val( $(this).find('option:selected').text() );
    })

    // reset modal
    .on('hidden.bs.modal', '#new-success-modal', function () {

      var $customerSelect = $('select.new-success.customer'),
          $referrerSelect = $('select.new-success.referrer');

      $(this).find('form')[0].reset();
      disableContributorAttrs(true);
      $(this).find('.create-referrer').addClass('hidden');
      $(this).find('select').val('').trigger('change');
      $('button[type="submit"][form="new-success-form"] span').css('display', 'inline');
      $('button[type="submit"][form="new-success-form"] i').css('display', 'none');

    })

    // need to listen for the click on the submit button,
    // instead of 'submit' on 'new-success-form'
    // => the button is outside the form, linked to it through form= attribute
    // => submit event doesn't bubble up to form, so e.preventDefault() doesn't work
    .on('click', 'button[type="submit"][form="new-success-form"]', function (e) {

      $('button[type="submit"][form="new-success-form"] span').toggle();
      $('button[type="submit"][form="new-success-form"] .fa-spinner').toggle();

      if ( $('#success_contributions_attributes_0_referrer_id').val() === '' ) {
        e.preventDefault();
        $('#success_contributions_attributes_0_referrer_id').attr('name', '');
        $('#new-success-form').submit();
      }

    });
}








