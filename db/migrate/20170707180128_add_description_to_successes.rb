class AddDescriptionToSuccesses < ActiveRecord::Migration
  def change
    add_column :successes, :description, :text
  end
end
