class AddFeedbackPageTitleToCrowdsourcingTemplates < ActiveRecord::Migration
  def change
    add_column :crowdsourcing_templates, :feedback_page_title, :string, default: "Thank you for your feedback"
  end
end
