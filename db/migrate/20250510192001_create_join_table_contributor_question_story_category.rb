class CreateJoinTableContributorQuestionStoryCategory < ActiveRecord::Migration[6.1]
  def change
    create_join_table :contributor_questions, :story_categories do |t|
      t.index [:contributor_question_id, :story_category_id], name: 'index_cq_sc_on_cq_id_and_sc_id'
    end
  end
end
