class AddSuccessContactToContributions < ActiveRecord::Migration
  def change
    add_column :contributions, :success_contact, :boolean, default: false
  end
end
