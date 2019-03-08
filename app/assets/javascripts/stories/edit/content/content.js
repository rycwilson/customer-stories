
//= require ./video
//= require ./results
//= require ./form_validator

function storiesEditContent () {

  loadVideoThumbnail();
  // storyFormValidator();

}

function storiesEditContentListeners () {

  storiesEditVideoListeners();
  storiesEditResultsListeners();

  var openFormControls = function () {
        $('#story-content-submit').addClass('show');
      },
      getContributor = function (contributionId) {
        return $('#prospect-contributors-table')
                  .DataTable()
                  .rows('[data-contribution-id="' + contributionId + '"]')
                  .data()[0]
                  .contributor;
      },
      groupAnswers = function (questionId, contributionsData) {
        return contributionsData.answers.filter(function (a) {
                 return a.contributor_question_id == questionId;
               })
                 .map(function (a) {
                   return {
                     contributor: getContributor(a.contribution_id),
                     answer: a.answer,
                   }
                 });
      },
      showByQuestion = function ($list, contributionsData) {
        contributionsData.questions.forEach(function (question) {
          var numAnswers = groupAnswers(question.id, contributionsData).length;

          // add the question to the list
          // some styles must be added inline else they don't take affect until .collapse is shown
          $list.append(
            '<li data-question-id="' + question.id + '" class="' + (numAnswers === 0 ? 'disabled' : '') + '">' +
              '<span class="fa-li"><i class="fa fa-chevron-right"></i><i style="display:none" class="fa fa-chevron-down"></i></span>' +
              '<p class="question">' + question.question + '\xa0\xa0(' + numAnswers + ')</p>' +
              '<div class="collapse"><div style="margin-left: -20px"><ul style="list-style-type: disc"></ul></div></div>' +
            '</li>'
          )

          // add the question's answers
          groupAnswers(question.id, contributionsData).forEach(function (answer) {
            $list.find('li[data-question-id="' + question.id + '"] .collapse ul').append(
              '<li style="margin-bottom: 5px">' +
                '<p style="margin-bottom: 0">' + answer.contributor.full_name + '</p>' +
                '<p style="font-style: italic; margin-bottom: 0">' + answer.answer + '</p>' +
              '</li>'
            )
          })
        })
        return $list;
      },
      contributorAnswers = function (contributionId, contributionsData) {
        return contributionsData.answers.filter(function (a) {
                  return a.contribution_id == contributionId;
                })
                  .map(function (a) {
                    return {
                      question: contributionsData.questions.find(function (q) {
                                  return q.id === a.contributor_question_id;
                                }).question,
                      answer: a.answer
                    };
                  })
      },
      showByContributor = function ($list, contributionsData) {
        var contributionIds = _.uniq(
              contributionsData.answers.map(function (answer) {
                return answer.contribution_id
              })
            ),
            contributors = contributionIds.map(function (contributionId) {
              return getContributor(contributionId);
            }),
            numAnswers;

        // add the contributors to the list
        contributors.forEach(function (contributor, index) {
          numAnswers = contributorAnswers(contributionIds[index], contributionsData).length;
          $list.append(
            '<li data-contribution-id="' + contributionIds[index] + '" class="' + (numAnswers === 0 ? 'disabled' : '') + '">' +
              '<span class="fa-li"><i class="fa fa-chevron-right"></i><i style="display:none" class="fa fa-chevron-down"></i></span>' +
              '<p class="contributor">' + contributor.full_name + '\xa0\xa0(' + numAnswers + ')</p>' +
              '<div class="collapse"><div style="margin-left: -20px"><ul style="list-style-type: disc"></ul></div></div>' +
            '</li>'
          )
        })

        // add each contributor's answers
        contributionIds.forEach(function (contributionId) {
          contributorAnswers(contributionId, contributionsData).forEach(function (qAndA) {
            $list.find('li[data-contribution-id="' + contributionId + '"] .collapse ul').append(
              '<li style="margin-bottom: 5px">' +
                '<p class="contributor" style="margin-bottom: 0">' + qAndA.question + '</p>' +
                '<p style="font-style: italic; margin-bottom: 0">' + qAndA.answer + '</p>' +
              '</li>'
            )
          })
        })
        return $list;
      }
      showContributions = function (group, contributionsData) {
        var $list = $('<ul class="fa-ul"></ul>');
        $('#show-contributions .contributions').empty();
        if (group === 'question') {
          $list = showByQuestion($list, contributionsData);
        } else if (group === 'contributor') {
          $list = showByContributor($list, contributionsData);
        }
        $('#show-contributions .contributions').append($list);
      };


  $(document)


    // get and show contributions
    .on('click', 'button[data-original-title="Show/Hide Contributions"]', function () {
      $.ajax({
        url: window.location.pathname,
        method: 'get',
        dataType: 'json'
      })
        .done(function (contributionsData, status, xhr) {
          console.log(contributionsData)
          $('#show-contributions input[type="radio"]')
            .prop('disabled', false)
            .on('change', function () {
              showContributions($(this).val(), contributionsData);
            })
            .filter('[value="question"]')[0].click();  // default: group by question
        });
      $('#show-contributions').collapse('toggle');
    })

    // toggle collapsible content
    .on('click', '#show-contributions p.question, #show-contributions p.contributor', function () {
      $(this).prev().find('i').toggle();
      $(this).next().collapse('toggle');
    })

    // form changes
    .on('input', '#story-content-form', function () {})
    .on('click', '.add-result, .remove-result', function () {})

    .on('wheel', '.contribution-content, #story_summary', function (event) {
      var maxY = $(this).prop('scrollHeight') - $(this).prop('clientHeight');
      if (maxY > 0) {
        // If this event looks like it will scroll beyond the bounds of the element,
        //  prevent it and set the scroll to the boundary manually
        if ($(this).prop('scrollTop') + event.originalEvent.deltaY < 0 ||
            $(this).prop('scrollTop') + event.originalEvent.deltaY > maxY) {
          event.preventDefault();
          $(this).prop('scrollTop', Math.max(0, Math.min(maxY, $(this).prop('scrollTop') + event.originalEvent.deltaY)));
        }
      }
    })

    .on('input', '#story-content-form', openFormControls)
    .on('click', '#story-content-form .add-result, #story-content-form .remove-result', openFormControls)
    .on('scroll', function () {
      if (!$('a[href="#story-content"]').parent().hasClass('active')) {
        return false;
      }
      if ($(document).scrollTop() > (($('.narrative').offset().top + 200) - $(window).height())) {
        openFormControls();
      }
    })

}

function initStoriesEditContent () {

  $("[data-toggle='tooltip']").tooltip();
  initSummernote();
  loadVideoThumbnail();
  // storyFormValidator();

}

