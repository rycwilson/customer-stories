# frozen_string_literal: true

json.array! @wins do |win|
  json.call(win, :id, :name)
  json.display_status SuccessesHelper.status_html(win)
  json.timestamp win.created_at.to_i
  json.path success_path(win)
  json.edit_path edit_success_path(win)
  json.customer do
    json.id win.customer_id
    json.name win.customer_name
    json.edit_customer_path edit_customer_path(win.customer_id)
  end
  json.curator do
    json.id win.curator_id
    json.full_name "#{win.curator_first} #{win.curator_last}"
  end
  if win.story_id
    json.story do
      json.id win.story_id
      json.title win.story_title
      json.edit_path edit_story_path(win.story_id)
    end
  else
    json.new_story_path new_success_story_path(win)
  end
end
