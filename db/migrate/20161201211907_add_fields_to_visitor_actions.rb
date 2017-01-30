class AddFieldsToVisitorActions < ActiveRecord::Migration

  def change
    add_column :visitor_actions, :landing, :boolean, default: false
    add_column :visitor_actions, :share_network, :string
  end

end
