class RemoveUnsubscribeFromContributions < ActiveRecord::Migration
  def change
    remove_column :contributions, :unsubscribe, :boolean
  end
end
