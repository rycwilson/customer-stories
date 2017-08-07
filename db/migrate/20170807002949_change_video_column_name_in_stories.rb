class ChangeVideoColumnNameInStories < ActiveRecord::Migration
  def change
    rename_column(:stories, :embed_url, :video_url)
  end
end
