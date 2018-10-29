class CreateContributorAnswers < ActiveRecord::Migration[5.0]
  def change
    create_table :contributor_answers do |t|
      t.text :answer
      t.references :contribution, foreign_key: true
      t.references :contributor_question, foreign_key: true

      t.timestamps
    end
  end
end
