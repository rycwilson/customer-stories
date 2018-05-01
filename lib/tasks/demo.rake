
namespace :demo do

  desc "create demo analytics data"

  task analytics: :environment do
    PageView.where(company_id: 24).destroy_all
    PageView
      .includes(:story)
      .joins(:story).where("stories.id IN (225,227,254,258)")
      .each do |page_view|
        demo_page_view = page_view.dup
        demo_page_view.company_id = 24
        # create a 1:1 mapping so it's a realistic portrayal of relative story popularity
        demo_page_view.success_id = case page_view.story.id
                                    when 225 then 293
                                    when 227 then 298
                                    when 254 then 302
                                    when 258 then 304
                                    end
        demo_page_view.description = nil  # this is normally the story url, but it's not actually used anywhere in csp
        demo_page_view.save
        puts demo_page_view.errors.full_messages
      end
    PageView
      .joins(:company).where(success_id: nil, companies: { id: 10 })
      .each do |page_view|
        demo_page_view = page_view.dup
        demo_page_view.company_id = 24
        demo_page_view.description = "https://demo.customerstories.net/"
        demo_page_view.save
        puts demo_page_view.errors.full_messages
      end
  end

end