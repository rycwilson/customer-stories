class AddDefaultsToContributions < ActiveRecord::Migration

  def up
    change_column :contributions, :status, :string, default: 'pre_request'
  end

  def down
    change_column :contributions, :status, :string, default: nil
  end

end
