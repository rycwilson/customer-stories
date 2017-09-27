class AddPreviewPublishDateToStories < ActiveRecord::Migration
  def change
    add_column :stories, :preview_publish_date, :datetime
  end
end
