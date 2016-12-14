class AddSessionsCountToVisitors < ActiveRecord::Migration

  def change
    add_column :visitors, :visitor_sessions_count, :integer, default: 0
  end

end
