class AddDefaultToContributorQuestions < ActiveRecord::Migration
  def change
    add_column :contributor_questions, :default, :boolean, default: false
  end
end
