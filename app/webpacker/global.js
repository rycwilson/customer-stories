import dashboard from 'views/dashboard';
import companies from 'views/companies';
import stories from 'views/stories';
import users from 'views/users';

export function addAppListeners() {
  dashboard.addListeners();
  [companies, stories, users].forEach((resource) => resource.addListeners());
}

export function pluck(array, key) {
  return array.map(obj => obj[key]);
}

export function truncateStoryTitles() {
  $('.story-card__title').each(function () {
    if ($(this).closest('.story-card').hasClass('.story-card--card-image')) {
      // do nothing
    } else {
      const $title = $(this).find('p');
      while ($title.outerHeight() > $(this).height()) {
        $title.text((index, text) => {
          return text.replace(/\W*\s(\S)*$/, '...');
        });
      }
    }
  });
}