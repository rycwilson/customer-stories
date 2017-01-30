class AddTotalVisitsToVisitors < ActiveRecord::Migration
  def change
    add_column :visitors, :total_visits, :integer
  end
end
