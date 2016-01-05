class AddLogoPublishedToSuccesses < ActiveRecord::Migration
  def change
    add_column :successes, :logo_published, :boolean
    rename_column :successes, :published?, :story_published
    rename_column :successes, :approved?, :story_approved
  end
end
