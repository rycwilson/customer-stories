
import companies from './companies/index';
import stories from './stories/index';
import profile from './profile/index';
import flash from '../lib/flash';

const views = {
        companies: {
          show: companies.show,
          edit: companies.edit
        },
        stories: {
          index: stories.gallery,
          search: stories.gallery,
          show: stories.show,
          edit: stories.edit
        },
        profile: {
          edit: profile.edit,
          linkedin_callback: profile.edit
        }
      };


const view = {
  init: (controller, action) => {
    if ($('#flash').is(':visible')) flash.timeout();
    if (!views[controller] || typeof views[controller][action].init !== 'function') {
      return false;
    }
    views[controller][action].init();
  }
};

export default view;