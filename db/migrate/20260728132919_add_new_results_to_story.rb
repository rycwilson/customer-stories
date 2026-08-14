class AddNewResultsToStory < ActiveRecord::Migration[7.2]
  def change
    add_column :stories, :new_results, :jsonb, default: [], null: false
  end
end
