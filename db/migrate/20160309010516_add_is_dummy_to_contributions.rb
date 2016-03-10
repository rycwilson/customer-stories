class AddIsDummyToContributions < ActiveRecord::Migration

  def change
    add_column :contributions, :is_dummy, :boolean
  end

end
