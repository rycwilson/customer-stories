class RenameContributionEmailsToEmailTemplates < ActiveRecord::Migration
  def change
    rename_table :contribution_emails, :email_templates
  end
end
