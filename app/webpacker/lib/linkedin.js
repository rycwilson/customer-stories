
export default {

  // LI2Observer
  storiesShowLIObserver: () => {
    // const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    const $contributors = $('.story-contributors');
    const $badges = $contributors.find('.LI-profile-badge');
    const badgeAdded = (mutation) => {
        return mutation.type === 'attributes' && mutation.attributeName === 'data-uid'
      };
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes') {
            // console.log('attributes, attributeName: ', mutation.attributeName, $(mutation.target).data('uid'));
          } else if (mutation.type === 'childList') {
            // console.log('childList, addedNodes: ', mutation.addedNodes[0], $(mutation.target).data('uid'));
            // this would be the last mutation, but it doesn't always happen
            // if ($(mutation.addedNodes[0]).hasClass('resize-sensor')) {
          } else {
            // console.log('other')
          }
          if (badgeAdded(mutation)) {
            // console.log('badge added', $(mutation.target).data('uid'))

            // this is a reliable indicator that the badge has displayed
            // if at least one displays, show the section, with a brief timeout to allow for other badges and style settings
            new ResizeSensor($(mutation.target), () => {
              // console.log('badge rendered', $(mutation.target).data('uid'))

              // give it a brief delay to allow for multiple contributors being rendered,
              // and for local style changes to take effect
              setTimeout(() => $contributors.css({ visibility: 'visible' }), 200);
            });
          }
        });
      });
    $badges.each(() => observer.observe(this, { attributes: true, childList: true }));
  }
}

