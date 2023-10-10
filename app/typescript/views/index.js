import companies from './companies.js';
import profile from './user_profile.js';

const views = {
  companies: {
    show: companies.show,
    edit: companies.edit
  }, 
  profile: {
    edit: profile.edit
  }
}

export function initView(controller, action) {
  if (views[controller] && views[controller][action] && typeof views[controller][action].init === 'function')
    views[controller][action].init();
};