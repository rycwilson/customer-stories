class RemoveUnusedTables < ActiveRecord::Migration[6.1]
  def change
    drop_table :contributor_prompts, if_exists: true
    drop_table :contributor_prompts_invitation_templates, if_exists: true
    drop_table :contributor_prompts_story_categories, if_exists: true
    drop_table :contributor_prompts_products, if_exists: true
  end
end
