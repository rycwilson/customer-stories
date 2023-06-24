import customerWinsTable from '../customer_wins/table.js';
import contributorsTable from '../contributors/table.js';
import promotedStoriesPanel from '../stories/promoted_stories.js';

let successes, contributions;

const dashboard = {
  panels: {
    prospect: {
      init() {
        console.log('init prospect')
        const initTables = () => {
          customerWinsTable.init(successes);
          contributorsTable.init(contributions);
        }
        const dataDidLoad = successes && contributions;
        // console.log('init prospect')
        if (dataDidLoad) {
          initTables();
        } else {
          getProspectData().then(([_successes, _contributions]) => {
            // Object.assign(CSP.data, { customerWins, contributions })
            successes = _successes;
            contributions = _contributions;
            initTables();
          })
        }   
      },
      addListeners() {
        document.addEventListener('click', onSidebarTabClick);
        // document.addEventListener('change', onCuratorChange);
        // customerWinsTable.addListeners();
        // contributorsTable.addListeners();
        
        // https://www.gyrocode.com/articles/jquery-datatables-column-width-issues-with-bootstrap-tabs/
        // $(document).on('shown.bs.tab', '#prospect a[data-toggle="tab"]', () => {
        //   $($.fn.dataTable.tables(true)).DataTable().columns.adjust();
        // })
      }
    },
    curate: {
      init() {
        // console.log('init curate')
      },
      addListeners() {
        // console.log('curate listeners')
      }
    },
    promote: {
      init() {
        // console.log('init promote')
        getPromotedStories().then(promotedStories => {
          // Object.assign(CSP.data, { promotedStories })
          // console.log(promotedStories)
          promotedStoriesPanel.initTable(promotedStories);
        })
      },
      addListeners() {
        // console.log('promote listeners')
      }
    },
    measure: {
      init() {
        // console.log('init measure')
      },
      addListeners() {
        // console.log('measure listeners')
      }
    }
  }
}

export default dashboard;

export function initTabPanel({ target }) {
  const tab = target;
  const panel = tab.getAttribute('aria-controls');
  if (panel.match(/prospect|curate|promote|measure/)) dashboard.panels[panel].init();
}

export function showActiveTabPanel(e) {
  const workflowMatch = location.pathname.match(/(prospect|curate|promote|measure)(\/(\w|-)+)?/);
  const workflowStage = workflowMatch && workflowMatch[1];
  const curateView = workflowStage === 'curate' && (workflowMatch[2] ? 'story' : 'stories');
  if (workflowStage) {
    $(`.nav-workflow a[href="#${workflowStage}"]`).tab('show');
    // document.querySelector(`.nav-workflow a[href="#${workflowStage}"]`).click()
    if (curateView) {
      curateView === 'stories' ? $('a[href=".curate-stories"]').tab('show') : $('a[href=".edit-story"]').tab('show');
      
      // don't scroll to panel
      setTimeout(() => scrollTo(0, 0));
      if (curateView === 'stories') {
        // $('#curate-filters .curator')
        //   .val($('#curate-filters .curator').children(`[value="${CSP.current_user.id}"]`).val())
        //   .trigger('change', { auto: true });
      }
    }
  }
}

export function onDashboardTabClick(e) {
  const isDashboardTab = (
    e.target.getAttribute('aria-controls') && 
    e.target.getAttribute('aria-controls').match(/prospect|curate|promote|measure/)
  ); 
  if (isDashboardTab) {
    e.preventDefault();
    dashboardTurboVisit(e.target);
  }
}

export function dashboardTurboVisit(link) {
  const newDashboardPath = `/${link.getAttribute('href').slice(1, link.getAttribute('href').length)}`;
  const currentlyOnDashboard = document.body.classList.contains('companies') && document.body.classList.contains('show');
  if (currentlyOnDashboard) {
    // replacing state ensures turbo:false for the first tab state
    history.replaceState({ turbo: false }, null, location.pathname);
    history.pushState(
      { turbo: { restorationIdentifier: Turbo.navigator.history.restorationIdentifier } }, 
      null, 
      newDashboardPath
    );
  } else {
    // const dropdowns = document.querySelectorAll('#company-nav .nav-settings > li.dropdown');
    // dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
    Turbo.visit(newDashboardPath);
  }
}

export function onShownActionsDropdown() {
  const $dropdownMenu = $(this).find('.dropdown-menu');
  const windowBottom = window.scrollY + window.innerHeight;
  const dropdownBottom = $dropdownMenu.offset().top + $dropdownMenu.outerHeight();
  $(this).closest('tr').addClass('active');
  if (dropdownBottom > windowBottom) $dropdownMenu.addClass('flip shown')
  else $dropdownMenu.addClass('shown');
}

export function onHiddenActionsDropdown() {
  $(this).find('.dropdown-menu').removeClass('flip shown');
  
  // don't remove .active if the child row is open
  if (!$(this).closest('tr').hasClass('shown')) $(this).closest('tr').removeClass('active');
}

async function getProspectData() {
  try {
    return await Promise.all([
      fetch('/successes', requestHeaders()).then(res => res.json()), 
      fetch('/companies/0/contributions', requestHeaders()).then(res => res.json())
    ]);
  } catch(err) {
    console.error(err);
  }
}

async function getPromotedStories() {
  const subdomain = location.hostname.slice(0, location.hostname.indexOf('.'));
  try {
    return await fetch(`/companies/${subdomain}/stories/promoted`, requestHeaders()).then(res => res.json());
  } catch (err) {
    console.error(err);
  }
}

function requestHeaders() { 
  return {
    'Content-Type': 'application/json', 
    'X-CSRF-Token': document.querySelector('[name="csrf-token" ]').content
  };
}

function onSidebarTabClick(e) {
  const isProspectTab = (
    e.target.closest('a[href="#successes"]') || e.target.closest('a[href="#prospect-contributors"]')
  );
  if (isProspectTab) Cookies.set('csp-prospect-tab', e.target.closest('a').getAttribute('href'));
}

function onCuratorChange(e) {
  if (e.target.className.includes('curator-select')) {
    document.getElementById('prospect').querySelectorAll('.curator-select:not(.ts-wrapper)').forEach(select => {
      if (!select.isSameNode(e.target)) 
        select.tomselect.setValue(e.target.value)
    })
  }
}