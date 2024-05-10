class DropEmailTemplates < ActiveRecord::Migration[6.1]
  def change
    drop_table :email_templates
  end
end
