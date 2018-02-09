class AddContributionPageTitleToCrowdsourcingTemplates < ActiveRecord::Migration
  def change
    add_column :crowdsourcing_templates, :contribution_page_title, :string, default: "Thank you for contributing your insights"
  end
end
