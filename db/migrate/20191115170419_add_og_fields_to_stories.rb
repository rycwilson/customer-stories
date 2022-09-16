class AddOgFieldsToStories < ActiveRecord::Migration[5.0]
  def change
    add_column :stories, :og_title, :string
    add_column :stories, :og_description, :string
    add_column :stories, :og_image_url, :string
    add_column :stories, :og_image_alt, :string
    add_column :stories, :og_image_width, :string
    add_column :stories, :og_image_height, :string
  end
end
