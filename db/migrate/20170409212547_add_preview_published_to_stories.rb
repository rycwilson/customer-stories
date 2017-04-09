class AddPreviewPublishedToStories < ActiveRecord::Migration
  def change
    add_column :stories, :preview_published, :boolean, default: false
  end
end
