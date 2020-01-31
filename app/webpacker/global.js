
import companies from 'views/companies';
import stories from 'views/stories';
import users from 'views/users';

export function addAppListeners() {
  [companies, stories, users].forEach((resource) => resource.addListeners());
}

export function pluck(array, key) {
  return array.map(obj => obj[key]);
}

export function truncateStoryTitles() {
  $('.story-card__title').each(function () {
    const $title = $(this).find('p');
    while ($title.outerHeight() > $(this).height()) {
      $title.text((index, text) => {
        return text.replace(/\W*\s(\S)*$/, '...');
      });
    }
  });
}
