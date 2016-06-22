namespace :temp do
  desc "TODO"
  task clone_categories: :environment do

    id_mapping = {}

    IndustryCategory.all.each do |industry|
      sc = StoryCategory.new
      sc.update(industry.attributes.except("id"))
      id_mapping[industry.id] = sc.id
    end

    IndustriesSuccess.all.each do |old_join_record|
      StoryCategoriesSuccess.create(
        story_category_id: id_mapping[old_join_record.industry_category_id],
        success_id: old_join_record.success_id
      )

    end

  end

  task condense_story_fields: :environment do
    Story.all.each do |story|
      story.content = ""
      story.content << "<p><strong>Situation</strong></p>"
      story.content << story.situation.to_s
      story.content << "<p><strong>Challenge</strong></p>"
      story.content << story.challenge.to_s
      story.content << "<p><strong>Solution</strong></p>"
      story.content << story.solution.to_s
      story.content << "<p><strong>Benefits</strong></p>"
      story.content << story.benefits.to_s
      story.save
    end
  end

end
