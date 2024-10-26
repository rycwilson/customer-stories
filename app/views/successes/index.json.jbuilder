json.array! @successes do |customer_win|
  json.(customer_win, :id, :name)
  json.display_status customer_win.display_status
  json.referrer customer_win.referrer
  json.contact customer_win.contact
  json.timestamp customer_win.timestamp
  json.new_story_path customer_win.new_story_path
  json.path customer_win.path
  json.curator do
    json.id customer_win.curator.id
    json.full_name customer_win.curator.full_name
  end
  json.customer do
    json.id customer_win.customer.id
    json.name customer_win.customer.name
    json.slug customer_win.customer.slug
  end
  if customer_win.story.present?
    json.story do
      json.id customer_win.story.id
      json.title customer_win.story.title
      json.slug customer_win.story.slug
    end
  end
end