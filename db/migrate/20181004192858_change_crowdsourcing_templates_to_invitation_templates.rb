class ChangeCrowdsourcingTemplatesToInvitationTemplates < ActiveRecord::Migration[5.0]
  def change
    rename_table :crowdsourcing_templates, :invitation_templates
  end
end
