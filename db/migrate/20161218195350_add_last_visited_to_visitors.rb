class AddLastVisitedToVisitors < ActiveRecord::Migration

  def change
    add_column :visitors, :last_visited, :datetime
  end

end
