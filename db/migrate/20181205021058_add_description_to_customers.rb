class AddDescriptionToCustomers < ActiveRecord::Migration[5.0]
  def change
    add_column :customers, :description, :string
  end
end
