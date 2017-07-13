class AddEmailTemplateIdToContributions < ActiveRecord::Migration
  def change
    add_reference :contributions, :email_template, index: true, foreign_key: true
  end
end
