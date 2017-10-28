
function newSuccessListeners () {

  var disableContributionAttrs = function (disabled) {
        ['user_id', 'referrer_id', 'crowdsourcing_template_id']
          .forEach(function (attribute) {
            // don't disable referrer_id since it's visible, instead blank the [name]
            if (attribute === 'referrer_id') {
              if (disabled) {
                $('#new-success-form #success_contributions_attributes_0_referrer_id').attr('name', '');
              } else {
                $('#new-success-form #success_contributions_attributes_0_referrer_id').attr('name',
                  'success[contributions_attributes][0][referrer_id]');
              }
            // all others disabled
            } else {
              $('#new-success-form #success_contributions_attributes_0_' + attribute).prop('disabled', disabled);
            }
          });
      },
      disableContributorAttrs = function (disabled) {
        if (disabled) {
          $('#new-success-form .create-referrer').addClass('hidden');
        } else {
          $('#new-success-form .create-referrer').removeClass('hidden');
        }
        ['first_name', 'last_name', 'email', 'sign_up_code', 'password']
          .forEach(function (attribute) {
            $('#success_contributions_attributes_0_contributor_attributes_' + attribute)
              .prop('disabled', disabled);
        });
      };

  $(document)

    .on('change', '#new-success-form ' +
          '#success_contributions_attributes_0_referrer_id', function () {

      // if no referrer provided, disable all attributes
      if ( $(this).val() === '' ) {
        disableContributionAttrs(true);
        disableContributorAttrs(true);

      // if creating a new referrer with this success,
      // enable contribution and contributor attributes
      } else if ( $(this).val() === '0' ) {
        disableContributionAttrs(false);
        disableContributorAttrs(false);

      // if existing referrer, disable contributor attributes
      } else {
        disableContributionAttrs(false);
        disableContributorAttrs(true);
        // the referrer will be both contributor and referrer for this contribution
        $('#new-success-form #success_contributions_attributes_0_user_id')
          .val( $(this).val() );
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
      disableContributionAttrs(true);
      disableContributorAttrs(true);
      $(this).find('.create-referrer').addClass('hidden');
      $(this).find('select').val('').trigger('change');
      $('button[type="submit"][form="new-success-form"] span').css('display', 'inline');
      $('button[type="submit"][form="new-success-form"] i').css('display', 'none');
    })

    // need to listen for the click on the submit button instead of 'submit' on 'new-success-form'
    // => the button is outside the form, linked to it through form= attribute
    // => submit event doesn't bubble up to form, so e.preventDefault() doesn't work
    .on('click', 'button[type="submit"][form="new-success-form"]', function (e) {

      $('button[type="submit"][form="new-success-form"] span').toggle();
      $('button[type="submit"][form="new-success-form"] .fa-spinner').toggle();
      // if a referrer wasn't selected, hide the contribution attributes
      // so a contribution isn't created
      if ( $('#success_contributions_attributes_0_referrer_id').val() === '' ) {
        e.preventDefault();
        disableContributionAttrs(true);
        $('#new-success-form').submit();
      }

    });
}








