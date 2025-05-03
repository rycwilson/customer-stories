class CreateJoinTableContributorPromptProduct < ActiveRecord::Migration[6.1]
  def change
    create_join_table :contributor_prompts, :products do |t|
      t.index [:contributor_prompt_id, :product_id], name: 'index_cp_product_on_cp_id_and_product_id'
      t.index [:product_id, :contributor_prompt_id], name: 'index_cp_product_on_product_id_and_cp_id'
    end
  end
end
