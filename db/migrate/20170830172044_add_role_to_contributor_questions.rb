class AddRoleToContributorQuestions < ActiveRecord::Migration
  def change
    add_column :contributor_questions, :role, :string
    remove_column :contributor_questions, :default, :boolean, default: false
  end
end
