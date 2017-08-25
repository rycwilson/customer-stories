class RenameTemplateIdInContributions < ActiveRecord::Migration
  def change
    remove_reference(:contributions, :email_template, index: true)
    add_reference(:contributions, :crowdsourcing_template, index: true)
  end
end
