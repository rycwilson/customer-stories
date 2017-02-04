class AddTimestampToVisitorActions < ActiveRecord::Migration
  def change
    add_column :visitor_actions, :timestamp, :datetime
  end
end
