class RenameForeignKeys < ActiveRecord::Migration[5.0]
  def change
    rename_column :contributions, :crowdsourcing_template_id, :invitation_template_id
    rename_column :templates_questions, :crowdsourcing_template_id, :invitation_template_id
  end
end
