import bootbox from 'bootbox';

export function actionsDropdownTemplate(status, rowData, workflowStage) {
  const isPreInvite = rowData.status === 'pre_request';
  const invitationTemplate = rowData.invitation_template;
  const didNotRespond = rowData.status === 'did_not_respond';
  const wasSubmitted = rowData.status && rowData.status.includes('submitted');
  const story = rowData.success.story;
  const viewStoryPath = story && story.csp_story_path;
  const editStoryPath = story && `/curate/${rowData.success.customer.slug}/${rowData.success.story.slug}`;
  const storyActions = [['story-settings', 'fa-gear'], ['story-content', 'fa-edit'], ['story-contributors', 'fa-users']]
    .map(([className, icon]) => {
      const section = (
        className[className.indexOf('-') + 1].toUpperCase() + 
        className.slice(className.indexOf('-') + 2, className.length)
      )
      return `
        <li class="${className}">
          <a href="${editStoryPath}">
            <i class="fa ${icon} fa-fw action"></i>&nbsp;&nbsp;
            <span>Customer Story ${section}</span>
          </a>
        </li>
      `;
    }).join('');
  return `
    <a href="javascript:;" class="dropdown-toggle" data-toggle='dropdown'>
      <i class="fa fa-caret-down"></i>
    </a>
    <ul class='contributor-actions dropdown-menu dropdown-menu-right dropdown-actions'>
      <li class="${isPreInvite ? `compose-invitation ${invitationTemplate ? '' : 'disabled'}` : 'view-request'}">
        <a href="javascript:;">
          <i class="fa fa-${isPreInvite ? 'envelope' : 'search'} fa-fw action"></i>&nbsp;&nbsp;
          <span>${isPreInvite ? 'Compose Invitation' : 'View Sent Invitation'}</span>
        </a>
      </li>
      ${didNotRespond ? `
          <li class="re-send-invitation">
            <a href="javascript:;">
              <i class="fa fa-envelope fa-fw action"></i>&nbsp;&nbsp;
              <span>Re-send Invitation</span>
            </a>
          </li>
        ` : ''
      }
      ${wasSubmitted ? `
          <li class="completed">
            <a href="javascript:;">
              <i class="fa fa-check fa-fw action"></i>&nbsp;&nbsp;
              <span>Mark as completed</span>
            </a>
          </li>
        ` : ''
      }
      <li role="separator" class="divider"></li>
      ${workflowStage === 'prospect' ? `
          ${story && story.published ? `
              <li>
                <a href="${viewStoryPath}"}>
                  <i class="fa fa-search fa-fw action"></i>&nbsp;&nbsp;
                  <span>View Story</span>
                </a>
              </li>
              <li role="separator" class="divider"></li>
            ` : ''
          }
          ${story ? storyActions : `
              <li class="view-success">
                <a href="javascript:;"}>
                  <i class="fa fa-rocket fa-fw action"></i>&nbsp;&nbsp;
                  <span>View Customer Win</span>
                </a>
              </li>
            `
          }
          <li role="separator" class="divider"></li>
        ` : ''
      }
      <li class="remove">
        <a href="javascript:;">
          <i class="fa fa-remove fa-fw action"></i>&nbsp;&nbsp;
          <span>Remove</span>
        </a>
      </li>
    </ul>
  `;
}