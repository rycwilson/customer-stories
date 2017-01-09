class RemoveFieldsFromVisitor < ActiveRecord::Migration

  def change
    remove_column :visitors, :name, :string
    remove_column :visitors, :location, :string
    remove_column :visitors, :total_visits, :string
    add_column :visitor_sessions, :organization, :string
    add_column :visitor_sessions, :location, :string
  end

end
