
import companies from './companies/index';
import stories from './stories/index';
import profile from './profile/index';

const views = {
        companies: {
          new: companies.new,
          show: companies.show,
          edit: companies.edit
        },
        stories: {
          index: stories.index,
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
          if (!views[controller] || typeof views[controller][action] !== 'function') {
            return false;
          }
          // if ($('#flash').is(':visible')) { flashTimeout(); }
          views[controller][action]();
        }
      };

export default view;