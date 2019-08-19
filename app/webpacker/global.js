
import companies from 'views/companies';
import stories from 'views/stories';
import profile from 'views/profile';

export function addAppListeners() {
  companies.addListeners();
  stories.addListeners();
  profile.addListeners();
}

export function pluck(array, key) {
  return array.map(obj => obj[key]);
}