
import companies from 'views/companies';
import stories from 'views/stories';
import profile from 'views/profile';

const global = {
  addListeners: () => {
    companies.addListeners();
    stories.addListeners();
    profile.addListeners();
  }
}

export default global;