class AddNameToSuccesses < ActiveRecord::Migration
  def change
    add_column :successes, :name, :string
  end
end
