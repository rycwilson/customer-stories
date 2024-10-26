json.array! @contributions do |contribution|
  json.(contribution, :id, :status, :publish_contributor, :contributor_unpublished)
  json.display_status contribution.display_status
  json.timestamp contribution.timestamp
  json.path contribution.path unless @success.present?
  json.success do
    json.(contribution.success, :id, :customer_id, :curator_id, :name)
    json.curator do
      json.(contribution.curator, :id)
      json.full_name contribution.curator.full_name
    end
    json.customer do
      json.(contribution.customer, :id, :name, :slug)
    end
    if contribution.success.story.present?
      json.story do
        json.(contribution.story, :id, :title, :published, :slug)
        json.csp_story_path contribution.story.csp_story_path
      end
    end
  end
  json.contributor do
    json.(contribution.contributor, :id, :email, :first_name, :last_name, :phone, :title, :linkedin_url)
    json.full_name contribution.contributor.full_name
  end
  if contribution.referrer.present?
    json.referrer do
      json.(contribution.referrer, :id, :email, :first_name, :last_name, :title)
      json.full_name contribution.referrer.full_name
    end
  end
  if contribution.invitation_template.present?
    json.invitation_template do
      json.(contribution.invitation_template, :id, :name)
      json.path contribution.invitation_template.path
    end
  end
  if contribution.contributor_invitation.present?
    json.contributor_invitation do 
      json.(contribution.contributor_invitation, :id)
    end
  end
end