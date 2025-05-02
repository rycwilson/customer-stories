class CreateContributorPrompts < ActiveRecord::Migration[6.1]
  def change
    create_table :contributor_prompts do |t|
      t.string :prompt
      t.references :company, foreign_key: true

      t.timestamps
    end
  end
end
