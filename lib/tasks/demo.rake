
namespace :demo do

  desc "create faux analytics data"

  task analytics: :environment do
    demo_success_ids = [293, 298, 302, 304]
    PageView
      .joins(:story).where("stories.id IN (225,227,254,258)")
      .each do |action|
        faux_action = action.dup
        faux_action.company_id = 24
        faux_action.success_id = demo_success_ids.sample
        faux_action.description = nil  # this is normally the story url, but it's not actually used anywhere in csp
        faux_action.save
      end
    PageView
      .joins(:company).where(success_id: nil, companies: { id: 10 })
      .each do |action|
        faux_action = action.dup
        faux_action.company_id = 24
        faux_action.description = "https://demo.customerstories.net/"  # this is normally the story url, but it's not actually used anywhere in csp
        faux_action.save
      end
  end

end