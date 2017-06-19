class AddCompleteToContributions < ActiveRecord::Migration
  def change
    add_column :contributions, :complete, :boolean, default: false
  end
end
