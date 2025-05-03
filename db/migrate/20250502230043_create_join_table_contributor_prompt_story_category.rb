class CreateJoinTableContributorPromptStoryCategory < ActiveRecord::Migration[6.1]
  def change
    create_join_table :contributor_prompts, :story_categories do |t|
      t.index [:contributor_prompt_id, :story_category_id], name: 'index_cp_sc_on_cp_id_and_sc_id'
      t.index [:story_category_id, :contributor_prompt_id], name: 'index_cp_sc_on_sc_id_and_cp_id'
    end
  end
end
