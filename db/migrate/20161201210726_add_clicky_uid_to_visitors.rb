class AddClickyUidToVisitors < ActiveRecord::Migration

  def change
    add_column :visitors, :clicky_uid, :string
    add_index :visitors, :clicky_uid, unique: true
  end

end
