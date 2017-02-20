class RemoveLastVisitedFromVisitors < ActiveRecord::Migration
  def change
    remove_column :visitors, :last_visited, :datetime
  end
end
