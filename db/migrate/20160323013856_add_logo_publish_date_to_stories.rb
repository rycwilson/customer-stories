class AddLogoPublishDateToStories < ActiveRecord::Migration
  def change
    add_column :stories, :logo_publish_date, :datetime
  end
end
