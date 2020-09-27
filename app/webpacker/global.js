import dashboard from 'views/dashboard';
import companies from 'views/companies';
import stories from 'views/stories';
import storyCardTemplate from 'views/stories/story_card_template';
import users from 'views/users';

export function addAppListeners() {
  dashboard.addListeners();
  [companies, stories, users].forEach((resource) => resource.addListeners());
}

export function renderGallery($gallery, stories, isDashboard) {
  // console.log('stories', stories)
  if (stories.length == 0) {
    console.log('none', $gallery)
    $gallery
      .append(
        '<li><h3 class="lead">No Stories found</h3></li>'
      )
      .show();
    return false;
  }
  const companyClass = `story-card--${location.href.match(/:\/\/((\w|-)+)\./)[1]}`;
  const locationClass = isDashboard ? 'story-card--small story-card--dashboard' : companyClass;
  const typeClass = 'story-card--card';
  const storyCardsHtml = stories.map((story) => {
    // console.log(story)

    // order matters here
    const statusClass = `story-card--${
      (story.published && 'published') || 
      (story.preview_published && 'preview-published') || 
      (story.logo_published && 'logo-published') || 
      ''  
    }`;
    const cardClass = `${typeClass} ${statusClass} ${locationClass}`
    const storyLink = `${
      isDashboard || story.preview_published ? 
        'javascript:;' : 
        (story.published && story.csp_story_path) || ''
    }`;
    return storyCardTemplate(story, storyLink, cardClass);
  }).join('');
  $gallery.append(storyCardsHtml).imagesLoaded(() => {
    $gallery.show({
      duration: 0,
      complete: () => truncateStoryTitles()
    });
  }); 
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