class CreateJoinTableContributorQuestionProduct < ActiveRecord::Migration[6.1]
  def change
    create_join_table :contributor_questions, :products do |t|
      t.index [:contributor_question_id, :product_id], name: 'index_cq_p_on_cq_id_and_p_id'
    end
  end
end
