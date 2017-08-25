class CreateContributorQuestions < ActiveRecord::Migration
  def change
    create_table :contributor_questions do |t|
      t.references :company, index: true, foreign_key: true
      t.string :question

      t.timestamps null: false
    end
  end
end
