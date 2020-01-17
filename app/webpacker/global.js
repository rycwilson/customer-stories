
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