namespace :temp do
  desc "TODO"
  task clone: :environment do

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
end
