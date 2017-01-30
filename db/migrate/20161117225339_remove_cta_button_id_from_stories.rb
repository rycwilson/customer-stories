class RemoveCtaButtonIdFromStories < ActiveRecord::Migration
  def change
    remove_column :stories, :cta_button_id, :integer
  end
end
