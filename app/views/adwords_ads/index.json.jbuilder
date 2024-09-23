json.array! @ads do |ad|
  json.(ad, :id, :status)
  json.set! 'approvalStatus', ad.approval_status
  json.set! 'longHeadline', ad.long_headline
  json.set! 'mainColor', ad.main_color
  json.set! 'accentColor', ad.accent_color
  json.set! 'storyId', ad.story_id
  json.path adwords_ad_path(ad)
  json.set! 'editPath', edit_adwords_ad_path(ad)

  json.customer do
    json.id ad.customer.id
    json.name ad.customer.name
  end

  json.story do
    json.id ad.story.id
    json.title ad.story.title
  end

  json.curator do
    json.id ad.curator.id
    json.name ad.curator.full_name
  end
end