class CreateTemplatesQuestions < ActiveRecord::Migration
  def change
    create_table :templates_questions do |t|
      t.integer :crowdsourcing_template_id
      t.integer :contributor_question_id

      t.timestamps null: false
    end
  end
end
