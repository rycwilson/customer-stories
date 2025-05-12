class AddPlaceholderToSuccesses < ActiveRecord::Migration[6.1]
  def change
    add_column :successes, :placeholder, :boolean, default: false, null: false
  end
end
