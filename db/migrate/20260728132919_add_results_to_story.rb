class AddResultsToStory < ActiveRecord::Migration[7.2]
  def change
    add_column :stories, :results, :jsonb, default: [], null: false
  end
end
