class AddDescriptionToOutboundActions < ActiveRecord::Migration

  def change
    add_column :outbound_actions, :description, :string
  end

end
