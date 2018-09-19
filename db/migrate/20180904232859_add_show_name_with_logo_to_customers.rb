class AddShowNameWithLogoToCustomers < ActiveRecord::Migration
  def change
    add_column :customers, :show_name_with_logo, :boolean, default: true
  end
end