import dashboard, { initTabPanel, showActiveTabPanel, onDashboardTabClick } from './dashboard';

export default {

  show: {
    init() {
      console.log('init dashboard')
      const activeTab = document.querySelector(`a[href="${location.pathname.replace('/', '#')}"]`);
      const inactiveTabs = document.querySelectorAll('.nav-workflow > li:not(.active) > a');
      initTabPanel({ target: activeTab });
      inactiveTabs.forEach(tab => $(tab).one('show.bs.tab', initTabPanel));
    },
    addListeners() {
      console.log('dashboard listeners')
      document.addEventListener('click', onDashboardTabClick);
      window.onpopstate = showActiveTabPanel;
      Object.keys(dashboard.panels).forEach(panel => dashboard.panels[panel].addListeners());
    }
  }, 

  edit: {
    init() {
      console.log('init company settings')
    },
    addListeners() {
      console.log('settings listeners')
    }
  },

  addListeners() {
    this.show.addListeners();
    this.edit.addListeners();
  }

}