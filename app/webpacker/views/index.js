
import companies from './companies/index';
import stories from './stories/index';
import users from './users/index';
import flash from '../lib/flash';

const views = {
        companies: {
          show: companies.dashboard,
          edit: companies.settings
        },
        stories: {
          index: stories.gallery,
          search: stories.gallery,
          show: stories.show,
          edit: stories.edit
        },
        users: {
          edit: users.edit,
          linkedin_callback: users.edit
        }
      };


const view = {
  init: (controller, action) => {
    // console.log('controller: ', controller)
    // console.log('action: ', action)
    if ($('#flash').is(':visible')) flash.timeout();
    if (!views[controller] || typeof views[controller][action].init !== 'function') {
      return false;
    }
    views[controller][action].init();
  }
};

export default view;