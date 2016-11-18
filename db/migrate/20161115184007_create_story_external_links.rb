class CreateStoryExternalLinks < ActiveRecord::Migration
  def change
    create_table :story_external_links do |t|
      t.string :url
      t.string :link_text
      t.references :company, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
