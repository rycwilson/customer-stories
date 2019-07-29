
import companies from 'views/companies';
import stories from 'views/stories';
import profile from 'views/profile';

const global = {
  attachListeners: () => {
    companies.attachListeners();
    stories.attachListeners();
    profile.attachListeners();
  }
}

export default global;