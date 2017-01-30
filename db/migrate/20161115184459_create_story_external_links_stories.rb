class CreateStoryExternalLinksStories < ActiveRecord::Migration
  def change
    create_table :story_external_links_stories do |t|
      t.references :story_external_link, index: true, foreign_key: true
      t.references :story, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
