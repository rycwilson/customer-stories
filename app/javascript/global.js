
import companies from 'views/companies/index';
import stories from 'views/stories/index';
import profile from 'views/profile/index';

const global = {
  attachListeners: () => {
    companies.attachListeners();
    stories.attachListeners();
    profile.attachListeners();
  }
}

export default global;