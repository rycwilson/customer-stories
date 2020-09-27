import dashboard from 'views/dashboard';
import companies from 'views/companies';
import stories from 'views/stories';
import storyCardTemplate from 'views/stories/story_card_template';
import users from 'views/users';

export function addAppListeners() {
  dashboard.addListeners();
  [companies, stories, users].forEach((resource) => resource.addListeners());
  window.onpopstate = onPopState;
}

export function renderGallery($gallery, stories, isDashboard) {
  // console.log('stories', stories)
  if (stories.length == 0) {
    $gallery
      .append('<li><h3 class="lead">No Stories found</h3></li>')
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

function onPopState(e) {
  console.log(onpopstate)
  const dashboardPathMatch = window.location.pathname.match(
    /(prospect|curate|promote|measure)(\/(\w|-)+)?/
  );
  const dashboardTab = dashboardPathMatch && `#${dashboardPathMatch[1]}`;
  // const curateView = dashboardTab && (dashboardTab === '#curate') ?
  //   (dashboardPathMatch[2] ? 'story' : 'stories') : 
  //   null;
  if (dashboardTab) {
    console.log('well?', dashboardTab)
    console.log($(`.nav-workflow a[href="${dashboardTab}"]`))
    $(`.nav-workflow a[href="${dashboardTab}"]`).tab('show');
    // if (curateView) {
    //   if (curateView === 'stories') {
    //     $('a[href=".curate-stories"]').tab('show'); 
    //   } else {
    //     $('a[href=".edit-story"]').tab('show');
    //   }
      
    //   // don't scroll to panel
    //   setTimeout(function() { window.scrollTo(0, 0); }, 1);
    //   if (curateView === 'stories') {
    //     $('#curate-filters .curator')
    //       .val(
    //         $('#curate-filters .curator').children('[value="' + CSP.current_user.id + '"]').val()
    //       )
    //       .trigger('change', { auto: true });
    //   }
    // }
  }

}