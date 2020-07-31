import Cookies from 'js-cookie';
import prospect from './prospect';
import curate from './curate';
import promote from './promote';
import measure from './measure';
import { addListeners as addTablesListeners } from './tables';

export default {
  show: {
    init() {
      showLoadingScreen();
      $.getJSON('/dashboard', (data, status, xhr) => {
        Object.assign(APP, data);
        [prospect, curate, promote, measure].forEach((panel) => panel.init());
      });
    }
  },
  activeTab() {
    const tab = $('.nav-workflow li.active a');
    if (tab.length == 0) return null;
    return tab.attr('href').slice(1, tab.attr('href').length);
  },
  addListeners() {
    [prospect, curate, promote, measure].forEach((panel) => panel.addListeners());
    addTablesListeners();
    ['#prospect', '#promote'].forEach((section) => {
      $(document)
        .on(
          'show.bs.tab', 
          `${ section } .layout-sidebar a[data-toggle="tab"]`, 
          setNavCookie(section)
        )
    });
  }
}
  
function setNavCookie(section) {
  return function (e) {
    Cookies.set(
      `${ section.slice(1, section.length) }-tab`, 
      $(this).attr('href')
    );
  }
}

function showLoadingScreen() {
  // to control delay via css (opacity transition), need to synchronously add the working--still class
  // => won't work without the timeout
  setTimeout(() => { $('.working').addClass('working--still'); }, 1);
}