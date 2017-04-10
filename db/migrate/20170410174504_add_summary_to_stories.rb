class AddSummaryToStories < ActiveRecord::Migration
  def change
    add_column :stories, :summary, :text
  end
end
