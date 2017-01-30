class AddSessionIdToVisitorSessions < ActiveRecord::Migration

  def change
    add_column :visitor_sessions, :clicky_session_id, :string
    add_index :visitor_sessions, :clicky_session_id, unique: true
  end

end
