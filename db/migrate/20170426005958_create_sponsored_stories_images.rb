class CreateSponsoredStoriesImages < ActiveRecord::Migration
  def change
    create_table :sponsored_stories_images do |t|
      t.references :adwords_config, index: true, foreign_key: true
      t.references :adwords_image, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
