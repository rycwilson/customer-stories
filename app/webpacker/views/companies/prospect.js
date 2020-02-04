
import customerWinsPane from './customer_wins/customer_wins';
import contributorsPane from './contributors/contributors';
import { setSearch, autoSearch, displayResults } from './tables';
import _uniq from 'lodash/uniq';
import _uniqBy from 'lodash/uniqBy';

export default {
  init() {
    // deferred objects will resolve after each respective table initializes;
    // must wait for both to complete as the headers need data from each
    const loadCustomerWins = $.Deferred();
    const loadContributors = $.Deferred();
    customerWinsPane.table.init(loadCustomerWins);
    customerWinsPane.initForm();
    contributorsPane.table.init(loadContributors);
    $.when(loadCustomerWins, loadContributors)
      .done((data, status, xhr) => {
        renderTableHeaders();
        initTableFilters();
        $('.prospect.curator-select')
            .val(APP.current_user.id)
            .trigger('change', { auto: true });
        showTables();
      })
  },
  addListeners() {
    [customerWinsPane, contributorsPane].forEach((pane) => pane.addListeners());
    $(document)
      .on('change', '.prospect.curator-select', onCuratorChange)
      .on('select2:open', '.dt-filter', onOpenFilter)
      .on('change', '.dt-filter', onFilterChange)
      .on('draw.dt', '#successes-table, #contributors-table', displayResults)
      // TODO .on('keyup', '.select2-search input', autoSearch) 
  }
}

export function editStory(e) {
  const href = $(this).find('a')[0].href;
  let storyTab;
  e.preventDefault();
  if ($(this).hasClass('story-settings')) {
    storyTab = '#story-settings';
  } else if ($(this).hasClass('story-content')) {
    storyTab = '#story-content';
  } else {
    storyTab = '#story-contributors';
  }
  Cookies.set('cs-edit-story-tab', storyTab);
  window.location = href;
}

function onCuratorChange(e, data) {
  const $selectCurator = $(this);
  const curatorId = $selectCurator.val();
  const $tableWrapper = $selectCurator.closest('.dataTables_wrapper');
  const $table = $tableWrapper.find('table');
  const $filter = $tableWrapper.find('.dt-filter');
  $filter.val('').trigger('change.select2');
  setSearch($table).draw();

  // update the other curator select (if auto, halt the chain)
  if (!(data && data.auto)) {
    $('.prospect.curator-select').not($selectCurator)
      .val(curatorId)
      .trigger('change', { auto: true });
  }
}

function onOpenFilter(e) {
  const $filter = $(this);
  const curatorId = $filter.closest('.dataTables_wrapper').find('.curator-select').val();
  showCuratorOptions(curatorId);
  $('.select2-search--dropdown .select2-search__field').attr('placeholder', 'Search');
}

function onFilterChange(e) {
  const $table = $(this).closest('.dataTables_wrapper').find('table');
  setSearch($table, true).draw();
}

function showTables() {
  $('.successes-header, #successes-table, .contributors-header, #contributors-table')
    .css('visibility', 'visible');
  $('#prospect, #curate').find('.layout-sidebar .nav .btn-add').show();
}

function showCuratorOptions(curatorId) {
  // console.log(`showCuratorOptions(${ curatorId })`)
  if (!curatorId) return false;
  $('.select2-results').hide(); // avoid flicker (see below)
  const companySuccesses = $('#successes-table').DataTable().rows().data().toArray();
  const companyContributions = (
    $('#contributors-table').DataTable().rows().data().toArray()
  )
  const curatorSuccesses = (
    companySuccesses
      .filter((success) => success.curator.id.toString() === curatorId)
  );
  const curatorSuccessIds = (
    curatorSuccesses.map((success) => success.id.toString())
  );
  const curatorCustomerIds = _uniq(
    curatorSuccesses.map((success) => success.customer.id.toString())
  );
  const curatorContributions = (
    companyContributions.filter((contribution) => (
      contribution.success.curator_id.toString() === curatorId
    ))
  );
  const curatorContributorIds = (
    _uniqBy(curatorContributions, (contribution) => contribution.contributor.id)
      .map((contribution) => contribution.contributor.id.toString())
  );
  const hideUnownedOption = ($option, curatorItems, item) => {
    if (!curatorItems.includes(item))
    curatorItems.includes(item) ? $option.show() : $option.hide();
  }

  // (timeout needed since options are still loading at this point)
  setTimeout(() => {
    $('.select2-results__option[aria-label="Customer Win"]')
      .find('.select2-results__option')
        .each(function (index) {
          let successId = $(this).attr('id').match(/-(\d+)$/)[1];
          hideUnownedOption($(this), curatorSuccessIds, successId);
        });
    $('.select2-results__option[aria-label="Customer"]')
      .find('.select2-results__option')
        .each(function (index) {
          let customerId = $(this).attr('id').match(/-(\d+)$/)[1];
          hideUnownedOption($(this), curatorCustomerIds, customerId);
        });
    $('.select2-results__option[aria-label="Contributor"]')
      .find('.select2-results__option')
        .each(function (index) {
          let contributorId = $(this).attr('id').match(/-(\d+)$/)[1];
          hideUnownedOption($(this), curatorContributorIds, contributorId);
        });
    $('.select2-results').show(); // avoid flicker (see above)
  }, 1);
}

function renderTableHeaders() {
  const dtSuccesses = $('#successes-table').DataTable();
  const dtContributors = $('#contributors-table').DataTable();
  const successes = dtSuccesses.column(1).data().toArray();
  const curators = _uniqBy( 
    dtSuccesses.column(3).data().toArray(), 
    (curator) => curator.id
  );
  const contributors = _uniqBy(
    dtContributors.column(1).data().toArray(), 
    (contributor) => contributor.id
  );
  const customers = _uniqBy(
    dtSuccesses.column(2).data().toArray(), 
    (customer) => customer.id
  );
  customerWinsPane.table.renderHeader(curators, successes, customers);
  contributorsPane.table.renderHeader(curators, successes, customers, contributors);
}

function initTableFilters() {
  $('#show-wins-with-story, #show-completed, #show-published')
    .trigger('change');

  $('.prospect.curator-select')
    .select2({
      theme: 'bootstrap',
      width: 'style',
      placeholder: 'Select',
      allowClear: true,
      minimumResultsForSearch: -1   // hides search field
    })
    .on('select2:unselecting', function (e) {
      $(this).data('unselecting', true);
    })
    .on('select2:open', function (e) {
      if ($(this).data('unselecting')) {
        $(this).removeData('unselecting')
                .select2('close');
      }
    })
    .on('change.select2', function (e) {
      if ($(this).val()) {
        $(this).next('.select2').addClass('select2-container--allow-clear')
      } else {
        $(this).next('.select2').removeClass('select2-container--allow-clear')
      }
    });

  $('.dt-filter')
    .select2({
      theme: 'bootstrap',
      width: 'style',
      placeholder: 'Search / Select',
      allowClear: true
    })
    .on('select2:unselecting', function (e) {
      $(this).data('unselecting', true);
    })
    .on('select2:open', function (e) {
      if ($(this).data('unselecting')) {
        $(this).removeData('unselecting')
                .select2('close');
      }
    })
    .on('change.select2', function (e) {
      if ($(this).val()) {
        $(this).next('.select2').addClass('select2-container--allow-clear')
      } else {
        $(this).next('.select2').removeClass('select2-container--allow-clear')
      }
    });
}
