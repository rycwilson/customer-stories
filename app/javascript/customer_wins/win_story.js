// use a skeleton version of the child row template as a placeholder while loading
// see views/successes/win_story_form
export function childRowPlaceholderTemplate(curatorName) {
  return `
    <div class="success-form">
      <div class="win-story">
        <div class="win-story__header">
          <label>Win Story</label>
          <div>
            <button type="button" class="btn-expand" disabled>
              <i class="fa fa-expand"></i>
              <span>Max</span>
            </button>
            <button type="button" class="btn-edit" disabled>
              <i class="fa fa-pencil"></i>
              <span>Edit</span>
            </button>
            <button type="button" class="btn-copy" disabled>
              <i class="fa fa-clipboard"></i>
              <span>Copy</span>
            </button>
            <!-- <button type="button" class="btn-email" disabled>
              <i class="fa fa-envelope-o"></i>
              <span>Email</span>
            </button> -->
          </div>
        </div>
        <div class="win-story__summernote form-control" style="overflow:auto; position:relative">
          <div class="spinner"><i class="fa fa-spin fa-circle-o-notch"></i></div>
        </div>
        <div class="win-story__footer text-right hidden">
          <button class="btn btn-sm btn-success text-center mark-completed" disabled>
            Mark as Completed
          </button>
        </div>
      </div>
      <div class="success-form__contacts">
        <label for="curator-name">Curator</label>
        <p class="curator-name">${curatorName}</p>
      </div>
    </div>
  `
}