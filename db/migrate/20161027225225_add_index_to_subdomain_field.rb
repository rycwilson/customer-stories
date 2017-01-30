class AddIndexToSubdomainField < ActiveRecord::Migration

  def change
    add_index :companies, :subdomain, unique: true
  end

end
