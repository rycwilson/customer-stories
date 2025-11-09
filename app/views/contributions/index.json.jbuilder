# frozen_string_literal: true

json.array! @contributions do |contribution|
  json.call(contribution, :id, :status)
  json.display_status ContributionsHelper.status_html(contribution)
  json.timestamp contribution.created_at.to_i
  json.path contribution_path(contribution)
  json.edit_path edit_contribution_path(contribution)
  json.customer do
    json.id contribution.customer_id
    json.name contribution.customer_name
  end
  json.curator do
    json.id contribution.curator_id
  end
  json.customer_win do
    json.id contribution.success_id
    json.name contribution.success_name
  end
  json.contributor do
    json.id contribution.contributor_id
    json.full_name "#{contribution.contributor_first} #{contribution.contributor_last}"
    json.last_name contribution.contributor_last
  end
  json.invitation do
    json.path(
      if contribution.invitation_contribution_id
        edit_contribution_contributor_invitation_path(contribution.id)
      else
        new_contribution_contributor_invitation_path(contribution.id)
      end
    )
  end
  if contribution.invitation_template_id
    json.invitation_template do
      json.id contribution.invitation_template_id
      json.name contribution.invitation_template_name
    end
  end
  if contribution.story_id
    json.story do
      json.title contribution.story_title
      json.published contribution.story_published
      json.edit_path edit_story_path(contribution.story_id)
    end
  end
end
