class AddIpAddressToVisitorSessions < ActiveRecord::Migration
  def change
    add_column :visitor_sessions, :ip_address, :string
  end
end
